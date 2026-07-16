import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Trash2 } from "lucide-react";

interface ImageItem {
  id: string;
  file: File;
  previewUrl: string;
}

interface PreviewGridProps {
  images: ImageItem[];
  onRemoveImage: (id: string) => void;
}

export const PreviewGrid: React.FC<PreviewGridProps> = ({ images, onRemoveImage }) => {
  return (
    <div className="w-full flex flex-col gap-4">
      <div className="flex items-center justify-between border-b border-border pb-3">
        <h3 className="text-base font-semibold text-zinc-100 flex items-center gap-2">
          Selected Images
          <span className="text-xs font-normal text-zinc-500 bg-zinc-900 border border-border px-2 py-0.5 rounded-full">
            {images.length} items
          </span>
        </h3>
      </div>

      {images.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center bg-card/20 border border-border/50 rounded-2xl">
          <p className="text-sm text-zinc-500">No images added yet.</p>
        </div>
      ) : (
        <motion.div 
          layout
          className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 max-h-[460px] overflow-y-auto pr-1"
        >
          <AnimatePresence mode="popLayout">
            {images.map((item, index) => (
              <motion.div
                key={item.id}
                layout
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.6, y: 15 }}
                whileHover={{ scale: 1.04 }}
                transition={{ type: "spring", stiffness: 350, damping: 25 }}
                className="group relative aspect-square rounded-xl bg-card border border-border overflow-hidden cursor-default shadow-md"
              >
                {/* Image Preview */}
                <img
                  src={item.previewUrl}
                  alt={item.file.name}
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                />

                {/* Overlay with details */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/0 to-black/30 opacity-0 group-hover:opacity-100 transition-opacity duration-200" />

                {/* Queue Badge */}
                <div className="absolute top-2.5 left-2.5 flex items-center justify-center bg-black/70 backdrop-blur-md border border-zinc-800 text-[10px] font-bold text-white w-6 h-6 rounded-full shadow-md">
                  #{index + 1}
                </div>

                {/* Hover Reveal Delete Button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onRemoveImage(item.id);
                  }}
                  className="absolute top-2.5 right-2.5 flex items-center justify-center bg-accent-red/90 hover:bg-accent-red text-white p-1.5 rounded-lg shadow-md opacity-0 group-hover:opacity-100 transform translate-y-[-4px] group-hover:translate-y-0 transition-all duration-200 focus:outline-none"
                  title="Remove image"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>

                {/* File name info overlay */}
                <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                  <p className="text-[10px] text-zinc-300 truncate font-mono">
                    {item.file.name}
                  </p>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      )}
    </div>
  );
};
