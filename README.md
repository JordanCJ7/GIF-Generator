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

**✅ Key New Features and Changes**

- **🖼️ Image Previews with Larger Containers**  
  The image preview containers are now larger (180x230), with a solid border and padding, creating a card-style layout for each image. The thumbnails are resized to a larger size (150x150).  
  *Impact*: The new card-style layout enhances the visual appearance, making the image previews more prominent and easier to interact with.

- **🔢 Queue Number Display**  
  A queue number is displayed on each image preview (#1, #2, etc.), indicating the order of images.  
  *Impact*: Helps users easily track the order of their images in the selection and can be useful if they want to ensure specific order for GIF creation.

- **🎨 Enhanced Styling and Hover Effects**  
  The preview container now has a hover effect that changes the background color when the mouse enters and leaves the container.  
  *Impact*: Provides a more dynamic and interactive user experience by giving visual feedback as the user hovers over an image.

- **🛑 Updated Image Remove Button Position**  
  The remove button (❌) is now positioned at the top-right corner of the preview container, with updated positioning logic.  
  *Impact*: The button is now more easily accessible and aligns better with the new container design.

- **🖼️ Scrollable Preview Area**  
  The preview area now utilizes a scrollable canvas to accommodate multiple image previews, especially when there are many images.  
  *Impact*: Ensures users can scroll through all their selected images even if the number of previews exceeds the screen space.

- **📐 Fixed Columns for Image Previews**  
  The number of columns for displaying image previews is now fixed at 4 columns per row.  
  *Impact*: Ensures a more consistent layout and avoids images being arranged unpredictably when many images are selected.

**🔄 Unchanged Features**

- **GIF Creation Logic**: The logic for creating the GIF remains unchanged. It still validates the selected images, frame duration, and resolution before saving the GIF.
- **Validation**: The validation for frame duration, width, and height input is still present.
- **GUI Layout**: While the preview area has changed, the rest of the GUI elements (such as input fields and buttons) remain the same as in the previous version.

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
