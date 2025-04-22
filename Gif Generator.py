import tkinter as tk
from tkinter import filedialog, messagebox
from tkinter import ttk
from PIL import Image, ImageTk

# Global image storage
image_files = []      # List of selected file paths
preview_widgets = []  # List of preview widget frames

# Select images and show previews
def select_images():
    global image_files, preview_widgets

    file_paths = filedialog.askopenfilenames(
        title="Select Images",
        filetypes=(("Image files", "*.png;*.jpg;*.jpeg;*.gif"), ("All files", "*.*"))
    )
    
    if file_paths:
        image_files.extend(file_paths)
        show_image_previews()

# Show image previews with remove buttons
def show_image_previews():
    global preview_widgets

    # Clear current widgets
    for widget in preview_frame.winfo_children():
        widget.destroy()
    preview_widgets.clear()

    for idx, path in enumerate(image_files):
        try:
            # Create preview container
            container = tk.Frame(preview_frame, width=100, height=100, bg="#1d1f27")
            container.grid(row=idx // 5, column=idx % 5, padx=5, pady=5)
            container.pack_propagate(0)

            # Load and resize thumbnail
            img = Image.open(path)
            img.thumbnail((90, 90))
            thumb = ImageTk.PhotoImage(img)

            # Store to prevent garbage collection
            container.image = thumb

            # Image label
            img_label = tk.Label(container, image=thumb, bg="#1d1f27")
            img_label.pack(expand=True)

            # Remove button (top right)
            remove_btn = tk.Button(container, text="❌", command=lambda p=path: remove_image(p),
                                   font=("Arial", 8), bg="#ff4d4d", fg="white", relief="flat")
            remove_btn.place(x=75, y=0, width=20, height=20)

            preview_widgets.append(container)
        except Exception as e:
            messagebox.showerror("Error", f"Could not preview image:\n{e}")

# Remove selected image
def remove_image(path_to_remove):
    global image_files
    if path_to_remove in image_files:
        image_files.remove(path_to_remove)
        show_image_previews()

# Create the GIF
def create_gif():
    try:
        if len(image_files) < 2:
            messagebox.showerror("Error", "Please select at least two images.")
            return

        # Validate duration
        try:
            duration = int(duration_var.get())
            if duration <= 0:
                raise ValueError
        except ValueError:
            messagebox.showerror("Error", "Frame duration must be a positive number.")
            return

        # Validate resolution
        try:
            width = int(width_var.get())
            height = int(height_var.get())
            if width <= 0 or height <= 0:
                raise ValueError
            target_size = (width, height)
        except ValueError:
            messagebox.showerror("Error", "Width and Height must be positive integers.")
            return

        images = []
        for path in image_files:
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
                duration=duration,
                loop=0
            )
            messagebox.showinfo("Success", f"GIF saved as {save_path}")
        else:
            messagebox.showwarning("Canceled", "GIF creation canceled.")
    except Exception as e:
        messagebox.showerror("Error", f"An error occurred:\n{e}")

# ---------------------- GUI SETUP ----------------------

root = tk.Tk()
root.title("GIF Creator")
root.geometry("550x720")
root.configure(bg="#1d1f27")

frame = ttk.Frame(root, padding="20")
frame.pack(fill="both", expand=False)

label = ttk.Label(frame, text="GIF Creator", font=("Arial", 24, "bold"), foreground="#FFD700")
label.pack(pady=10)

# Duration input
duration_label = ttk.Label(frame, text="Frame Duration (ms):", font=("Arial", 12, "bold"), foreground="#FFD700")
duration_label.pack(pady=(20, 5))

duration_var = tk.StringVar(value="3000")
duration_entry = ttk.Entry(frame, textvariable=duration_var, width=15, font=("Arial", 12), justify="center", style="TEntry")
duration_entry.pack(pady=5)

# Resolution input
res_label = ttk.Label(frame, text="Resolution (width x height):", font=("Arial", 12, "bold"), foreground="#FFD700")
res_label.pack(pady=(20, 5))

res_frame = ttk.Frame(frame)
res_frame.pack(pady=5)

width_var = tk.StringVar(value="300")
height_var = tk.StringVar(value="300")

width_entry = ttk.Entry(res_frame, textvariable=width_var, width=10, font=("Arial", 12), justify="center", style="TEntry")
width_entry.grid(row=0, column=0, padx=5)

x_label = ttk.Label(res_frame, text="x", font=("Arial", 12, "bold"), foreground="#FFD700")
x_label.grid(row=0, column=1, padx=5)

height_entry = ttk.Entry(res_frame, textvariable=height_var, width=10, font=("Arial", 12), justify="center", style="TEntry")
height_entry.grid(row=0, column=2, padx=5)

# Buttons
select_button = ttk.Button(frame, text="Select Images", command=select_images, width=20, style="TButton")
select_button.pack(pady=10)

create_button = ttk.Button(frame, text="Create GIF", command=create_gif, width=20, style="TButton")
create_button.pack(pady=15)

# Thumbnail preview area
preview_container = ttk.LabelFrame(root, text="Selected Image Previews", padding="10")
preview_container.pack(fill="both", expand=True, padx=20, pady=10)

canvas = tk.Canvas(preview_container, bg="#1d1f27", highlightthickness=0)
canvas.pack(side="left", fill="both", expand=True)

scrollbar = ttk.Scrollbar(preview_container, orient="vertical", command=canvas.yview)
scrollbar.pack(side="right", fill="y")

canvas.configure(yscrollcommand=scrollbar.set)
canvas.bind('<Configure>', lambda e: canvas.configure(scrollregion=canvas.bbox("all")))

preview_frame = ttk.Frame(canvas)
canvas.create_window((0, 0), window=preview_frame, anchor="nw")

# Styles
style = ttk.Style()
style.configure("TButton", font=("Arial", 14), padding=12, background="#ff7f50", foreground="#000000", borderwidth=0)
style.map("TButton", background=[("active", "#e6713a")])
style.configure("TEntry", fieldbackground="#2b2f3a", foreground="#FFD700", font=("Arial", 12))
style.configure("TLabelframe", background="#1d1f27", foreground="#FFD700")
style.configure("TLabelframe.Label", background="#1d1f27", foreground="#FFD700")

# Run the app
root.mainloop()
