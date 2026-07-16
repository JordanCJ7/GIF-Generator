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

@app.post("/generate-gif")
async def generate_gif(
    files: List[UploadFile] = File(...),
    duration: int = Form(3000),
    width: int = Form(300),
    height: int = Form(300)
):
    if len(files) < 2:
        raise HTTPException(status_code=400, detail="Please upload at least two images to create a GIF.")
    
    if duration <= 0:
        raise HTTPException(status_code=400, detail="Frame duration must be a positive integer.")
    
    if width <= 0 or height <= 0:
        raise HTTPException(status_code=400, detail="Width and height must be positive integers.")

    images = []
    
    for upload_file in files:
        try:
            # Read image file bytes
            file_bytes = await upload_file.read()
            # Open the image using Pillow
            img = Image.open(io.BytesIO(file_bytes)).convert("RGBA")
            # Resize the image to target resolution
            target_size = (width, height)
            img = img.resize(target_size, Image.Resampling.LANCZOS)
            images.append(img)
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Failed to process image '{upload_file.filename}': {str(e)}")

    if not images:
        raise HTTPException(status_code=400, detail="No valid images processed.")

    try:
        # Create output buffer for the GIF
        output_buffer = io.BytesIO()
        
        # Save images as animated GIF to the buffer
        images[0].save(
            output_buffer,
            format="GIF",
            save_all=True,
            append_images=images[1:],
            duration=duration,
            loop=0,
            optimize=True
        )
        
        # Seek back to start of buffer
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

