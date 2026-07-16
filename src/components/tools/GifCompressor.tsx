import React, { useState, useRef, useEffect } from "react";
import { Sparkles, Upload, FileArchive, Loader2, Trash2, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { compressGif } from "@/lib/api";

export const GifCompressor: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [colors, setColors] = useState<number>(128);
  const [isCompressing, setIsCompressing] = useState(false);
  const [compressedBlob, setCompressedBlob] = useState<Blob | null>(null);
  const [compressedUrl, setCompressedUrl] = useState<string | null>(null);
  const [compressedSize, setCompressedSize] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      if (compressedUrl) URL.revokeObjectURL(compressedUrl);
    };
  }, [previewUrl, compressedUrl]);

  const handleFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile && selectedFile.type === "image/gif") {
      setFile(selectedFile);
      setPreviewUrl(URL.createObjectURL(selectedFile));
      setCompressedBlob(null);
      setCompressedUrl(null);
      setCompressedSize(null);
      setError(null);
    } else if (selectedFile) {
      setError("Please select a valid GIF file.");
    }
  };

  const handleRemove = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    if (compressedUrl) URL.revokeObjectURL(compressedUrl);
    setFile(null);
    setPreviewUrl(null);
    setCompressedBlob(null);
    setCompressedUrl(null);
    setCompressedSize(null);
  };

  const handleCompress = async () => {
    if (!file) return;
    setError(null);
    setIsCompressing(true);

    try {
      const blob = await compressGif(file, colors);
      setCompressedBlob(blob);
      const url = URL.createObjectURL(blob);
      setCompressedUrl(url);
      setCompressedSize(blob.size);

      // Trigger auto download
      const a = document.createElement("a");
      a.href = url;
      a.download = `compressed_${file.name}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch (err: any) {
      setError(err.message || "Failed to compress GIF.");
    } finally {
      setIsCompressing(false);
    }
  };

  return (
    <div className="flex-1 flex overflow-hidden">
      {/* Settings Side Panel */}
      <section className="w-80 md:w-96 border-r border-border bg-card/20 flex flex-col h-full overflow-y-auto p-6 gap-6">
        <div className="flex items-center gap-2 text-zinc-300">
          <FileArchive className="w-4 h-4 text-accent-blue" />
          <h2 className="text-sm font-semibold">Compression Settings</h2>
        </div>

        <div className="flex flex-col gap-5 bg-card/40 border border-border p-5 rounded-2xl">
          <h3 className="text-sm font-semibold text-zinc-300 uppercase tracking-wider">
            Optimization
          </h3>

          <div className="flex flex-col gap-2">
            <label className="text-xs font-medium text-zinc-400">Colors (2-256)</label>
            <Input
              type="number"
              value={colors}
              onChange={(e) => setColors(Math.min(256, Math.max(2, parseInt(e.target.value) || 128)))}
              min={2}
              max={256}
            />
            <p className="text-[10px] text-zinc-500">
              Reducing color depth is the most effective way to compress animated GIFs.
            </p>
          </div>
        </div>

        <div className="mt-auto pt-6 border-t border-border flex flex-col gap-3">
          {error && (
            <div className="text-xs text-accent-red bg-accent-red/10 border border-accent-red/20 px-3.5 py-2.5 rounded-lg">
              {error}
            </div>
          )}

          <Button
            variant="primary"
            disabled={!file || isCompressing}
            onClick={handleCompress}
            className="w-full py-3 text-sm font-semibold rounded-xl flex items-center gap-2 justify-center"
          >
            {isCompressing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-white" />
                Compressing...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 text-white" />
                Compress GIF
              </>
            )}
          </Button>
        </div>
      </section>

      {/* Main Workspace */}
      <section className="flex-1 flex flex-col h-full overflow-hidden p-6 gap-6 bg-zinc-950/20">
        <div className="flex items-center justify-between text-zinc-300">
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
            <div className="flex-1 bg-card/10 border border-border rounded-2xl flex items-center justify-center p-6 overflow-hidden">
              <img
                src={previewUrl}
                alt="Source preview"
                className="max-h-full max-w-full object-contain rounded-lg shadow-lg"
              />
            </div>

            {/* Details Panel */}
            <div className="bg-card/40 border border-border p-4 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
              <div className="text-xs font-mono">
                <p className="text-zinc-400">Original Size: <span className="text-white font-bold">{(file.size / 1024).toFixed(1)} KB</span></p>
                {compressedSize && (
                  <p className="text-accent-blue mt-1">Compressed Size: <span className="font-bold">{(compressedSize / 1024).toFixed(1)} KB</span> ({Math.round((1 - compressedSize / file.size) * 100)}% savings)</p>
                )}
              </div>

              {compressedUrl && (
                <div className="flex items-center gap-2 text-xs text-green-400 font-medium">
                  <CheckCircle className="w-4 h-4" />
                  Successfully Compressed & Downloaded!
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
