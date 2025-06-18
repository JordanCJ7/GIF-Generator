# 🎥 GIF Generator

GIF Generator is a user-friendly Python application built with **Tkinter** that allows users to create animated GIFs by selecting images, adjusting the frame duration, and setting a custom resolution for each frame. This tool also features a live preview of selected images, offering a seamless user experience. 🌟

The application utilizes the **Pillow** library to handle image processing and **Tkinter** for creating the graphical user interface (GUI). Whether you are a beginner looking to create fun animated GIFs or a professional in need of quick GIF creation, this tool will help you easily create GIFs for any purpose. 🎨

## ✨ Features

- 📂 **Select multiple images** from your device.
- 🖼️ **Preview the selected images** as thumbnails before creating the GIF.
- ⏱️ **Customizable frame duration** (in milliseconds) for the GIF.
- 📏 **Customizable resolution** for the GIF frames (width x height).
- 🔄 **Scroll through selected image previews** if more than five images are selected.
- 🎬 **Easy GIF creation** by specifying output file location and settings.

---

## 🕒 Project Version History

### 🚀 Version 1.0 - Initial Release
**Release Date**: April 2025

**Features:**
- Basic GUI setup with Tkinter.
- Select multiple images from file explorer.
- Convert selected images into an animated GIF.
- Fixed frame duration of 3 seconds.
- Set default resolution for GIF frames to 300x300 pixels.

### 🛠️ Version 1.1 - Frame Duration and Resolution Customization
**Release Date**: April 2025

**Features:**
- Added user input for **frame duration** (in milliseconds) to allow custom timing between frames.
- Allowed the user to specify **resolution** (width x height) for the GIF frames.
- Improved error handling for **invalid input** (non-positive values).
- Basic layout and button styling enhancements.

### 🖼️ Version 1.2 - Image Preview Feature
**Release Date**: April 2025

**Features:**
- Introduced a **scrollable thumbnail preview** feature.
- Users can see **thumbnails of selected images** before creating the GIF.
- Implemented dynamic image loading and grid layout for displaying previews.
- Added scrolling support to handle multiple images.
- Enhanced error handling when loading or displaying images.
- Adjusted window size for accommodating the image preview section.

### 🎨 Version 1.3 - Final Refinements & GUI Styling
**Release Date**: April 2025

**Features:**
- Enhanced overall GUI styling with modern fonts, colors, and padding for a professional look.
- Improved button styles and input field designs to match the visual theme of the app.
- Refined image preview display with consistent styling in the scrollable frame.
- Optimized user experience by improving the image file handling logic.

### 🧼 Version 1.4 - Smarter Image Management & UX Tweaks  
**Release Date**: April 2025

**Features:**
- Added **❌ remove buttons** to image thumbnails for easier image removal.
- Wrapped each thumbnail in its own **Frame container** for a cleaner, more structured layout.
- Enabled **incremental image selection**, so new images are added to the list without replacing previous selections.
- Improved **thumbnail refresh** logic for smoother layout updates.
- Kept **GIF creation logic** and **input validation** consistent with previous versions.
- Maintained the **stylish and intuitive UI** throughout.

### 🚀 Version 2.0 - Major Upgrade: Enhanced Image Previews & UI Improvements  
**Release Date**: April 2025

**Features:**
- Increased the size of ith solid borders, and resized thumbnails to **150x150** for improved display.
- Added **queue number display** on each preview to track the order of images (#1, #2, etc.).
- Introduced **hover effects** on preview containers, changing the background color on mouse events for better interactivity.
- Moved the **❌ remove button** to the top-right corner of the preview for easier access.
- Made the **preview area scrollable** to accommodate more images without layout issues.
- Set a fixed number of **4 columns** for consistent image preview layout.

**Unchanged Features:**
- **GIF creation logic** remains the same, ensuring images, frame duration, and resolution are validated.
- **Input validation** for duration, width, and height is still in place.
- The overall **GUI layout** remains the same with no major changes to input fields or buttons.

---

## 🛠️ How to Run the Project

### Requirements:
- 🐍 Python 3.x
- 🖼️ Pillow library (`pip install Pillow`)
- 🖥️ Tkinter (typically included with Python)

### Running the GIF Generator:

1. Clone or download the repository:
    ```bash
    git clone https://github.com/yourusername/GIF-Generator.git
    ```

2. Navigate to the project folder:
    ```bash
    cd GIF-Generator
    ```

3. Install the necessary dependencies:
    ```bash
    pip install pillow
    ```

4. Run the application:
    ```bash
    python "GIF Generator.py"
    ```

---

## 📖 Usage Instructions

1. **📂 Select Images**: Click the "Select Images" button to choose multiple images from your file explorer.
2. **🖼️ Preview Images**: The selected images will appear as thumbnails below the main interface. If you select more than five images, a scrollable view will be available to browse through the thumbnails.
3. **⏱️ Set Frame Duration**: Enter the desired frame duration in milliseconds. The default value is 3000ms (3 seconds).
4. **📏 Set Resolution**: Enter the width and height for the GIF resolution. The default resolution is 300x300 pixels.
5. **🎬 Create GIF**: Click the "Create GIF" button to generate the GIF. The program will prompt you to choose a location and filename to save the resulting GIF.

---

## 🤝 Contributing

Feel free to fork this repository and submit pull requests for new features, bug fixes, or improvements. Contributions are welcome! 🌟

### How to Contribute:

1. 🍴 Fork the repository
2. 🌿 Create a feature branch
3. 💾 Commit your changes
4. 🚀 Push to your forked repository
5. 🔄 Create a pull request
