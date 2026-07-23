import io
import os
import sys
import subprocess
import tempfile
from pathlib import Path
from typing import List
from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse, JSONResponse
from PIL import Image

# ── Bundled gifsicle binary path ──────────────────────────────────────────────
# Look for gifsicle next to this script (bundled), then fall back to PATH.
_SCRIPT_DIR = Path(__file__).parent
_BUNDLED_GIFSICLE = _SCRIPT_DIR / "bin" / ("gifsicle.exe" if sys.platform == "win32" else "gifsicle")

def _gifsicle_path() -> str | None:
    """Return gifsicle executable path, or None if not available."""
    if _BUNDLED_GIFSICLE.exists():
        return str(_BUNDLED_GIFSICLE)
    # Fall back to system PATH
    try:
        result = subprocess.run(["gifsicle", "--version"], capture_output=True, timeout=5)
        if result.returncode == 0:
            return "gifsicle"
    except (FileNotFoundError, subprocess.TimeoutExpired):
        pass
    return None

app = FastAPI(title="GIF Creator Backend", description="FastAPI service for Pillow image processing")

# Enable CORS for frontend integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins (e.g. Tauri, Next.js dev server)
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

import json

@app.post("/generate-gif")
async def generate_gif(
    files: List[UploadFile] = File(...),
    duration: int = Form(1000),
    width: int = Form(500),
    height: int = Form(500),
    durations: str = Form("")   # JSON-encoded list of per-frame delays e.g. "[500,1000,200]"
):
    if len(files) < 2:
        raise HTTPException(status_code=400, detail="Please upload at least two images to create a GIF.")

    if width <= 0 or height <= 0:
        raise HTTPException(status_code=400, detail="Width and height must be positive integers.")

    # Parse per-frame delay list; fall back to global duration if not provided
    per_frame_delays: list[int] = []
    if durations:
        try:
            parsed = json.loads(durations)
            per_frame_delays = [max(10, int(d)) for d in parsed]
        except Exception:
            per_frame_delays = []

    images = []

    for upload_file in files:
        try:
            file_bytes = await upload_file.read()
            img = Image.open(io.BytesIO(file_bytes)).convert("RGBA")
            target_size = (width, height)
            img = img.resize(target_size, Image.Resampling.LANCZOS)
            images.append(img)
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Failed to process image '{upload_file.filename}': {str(e)}")

    if not images:
        raise HTTPException(status_code=400, detail="No valid images processed.")

    # Build the final delay list — use per-frame if available, else broadcast global duration
    if per_frame_delays and len(per_frame_delays) == len(images):
        final_delays = per_frame_delays
    else:
        if duration <= 0:
            raise HTTPException(status_code=400, detail="Frame duration must be a positive integer.")
        final_delays = duration  # Pillow accepts a scalar for uniform delay

    try:
        output_buffer = io.BytesIO()

        images[0].save(
            output_buffer,
            format="GIF",
            save_all=True,
            append_images=images[1:],
            duration=final_delays,
            loop=0,
            optimize=True
        )

        output_buffer.seek(0)

        return StreamingResponse(
            output_buffer,
            media_type="image/gif",
            headers={"Content-Disposition": "attachment; filename=\"generated.gif\""}
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate GIF: {str(e)}")


@app.post("/compress-gif")
async def compress_gif(
    file: UploadFile = File(...),
    colors: int = Form(128)
):
    try:
        file_bytes = await file.read()
        img = Image.open(io.BytesIO(file_bytes))
        
        if not getattr(img, "is_animated", False):
            output_buffer = io.BytesIO()
            img.convert("P", colors=colors).save(output_buffer, format="GIF", optimize=True)
            output_buffer.seek(0)
            return StreamingResponse(
                output_buffer,
                media_type="image/gif",
                headers={"Content-Disposition": "attachment; filename=\"compressed.gif\""}
            )
            
        frames = []
        durations = []
        
        # Iterate over frames
        for frame_idx in range(img.n_frames):
            img.seek(frame_idx)
            # Pillow loses color palette sometimes on animated GIFs, convert to RGBA then back to P with reduced palette
            rgba_frame = img.convert("RGBA")
            p_frame = rgba_frame.convert("P", palette=Image.Palette.ADAPTIVE, colors=colors)
            frames.append(p_frame)
            durations.append(img.info.get("duration", 100))
            
        output_buffer = io.BytesIO()
        frames[0].save(
            output_buffer,
            format="GIF",
            save_all=True,
            append_images=frames[1:],
            duration=durations,
            loop=img.info.get("loop", 0),
            optimize=True
        )
        output_buffer.seek(0)
        
        return StreamingResponse(
            output_buffer,
            media_type="image/gif",
            headers={"Content-Disposition": "attachment; filename=\"compressed.gif\""}
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to compress GIF: {str(e)}")

@app.get("/gifsicle-status")
async def gifsicle_status():
    """Check if gifsicle is available and return version info."""
    path = _gifsicle_path()
    if path is None:
        return JSONResponse({"available": False, "version": None, "path": None})
    try:
        result = subprocess.run([path, "--version"], capture_output=True, text=True, timeout=5)
        version_line = result.stdout.strip().splitlines()[0] if result.stdout else "Unknown"
        return JSONResponse({"available": True, "version": version_line, "path": path})
    except Exception as e:
        return JSONResponse({"available": False, "version": None, "error": str(e)})


@app.post("/optimize-gif")
async def optimize_gif(
    file: UploadFile = File(...),
    lossy: int = Form(80),          # 0 = lossless, 1-200 = lossy (higher = smaller but lower quality)
    colors: int = Form(256),        # 2-256 color palette
    optimize: int = Form(3),        # 1=O1 (fast), 2=O2 (balanced), 3=O3 (max)
):
    """
    Compress a GIF using the bundled gifsicle binary.
    Falls back to Pillow palette reduction if gifsicle is unavailable.
    Returns compressed GIF with X-Original-Size / X-Compressed-Size headers.
    """
    gifsicle = _gifsicle_path()
    original_bytes = await file.read()
    original_size = len(original_bytes)

    if original_size == 0:
        raise HTTPException(status_code=400, detail="Uploaded file is empty.")

    if gifsicle:
        # ── gifsicle path (best quality compression) ──────────────────────
        try:
            with tempfile.NamedTemporaryFile(suffix=".gif", delete=False) as tmp_in:
                tmp_in.write(original_bytes)
                tmp_in_path = tmp_in.name

            tmp_out_path = tmp_in_path + "_out.gif"

            cmd = [gifsicle, f"-O{max(1, min(3, optimize))}"]

            # Color palette reduction
            palette_size = max(2, min(256, colors))
            if palette_size < 256:
                cmd += ["--colors", str(palette_size)]

            # Lossy compression (gifsicle >=1.92 supports --lossy)
            if lossy > 0:
                cmd += [f"--lossy={max(1, min(200, lossy))}"]

            cmd += ["--output", tmp_out_path, tmp_in_path]

            result = subprocess.run(cmd, capture_output=True, timeout=120)

            if result.returncode != 0:
                stderr = result.stderr.decode("utf-8", errors="replace")
                raise RuntimeError(f"gifsicle error: {stderr}")

            with open(tmp_out_path, "rb") as f_out:
                compressed_bytes = f_out.read()

        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Gifsicle compression failed: {str(e)}")
        finally:
            for p in [tmp_in_path, tmp_out_path]:
                try:
                    os.unlink(p)
                except OSError:
                    pass
    else:
        # ── Pillow fallback: palette quantization only ─────────────────────
        try:
            img = Image.open(io.BytesIO(original_bytes))
            frames, durations = [], []

            if getattr(img, "is_animated", False):
                for i in range(img.n_frames):
                    img.seek(i)
                    rgba = img.convert("RGBA")
                    p_frame = rgba.convert("P", palette=Image.Palette.ADAPTIVE, colors=max(2, min(256, colors)))
                    frames.append(p_frame)
                    durations.append(img.info.get("duration", 100))
            else:
                rgba = img.convert("RGBA")
                frames = [rgba.convert("P", palette=Image.Palette.ADAPTIVE, colors=max(2, min(256, colors)))]
                durations = [100]

            buf = io.BytesIO()
            frames[0].save(
                buf, format="GIF", save_all=True,
                append_images=frames[1:],
                duration=durations,
                loop=img.info.get("loop", 0),
                optimize=True
            )
            compressed_bytes = buf.getvalue()
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Pillow compression failed: {str(e)}")

    compressed_size = len(compressed_bytes)
    engine = "gifsicle" if gifsicle else "pillow-fallback"

    return StreamingResponse(
        io.BytesIO(compressed_bytes),
        media_type="image/gif",
        headers={
            "Content-Disposition": f'attachment; filename="optimized_{file.filename}"',
            "X-Original-Size": str(original_size),
            "X-Compressed-Size": str(compressed_size),
            "X-Engine": engine,
            "Access-Control-Expose-Headers": "X-Original-Size, X-Compressed-Size, X-Engine",
        }
    )


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)
