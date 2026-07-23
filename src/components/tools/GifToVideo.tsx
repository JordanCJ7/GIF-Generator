"use client";

import React, { useState, useRef, useEffect } from "react";
import { Video, Sparkles, Upload, FileVideo, Loader2, Trash2, CheckCircle, RefreshCw, Play, Film } from "lucide-react";
import { Button } from "@/components/ui/button";

export const GifToVideo: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [gifUrl, setGifUrl] = useState<string | null>(null);
  const [gifDimensions, setGifDimensions] = useState<{ width: number; height: number } | null>(null);

  // Conversion Options
  const [outputFormat, setOutputFormat] = useState<"mp4" | "webm">("mp4");
  const [loopCount, setLoopCount] = useState<number>(3);
  const [fps, setFps] = useState<number>(30);
  const [scale, setScale] = useState<number>(100);

  // Conversion State
  const [isConverting, setIsConverting] = useState(false);
  const [progress, setProgress] = useState<number>(0);
  const [statusText, setStatusText] = useState<string>("");
  const [videoBlob, setVideoBlob] = useState<Blob | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [videoSize, setVideoSize] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    return () => {
      if (gifUrl) URL.revokeObjectURL(gifUrl);
      if (videoUrl) URL.revokeObjectURL(videoUrl);
    };
  }, [gifUrl, videoUrl]);

  const handleFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile && selectedFile.type === "image/gif") {
      setFile(selectedFile);
      const url = URL.createObjectURL(selectedFile);
      setGifUrl(url);
      setVideoBlob(null);
      setVideoUrl(null);
      setVideoSize(null);
      setError(null);

      // Measure dimensions
      const img = new Image();
      img.src = url;
      img.onload = () => {
        setGifDimensions({ width: img.naturalWidth, height: img.naturalHeight });
      };
    } else if (selectedFile) {
      setError("Please select a valid GIF file.");
    }
  };

  const handleRemove = () => {
    if (gifUrl) URL.revokeObjectURL(gifUrl);
    if (videoUrl) URL.revokeObjectURL(videoUrl);
    setFile(null);
    setGifUrl(null);
    setGifDimensions(null);
    setVideoBlob(null);
    setVideoUrl(null);
    setVideoSize(null);
    setError(null);
  };

  // Extract frames using ImageDecoder (WebCodecs) or Image fallback
  const decodeGifFrames = async (gifFile: File): Promise<{ canvas: HTMLCanvasElement; duration: number }[]> => {
    // Check if ImageDecoder is supported
    if ("ImageDecoder" in window) {
      try {
        const stream = gifFile.stream();
        // @ts-ignore - WebCodecs ImageDecoder
        const decoder = new ImageDecoder({ data: stream, type: "image/gif" });
        await decoder.tracks.ready;

        const track = decoder.tracks.selectedTrack;
        const frameCount = track?.frameCount || 1;
        const extracted: { canvas: HTMLCanvasElement; duration: number }[] = [];

        for (let i = 0; i < frameCount; i++) {
          setStatusText(`Decoding GIF frame ${i + 1} of ${frameCount}...`);
          setProgress(Math.round(((i + 1) / frameCount) * 40));
          const result = await decoder.decode({ frameIndex: i });
          const imageFrame = result.image;

          const c = document.createElement("canvas");
          c.width = Math.round((imageFrame.displayWidth * scale) / 100);
          c.height = Math.round((imageFrame.displayHeight * scale) / 100);
          const ctx = c.getContext("2d");
          if (ctx) {
            ctx.drawImage(imageFrame, 0, 0, c.width, c.height);
          }
          // frame.duration is in microseconds, convert to ms (default to 100ms if 0)
          const durationMs = imageFrame.duration ? imageFrame.duration / 1000 : 100;
          extracted.push({ canvas: c, duration: durationMs });
          imageFrame.close();
        }

        if (extracted.length > 0) return extracted;
      } catch (err) {
        console.warn("ImageDecoder failed, falling back to canvas element extraction:", err);
      }
    }

    // Fallback: single image frame canvas
    setStatusText("Loading image frame...");
    const img = new Image();
    img.src = gifUrl!;
    await new Promise((resolve) => { img.onload = resolve; });

    const c = document.createElement("canvas");
    c.width = Math.round((img.naturalWidth * scale) / 100);
    c.height = Math.round((img.naturalHeight * scale) / 100);
    const ctx = c.getContext("2d");
    if (ctx) ctx.drawImage(img, 0, 0, c.width, c.height);

    return [{ canvas: c, duration: 1000 }];
  };

  const handleConvert = async () => {
    if (!file || !gifUrl) return;
    setError(null);
    setIsConverting(true);
    setProgress(0);
    setStatusText("Reading GIF data...");

    try {
      const frames = await decodeGifFrames(file);
      if (frames.length === 0) throw new Error("Could not decode GIF frames.");

      const targetWidth = frames[0].canvas.width;
      const targetHeight = frames[0].canvas.height;

      // Setup render canvas
      const renderCanvas = document.createElement("canvas");
      renderCanvas.width = targetWidth;
      renderCanvas.height = targetHeight;
      const ctx = renderCanvas.getContext("2d")!;

      // Determine MIME type supported by browser
      let mimeType = outputFormat === "mp4" ? "video/mp4;codecs=avc1" : "video/webm;codecs=vp9";
      if (!MediaRecorder.isTypeSupported(mimeType)) {
        mimeType = outputFormat === "mp4" ? "video/mp4" : "video/webm";
      }
      if (!MediaRecorder.isTypeSupported(mimeType)) {
        mimeType = "video/webm"; // ultimate fallback
      }

      const stream = renderCanvas.captureStream(fps);
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType,
        videoBitsPerSecond: 2500000, // 2.5 Mbps crisp video
      });

      const chunks: Blob[] = [];
      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
      };

      const recordPromise = new Promise<Blob>((resolve) => {
        mediaRecorder.onstop = () => {
          const finalBlob = new Blob(chunks, { type: mimeType });
          resolve(finalBlob);
        };
      });

      mediaRecorder.start();
      setStatusText(`Encoding ${outputFormat.toUpperCase()} video (${loopCount}x loop)...`);

      // Play through frames for loopCount loops
      const totalPlaybackPasses = loopCount;
      const totalFramesToPlay = frames.length * totalPlaybackPasses;
      let framesPlayed = 0;

      for (let loop = 0; loop < totalPlaybackPasses; loop++) {
        for (let f = 0; f < frames.length; f++) {
          const frame = frames[f];
          ctx.clearRect(0, 0, targetWidth, targetHeight);
          ctx.drawImage(frame.canvas, 0, 0);

          framesPlayed++;
          setProgress(40 + Math.round((framesPlayed / totalFramesToPlay) * 55));

          // Wait for frame duration
          await new Promise((r) => setTimeout(r, frame.duration));
        }
      }

      // Stop recorder after short buffer
      await new Promise((r) => setTimeout(r, 200));
      mediaRecorder.stop();

      const blob = await recordPromise;
      setVideoBlob(blob);
      const url = URL.createObjectURL(blob);
      setVideoUrl(url);
      setVideoSize(blob.size);
      setProgress(100);
      setStatusText("Conversion complete!");

      // Auto download
      const a = document.createElement("a");
      a.href = url;
      const ext = mimeType.includes("mp4") ? "mp4" : "webm";
      a.download = `${file.name.replace(/\.gif$/i, "")}.${ext}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch (err: any) {
      setError(err.message || "Failed to convert GIF to video.");
    } finally {
      setIsConverting(false);
    }
  };

  const savings = file && videoSize
    ? Math.round((1 - videoSize / file.size) * 100)
    : null;

  return (
    <div className="flex-1 flex overflow-hidden">
      {/* Settings Side Panel */}
      <section className="w-80 md:w-96 border-r border-border bg-card/20 flex flex-col h-full overflow-y-auto p-6 gap-6 shrink-0">
        <div className="flex items-center gap-2 text-zinc-300">
          <FileVideo className="w-4 h-4 text-accent-blue" />
          <h2 className="text-sm font-semibold">GIF to Video Settings</h2>
        </div>

        <div className="flex flex-col gap-5 bg-card/40 border border-border p-5 rounded-2xl">
          <h3 className="text-sm font-semibold text-zinc-300 uppercase tracking-wider">
            Export Configurations
          </h3>

          {/* Output Format */}
          <div className="flex flex-col gap-2">
            <label className="text-xs font-medium text-zinc-400">Video Format</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setOutputFormat("mp4")}
                className={`py-2 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                  outputFormat === "mp4"
                    ? "border-accent-blue bg-accent-blue/10 text-white"
                    : "border-zinc-800 bg-zinc-900/60 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200"
                }`}
              >
                MP4 (H.264)
              </button>
              <button
                type="button"
                onClick={() => setOutputFormat("webm")}
                className={`py-2 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                  outputFormat === "webm"
                    ? "border-accent-blue bg-accent-blue/10 text-white"
                    : "border-zinc-800 bg-zinc-900/60 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200"
                }`}
              >
                WebM (VP9)
              </button>
            </div>
          </div>

          {/* Loop Count */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-medium text-zinc-400">Loop Count</label>
              <span className="text-xs font-mono font-bold text-white bg-zinc-900 border border-border px-2 py-0.5 rounded-md">
                {loopCount}x
              </span>
            </div>
            <div className="grid grid-cols-4 gap-1.5">
              {[1, 2, 3, 5].map((cnt) => (
                <button
                  key={cnt}
                  type="button"
                  onClick={() => setLoopCount(cnt)}
                  className={`py-1.5 rounded-lg border text-xs font-mono transition-all ${
                    loopCount === cnt
                      ? "border-accent-blue bg-accent-blue/10 text-white"
                      : "border-zinc-800 bg-zinc-900/60 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200"
                  }`}
                >
                  {cnt}x
                </button>
              ))}
            </div>
            <p className="text-[10px] text-zinc-500">Loops the animation to create a comfortable video clip length.</p>
          </div>

          {/* Resolution Scaling */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-medium text-zinc-400">Scale Resolution</label>
              <span className="text-xs font-mono font-bold text-white bg-zinc-900 border border-border px-2 py-0.5 rounded-md">
                {scale}%
              </span>
            </div>
            <div className="grid grid-cols-4 gap-1.5">
              {[50, 75, 100, 150].map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setScale(s)}
                  className={`py-1.5 rounded-lg border text-xs font-mono transition-all ${
                    scale === s
                      ? "border-accent-blue bg-accent-blue/10 text-white"
                      : "border-zinc-800 bg-zinc-900/60 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200"
                  }`}
                >
                  {s}%
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Action Button */}
        <div className="mt-auto pt-6 border-t border-border flex flex-col gap-3">
          {error && (
            <div className="text-xs text-accent-red bg-accent-red/10 border border-accent-red/20 px-3.5 py-2.5 rounded-lg">
              {error}
            </div>
          )}
          {statusText && (
            <div className="text-xs text-accent-blue bg-accent-blue/10 border border-accent-blue/20 px-3.5 py-2.5 rounded-lg animate-pulse">
              {statusText}
            </div>
          )}
          <Button
            variant="primary"
            disabled={!file || isConverting}
            onClick={handleConvert}
            className="w-full py-3 text-sm font-semibold rounded-xl flex items-center gap-2 justify-center"
          >
            {isConverting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-white" />
                Converting to Video...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 text-white" />
                Convert GIF to {outputFormat.toUpperCase()}
              </>
            )}
          </Button>
        </div>
      </section>

      {/* Main Workspace */}
      <section className="flex-1 flex flex-col h-full overflow-hidden p-6 gap-6 bg-zinc-950/20">
        <div className="flex items-center justify-between text-zinc-300">
          <div className="flex items-center gap-2">
            <FileVideo className="w-4 h-4 text-accent-blue" />
            <h2 className="text-sm font-semibold">Video Converter Workspace</h2>
          </div>
          {file && (
            <Button variant="danger" onClick={handleRemove} className="p-2">
              <Trash2 className="w-4 h-4" />
            </Button>
          )}
        </div>

        {file && gifUrl ? (
          <div className="flex-1 flex flex-col gap-4 overflow-hidden">
            {/* Split View / Preview */}
            <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4 overflow-hidden">
              {/* Left: Input GIF */}
              <div className="bg-card/10 border border-border rounded-2xl flex flex-col overflow-hidden p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-zinc-400 flex items-center gap-1.5">
                    <Film className="w-3.5 h-3.5 text-accent-blue" /> Source GIF
                  </span>
                  <span className="text-[10px] font-mono text-zinc-500">
                    {(file.size / 1024 / 1024).toFixed(2)} MB
                  </span>
                </div>
                <div className="flex-1 flex items-center justify-center overflow-hidden">
                  <img
                    src={gifUrl}
                    alt="Source GIF"
                    className="max-h-full max-w-full object-contain rounded-lg shadow-md"
                  />
                </div>
              </div>

              {/* Right: Output Video */}
              <div className="bg-card/10 border border-border rounded-2xl flex flex-col overflow-hidden p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-zinc-400 flex items-center gap-1.5">
                    <Video className="w-3.5 h-3.5 text-green-400" /> Output Video ({outputFormat.toUpperCase()})
                  </span>
                  {videoSize && (
                    <span className="text-[10px] font-mono font-bold text-green-400">
                      {(videoSize / 1024 / 1024).toFixed(2)} MB
                    </span>
                  )}
                </div>
                <div className="flex-1 flex items-center justify-center overflow-hidden">
                  {videoUrl ? (
                    <video
                      src={videoUrl}
                      controls
                      autoPlay
                      loop
                      className="max-h-full max-w-full object-contain rounded-lg shadow-md"
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center text-center p-6 text-zinc-600">
                      <Play className="w-10 h-10 mb-2 opacity-40" />
                      <p className="text-xs">Click "Convert GIF" to generate video preview</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Results / Stats Card */}
            {videoSize && savings !== null && (
              <div className="bg-card/40 border border-border p-4 rounded-2xl flex items-center justify-between shrink-0">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-green-500/10 border border-green-500/20 text-green-400">
                    <CheckCircle className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white">Video Converted Successfully</h4>
                    <p className="text-[10px] text-zinc-400 mt-0.5">
                      Reduced file size from {(file.size / 1024 / 1024).toFixed(2)} MB down to {(videoSize / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                </div>

                <div className="text-right font-mono">
                  <span className="text-base font-bold text-green-400">
                    {savings > 0 ? `${savings}% smaller` : "Converted"}
                  </span>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div
            onClick={() => fileInputRef.current?.click()}
            className="flex-1 border-2 border-dashed border-border hover:border-zinc-700 bg-card/40 rounded-2xl flex flex-col items-center justify-center text-center p-6 cursor-pointer transition-colors duration-300"
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/gif"
              onChange={handleFileSelected}
              className="hidden"
            />
            <div className="mb-4 p-3 rounded-full bg-zinc-900 border border-border">
              <Upload className="w-8 h-8 text-zinc-400" />
            </div>
            <p className="mb-2 text-sm text-zinc-300">
              <span className="font-semibold text-accent-blue">Click to upload GIF</span> or drag and drop
            </p>
            <p className="text-xs text-zinc-500">Convert animated GIFs to MP4 or WebM video files up to 50MB</p>
          </div>
        )}
      </section>
    </div>
  );
};
