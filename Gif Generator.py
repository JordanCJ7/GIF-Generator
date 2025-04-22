from PIL import Image
import requests
from io import BytesIO

# Image URLs
image_urls = [
    "https://octodex.github.com/images/goretocat.png",
    "https://octodex.github.com/images/octobiwan.jpg",
    "https://octodex.github.com/images/daftpunktocat-thomas.gif"
]

# Load and resize all images to the same size
images = []
target_size = (300, 300)

for url in image_urls:
    response = requests.get(url)
    img = Image.open(BytesIO(response.content)).convert("RGBA")
    img = img.resize(target_size, Image.Resampling.LANCZOS)  # Use LANCZOS instead of ANTIALIAS
    images.append(img)

# Save as animated GIF
images[0].save(
    "octocat_slider.gif",
    format="GIF",
    save_all=True,
    append_images=images[1:],
    duration=3000,  # 3 seconds per image
    loop=0
)

print("✅ GIF saved as octocat_slider.gif")