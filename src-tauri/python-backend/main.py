import io
from typing import List
from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from PIL import Image

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

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)

