"use client";

import React, { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, RotateCcw, RotateCw, Type, Check } from "lucide-react";
import { Button } from "@/components/ui/button";

export type FilterType = "none" | "grayscale" | "sepia" | "vintage";
export type Rotation = 0 | 90 | 180 | 270;

export interface TextOverlay {
  text: string;
  x: number; // 0-1 normalized
  y: number; // 0-1 normalized
  fontSize: number;
  color: string;
}

export interface FrameEdits {
  filter: FilterType;
  rotation: Rotation;
  textOverlay: TextOverlay | null;
}

interface FrameEditorModalProps {
  isOpen: boolean;
  sourceUrl: string;
  frameName: string;
  initialEdits: FrameEdits;
  onSave: (edits: FrameEdits, editedDataUrl: string) => void;
  onClose: () => void;
}

const FILTERS: { id: FilterType; label: string; emoji: string }[] = [
  { id: "none", label: "Original", emoji: "🖼️" },
  { id: "grayscale", label: "Grayscale", emoji: "⬛" },
  { id: "sepia", label: "Sepia", emoji: "🟫" },
  { id: "vintage", label: "Vintage", emoji: "🌅" },
];

function applyFilter(ctx: CanvasRenderingContext2D, filter: FilterType, w: number, h: number) {
  if (filter === "none") return;
  const imageData = ctx.getImageData(0, 0, w, h);
  const data = imageData.data;
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i], g = data[i + 1], b = data[i + 2];
    if (filter === "grayscale") {
      const avg = 0.299 * r + 0.587 * g + 0.114 * b;
      data[i] = data[i + 1] = data[i + 2] = avg;
    } else if (filter === "sepia") {
      data[i]     = Math.min(255, r * 0.393 + g * 0.769 + b * 0.189);
      data[i + 1] = Math.min(255, r * 0.349 + g * 0.686 + b * 0.168);
      data[i + 2] = Math.min(255, r * 0.272 + g * 0.534 + b * 0.131);
    } else if (filter === "vintage") {
      // Warm highlight + cool shadow
      data[i]     = Math.min(255, r * 1.1 + 20);
      data[i + 1] = Math.min(255, g * 0.9 + 10);
      data[i + 2] = Math.min(255, b * 0.75);
    }
  }
  ctx.putImageData(imageData, 0, 0);
}

function renderCanvas(
  canvas: HTMLCanvasElement,
  img: HTMLImageElement,
  edits: FrameEdits
) {
  const { rotation, filter, textOverlay } = edits;
  const rad = (rotation * Math.PI) / 180;
  const sw = img.naturalWidth, sh = img.naturalHeight;

  // Swap dims for 90/270
  const cw = rotation === 90 || rotation === 270 ? sh : sw;
  const ch = rotation === 90 || rotation === 270 ? sw : sh;
  canvas.width = cw;
  canvas.height = ch;

  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  ctx.save();
  ctx.translate(cw / 2, ch / 2);
  ctx.rotate(rad);
  ctx.drawImage(img, -sw / 2, -sh / 2, sw, sh);
  ctx.restore();

  applyFilter(ctx, filter, cw, ch);

  if (textOverlay && textOverlay.text) {
    const px = textOverlay.x * cw;
    const py = textOverlay.y * ch;
    ctx.font = `bold ${textOverlay.fontSize}px sans-serif`;
    ctx.fillStyle = textOverlay.color;
    ctx.strokeStyle = "rgba(0,0,0,0.7)";
    ctx.lineWidth = textOverlay.fontSize / 8;
    ctx.textAlign = "center";
    ctx.strokeText(textOverlay.text, px, py);
    ctx.fillText(textOverlay.text, px, py);
  }
}

export const FrameEditorModal: React.FC<FrameEditorModalProps> = ({
  isOpen, sourceUrl, frameName, initialEdits, onSave, onClose
}) => {
  const [edits, setEdits] = useState<FrameEdits>(initialEdits);
  const [showTextPanel, setShowTextPanel] = useState(false);
  const [textInput, setTextInput] = useState(initialEdits.textOverlay?.text ?? "");
  const [textColor, setTextColor] = useState(initialEdits.textOverlay?.color ?? "#ffffff");
  const [fontSize, setFontSize] = useState(initialEdits.textOverlay?.fontSize ?? 32);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);

  // Reset local state whenever modal opens with new edits
  useEffect(() => {
    if (isOpen) {
      setEdits(initialEdits);
      setTextInput(initialEdits.textOverlay?.text ?? "");
      setTextColor(initialEdits.textOverlay?.color ?? "#ffffff");
      setFontSize(initialEdits.textOverlay?.fontSize ?? 32);
    }
  }, [isOpen, sourceUrl]);

  // Re-render canvas when edits change
  useEffect(() => {
    if (!isOpen || !canvasRef.current) return;
    const img = new Image();
    img.src = sourceUrl;
    img.onload = () => {
      imgRef.current = img;
      if (canvasRef.current) renderCanvas(canvasRef.current, img, edits);
    };
  }, [isOpen, sourceUrl, edits]);

  const rotateLeft = () => {
    setEdits((prev) => ({ ...prev, rotation: (((prev.rotation - 90) % 360 + 360) % 360) as Rotation }));
  };
  const rotateRight = () => {
    setEdits((prev) => ({ ...prev, rotation: ((prev.rotation + 90) % 360) as Rotation }));
  };

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!showTextPanel || !textInput) return;
    const rect = (e.target as HTMLCanvasElement).getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;
    setEdits((prev) => ({
      ...prev,
      textOverlay: { text: textInput, x, y, fontSize, color: textColor },
    }));
  };

  const updateTextOverlay = () => {
    setEdits((prev) => ({
      ...prev,
      textOverlay: textInput
        ? { text: textInput, x: prev.textOverlay?.x ?? 0.5, y: prev.textOverlay?.y ?? 0.5, fontSize, color: textColor }
        : null,
    }));
  };

  const handleSave = () => {
    const dataUrl = canvasRef.current?.toDataURL("image/png") ?? sourceUrl;
    onSave(edits, dataUrl);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
        >
          <motion.div
            initial={{ scale: 0.92, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.92, opacity: 0, y: 20 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            className="bg-zinc-900 border border-border rounded-2xl shadow-2xl flex flex-col w-full max-w-4xl max-h-[90vh] overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-border shrink-0">
              <div>
                <h2 className="text-sm font-bold text-white">Frame Editor</h2>
                <p className="text-[10px] text-zinc-500 font-mono">{frameName}</p>
              </div>
              <button onClick={onClose} className="p-2 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex flex-1 overflow-hidden">
              {/* Canvas Preview */}
              <div className="flex-1 bg-zinc-950 flex items-center justify-center p-6 overflow-hidden">
                <canvas
                  ref={canvasRef}
                  onClick={handleCanvasClick}
                  className={`max-h-full max-w-full object-contain rounded-lg shadow-lg border border-zinc-800 ${showTextPanel && textInput ? "cursor-crosshair" : ""}`}
                  style={{ imageRendering: "pixelated" }}
                />
              </div>

              {/* Controls Panel */}
              <div className="w-64 border-l border-border flex flex-col p-4 gap-5 overflow-y-auto shrink-0">
                {/* Filters */}
                <div className="flex flex-col gap-2">
                  <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Filter</p>
                  <div className="grid grid-cols-2 gap-2">
                    {FILTERS.map((f) => (
                      <button
                        key={f.id}
                        onClick={() => setEdits((prev) => ({ ...prev, filter: f.id }))}
                        className={`flex flex-col items-center gap-1 p-2 rounded-xl border text-xs transition-all duration-150 ${
                          edits.filter === f.id
                            ? "border-accent-blue bg-accent-blue/10 text-white"
                            : "border-zinc-800 bg-zinc-900/60 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200"
                        }`}
                      >
                        <span className="text-lg">{f.emoji}</span>
                        <span>{f.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Rotation */}
                <div className="flex flex-col gap-2">
                  <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Rotation</p>
                  <div className="flex gap-2">
                    <button
                      onClick={rotateLeft}
                      className="flex-1 flex items-center justify-center gap-1.5 p-2.5 rounded-xl border border-zinc-800 bg-zinc-900/60 text-zinc-400 hover:border-zinc-700 hover:text-white transition-all text-xs"
                    >
                      <RotateCcw className="w-3.5 h-3.5" /> 90° L
                    </button>
                    <button
                      onClick={rotateRight}
                      className="flex-1 flex items-center justify-center gap-1.5 p-2.5 rounded-xl border border-zinc-800 bg-zinc-900/60 text-zinc-400 hover:border-zinc-700 hover:text-white transition-all text-xs"
                    >
                      <RotateCw className="w-3.5 h-3.5" /> 90° R
                    </button>
                  </div>
                  <p className="text-[10px] text-zinc-600 text-center">Current: {edits.rotation}°</p>
                </div>

                {/* Text Overlay */}
                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Text Overlay</p>
                    <button
                      onClick={() => setShowTextPanel(!showTextPanel)}
                      className={`p-1.5 rounded-lg border text-xs transition-colors ${showTextPanel ? "border-accent-blue bg-accent-blue/10 text-accent-blue" : "border-zinc-800 text-zinc-500 hover:text-white"}`}
                    >
                      <Type className="w-3 h-3" />
                    </button>
                  </div>

                  {showTextPanel && (
                    <div className="flex flex-col gap-2">
                      <input
                        type="text"
                        value={textInput}
                        onChange={(e) => setTextInput(e.target.value)}
                        placeholder="Enter text..."
                        className="w-full bg-zinc-950 border border-border rounded-lg px-3 py-2 text-xs text-zinc-100 placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-accent-blue"
                      />
                      <div className="flex gap-2 items-center">
                        <label className="text-[10px] text-zinc-500">Color</label>
                        <input
                          type="color"
                          value={textColor}
                          onChange={(e) => setTextColor(e.target.value)}
                          className="w-8 h-8 rounded cursor-pointer border-0 bg-transparent"
                        />
                        <label className="text-[10px] text-zinc-500 ml-1">Size</label>
                        <input
                          type="number"
                          value={fontSize}
                          onChange={(e) => setFontSize(Math.max(8, parseInt(e.target.value) || 32))}
                          className="w-14 bg-zinc-950 border border-border rounded px-1.5 py-1 text-xs text-zinc-100 focus:outline-none focus:ring-1 focus:ring-accent-blue"
                          min={8}
                        />
                      </div>
                      <button
                        onClick={updateTextOverlay}
                        className="text-xs bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 rounded-lg py-1.5 px-3 text-zinc-200 transition-colors"
                      >
                        Apply / Update Text
                      </button>
                      {textInput && (
                        <p className="text-[10px] text-zinc-500">Click on the canvas to position the text.</p>
                      )}
                    </div>
                  )}
                </div>

                {/* Spacer + Save */}
                <div className="mt-auto pt-4 border-t border-border flex flex-col gap-2">
                  <Button variant="primary" onClick={handleSave} className="w-full py-2.5 text-xs rounded-xl flex items-center gap-2 justify-center">
                    <Check className="w-3.5 h-3.5" />
                    Save Changes
                  </Button>
                  <Button variant="secondary" onClick={onClose} className="w-full py-2.5 text-xs rounded-xl">
                    Discard
                  </Button>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
