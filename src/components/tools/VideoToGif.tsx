"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { Video, Sparkles, Upload, Film, Loader2, Trash2, Scissors } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { generateGif } from "@/lib/api";

// ─── Dual-Handle Range Slider ───────────────────────────────────────────────
interface RangeSliderProps {
  min: number;
  max: number;
  startVal: number;
  endVal: number;
  onStartChange: (v: number) => void;
  onEndChange: (v: number) => void;
  onSeekPreview: (time: number) => void;
}

const RangeSlider: React.FC<RangeSliderProps> = ({
  min, max, startVal, endVal, onStartChange, onEndChange, onSeekPreview,
}) => {
  const trackRef = useRef<HTMLDivElement>(null);
  const draggingRef = useRef<"start" | "end" | null>(null);

  const toPercent = (v: number) => max <= min ? 0 : ((v - min) / (max - min)) * 100;

  const valueFromEvent = (e: MouseEvent | React.MouseEvent) => {
    if (!trackRef.current) return min;
    const rect = trackRef.current.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    return parseFloat((min + ratio * (max - min)).toFixed(2));
  };

  const onMouseDown = (handle: "start" | "end") => (e: React.MouseEvent) => {
    e.preventDefault();
    draggingRef.current = handle;
    const onMove = (ev: MouseEvent) => {
      const v = valueFromEvent(ev);
      if (draggingRef.current === "start") {
        const clamped = Math.max(min, Math.min(v, endVal - 0.1));
        onStartChange(clamped);
        onSeekPreview(clamped);
      } else {
        const clamped = Math.min(max, Math.max(v, startVal + 0.1));
        onEndChange(clamped);
        onSeekPreview(clamped);
      }
    };
    const onUp = () => {
      draggingRef.current = null;
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseup", onUp);
    };
    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseup", onUp);
  };

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = (s % 60).toFixed(1);
    return m > 0 ? `${m}:${sec.padStart(4, "0")}` : `${sec}s`;
  };

  const leftPct = toPercent(startVal);
  const rightPct = toPercent(endVal);
  const selectedDuration = (endVal - startVal).toFixed(1);

  return (
    <div className="flex flex-col gap-2">
      {/* Labels row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Scissors className="w-3 h-3 text-accent-blue" />
          <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Trim Range</span>
        </div>
        <span className="text-[10px] text-zinc-400 font-mono">
          {formatTime(startVal)} → {formatTime(endVal)} ({selectedDuration}s)
        </span>
      </div>

      {/* Track */}
      <div
        ref={trackRef}
        className="relative h-8 w-full select-none"
      >
        {/* Background track */}
        <div className="absolute top-1/2 -translate-y-1/2 left-0 right-0 h-2 bg-zinc-800 rounded-full" />

        {/* Selected range highlight */}
        <div
          className="absolute top-1/2 -translate-y-1/2 h-2 bg-accent-blue/40 rounded-full"
          style={{ left: `${leftPct}%`, width: `${rightPct - leftPct}%` }}
        />

        {/* Start handle */}
        <div
          onMouseDown={onMouseDown("start")}
          className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-5 h-5 rounded-full bg-accent-blue border-2 border-white shadow-lg shadow-blue-500/30 cursor-ew-resize z-10 hover:scale-110 transition-transform"
          style={{ left: `${leftPct}%` }}
          title={`Start: ${formatTime(startVal)}`}
        />

        {/* End handle */}
        <div
          onMouseDown={onMouseDown("end")}
          className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-5 h-5 rounded-full bg-blue-400 border-2 border-white shadow-lg shadow-blue-400/30 cursor-ew-resize z-10 hover:scale-110 transition-transform"
          style={{ left: `${rightPct}%` }}
          title={`End: ${formatTime(endVal)}`}
        />
      </div>

      {/* Fine-tune numeric inputs */}
      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-medium text-zinc-500">Start (sec)</label>
          <input
            type="number"
            value={startVal}
            step={0.1}
            min={min}
            max={endVal - 0.1}
            onChange={(e) => {
              const v = Math.max(min, Math.min(parseFloat(e.target.value) || 0, endVal - 0.1));
              onStartChange(v);
              onSeekPreview(v);
            }}
            className="w-full bg-zinc-950 border border-border rounded-lg px-2.5 py-1.5 text-xs text-zinc-100 text-right font-mono focus:outline-none focus:ring-1 focus:ring-accent-blue"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-medium text-zinc-500">End (sec)</label>
          <input
            type="number"
            value={endVal}
            step={0.1}
            min={startVal + 0.1}
            max={max}
            onChange={(e) => {
              const v = Math.min(max, Math.max(parseFloat(e.target.value) || 0, startVal + 0.1));
              onEndChange(v);
              onSeekPreview(v);
            }}
            className="w-full bg-zinc-950 border border-border rounded-lg px-2.5 py-1.5 text-xs text-zinc-100 text-right font-mono focus:outline-none focus:ring-1 focus:ring-accent-blue"
          />
        </div>
      </div>
    </div>
  );
};

// ─── Main Component ─────────────────────────────────────────────────────────
export const VideoToGif: React.FC = () => {
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [videoDuration, setVideoDuration] = useState<number>(0);
  const [fps, setFps] = useState<number>(10);
  const [startTime, setStartTime] = useState<number>(0);
  const [endTime, setEndTime] = useState<number>(5);
  const [width, setWidth] = useState<number>(400);
  const [height, setHeight] = useState<number>(400);
  const [isConverting, setIsConverting] = useState(false);
  const [statusText, setStatusText] = useState("");
  const [error, setError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    return () => {
      if (videoUrl) URL.revokeObjectURL(videoUrl);
    };
  }, [videoUrl]);

  const handleVideoSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setVideoFile(file);
      const url = URL.createObjectURL(file);
      setVideoUrl(url);
      setError(null);
    }
  };

  const handleRemove = () => {
    if (videoUrl) URL.revokeObjectURL(videoUrl);
    setVideoFile(null);
    setVideoUrl(null);
    setVideoDuration(0);
  };

  const handleSeekPreview = useCallback((time: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime = time;
    }
  }, []);

  const extractFrames = async (): Promise<File[]> => {
    const video = videoRef.current;
    if (!video) throw new Error("Video player not ready");

    const totalSeconds = endTime - startTime;
    if (totalSeconds <= 0) throw new Error("Invalid start/end time range");

    const frameCount = Math.floor(totalSeconds * fps);
    const timeStep = 1 / fps;
    const frames: File[] = [];

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Could not create canvas rendering context");

    video.pause();

    for (let i = 0; i < frameCount; i++) {
      const time = startTime + i * timeStep;
      setStatusText(`Extracting frame ${i + 1} of ${frameCount}...`);
      video.currentTime = time;

      await new Promise<void>((resolve) => {
        const onSeeked = () => {
          video.removeEventListener("seeked", onSeeked);
          resolve();
        };
        video.addEventListener("seeked", onSeeked);
      });

      ctx.drawImage(video, 0, 0, width, height);

      const blob = await new Promise<Blob | null>((resolve) => {
        canvas.toBlob((b) => resolve(b), "image/jpeg", 0.85);
      });

      if (blob) {
        const file = new File([blob], `frame_${i}.jpg`, { type: "image/jpeg" });
        frames.push(file);
      }
    }

    return frames;
  };

  const handleConvert = async () => {
    if (!videoFile) return;
    setError(null);
    setIsConverting(true);
    setStatusText("Preparing video...");

    try {
      const frames = await extractFrames();
      if (frames.length < 2) {
        throw new Error("Extracted too few frames to make an animated GIF. Increase FPS or time range.");
      }

      setStatusText("Compiling GIF in backend...");
      const delay = Math.round(1000 / fps);
      const gifBlob = await generateGif(frames, delay, width, height);

      const url = URL.createObjectURL(gifBlob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "video_animation.gif";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setStatusText("Done!");
    } catch (err: any) {
      setError(err.message || "Failed to convert video.");
    } finally {
      setIsConverting(false);
      setStatusText("");
    }
  };

  const estimatedFrames = Math.max(0, Math.floor((endTime - startTime) * fps));

  return (
    <div className="flex-1 flex overflow-hidden">
      {/* Settings Side Panel */}
      <section className="w-80 md:w-96 border-r border-border bg-card/20 flex flex-col h-full overflow-y-auto p-6 gap-6">
        <div className="flex items-center gap-2 text-zinc-300">
          <Video className="w-4 h-4 text-accent-blue" />
          <h2 className="text-sm font-semibold">Video Settings</h2>
        </div>

        <div className="flex flex-col gap-5 bg-card/40 border border-border p-5 rounded-2xl">
          <h3 className="text-sm font-semibold text-zinc-300 uppercase tracking-wider">
            Conversion Settings
          </h3>

          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-medium text-zinc-400">Target FPS</label>
              <span className="text-xs font-mono font-bold text-white bg-zinc-900 border border-border px-2 py-0.5 rounded-md">
                {fps} fps
              </span>
            </div>
            <div className="relative h-5 flex items-center">
              <div className="absolute left-0 right-0 h-1.5 bg-zinc-800 rounded-full" />
              <div
                className="absolute left-0 h-1.5 bg-accent-blue rounded-full transition-all duration-75"
                style={{ width: `${((fps - 1) / (60 - 1)) * 100}%` }}
              />
              <input
                type="range"
                min={1}
                max={60}
                step={1}
                value={fps}
                onChange={(e) => setFps(Number(e.target.value))}
                disabled={isConverting}
                className="absolute w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
              />
              <div
                className="absolute w-4 h-4 rounded-full bg-accent-blue border-2 border-white shadow-md shadow-blue-500/30 -translate-x-1/2 pointer-events-none transition-all duration-75"
                style={{ left: `${((fps - 1) / (60 - 1)) * 100}%` }}
              />
            </div>
            <div className="grid grid-cols-6 gap-1.5">
              {[5, 10, 15, 24, 30, 60].map((preset) => (
                <button
                  key={preset}
                  type="button"
                  disabled={isConverting}
                  onClick={() => setFps(preset)}
                  className={`py-1.5 rounded-lg border text-[10px] font-mono font-semibold transition-all duration-150 ${
                    fps === preset
                      ? "border-accent-blue bg-accent-blue/10 text-white"
                      : "border-zinc-800 bg-zinc-900/60 text-zinc-500 hover:border-zinc-700 hover:text-zinc-300 disabled:opacity-40 disabled:cursor-not-allowed"
                  }`}
                >
                  {preset}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-2">
              <label className="text-xs font-medium text-zinc-400">Width</label>
              <Input
                type="number"
                value={width}
                onChange={(e) => setWidth(Math.max(10, parseInt(e.target.value) || 400))}
                min={10}
              />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-xs font-medium text-zinc-400">Height</label>
              <Input
                type="number"
                value={height}
                onChange={(e) => setHeight(Math.max(10, parseInt(e.target.value) || 400))}
                min={10}
              />
            </div>
          </div>
        </div>

        {/* Estimated output info */}
        {videoFile && (
          <div className="bg-card/30 border border-border/50 rounded-xl p-3 flex flex-col gap-1">
            <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Estimated Output</p>
            <p className="text-xs text-zinc-300 font-mono">{estimatedFrames} frames @ {fps} FPS</p>
            <p className="text-xs text-zinc-400 font-mono">{(endTime - startTime).toFixed(1)}s segment → ~{(estimatedFrames / fps).toFixed(1)}s GIF</p>
          </div>
        )}

        <div className="mt-auto pt-6 border-t border-border flex flex-col gap-3">
          {error && (
            <div className="text-xs text-accent-red bg-accent-red/10 border border-accent-red/20 px-3 py-2 rounded-lg">
              {error}
            </div>
          )}
          {statusText && (
            <div className="text-xs text-accent-blue bg-accent-blue/10 border border-accent-blue/20 px-3 py-2 rounded-lg animate-pulse">
              {statusText}
            </div>
          )}
          <Button
            variant="primary"
            disabled={!videoFile || isConverting}
            onClick={handleConvert}
            className="w-full py-3 text-sm font-semibold rounded-xl flex items-center gap-2 justify-center"
          >
            {isConverting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-white" />
                Converting...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 text-white" />
                Convert to GIF
              </>
            )}
          </Button>
        </div>
      </section>

      {/* Main Workspace */}
      <section className="flex-1 flex flex-col h-full overflow-hidden p-6 gap-4 bg-zinc-950/20">
        <div className="flex items-center justify-between text-zinc-300 shrink-0">
          <div className="flex items-center gap-2">
            <Film className="w-4 h-4 text-accent-blue" />
            <h2 className="text-sm font-semibold">Video Board</h2>
          </div>
          {videoFile && (
            <Button variant="danger" onClick={handleRemove} className="p-2">
              <Trash2 className="w-4 h-4" />
            </Button>
          )}
        </div>

        {videoUrl ? (
          <div className="flex-1 flex flex-col gap-4 overflow-hidden">
            {/* Video Player */}
            <div className="flex-1 bg-card/10 border border-border rounded-2xl overflow-hidden flex items-center justify-center p-4">
              <video
                ref={videoRef}
                src={videoUrl}
                controls
                className="max-h-full max-w-full rounded-lg shadow-lg"
                onLoadedMetadata={() => {
                  if (videoRef.current) {
                    const dur = videoRef.current.duration;
                    setVideoDuration(dur);
                    setStartTime(0);
                    setEndTime(Math.min(5, dur));
                    setWidth(videoRef.current.videoWidth || 400);
                    setHeight(videoRef.current.videoHeight || 400);
                  }
                }}
              />
            </div>

            {/* Interactive Range Slider Trimmer */}
            <div className="bg-card/30 border border-border rounded-2xl p-4 shrink-0">
              <RangeSlider
                min={0}
                max={videoDuration || 1}
                startVal={startTime}
                endVal={endTime}
                onStartChange={setStartTime}
                onEndChange={setEndTime}
                onSeekPreview={handleSeekPreview}
              />
            </div>
          </div>
        ) : (
          <div
            onClick={() => fileInputRef.current?.click()}
            className="flex-1 border-2 border-dashed border-border hover:border-zinc-700 bg-card/40 rounded-2xl flex flex-col items-center justify-center text-center p-6 cursor-pointer transition-colors duration-300"
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="video/mp4,video/webm,video/quicktime"
              onChange={handleVideoSelected}
              className="hidden"
            />
            <div className="mb-4 p-3 rounded-full bg-zinc-900 border border-border">
              <Upload className="w-8 h-8 text-zinc-400" />
            </div>
            <p className="mb-2 text-sm text-zinc-300">
              <span className="font-semibold text-accent-blue">Click to upload video</span> or drag and drop
            </p>
            <p className="text-xs text-zinc-500">Supports MP4, WebM, MOV up to 50MB</p>
          </div>
        )}
      </section>
    </div>
  );
};
