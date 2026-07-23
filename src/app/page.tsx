"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Film, FileArchive, Shuffle, Monitor, Layers, FileVideo } from "lucide-react";

// Tool Components
import { GifCreator } from "@/components/tools/GifCreator";
import { VideoToGif } from "@/components/tools/VideoToGif";
import { GifToVideo } from "@/components/tools/GifToVideo";
import { GifCompressor } from "@/components/tools/GifCompressor";
import { ImageConverter } from "@/components/tools/ImageConverter";
import { ScreenRecorder } from "@/components/tools/ScreenRecorder";

interface ToolItem {
  id: string;
  name: string;
  description: string;
  icon: React.ComponentType<any>;
}

export default function Home() {
  const [selectedTool, setSelectedTool] = useState<string>("gif-creator");

  const tools: ToolItem[] = [
    { id: "gif-creator", name: "GIF Creator", description: "Create animated GIFs from static images", icon: Layers },
    { id: "video-to-gif", name: "Video to GIF", description: "Convert video clips to high-quality GIFs", icon: Film },
    { id: "gif-to-video", name: "GIF to Video", description: "Convert animated GIFs to MP4 or WebM video", icon: FileVideo },
    { id: "gif-compressor", name: "GIF Compressor", description: "Reduce size of animated GIF files", icon: FileArchive },
    { id: "image-converter", name: "Image Converter", description: "Format and resize static images", icon: Shuffle },
    { id: "screen-recorder", name: "Screen Recorder", description: "Record display output straight to GIF", icon: Monitor },
  ];

  const renderActiveTool = () => {
    switch (selectedTool) {
      case "gif-creator":
        return (
          <motion.div
            key="gif-creator"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="flex-1 flex overflow-hidden"
          >
            <GifCreator />
          </motion.div>
        );
      case "video-to-gif":
        return (
          <motion.div
            key="video-to-gif"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="flex-1 flex overflow-hidden"
          >
            <VideoToGif />
          </motion.div>
        );
      case "gif-to-video":
        return (
          <motion.div
            key="gif-to-video"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="flex-1 flex overflow-hidden"
          >
            <GifToVideo />
          </motion.div>
        );
      case "gif-compressor":
        return (
          <motion.div
            key="gif-compressor"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="flex-1 flex overflow-hidden"
          >
            <GifCompressor />
          </motion.div>
        );
      case "image-converter":
        return (
          <motion.div
            key="image-converter"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="flex-1 flex overflow-hidden"
          >
            <ImageConverter />
          </motion.div>
        );
      case "screen-recorder":
        return (
          <motion.div
            key="screen-recorder"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="flex-1 flex overflow-hidden"
          >
            <ScreenRecorder />
          </motion.div>
        );
      default:
        return null;
    }
  };

  return (
    <main className="h-screen w-screen bg-background flex flex-col overflow-hidden">
      {/* Top Header */}
      <header className="px-6 py-4 border-b border-border flex items-center justify-between bg-card/25 backdrop-blur-md z-10 shrink-0">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-accent-blue/10 border border-accent-blue/20 rounded-xl">
            <Sparkles className="w-5 h-5 text-accent-blue" />
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight text-white flex items-center gap-1.5">
              GIF Creator Studio
            </h1>
            <p className="text-[10px] text-zinc-500 uppercase tracking-widest">
              High Performance Media Toolkit
            </p>
          </div>
        </div>
      </header>

      {/* Main Workspace Frame */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Side Global Navigation Panel */}
        <aside className="w-64 border-r border-border bg-card/10 flex flex-col p-4 gap-2 shrink-0">
          <div className="px-3 mb-2">
            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
              Media Tools
            </span>
          </div>

          <nav className="flex flex-col gap-1.5">
            {tools.map((tool) => {
              const Icon = tool.icon;
              const isActive = selectedTool === tool.id;
              return (
                <button
                  key={tool.id}
                  onClick={() => setSelectedTool(tool.id)}
                  className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl text-left transition-all duration-200 focus:outline-none ${
                    isActive
                      ? "bg-accent-blue/10 border border-accent-blue/25 text-white font-medium shadow-[0_0_12px_rgba(59,130,246,0.05)]"
                      : "text-zinc-400 hover:bg-card/50 hover:text-zinc-200 border border-transparent"
                  }`}
                >
                  <Icon className={`w-4 h-4 shrink-0 ${isActive ? "text-accent-blue" : "text-zinc-400"}`} />
                  <div className="flex flex-col min-w-0">
                    <span className="text-xs truncate">{tool.name}</span>
                  </div>
                </button>
              );
            })}
          </nav>
        </aside>

        {/* Dynamic Tool Workspace */}
        <div className="flex-1 flex overflow-hidden">
          <AnimatePresence mode="wait">
            {renderActiveTool()}
          </AnimatePresence>
        </div>
      </div>
    </main>
  );
}
