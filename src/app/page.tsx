"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Loader2, Settings, Image as ImageIcon, Sparkles } from "lucide-react";
import { DragDropZone } from "@/components/DragDropZone";
import { PreviewGrid } from "@/components/PreviewGrid";
import { SettingsPanel } from "@/components/SettingsPanel";
import { Button } from "@/components/ui/button";
import { generateGif } from "@/lib/api";

interface ImageItem {
  id: string;
  file: File;
  previewUrl: string;
}

export default function Home() {
  const [images, setImages] = useState<ImageItem[]>([]);
  const [duration, setDuration] = useState<number>(1000);
  const [width, setWidth] = useState<number>(500);
  const [height, setHeight] = useState<number>(500);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Clean up object URLs to avoid memory leaks
  useEffect(() => {
    return () => {
      images.forEach((item) => URL.revokeObjectURL(item.previewUrl));
    };
  }, [images]);

  const handleFilesSelected = (newFiles: File[]) => {
    setError(null);
    const newItems = newFiles.map((file) => ({
      id: Math.random().toString(36).substr(2, 9),
      file,
      previewUrl: URL.createObjectURL(file),
    }));
    setImages((prev) => [...prev, ...newItems]);
  };

  const handleRemoveImage = (id: string) => {
    setImages((prev) => {
      const target = prev.find((item) => item.id === id);
      if (target) {
        URL.revokeObjectURL(target.previewUrl);
      }
      return prev.filter((item) => item.id !== id);
    });
  };

  const handleCreateGif = async () => {
    if (images.length < 2) {
      setError("Please select at least 2 images to generate a GIF.");
      return;
    }
    setError(null);
    setIsGenerating(true);

    try {
      const files = images.map((img) => img.file);
      const gifBlob = await generateGif(files, duration, width, height);
      
      // Download the generated GIF
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
    <main className="h-screen w-screen bg-background flex flex-col">
      {/* Top Header */}
      <header className="px-6 py-4 border-b border-border flex items-center justify-between bg-card/25 backdrop-blur-md z-10">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-accent-blue/10 border border-accent-blue/20 rounded-xl">
            <Sparkles className="w-5 h-5 text-accent-blue" />
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight text-white flex items-center gap-1.5">
              GIF Creator Studio
            </h1>
            <p className="text-[10px] text-zinc-500 uppercase tracking-widest">
              High Performance Generator
            </p>
          </div>
        </div>
      </header>

      {/* Workspace */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Column - Control Panel (1/3 width) */}
        <section className="w-80 md:w-96 border-r border-border bg-card/20 flex flex-col h-full overflow-y-auto p-6 gap-6">
          <div className="flex items-center gap-2 text-zinc-300">
            <Settings className="w-4 h-4 text-accent-blue" />
            <h2 className="text-sm font-semibold">Workspace Settings</h2>
          </div>

          <SettingsPanel
            duration={duration}
            width={width}
            height={height}
            onDurationChange={setDuration}
            onWidthChange={setWidth}
            onHeightChange={setHeight}
          />

          <div className="mt-auto pt-6 border-t border-border flex flex-col gap-4">
            {error && (
              <div className="text-xs text-accent-red bg-accent-red/10 border border-accent-red/20 px-3.5 py-2.5 rounded-lg">
                {error}
              </div>
            )}
            <Button
              variant="primary"
              disabled={images.length < 2 || isGenerating}
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
                  Create GIF
                </>
              )}
            </Button>
          </div>
        </section>

        {/* Right Column - Drag & Drop Zone and Preview Grid (2/3 width) */}
        <section className="flex-1 flex flex-col h-full overflow-hidden p-6 gap-6 bg-zinc-950/20">
          <div className="flex items-center gap-2 text-zinc-300">
            <ImageIcon className="w-4 h-4 text-accent-blue" />
            <h2 className="text-sm font-semibold">Image Board</h2>
          </div>

          <DragDropZone onFilesSelected={handleFilesSelected} />

          <div className="flex-1 overflow-hidden flex flex-col">
            <PreviewGrid images={images} onRemoveImage={handleRemoveImage} />
          </div>
        </section>
      </div>
    </main>
  );
}
