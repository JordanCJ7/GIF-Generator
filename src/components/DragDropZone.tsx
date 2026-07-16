import React, { useState, useRef } from "react";
import { motion } from "framer-motion";
import { UploadCloud } from "lucide-react";

interface DragDropZoneProps {
  onFilesSelected: (files: File[]) => void;
}

export const DragDropZone: React.FC<DragDropZoneProps> = ({ onFilesSelected }) => {
  const [isDragActive, setIsDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setIsDragActive(true);
    } else if (e.type === "dragleave") {
      setIsDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const selectedFiles = Array.from(e.dataTransfer.files).filter((file) =>
        file.type.startsWith("image/")
      );
      if (selectedFiles.length > 0) {
        onFilesSelected(selectedFiles);
      }
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selectedFiles = Array.from(e.target.files).filter((file) =>
        file.type.startsWith("image/")
      );
      if (selectedFiles.length > 0) {
        onFilesSelected(selectedFiles);
      }
    }
  };

  const onButtonClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <motion.div
      onDragEnter={handleDrag}
      onDragOver={handleDrag}
      onDragLeave={handleDrag}
      onDrop={handleDrop}
      onClick={onButtonClick}
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
      className={`relative flex flex-col items-center justify-center w-full h-56 border-2 border-dashed rounded-2xl cursor-pointer transition-colors duration-300 ${
        isDragActive
          ? "border-accent-blue bg-accent-blue/5 shadow-[0_0_15px_rgba(59,130,246,0.1)]"
          : "border-border hover:border-zinc-700 bg-card/40 hover:bg-card/60"
      }`}
    >
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/*"
        onChange={handleFileInputChange}
        className="hidden"
      />
      <div className="flex flex-col items-center justify-center pt-5 pb-6 text-center px-4">
        <motion.div
          animate={isDragActive ? { y: -8 } : { y: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 15 }}
          className="mb-4 p-3 rounded-full bg-zinc-900 border border-border"
        >
          <UploadCloud className={`w-8 h-8 ${isDragActive ? "text-accent-blue" : "text-zinc-400"}`} />
        </motion.div>
        <p className="mb-2 text-sm text-zinc-300">
          <span className="font-semibold text-accent-blue">Click to upload</span> or drag and drop
        </p>
        <p className="text-xs text-zinc-500">
          Supports PNG, JPG, JPEG, static GIF
        </p>
      </div>
    </motion.div>
  );
};
