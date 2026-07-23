import React, { useState, useRef, useEffect, useCallback } from "react";
import { Monitor, Radio, Disc, Sparkles, Trash2, Loader2, StopCircle, Pause, Play, Zap, Timer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { generateGif } from "@/lib/api";

// ─── FPS Slider ──────────────────────────────────────────────────────────────
interface FpsSliderProps {
  value: number;
  onChange: (v: number) => void;
  disabled?: boolean;
}

const FPS_PRESETS = [5, 10, 15, 24, 30, 60];

const FpsSlider: React.FC<FpsSliderProps> = ({ value, onChange, disabled }) => {
  const pct = ((value - 1) / (60 - 1)) * 100;
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <label className="text-xs font-medium text-zinc-400">Capture FPS</label>
        <span className="text-xs font-mono font-bold text-white bg-zinc-900 border border-border px-2 py-0.5 rounded-md">
          {value} fps
        </span>
      </div>

      {/* Slider track */}
      <div className="relative h-5 flex items-center">
        <div className="absolute left-0 right-0 h-1.5 bg-zinc-800 rounded-full" />
        <div
          className="absolute left-0 h-1.5 bg-accent-blue rounded-full transition-all duration-75"
          style={{ width: `${pct}%` }}
        />
        <input
          type="range"
          min={1}
          max={60}
          step={1}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          disabled={disabled}
          className="absolute w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
        />
        <div
          className="absolute w-4 h-4 rounded-full bg-accent-blue border-2 border-white shadow-md shadow-blue-500/30 -translate-x-1/2 pointer-events-none transition-all duration-75"
          style={{ left: `${pct}%` }}
        />
      </div>

      {/* Preset buttons */}
      <div className="grid grid-cols-6 gap-1.5">
        {FPS_PRESETS.map((preset) => (
          <button
            key={preset}
            type="button"
            disabled={disabled}
            onClick={() => onChange(preset)}
            className={`py-1.5 rounded-lg border text-[10px] font-mono font-semibold transition-all duration-150 ${
              value === preset
                ? "border-accent-blue bg-accent-blue/10 text-white"
                : "border-zinc-800 bg-zinc-900/60 text-zinc-500 hover:border-zinc-700 hover:text-zinc-300 disabled:opacity-40 disabled:cursor-not-allowed"
            }`}
          >
            {preset}
          </button>
        ))}
      </div>
    </div>
  );
};

// ─── Quality Presets ─────────────────────────────────────────────────────────
interface QualityPreset {
  id: string;
  label: string;
  fps: number;
  width: number;
  height: number;
  description: string;
}

const QUALITY_PRESETS: QualityPreset[] = [
  { id: "draft",    label: "Draft",    fps: 10, width: 320,  height: 240,  description: "Small file, quick capture" },
  { id: "standard", label: "Standard", fps: 15, width: 640,  height: 480,  description: "Balanced quality & size" },
  { id: "high",     label: "High",     fps: 30, width: 1280, height: 720,  description: "Sharp, smooth output" },
  { id: "ultra",    label: "Ultra",    fps: 60, width: 1920, height: 1080, description: "Maximum fidelity" },
];

// ─── Recording Timer Hook ────────────────────────────────────────────────────
function useRecordingTimer(isRunning: boolean) {
  const [elapsed, setElapsed] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (isRunning) {
      setElapsed(0);
      intervalRef.current = setInterval(() => {
        setElapsed((prev) => prev + 1);
      }, 1000);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isRunning]);

  const minutes = Math.floor(elapsed / 60);
  const seconds = elapsed % 60;
  const formatted = `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;

  return { elapsed, formatted };
}

// ─── Props ───────────────────────────────────────────────────────────────────
interface ScreenRecorderProps {
  onRecordingChange?: (isRecording: boolean) => void;
}

// ─── Main Component ──────────────────────────────────────────────────────────
export const ScreenRecorder: React.FC<ScreenRecorderProps> = ({ onRecordingChange }) => {
  const [fps, setFps] = useState<number>(15);
  const [width, setWidth] = useState<number>(640);
  const [height, setHeight] = useState<number>(480);
  const [activePreset, setActivePreset] = useState<string | null>("standard");

  const [stream, setStream] = useState<MediaStream | null>(null);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [recordingState, setRecordingState] = useState<"idle" | "recording" | "paused" | "recorded">("idle");
  const [videoBlob, setVideoBlob] = useState<Blob | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [isCompiling, setIsCompiling] = useState(false);
  const [statusText, setStatusText] = useState("");
  const [error, setError] = useState<string | null>(null);

  const chunksRef = useRef<Blob[]>([]);
  const videoRef = useRef<HTMLVideoElement>(null);

  const isTimerRunning = recordingState === "recording";
  const { formatted: timerDisplay } = useRecordingTimer(isTimerRunning);

  // Notify parent of recording state changes
  useEffect(() => {
    onRecordingChange?.(recordingState === "recording" || recordingState === "paused");
  }, [recordingState, onRecordingChange]);

  useEffect(() => {
    return () => {
      if (videoUrl) URL.revokeObjectURL(videoUrl);
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [videoUrl, stream]);

  // Apply quality preset
  const applyPreset = useCallback((preset: QualityPreset) => {
    setFps(preset.fps);
    setWidth(preset.width);
    setHeight(preset.height);
    setActivePreset(preset.id);
  }, []);

  // Clear active preset when user manually changes settings
  const handleFpsChange = (v: number) => {
    setFps(v);
    setActivePreset(null);
  };
  const handleWidthChange = (v: number) => {
    setWidth(Math.max(100, v));
    setActivePreset(null);
  };
  const handleHeightChange = (v: number) => {
    setHeight(Math.max(100, v));
    setActivePreset(null);
  };

  const startRecording = async () => {
    setError(null);
    chunksRef.current = [];

    try {
      const displayStream = await navigator.mediaDevices.getDisplayMedia({
        video: {
          frameRate: { ideal: fps },
        },
        audio: false,
      });

      setStream(displayStream);

      // Determine supported MIME types
      let mimeType = "video/webm";
      if (MediaRecorder.isTypeSupported("video/webm;codecs=vp9")) {
        mimeType = "video/webm;codecs=vp9";
      } else if (MediaRecorder.isTypeSupported("video/mp4")) {
        mimeType = "video/mp4";
      }

      const recorder = new MediaRecorder(displayStream, { mimeType });
      setMediaRecorder(recorder);

      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: mimeType });
        setVideoBlob(blob);
        setVideoUrl(URL.createObjectURL(blob));
        setRecordingState("recorded");

        // Stop all tracks
        displayStream.getTracks().forEach((track) => track.stop());
        setStream(null);
      };

      // Handle user stopping screen share via browser bar
      displayStream.getVideoTracks()[0].onended = () => {
        if (recorder.state !== "inactive") {
          recorder.stop();
        }
      };

      recorder.start(100); // chunk every 100ms
      setRecordingState("recording");
    } catch (err: any) {
      setError(err.message || "Failed to start screen capture.");
    }
  };

  const pauseRecording = () => {
    if (mediaRecorder && mediaRecorder.state === "recording") {
      mediaRecorder.pause();
      setRecordingState("paused");
    }
  };

  const resumeRecording = () => {
    if (mediaRecorder && mediaRecorder.state === "paused") {
      mediaRecorder.resume();
      setRecordingState("recording");
    }
  };

  const stopRecording = () => {
    if (mediaRecorder && mediaRecorder.state !== "inactive") {
      mediaRecorder.stop();
    }
  };

  const handleReset = () => {
    if (videoUrl) URL.revokeObjectURL(videoUrl);
    setVideoBlob(null);
    setVideoUrl(null);
    setRecordingState("idle");
    setError(null);
  };

  const extractFramesAndCompile = async (): Promise<File[]> => {
    const video = videoRef.current;
    if (!video) throw new Error("Video element not available");

    const totalDuration = video.duration;
    if (isNaN(totalDuration) || totalDuration <= 0) {
      throw new Error("Invalid video duration");
    }

    const frameCount = Math.floor(totalDuration * fps);
    const timeStep = 1 / fps;
    const frames: File[] = [];

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Could not create canvas context");

    video.pause();

    for (let i = 0; i < frameCount; i++) {
      const time = i * timeStep;
      setStatusText(`Extracting frame ${i + 1} of ${frameCount}...`);
      video.currentTime = time;

      await new Promise<void>((resolve) => {
        const onSeeked = () => {
          video.removeEventListener("seeked", onSeeked);
          resolve();
        };
        video.addEventListener("seeked", onSeeked);
      });

      // Draw frames matching resolution settings
      ctx.drawImage(video, 0, 0, width, height);

      const blob = await new Promise<Blob | null>((resolve) => {
        canvas.toBlob((b) => resolve(b), "image/jpeg", 0.85);
      });

      if (blob) {
        frames.push(new File([blob], `frame_${i}.jpg`, { type: "image/jpeg" }));
      }
    }

    return frames;
  };

  const handleCompile = async () => {
    if (!videoBlob) return;
    setError(null);
    setIsCompiling(true);

    try {
      const frames = await extractFramesAndCompile();
      if (frames.length < 2) {
        throw new Error("Recording is too short or frame rate is too low.");
      }

      setStatusText("Generating GIF in backend...");
      const delay = Math.round(1000 / fps);
      const gifBlob = await generateGif(frames, delay, width, height);

      const url = URL.createObjectURL(gifBlob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "screen_recording.gif";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setStatusText("Success!");
    } catch (err: any) {
      setError(err.message || "Failed to generate GIF from recording.");
    } finally {
      setIsCompiling(false);
      setStatusText("");
    }
  };

  const isActiveRecording = recordingState === "recording" || recordingState === "paused";

  return (
    <div className="flex-1 flex overflow-hidden">
      {/* Settings Side Panel */}
      <section className="w-80 md:w-96 border-r border-border bg-card/20 flex flex-col h-full overflow-y-auto p-6 gap-6">
        <div className="flex items-center gap-2 text-zinc-300">
          <Monitor className="w-4 h-4 text-accent-blue" />
          <h2 className="text-sm font-semibold">Recording Settings</h2>
        </div>

        {/* Quality Presets */}
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-1.5">
            <Zap className="w-3 h-3 text-accent-blue" />
            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Quick Presets</span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {QUALITY_PRESETS.map((preset) => (
              <button
                key={preset.id}
                type="button"
                disabled={isActiveRecording}
                onClick={() => applyPreset(preset)}
                className={`flex flex-col items-start gap-0.5 p-3 rounded-xl border text-left transition-all duration-150 ${
                  activePreset === preset.id
                    ? "border-accent-blue bg-accent-blue/10 shadow-[0_0_12px_rgba(59,130,246,0.08)]"
                    : "border-zinc-800 bg-zinc-900/40 hover:border-zinc-700 disabled:opacity-40 disabled:cursor-not-allowed"
                }`}
              >
                <span className={`text-xs font-semibold ${activePreset === preset.id ? "text-white" : "text-zinc-300"}`}>
                  {preset.label}
                </span>
                <span className="text-[10px] text-zinc-500 font-mono">
                  {preset.fps}fps · {preset.width}×{preset.height}
                </span>
                <span className="text-[9px] text-zinc-600 leading-tight">{preset.description}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Fine-Tune Controls */}
        <div className="flex flex-col gap-5 bg-card/40 border border-border p-5 rounded-2xl">
          <h3 className="text-sm font-semibold text-zinc-300 uppercase tracking-wider">
            Fine-Tune
          </h3>

          <FpsSlider
            value={fps}
            onChange={handleFpsChange}
            disabled={isActiveRecording}
          />

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-2">
              <label className="text-xs font-medium text-zinc-400">Width</label>
              <Input
                type="number"
                value={width}
                onChange={(e) => handleWidthChange(parseInt(e.target.value) || 640)}
                min={100}
                disabled={isActiveRecording}
              />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-xs font-medium text-zinc-400">Height</label>
              <Input
                type="number"
                value={height}
                onChange={(e) => handleHeightChange(parseInt(e.target.value) || 480)}
                min={100}
                disabled={isActiveRecording}
              />
            </div>
          </div>
        </div>

        {/* Actions */}
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

          {recordingState === "idle" && (
            <Button variant="primary" onClick={startRecording} className="w-full py-3 text-sm font-semibold rounded-xl flex items-center gap-2 justify-center">
              <Disc className="w-4 h-4 text-white animate-pulse" />
              Start Capture
            </Button>
          )}

          {isActiveRecording && (
            <div className="flex flex-col gap-2">
              <div className="flex gap-2">
                {recordingState === "recording" ? (
                  <Button variant="secondary" onClick={pauseRecording} className="flex-1 py-3 text-sm font-semibold rounded-xl flex items-center gap-2 justify-center">
                    <Pause className="w-4 h-4" />
                    Pause
                  </Button>
                ) : (
                  <Button variant="primary" onClick={resumeRecording} className="flex-1 py-3 text-sm font-semibold rounded-xl flex items-center gap-2 justify-center">
                    <Play className="w-4 h-4 text-white" />
                    Resume
                  </Button>
                )}
                <Button variant="danger" onClick={stopRecording} className="flex-1 py-3 text-sm font-semibold rounded-xl flex items-center gap-2 justify-center">
                  <StopCircle className="w-4 h-4 text-white" />
                  Stop
                </Button>
              </div>
            </div>
          )}

          {recordingState === "recorded" && (
            <>
              <Button
                variant="primary"
                disabled={isCompiling}
                onClick={handleCompile}
                className="w-full py-3 text-sm font-semibold rounded-xl flex items-center gap-2 justify-center"
              >
                {isCompiling ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-white" />
                    Generating GIF...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-white" />
                    Export to GIF
                  </>
                )}
              </Button>
              <Button variant="secondary" onClick={handleReset} className="w-full py-3 text-sm font-semibold rounded-xl flex items-center gap-2 justify-center">
                <Trash2 className="w-4 h-4" />
                Discard & Reset
              </Button>
            </>
          )}
        </div>
      </section>

      {/* Main Workspace */}
      <section className="flex-1 flex flex-col h-full overflow-hidden p-6 gap-6 bg-zinc-950/20">
        <div className="flex items-center gap-2 text-zinc-300">
          <Radio className="w-4 h-4 text-accent-blue" />
          <h2 className="text-sm font-semibold">Recording Viewport</h2>
        </div>

        <div className="flex-1 bg-card/10 border border-border rounded-2xl flex flex-col items-center justify-center text-center p-6 overflow-hidden">
          {recordingState === "idle" && (
            <>
              <div className="mb-4 p-4 rounded-full bg-zinc-900/60 border border-border">
                <Monitor className="w-12 h-12 text-zinc-500" />
              </div>
              <h3 className="text-sm font-medium text-zinc-300 mb-1">No Screen Capture Active</h3>
              <p className="text-xs text-zinc-500 max-w-sm">
                Select a target screen, application window, or browser tab to begin recording.
              </p>
            </>
          )}

          {isActiveRecording && (
            <div className="flex flex-col items-center gap-4">
              {/* Recording pulse indicator */}
              <div className="relative">
                <div className="absolute inset-0 bg-red-500/20 rounded-full blur-xl animate-ping" />
                <div className={`p-5 border rounded-full relative transition-colors duration-300 ${
                  recordingState === "paused"
                    ? "bg-yellow-600/10 border-yellow-500/30 text-yellow-500"
                    : "bg-red-600/10 border-red-500/30 text-red-500"
                }`}>
                  <Radio className={`w-8 h-8 ${recordingState === "recording" ? "animate-pulse" : ""}`} />
                </div>
              </div>

              {/* Timer */}
              <div className="flex items-center gap-2 bg-zinc-900/80 border border-border px-4 py-2 rounded-full">
                <Timer className={`w-4 h-4 ${recordingState === "paused" ? "text-yellow-500" : "text-red-500"}`} />
                <span className="text-lg font-mono font-bold text-white tracking-wider">{timerDisplay}</span>
              </div>

              <h3 className="text-sm font-semibold text-white">
                {recordingState === "paused" ? "Recording Paused" : "Recording in progress..."}
              </h3>
              <p className="text-xs text-zinc-400">
                {recordingState === "paused"
                  ? "Recording is paused. Resume or stop to finish."
                  : `Capturing at ${fps} fps · ${width}×${height}`}
              </p>
            </div>
          )}

          {recordingState === "recorded" && videoUrl && (
            <video
              ref={videoRef}
              src={videoUrl}
              controls
              className="max-h-full max-w-full rounded-lg shadow-lg border border-border"
              onLoadedMetadata={() => {
                if (videoRef.current) {
                  setWidth(videoRef.current.videoWidth || 640);
                  setHeight(videoRef.current.videoHeight || 480);
                }
              }}
            />
          )}
        </div>
      </section>
    </div>
  );
};
