import React, { useState, useRef, useEffect } from "react";
import { Monitor, Radio, Disc, Sparkles, Trash2, Loader2, StopCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { generateGif } from "@/lib/api";

export const ScreenRecorder: React.FC = () => {
  const [fps, setFps] = useState<number>(10);
  const [width, setWidth] = useState<number>(400);
  const [height, setHeight] = useState<number>(400);
  
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [recordingState, setRecordingState] = useState<"idle" | "recording" | "recorded">("idle");
  const [videoBlob, setVideoBlob] = useState<Blob | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [isCompiling, setIsCompiling] = useState(false);
  const [statusText, setStatusText] = useState("");
  const [error, setError] = useState<string | null>(null);

  const chunksRef = useRef<Blob[]>([]);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    return () => {
      if (videoUrl) URL.revokeObjectURL(videoUrl);
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [videoUrl, stream]);

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

  return (
    <div className="flex-1 flex overflow-hidden">
      {/* Settings Side Panel */}
      <section className="w-80 md:w-96 border-r border-border bg-card/20 flex flex-col h-full overflow-y-auto p-6 gap-6">
        <div className="flex items-center gap-2 text-zinc-300">
          <Monitor className="w-4 h-4 text-accent-blue" />
          <h2 className="text-sm font-semibold">Recording Settings</h2>
        </div>

        <div className="flex flex-col gap-5 bg-card/40 border border-border p-5 rounded-2xl">
          <h3 className="text-sm font-semibold text-zinc-300 uppercase tracking-wider">
            Configuration
          </h3>

          <div className="flex flex-col gap-2">
            <label className="text-xs font-medium text-zinc-400">Capture FPS</label>
            <Input
              type="number"
              value={fps}
              onChange={(e) => setFps(Math.min(30, Math.max(1, parseInt(e.target.value) || 10)))}
              min={1}
              max={30}
              disabled={recordingState === "recording"}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-2">
              <label className="text-xs font-medium text-zinc-400">Width</label>
              <Input
                type="number"
                value={width}
                onChange={(e) => setWidth(Math.max(100, parseInt(e.target.value) || 400))}
                min={100}
                disabled={recordingState === "recording"}
              />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-xs font-medium text-zinc-400">Height</label>
              <Input
                type="number"
                value={height}
                onChange={(e) => setHeight(Math.max(100, parseInt(e.target.value) || 400))}
                min={100}
                disabled={recordingState === "recording"}
              />
            </div>
          </div>
        </div>

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

          {recordingState === "recording" && (
            <Button variant="danger" onClick={stopRecording} className="w-full py-3 text-sm font-semibold rounded-xl flex items-center gap-2 justify-center">
              <StopCircle className="w-4 h-4 text-white" />
              Stop Recording
            </Button>
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

          {recordingState === "recording" && (
            <div className="flex flex-col items-center gap-3">
              <div className="relative">
                <div className="absolute inset-0 bg-red-500/20 rounded-full blur-xl animate-ping" />
                <div className="p-5 bg-red-600/10 border border-red-500/30 text-red-500 rounded-full relative">
                  <Radio className="w-8 h-8 animate-pulse" />
                </div>
              </div>
              <h3 className="text-sm font-semibold text-white">Recording in progress...</h3>
              <p className="text-xs text-zinc-400">Capturing display output frame data.</p>
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
                  setWidth(videoRef.current.videoWidth || 400);
                  setHeight(videoRef.current.videoHeight || 400);
                }
              }}
            />
          )}
        </div>
      </section>
    </div>
  );
};
