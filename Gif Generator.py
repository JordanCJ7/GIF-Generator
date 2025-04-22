import tkinter as tk
from tkinter import filedialog, messagebox
from tkinter import ttk
from PIL import Image
import os

# Function to select images and store them
def select_images():
    file_paths = filedialog.askopenfilenames(
        title="Select Images", 
        filetypes=(("Image files", "*.png;*.jpg;*.jpeg;*.gif"), ("All files", "*.*"))
    )
    if file_paths:
        image_paths.set("\n".join(file_paths))  # Display selected paths in the entry widget

# Function to create GIF
def create_gif():
    try:
        # Get the file paths from the entry
        paths = image_paths.get().split("\n")
        
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
root.geometry("500x500")  # Adjust the window size for a more spacious layout
root.configure(bg="#1d1f27")  # Set a dark background color for the window

# Create a Frame to hold the widgets with some padding
frame = ttk.Frame(root, padding="30")
frame.pack(fill="both", expand=True)

# Add a heading label with modern font and color
label = ttk.Label(frame, text="GIF Creator", font=("Arial", 24, "bold"), foreground="#FFD700")  # Gold color
label.pack(pady=20)

# Create and place the widget for file paths (entry widget for longer paths)
image_paths = tk.StringVar()
entry = ttk.Entry(frame, textvariable=image_paths, width=50, font=("Arial", 12), justify="center", style="TEntry")
entry.pack(pady=15)

# Button to open file dialog and select images
select_button = ttk.Button(frame, text="Select Images", command=select_images, width=20, style="TButton")
select_button.pack(pady=10)

# Button to create GIF
create_button = ttk.Button(frame, text="Create GIF", command=create_gif, width=20, style="TButton")
create_button.pack(pady=30)

# Style the buttons to have custom background, padding, and fonts
style = ttk.Style()
style.configure("TButton", font=("Arial", 14), padding=12, background="#ff7f50", foreground="#ffffff", borderwidth=0)
style.map("TButton", background=[("active", "#e6713a")])  # Button color when hovered

# Set the style for entry widgets (a soft light color for text and background)
style.configure("TEntry", fieldbackground="#2b2f3a", foreground="#FFD700", font=("Arial", 12))  # Gold text for better visibility

# Start the GUI event loop
root.mainloop()
