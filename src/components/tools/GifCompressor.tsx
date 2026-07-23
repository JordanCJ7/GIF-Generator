"use client";

import React, { useState, useRef, useEffect } from "react";
import { Sparkles, Upload, FileArchive, Loader2, Trash2, CheckCircle, Zap, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { optimizeGif, checkGifsicleStatus } from "@/lib/api";

// ─── Slider primitive ────────────────────────────────────────────────────────
interface SliderProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  hint?: string;
  onChange: (v: number) => void;
  formatValue?: (v: number) => string;
}

const Slider: React.FC<SliderProps> = ({ label, value, min, max, step = 1, hint, onChange, formatValue }) => {
  const pct = ((value - min) / (max - min)) * 100;
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between">
        <label className="text-xs font-medium text-zinc-400">{label}</label>
        <span className="text-xs font-mono font-bold text-white bg-zinc-900 border border-border px-2 py-0.5 rounded-md">
          {formatValue ? formatValue(value) : value}
        </span>
      </div>
      <div className="relative h-5 flex items-center">
        {/* Track */}
        <div className="absolute left-0 right-0 h-1.5 bg-zinc-800 rounded-full" />
        {/* Fill */}
        <div
          className="absolute left-0 h-1.5 bg-accent-blue rounded-full"
          style={{ width: `${pct}%` }}
        />
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="absolute w-full h-full opacity-0 cursor-pointer"
        />
        {/* Thumb */}
        <div
          className="absolute w-4 h-4 rounded-full bg-accent-blue border-2 border-white shadow-md shadow-blue-500/30 -translate-x-1/2 pointer-events-none"
          style={{ left: `${pct}%` }}
        />
      </div>
      {hint && <p className="text-[10px] text-zinc-600 leading-relaxed">{hint}</p>}
    </div>
  );
};

// ─── Size bar ────────────────────────────────────────────────────────────────
const SizeBar: React.FC<{ label: string; size: number; max: number; color: string }> = ({ label, size, max, color }) => {
  const pct = max > 0 ? Math.min(100, (size / max) * 100) : 0;
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center justify-between text-[10px]">
        <span className="text-zinc-500">{label}</span>
        <span className="font-mono font-bold text-zinc-300">{(size / 1024).toFixed(1)} KB</span>
      </div>
      <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all duration-500 ${color}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
};

// ─── Main Component ──────────────────────────────────────────────────────────
export const GifCompressor: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  // Gifsicle parameters
  const [lossy, setLossy] = useState(80);
  const [colors, setColors] = useState(256);
  const [optimizeLevel, setOptimizeLevel] = useState(3);

  // State
  const [isCompressing, setIsCompressing] = useState(false);
  const [result, setResult] = useState<{ originalSize: number; compressedSize: number; engine: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [gifsicleAvailable, setGifsicleAvailable] = useState<boolean | null>(null);
  const [gifsicleVersion, setGifsicleVersion] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  // Check gifsicle availability on mount
  useEffect(() => {
    checkGifsicleStatus().then(({ available, version }) => {
      setGifsicleAvailable(available);
      setGifsicleVersion(version);
    });
  }, []);

  const handleFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile && selectedFile.type === "image/gif") {
      setFile(selectedFile);
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      setPreviewUrl(URL.createObjectURL(selectedFile));
      setResult(null);
      setError(null);
    } else if (selectedFile) {
      setError("Please select a valid GIF file.");
    }
  };

  const handleRemove = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setFile(null);
    setPreviewUrl(null);
    setResult(null);
  };

  const handleOptimize = async () => {
    if (!file) return;
    setError(null);
    setIsCompressing(true);

    try {
      const res = await optimizeGif(file, lossy, colors, optimizeLevel);
      setResult({ originalSize: res.originalSize, compressedSize: res.compressedSize, engine: res.engine });

      // Auto-download
      const url = URL.createObjectURL(res.blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `optimized_${file.name}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err: any) {
      setError(err.message || "Failed to optimize GIF.");
    } finally {
      setIsCompressing(false);
    }
  };

  const savings = result
    ? Math.max(0, Math.round((1 - result.compressedSize / result.originalSize) * 100))
    : null;

  const optLevelLabel = ["", "O1 — Fast", "O2 — Balanced", "O3 — Maximum"][optimizeLevel] ?? "O3";

  return (
    <div className="flex-1 flex overflow-hidden">
      {/* Settings Side Panel */}
      <section className="w-80 md:w-96 border-r border-border bg-card/20 flex flex-col h-full overflow-y-auto p-6 gap-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-zinc-300">
            <FileArchive className="w-4 h-4 text-accent-blue" />
            <h2 className="text-sm font-semibold">Compression Settings</h2>
          </div>
          {/* Engine badge */}
          {gifsicleAvailable !== null && (
            <div className={`flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded-full border ${
              gifsicleAvailable
                ? "text-green-400 border-green-500/30 bg-green-500/10"
                : "text-yellow-400 border-yellow-500/30 bg-yellow-500/10"
            }`}>
              <Zap className="w-2.5 h-2.5" />
              {gifsicleAvailable ? "gifsicle" : "pillow"}
            </div>
          )}
        </div>

        {/* Gifsicle status banner */}
        {gifsicleAvailable === false && (
          <div className="bg-yellow-500/5 border border-yellow-500/20 rounded-xl p-3 flex gap-2 text-[10px] text-yellow-400 leading-relaxed">
            <Info className="w-3.5 h-3.5 shrink-0 mt-0.5" />
            <p>Gifsicle binary not found — using Pillow palette fallback. Lossy LZW compression is unavailable.</p>
          </div>
        )}

        {gifsicleAvailable === true && (
          <div className="bg-green-500/5 border border-green-500/20 rounded-xl p-3 flex gap-2 text-[10px] text-green-400 leading-relaxed">
            <Zap className="w-3.5 h-3.5 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">Gifsicle Active</p>
              <p className="text-green-600 mt-0.5">{gifsicleVersion}</p>
            </div>
          </div>
        )}

        {/* Controls */}
        <div className="flex flex-col gap-6 bg-card/40 border border-border p-5 rounded-2xl">
          <h3 className="text-sm font-semibold text-zinc-300 uppercase tracking-wider">Optimization</h3>

          <Slider
            label="Lossy Level"
            value={lossy}
            min={0}
            max={200}
            step={5}
            onChange={setLossy}
            formatValue={(v) => v === 0 ? "Lossless" : `${v}`}
            hint={
              lossy === 0
                ? "Lossless — only frame deduplication and LZW repacking."
                : lossy < 80
                ? "Low — minimal quality loss, good file size reduction."
                : lossy < 150
                ? "Medium — balanced quality vs. size. Recommended for most GIFs."
                : "High — aggressive compression, noticeable grain on complex frames."
            }
          />

          <Slider
            label="Color Palette"
            value={colors}
            min={8}
            max={256}
            step={8}
            onChange={setColors}
            formatValue={(v) => `${v} colors`}
            hint="Fewer colors = smaller file. 256 preserves maximum quality."
          />

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-zinc-400">Optimize Level</label>
            <div className="flex gap-2">
              {[1, 2, 3].map((lvl) => (
                <button
                  key={lvl}
                  onClick={() => setOptimizeLevel(lvl)}
                  className={`flex-1 py-2 rounded-xl border text-xs font-semibold transition-all duration-150 ${
                    optimizeLevel === lvl
                      ? "border-accent-blue bg-accent-blue/10 text-white"
                      : "border-zinc-800 bg-zinc-900/60 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200"
                  }`}
                >
                  O{lvl}
                </button>
              ))}
            </div>
            <p className="text-[10px] text-zinc-600">
              {optLevelLabel} — {["", "fastest, minimal frame merging", "removes redundant pixels between frames", "inter-frame optimization + transparency tricks"][optimizeLevel]}
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="mt-auto pt-6 border-t border-border flex flex-col gap-3">
          {error && (
            <div className="text-xs text-accent-red bg-accent-red/10 border border-accent-red/20 px-3.5 py-2.5 rounded-lg">
              {error}
            </div>
          )}
          <Button
            variant="primary"
            disabled={!file || isCompressing}
            onClick={handleOptimize}
            className="w-full py-3 text-sm font-semibold rounded-xl flex items-center gap-2 justify-center"
          >
            {isCompressing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-white" />
                Optimizing...
              </>
            ) : (
              <>
                <Zap className="w-4 h-4 text-white" />
                Optimize with Gifsicle
              </>
            )}
          </Button>
        </div>
      </section>

      {/* Main Workspace */}
      <section className="flex-1 flex flex-col h-full overflow-hidden p-6 gap-4 bg-zinc-950/20">
        <div className="flex items-center justify-between text-zinc-300 shrink-0">
          <div className="flex items-center gap-2">
            <FileArchive className="w-4 h-4 text-accent-blue" />
            <h2 className="text-sm font-semibold">Compressor Board</h2>
          </div>
          {file && (
            <Button variant="danger" onClick={handleRemove} className="p-2">
              <Trash2 className="w-4 h-4" />
            </Button>
          )}
        </div>

        {file && previewUrl ? (
          <div className="flex-1 flex flex-col gap-4 overflow-hidden">
            {/* Preview */}
            <div className="flex-1 bg-card/10 border border-border rounded-2xl flex items-center justify-center p-6 overflow-hidden">
              <img
                src={previewUrl}
                alt="Source GIF preview"
                className="max-h-full max-w-full object-contain rounded-lg shadow-lg"
              />
            </div>

            {/* Stats panel */}
            <div className="bg-card/40 border border-border p-4 rounded-2xl shrink-0 flex flex-col gap-3">
              {result ? (
                <>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-400" />
                      <span className="text-xs font-semibold text-green-400">Optimized & Downloaded</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] text-zinc-500">Engine:</span>
                      <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded border ${
                        result.engine === "gifsicle"
                          ? "text-green-400 border-green-500/30 bg-green-500/10"
                          : "text-yellow-400 border-yellow-500/30 bg-yellow-500/10"
                      }`}>
                        {result.engine}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2">
                    <SizeBar label="Original" size={result.originalSize} max={result.originalSize} color="bg-zinc-600" />
                    <SizeBar label="Optimized" size={result.compressedSize} max={result.originalSize} color="bg-accent-blue" />
                  </div>

                  <div className="flex items-center justify-between pt-1 border-t border-border">
                    <span className="text-[10px] text-zinc-500">Size reduction</span>
                    <span className="text-sm font-bold font-mono text-accent-blue">
                      {savings}% saved ({((result.originalSize - result.compressedSize) / 1024).toFixed(1)} KB freed)
                    </span>
                  </div>
                </>
              ) : (
                <div className="flex items-center justify-between font-mono">
                  <span className="text-xs text-zinc-400">Original Size</span>
                  <span className="text-xs font-bold text-white">{(file.size / 1024).toFixed(1)} KB</span>
                </div>
              )}
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
            <p className="text-xs text-zinc-500">Supports animated GIF files up to 20MB</p>
          </div>
        )}
      </section>
    </div>
  );
};
