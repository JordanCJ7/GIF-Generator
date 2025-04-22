import tkinter as tk
from tkinter import filedialog, messagebox
from tkinter import ttk
from PIL import Image, ImageTk

# Store image references
preview_thumbnails = []
image_files = []

# Function to select and preview images
def select_images():
    global preview_thumbnails, image_files

    file_paths = filedialog.askopenfilenames(
        title="Select Images",
        filetypes=(("Image files", "*.png;*.jpg;*.jpeg;*.gif"), ("All files", "*.*"))
    )

    if file_paths:
        image_files = list(file_paths)
        # Clear previous previews
        for widget in preview_frame.winfo_children():
            widget.destroy()
        preview_thumbnails.clear()

        # Load and display thumbnails
        for idx, path in enumerate(image_files):
            try:
                img = Image.open(path)
                img.thumbnail((100, 100))
                thumb = ImageTk.PhotoImage(img)
                preview_thumbnails.append(thumb)

                label = ttk.Label(preview_frame, image=thumb)
                label.grid(row=idx // 5, column=idx % 5, padx=5, pady=5)
            except Exception as e:
                messagebox.showerror("Error", f"Could not load image:\n{e}")

# Function to create the GIF
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
root.geometry("550x700")
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

# Thumbnail preview frame (scrollable)
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

# Run the GUI
root.mainloop()
