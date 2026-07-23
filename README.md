# 🎥 MotionFlow Studio

[![Tauri](https://img.shields.io/badge/Wrapper-Tauri-blue?style=for-the-badge&logo=tauri)](https://tauri.app/)
[![React](https://img.shields.io/badge/Frontend-React%20%2F%20Next.js-cyan?style=for-the-badge&logo=react)](https://nextjs.org/)
[![FastAPI](https://img.shields.io/badge/Backend-FastAPI-green?style=for-the-badge&logo=fastapi)](https://fastapi.tiangolo.com/)
[![License](https://img.shields.io/badge/License-MIT-yellow?style=for-the-badge)](LICENSE)

**MotionFlow Studio** is a high-performance, sleek desktop suite designed for modern media creators. Transcending basic file conversions, it leverages a hybrid desktop wrapper framework to provide ultra-fast image-to-GIF processing with a stunning dark-mode editor.

Create high-fidelity animations, configure frame pacing down to the millisecond, optimize output resolutions dynamically, and experience fluid UI transitions driven by modern UX patterns.

---

## ⚡ Core Features

*   **🛠️ Compact Multi-Tool Media Suite**: A consolidated desktop dashboard featuring five distinct media tools:
    *   **GIF Creator**: Interactive timeline builder with drag-and-drop reordering, frame duplication, custom per-frame delays, and a built-in canvas editor (rotation, filters, text overlays).
    *   **Video to GIF**: Seek-slice MP4/WebM videos frame-by-frame and compile into high-quality GIFs.
    *   **GIF Compressor**: Optimize palette size and reduce overhead on large animated GIFs.
    *   **Image Converter**: Instant client-side format changes between PNG, JPEG, and WebP.
    *   **Screen Recorder**: Capture display output or windows and export them straight to GIF.
*   **✨ Premium UI/UX**: An interactive Onyx/Slate workspace featuring sidebar navigation, neon accent glow states, Framer Motion layouts, and smooth transition animations.
*   **📂 Fluid Ingestion**: Drag & drop boards supporting native file selectors and instant browser previews.
*   **⚙️ High-Fidelity Processing**: Fast image interpolation and color quantization powered by our local FastAPI/Pillow micro-engine.
*   **📦 Native Wrapper**: Desktop packaging via Tauri ensures zero bloatware, minimal memory usage, and fully offline operations.

---

## 🛠️ Technology Stack

MotionFlow Studio is built with a state-of-the-art hybrid stack:

- **Desktop Shell**: [Tauri](https://tauri.app/) (Rust framework for lightweight desktop applications)
- **Frontend Architecture**: [React](https://react.dev/) + [Next.js](https://nextjs.org/) + [TypeScript](https://www.typescriptlang.org/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **Micro-Animations**: [Framer Motion](https://www.framer.com/motion/)
- **Iconography**: [Lucide React](https://lucide.dev/)
- **Processing Backend**: [FastAPI](https://fastapi.tiangolo.com/) (Python) + [Pillow (PIL)](https://python-pillow.org/)

---

## 📖 Documentation

For developers, technical requirements, and building procedures, please refer to our dedicated documentation:

👉 **[Technical Setup & Architecture Guide](./TECHNICAL_README.md)**

---

## 🤝 Contributing

Contributions are welcome! Please feel free to open issues, submit pull requests, or recommend features to help enhance MotionFlow Studio.

## 📝 License

This project is licensed under the MIT License. See the LICENSE file for details.
