import React, { useState, useRef, useEffect } from "react";
import { Video, Sparkles, Upload, Film, Loader2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { generateGif } from "@/lib/api";

export const VideoToGif: React.FC = () => {
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [fps, setFps] = useState<number>(10);
  const [startTime, setStartTime] = useState<number>(0);
  const [endTime, setEndTime] = useState<number>(5);
  const [width, setWidth] = useState<number>(400);
  const [height, setHeight] = useState<number>(400);
  const [duration, setDuration] = useState<number>(100); // delay per frame in ms
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
  };

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

    // Pause video
    video.pause();

    for (let i = 0; i < frameCount; i++) {
      const time = startTime + i * timeStep;
      setStatusText(`Extracting frame ${i + 1} of ${frameCount}...`);
      video.currentTime = time;

      // Wait for seek to complete
      await new Promise<void>((resolve) => {
        const onSeeked = () => {
          video.removeEventListener("seeked", onSeeked);
          resolve();
        };
        video.addEventListener("seeked", onSeeked);
      });

      // Draw to canvas
      ctx.drawImage(video, 0, 0, width, height);

      // Convert canvas to Blob -> File
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

      // Download GIF
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

          <div className="flex flex-col gap-2">
            <label className="text-xs font-medium text-zinc-400">Target FPS</label>
            <Input
              type="number"
              value={fps}
              onChange={(e) => setFps(Math.min(30, Math.max(1, parseInt(e.target.value) || 10)))}
              min={1}
              max={30}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-2">
              <label className="text-xs font-medium text-zinc-400">Start (sec)</label>
              <Input
                type="number"
                value={startTime}
                onChange={(e) => setStartTime(Math.max(0, parseFloat(e.target.value) || 0))}
                min={0}
              />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-xs font-medium text-zinc-400">End (sec)</label>
              <Input
                type="number"
                value={endTime}
                onChange={(e) => setEndTime(Math.max(0.1, parseFloat(e.target.value) || 5))}
                min={0.1}
              />
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
      <section className="flex-1 flex flex-col h-full overflow-hidden p-6 gap-6 bg-zinc-950/20">
        <div className="flex items-center justify-between text-zinc-300">
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
          <div className="flex-1 bg-card/10 border border-border rounded-2xl overflow-hidden flex items-center justify-center p-4">
            <video
              ref={videoRef}
              src={videoUrl}
              controls
              className="max-h-full max-w-full rounded-lg shadow-lg"
              onLoadedMetadata={() => {
                if (videoRef.current) {
                  setEndTime(Math.min(5, videoRef.current.duration));
                  setWidth(videoRef.current.videoWidth || 400);
                  setHeight(videoRef.current.videoHeight || 400);
                }
              }}
            />
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
