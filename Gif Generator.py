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
        image_paths.set("\n".join(file_paths))

# Function to create GIF
def create_gif():
    try:
        # Get selected paths
        paths = image_paths.get().split("\n")
        if not paths or len(paths) < 2:
            messagebox.showerror("Error", "Please select at least two images.")
            return

        # Get duration input
        try:
            duration = int(duration_var.get())
            if duration <= 0:
                raise ValueError
        except ValueError:
            messagebox.showerror("Error", "Frame duration must be a positive number.")
            return

        images = []
        target_size = (300, 300)

        for path in paths:
            img = Image.open(path).convert("RGBA")
            img = img.resize(target_size, Image.Resampling.LANCZOS)
            images.append(img)

        save_path = filedialog.asksaveasfilename(defaultextension=".gif", filetypes=[("GIF Files", "*.gif")])
        if save_path:
            images[0].save(
                save_path,
                format="GIF",
                save_all=True,
                append_images=images[1:],
                duration=duration,  # Use custom duration here
                loop=0
            )
            messagebox.showinfo("Success", f"GIF saved as {save_path}")
        else:
            messagebox.showwarning("Canceled", "GIF creation canceled.")
    except Exception as e:
        messagebox.showerror("Error", f"An error occurred: {e}")

# Main window setup
root = tk.Tk()
root.title("GIF Creator")
root.geometry("500x550")
root.configure(bg="#1d1f27")

# Frame setup
frame = ttk.Frame(root, padding="30")
frame.pack(fill="both", expand=True)

# Title
label = ttk.Label(frame, text="GIF Creator", font=("Arial", 24, "bold"), foreground="#FFD700")
label.pack(pady=10)

# Entry for image paths
image_paths = tk.StringVar()
entry = ttk.Entry(frame, textvariable=image_paths, width=50, font=("Arial", 12), justify="center", style="TEntry")
entry.pack(pady=10)

# Frame duration input
duration_label = ttk.Label(frame, text="Frame Duration (ms):", font=("Arial", 12, "bold"), foreground="#FFD700")
duration_label.pack(pady=(20, 5))

duration_var = tk.StringVar(value="3000")  # Default to 3000ms (3 seconds)
duration_entry = ttk.Entry(frame, textvariable=duration_var, width=15, font=("Arial", 12), justify="center", style="TEntry")
duration_entry.pack(pady=5)

# Buttons
select_button = ttk.Button(frame, text="Select Images", command=select_images, width=20, style="TButton")
select_button.pack(pady=10)

create_button = ttk.Button(frame, text="Create GIF", command=create_gif, width=20, style="TButton")
create_button.pack(pady=20)

# Style configuration
style = ttk.Style()
style.configure("TButton", font=("Arial", 14), padding=12, background="#ff7f50", foreground="#000000", borderwidth=0)
style.map("TButton", background=[("active", "#e6713a")])
style.configure("TEntry", fieldbackground="#2b2f3a", foreground="#FFD700", font=("Arial", 12))

# Run the app
root.mainloop()
