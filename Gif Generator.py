import tkinter as tk
from tkinter import filedialog, messagebox
from PIL import Image
import requests
from io import BytesIO

# Function to select images and store them
def select_images():
    file_paths = filedialog.askopenfilenames(title="Select Images", filetypes=(("Image files", "*.png;*.jpg;*.jpeg;*.gif"), ("All files", "*.*")))
    if file_paths:
        image_paths.set(", ".join(file_paths))  # Display selected paths in the entry widget

# Function to create GIF
def create_gif():
    try:
        # Get the file paths from the entry
        paths = image_paths.get().split(", ")
        
        if not paths or len(paths) < 2:
            messagebox.showerror("Error", "Please select at least two images.")
            return

        images = []
        target_size = (300, 300)

        # Load and resize all images to the same size
        for path in paths:
            img = Image.open(path).convert("RGBA")
            img = img.resize(target_size, Image.Resampling.LANCZOS)  # Resize to target size
            images.append(img)

        # Ask for a filename to save the GIF
        save_path = filedialog.asksaveasfilename(defaultextension=".gif", filetypes=[("GIF Files", "*.gif")])
        if save_path:
            # Save as an animated GIF
            images[0].save(
                save_path,
                format="GIF",
                save_all=True,
                append_images=images[1:],
                duration=3000,  # 3 seconds per image
                loop=0
            )

            messagebox.showinfo("Success", f"GIF saved as {save_path}")
        else:
            messagebox.showerror("Error", "No path specified to save the GIF.")

    except Exception as e:
        messagebox.showerror("Error", f"An error occurred: {e}")

# Create the main window
root = tk.Tk()
root.title("GIF Creator")

# Create and place the widgets
tk.Label(root, text="Select images to create GIF:").pack(padx=10, pady=10)

# Entry widget to show selected file paths
image_paths = tk.StringVar()
entry = tk.Entry(root, textvariable=image_paths, width=50)
entry.pack(padx=10, pady=5)

# Button to open file dialog and select images
select_button = tk.Button(root, text="Select Images", command=select_images)
select_button.pack(padx=10, pady=5)

# Button to create GIF
create_button = tk.Button(root, text="Create GIF", command=create_gif)
create_button.pack(padx=10, pady=10)

# Start the GUI event loop
root.mainloop()
