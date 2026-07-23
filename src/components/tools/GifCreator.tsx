"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, Settings, Image as ImageIcon, Sparkles, GripVertical, Copy, Trash2, Pencil, Clock } from "lucide-react";
import { DragDropZone } from "@/components/DragDropZone";
import { SettingsPanel } from "@/components/SettingsPanel";
import { Button } from "@/components/ui/button";
import { generateGif } from "@/lib/api";
import { FrameEditorModal, FrameEdits, FilterType, Rotation } from "@/components/tools/FrameEditorModal";

export interface FrameItem {
  id: string;
  file: File;
  previewUrl: string;   // original blob URL
  editedUrl: string;    // post-edit data URL (same as previewUrl if untouched)
  delay: number;        // per-frame delay in ms
  edits: FrameEdits;
}

const DEFAULT_EDITS: FrameEdits = {
  filter: "none",
  rotation: 0,
  textOverlay: null,
};

export const GifCreator: React.FC = () => {
  const [frames, setFrames] = useState<FrameItem[]>([]);
  const [globalDuration, setGlobalDuration] = useState(500);
  const [width, setWidth] = useState(500);
  const [height, setHeight] = useState(500);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Frame editor modal state
  const [editingFrame, setEditingFrame] = useState<FrameItem | null>(null);

  // Drag state (native HTML5)
  const dragIndexRef = useRef<number | null>(null);

  // Keep latest frames for unmount cleanup (avoid stale closure on [])
  const framesRef = useRef<FrameItem[]>([]);
  useEffect(() => {
    framesRef.current = frames;
  }, [frames]);

  useEffect(() => {
    return () => {
      framesRef.current.forEach((f) => {
        if (f.previewUrl.startsWith("blob:")) URL.revokeObjectURL(f.previewUrl);
        if (f.editedUrl.startsWith("blob:")) URL.revokeObjectURL(f.editedUrl);
      });
    };
  }, []);

  const handleFilesSelected = (newFiles: File[]) => {
    setError(null);
    const newFrames: FrameItem[] = newFiles.map((file) => ({
      id: Math.random().toString(36).substring(2, 9),
      file,
      previewUrl: URL.createObjectURL(file),
      editedUrl: URL.createObjectURL(file),
      delay: globalDuration,
      edits: { ...DEFAULT_EDITS },
    }));
    setFrames((prev) => [...prev, ...newFrames]);
  };

  const handleRemoveFrame = (id: string) => {
    setFrames((prev) => {
      const target = prev.find((f) => f.id === id);
      if (target) {
        if (target.previewUrl.startsWith("blob:")) URL.revokeObjectURL(target.previewUrl);
        if (target.editedUrl.startsWith("blob:") && target.editedUrl !== target.previewUrl) {
          URL.revokeObjectURL(target.editedUrl);
        }
      }
      return prev.filter((f) => f.id !== id);
    });
  };

  const handleDuplicateFrame = (id: string) => {
    setFrames((prev) => {
      const idx = prev.findIndex((f) => f.id === id);
      if (idx === -1) return prev;
      const src = prev[idx];
      const previewUrl = URL.createObjectURL(src.file);
      const copy: FrameItem = {
        ...src,
        id: Math.random().toString(36).substring(2, 9),
        previewUrl,
        editedUrl: src.editedUrl.startsWith("blob:") ? previewUrl : src.editedUrl,
        edits: { ...src.edits, textOverlay: src.edits.textOverlay ? { ...src.edits.textOverlay } : null },
      };
      const next = [...prev];
      next.splice(idx + 1, 0, copy);
      return next;
    });
  };

  const handleDelayChange = (id: string, value: number) => {
    setFrames((prev) => prev.map((f) => f.id === id ? { ...f, delay: Math.max(10, value) } : f));
  };

  // Drag-and-drop handlers (native HTML5, no extra packages)
  const handleDragStart = (e: React.DragEvent, index: number) => {
    dragIndexRef.current = index;
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    const fromIndex = dragIndexRef.current;
    if (fromIndex === null || fromIndex === index) return;
    setFrames((prev) => {
      const next = [...prev];
      const [moved] = next.splice(fromIndex, 1);
      next.splice(index, 0, moved);
      dragIndexRef.current = index;
      return next;
    });
  };

  const handleDragEnd = () => {
    dragIndexRef.current = null;
  };

  // Frame Editor save callback
  const handleFrameEditSave = (edits: FrameEdits, editedDataUrl: string) => {
    if (!editingFrame) return;
    setFrames((prev) =>
      prev.map((f) =>
        f.id === editingFrame.id ? { ...f, edits, editedUrl: editedDataUrl } : f
      )
    );
    setEditingFrame(null);
  };

  const handleCreateGif = async () => {
    if (frames.length < 2) {
      setError("Please add at least 2 frames to generate a GIF.");
      return;
    }
    setError(null);
    setIsGenerating(true);

    try {
      // Build processed File objects from editedUrl data URLs
      const processedFiles = await Promise.all(
        frames.map(async (frame) => {
          // If the frame was edited it will have a data URL; otherwise use original file
          if (frame.editedUrl.startsWith("data:")) {
            const res = await fetch(frame.editedUrl);
            const blob = await res.blob();
            return new File([blob], frame.file.name, { type: "image/png" });
          }
          return frame.file;
        })
      );

      const perFrameDelays = frames.map((f) => f.delay);
      const gifBlob = await generateGif(processedFiles, globalDuration, width, height, perFrameDelays);

      const url = URL.createObjectURL(gifBlob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "animation.gif";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err: any) {
      setError(err.message || "An error occurred during GIF generation.");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <>
      {/* Frame Editor Modal */}
      <FrameEditorModal
        isOpen={!!editingFrame}
        sourceUrl={editingFrame?.previewUrl ?? ""}
        frameName={editingFrame?.file.name ?? ""}
        initialEdits={editingFrame?.edits ?? DEFAULT_EDITS}
        onSave={handleFrameEditSave}
        onClose={() => setEditingFrame(null)}
      />

      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel — Settings */}
        <section className="w-80 md:w-96 border-r border-border bg-card/20 flex flex-col h-full overflow-y-auto p-6 gap-6 shrink-0">
          <div className="flex items-center gap-2 text-zinc-300">
            <Settings className="w-4 h-4 text-accent-blue" />
            <h2 className="text-sm font-semibold">Workspace Settings</h2>
          </div>

          <SettingsPanel
            duration={globalDuration}
            width={width}
            height={height}
            onDurationChange={setGlobalDuration}
            onWidthChange={setWidth}
            onHeightChange={setHeight}
          />

          {/* Apply global delay to all frames */}
          <button
            onClick={() => setFrames((prev) => prev.map((f) => ({ ...f, delay: globalDuration })))}
            className="text-xs text-accent-blue hover:text-blue-400 transition-colors text-left px-1"
          >
            ↻ Apply global delay to all frames
          </button>

          <div className="mt-auto pt-6 border-t border-border flex flex-col gap-4">
            {error && (
              <div className="text-xs text-accent-red bg-accent-red/10 border border-accent-red/20 px-3.5 py-2.5 rounded-lg">
                {error}
              </div>
            )}
            <Button
              variant="primary"
              disabled={frames.length < 2 || isGenerating}
              onClick={handleCreateGif}
              className="w-full py-3 text-sm font-semibold rounded-xl flex items-center gap-2 justify-center"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                  Generating GIF...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-white" />
                  Create GIF ({frames.length} frames)
                </>
              )}
            </Button>
          </div>
        </section>

        {/* Right Panel — Drop Zone + Timeline */}
        <section className="flex-1 flex flex-col h-full overflow-hidden p-6 gap-4 bg-zinc-950/20">
          {/* Header */}
          <div className="flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2 text-zinc-300">
              <ImageIcon className="w-4 h-4 text-accent-blue" />
              <h2 className="text-sm font-semibold">Frame Timeline</h2>
              {frames.length > 0 && (
                <span className="text-[10px] text-zinc-500 bg-zinc-900 border border-border px-2 py-0.5 rounded-full">
                  {frames.length} frame{frames.length !== 1 ? "s" : ""}
                </span>
              )}
            </div>
            {frames.length > 0 && (
              <button
                onClick={() => {
                  frames.forEach((f) => {
                    if (f.previewUrl.startsWith("blob:")) URL.revokeObjectURL(f.previewUrl);
                    if (f.editedUrl.startsWith("blob:") && f.editedUrl !== f.previewUrl) {
                      URL.revokeObjectURL(f.editedUrl);
                    }
                  });
                  setFrames([]);
                }}
                className="text-[10px] text-zinc-500 hover:text-accent-red transition-colors"
              >
                Clear all
              </button>
            )}
          </div>

          {/* Drop Zone */}
          <div className="shrink-0">
            <DragDropZone onFilesSelected={handleFilesSelected} />
          </div>

          {/* Timeline Strip */}
          <div className="flex-1 overflow-hidden flex flex-col">
            {frames.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center bg-card/10 border border-border/40 rounded-2xl py-10">
                <p className="text-sm text-zinc-500">No frames yet.</p>
                <p className="text-xs text-zinc-600 mt-1">Upload images above to begin building your timeline.</p>
              </div>
            ) : (
              <div className="flex-1 overflow-y-auto pr-1 flex flex-col gap-2">
                <AnimatePresence mode="popLayout">
                  {frames.map((frame, index) => (
                    <motion.div
                      key={frame.id}
                      layout
                      initial={{ opacity: 0, y: 8, scale: 0.97 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -8, scale: 0.97 }}
                      transition={{ type: "spring", stiffness: 300, damping: 28 }}
                      draggable
                      onDragStart={(e) => handleDragStart(e as any, index)}
                      onDragOver={(e) => handleDragOver(e as any, index)}
                      onDragEnd={handleDragEnd}
                      className="group flex items-center gap-3 bg-card/30 border border-border/70 hover:border-zinc-700 rounded-2xl p-3 transition-all duration-150 cursor-grab active:cursor-grabbing"
                    >
                      {/* Drag handle */}
                      <div className="text-zinc-600 group-hover:text-zinc-400 transition-colors shrink-0">
                        <GripVertical className="w-4 h-4" />
                      </div>

                      {/* Frame number badge */}
                      <div className="w-6 h-6 rounded-full bg-zinc-900 border border-border flex items-center justify-center text-[10px] font-bold text-zinc-400 shrink-0">
                        {index + 1}
                      </div>

                      {/* Thumbnail */}
                      <div className="relative w-16 h-16 rounded-xl overflow-hidden border border-border shrink-0">
                        <img
                          src={frame.editedUrl}
                          alt={`Frame ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                        {frame.edits.filter !== "none" && (
                          <div className="absolute bottom-0.5 right-0.5 bg-black/70 rounded px-1 text-[8px] text-zinc-300 font-mono capitalize">
                            {frame.edits.filter}
                          </div>
                        )}
                      </div>

                      {/* File name */}
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-mono text-zinc-200 truncate">{frame.file.name}</p>
                        <p className="text-[10px] text-zinc-500 mt-0.5">
                          {frame.edits.rotation !== 0 && `${frame.edits.rotation}° · `}
                          {frame.edits.textOverlay ? "Text · " : ""}
                          {(frame.file.size / 1024).toFixed(0)} KB
                        </p>
                      </div>

                      {/* Per-frame delay input */}
                      <div className="flex items-center gap-1.5 shrink-0">
                        <Clock className="w-3 h-3 text-zinc-500" />
                        <input
                          type="number"
                          value={frame.delay}
                          min={10}
                          onChange={(e) => handleDelayChange(frame.id, parseInt(e.target.value) || 100)}
                          className="w-20 bg-zinc-950 border border-border rounded-lg px-2 py-1.5 text-xs text-zinc-100 text-right focus:outline-none focus:ring-1 focus:ring-accent-blue"
                          title="Frame delay in ms"
                        />
                        <span className="text-[10px] text-zinc-500">ms</span>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          onClick={() => setEditingFrame(frame)}
                          className="p-2 rounded-lg border border-transparent text-zinc-500 hover:border-zinc-700 hover:text-white hover:bg-zinc-800 transition-all"
                          title="Edit frame"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDuplicateFrame(frame.id)}
                          className="p-2 rounded-lg border border-transparent text-zinc-500 hover:border-zinc-700 hover:text-white hover:bg-zinc-800 transition-all"
                          title="Duplicate frame"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleRemoveFrame(frame.id)}
                          className="p-2 rounded-lg border border-transparent text-zinc-500 hover:border-red-900 hover:text-accent-red hover:bg-red-900/20 transition-all"
                          title="Remove frame"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}
          </div>
        </section>
      </div>
    </>
  );
};
