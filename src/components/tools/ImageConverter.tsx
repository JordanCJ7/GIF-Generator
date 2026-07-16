import React, { useState, useRef } from "react";
import { Sparkles, Upload, Shuffle, CheckCircle, Trash2, Download } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ImageItem {
  id: string;
  file: File;
  previewUrl: string;
  convertedUrl?: string;
  convertedName?: string;
  status: "idle" | "converting" | "done" | "error";
}

export const ImageConverter: React.FC = () => {
  const [images, setImages] = useState<ImageItem[]>([]);
  const [format, setFormat] = useState<string>("png");
  const [quality, setQuality] = useState<number>(0.9);
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFilesSelected = (selectedFiles: FileList | null) => {
    if (!selectedFiles) return;
    const newItems = Array.from(selectedFiles)
      .filter((file) => file.type.startsWith("image/"))
      .map((file) => ({
        id: Math.random().toString(36).substring(2, 9),
        file,
        previewUrl: URL.createObjectURL(file),
        status: "idle" as const,
      }));
    setImages((prev) => [...prev, ...newItems]);
  };

  const handleRemoveImage = (id: string) => {
    setImages((prev) => {
      const target = prev.find((item) => item.id === id);
      if (target) {
        URL.revokeObjectURL(target.previewUrl);
        if (target.convertedUrl) URL.revokeObjectURL(target.convertedUrl);
      }
      return prev.filter((item) => item.id !== id);
    });
  };

  const convertSingleImage = (item: ImageItem, targetFormat: string, qualityVal: number): Promise<ImageItem> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          resolve({ ...item, status: "error" });
          return;
        }

        ctx.drawImage(img, 0, 0);

        let mimeType = "image/png";
        let extension = ".png";
        if (targetFormat === "jpg" || targetFormat === "jpeg") {
          mimeType = "image/jpeg";
          extension = ".jpg";
        } else if (targetFormat === "webp") {
          mimeType = "image/webp";
          extension = ".webp";
        }

        canvas.toBlob(
          (blob) => {
            if (!blob) {
              resolve({ ...item, status: "error" });
              return;
            }
            const convertedUrl = URL.createObjectURL(blob);
            const originalBase = item.file.name.substring(0, item.file.name.lastIndexOf(".")) || item.file.name;
            resolve({
              ...item,
              status: "done",
              convertedUrl,
              convertedName: `${originalBase}${extension}`,
            });
          },
          mimeType,
          qualityVal
        );
      };
      img.onerror = () => {
        resolve({ ...item, status: "error" });
      };
      img.src = item.previewUrl;
    });
  };

  const handleConvert = async () => {
    if (images.length === 0) return;
    setIsProcessing(true);

    const updated = await Promise.all(
      images.map(async (item) => {
        if (item.status === "done") return item;
        return await convertSingleImage(item, format, quality);
      })
    );

    setImages(updated);
    setIsProcessing(false);
  };

  const triggerDownload = (item: ImageItem) => {
    if (!item.convertedUrl || !item.convertedName) return;
    const a = document.createElement("a");
    a.href = item.convertedUrl;
    a.download = item.convertedName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="flex-1 flex overflow-hidden">
      {/* Settings Side Panel */}
      <section className="w-80 md:w-96 border-r border-border bg-card/20 flex flex-col h-full overflow-y-auto p-6 gap-6">
        <div className="flex items-center gap-2 text-zinc-300">
          <Shuffle className="w-4 h-4 text-accent-blue" />
          <h2 className="text-sm font-semibold">Converter Settings</h2>
        </div>

        <div className="flex flex-col gap-5 bg-card/40 border border-border p-5 rounded-2xl">
          <h3 className="text-sm font-semibold text-zinc-300 uppercase tracking-wider">
            Format Options
          </h3>

          <div className="flex flex-col gap-2">
            <label className="text-xs font-medium text-zinc-400">Convert To</label>
            <select
              value={format}
              onChange={(e) => setFormat(e.target.value)}
              className="w-full bg-zinc-900 border border-border rounded-lg p-2.5 text-sm text-zinc-100 focus:outline-none focus:ring-1 focus:ring-accent-blue"
            >
              <option value="png">PNG (.png)</option>
              <option value="jpg">JPEG (.jpg)</option>
              <option value="webp">WEBP (.webp)</option>
            </select>
          </div>

          {(format === "jpg" || format === "webp") && (
            <div className="flex flex-col gap-2">
              <label className="text-xs font-medium text-zinc-400">Quality ({Math.round(quality * 100)}%)</label>
              <input
                type="range"
                min="0.1"
                max="1.0"
                step="0.05"
                value={quality}
                onChange={(e) => setQuality(parseFloat(e.target.value))}
                className="w-full h-1.5 bg-zinc-950 rounded-lg appearance-none cursor-pointer accent-accent-blue"
              />
            </div>
          )}
        </div>

        <div className="mt-auto pt-6 border-t border-border">
          <Button
            variant="primary"
            disabled={images.length === 0 || isProcessing}
            onClick={handleConvert}
            className="w-full py-3 text-sm font-semibold rounded-xl flex items-center gap-2 justify-center"
          >
            <Sparkles className="w-4 h-4 text-white" />
            {isProcessing ? "Converting..." : "Convert Images"}
          </Button>
        </div>
      </section>

      {/* Main Workspace */}
      <section className="flex-1 flex flex-col h-full overflow-hidden p-6 gap-6 bg-zinc-950/20">
        <div className="flex items-center gap-2 text-zinc-300">
          <Shuffle className="w-4 h-4 text-accent-blue" />
          <h2 className="text-sm font-semibold">Image Board</h2>
        </div>

        <div
          onClick={() => fileInputRef.current?.click()}
          className="border-2 border-dashed border-border hover:border-zinc-700 bg-card/40 rounded-2xl flex flex-col items-center justify-center text-center p-6 h-40 cursor-pointer transition-colors duration-300"
        >
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*"
            onChange={(e) => handleFilesSelected(e.target.files)}
            className="hidden"
          />
          <div className="mb-2 p-2 rounded-full bg-zinc-900 border border-border">
            <Upload className="w-6 h-6 text-zinc-400" />
          </div>
          <p className="text-xs text-zinc-300">
            <span className="font-semibold text-accent-blue">Click to upload images</span> or drag and drop
          </p>
          <p className="text-[10px] text-zinc-500">Supports PNG, JPG, JPEG, WEBP, BMP, SVG</p>
        </div>

        <div className="flex-1 overflow-y-auto flex flex-col gap-3 pr-1">
          {images.map((item) => (
            <div
              key={item.id}
              className="flex items-center gap-4 bg-card/30 border border-border/80 p-3 rounded-xl hover:bg-card/50 transition-all duration-200"
            >
              <img
                src={item.previewUrl}
                alt={item.file.name}
                className="w-12 h-12 object-cover rounded-lg border border-border"
              />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-mono truncate text-zinc-200">{item.file.name}</p>
                <p className="text-[10px] text-zinc-500">{(item.file.size / 1024).toFixed(1)} KB</p>
              </div>

              <div className="flex items-center gap-2">
                {item.status === "done" && (
                  <Button
                    variant="secondary"
                    onClick={() => triggerDownload(item)}
                    className="p-2 text-zinc-300 hover:text-white"
                  >
                    <Download className="w-4 h-4" />
                  </Button>
                )}
                <Button
                  variant="danger"
                  onClick={() => handleRemoveImage(item.id)}
                  className="p-2 text-zinc-300 hover:text-white"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))}
          {images.length === 0 && (
            <div className="flex-1 flex items-center justify-center text-zinc-500 text-xs py-10">
              No images uploaded yet.
            </div>
          )}
        </div>
      </section>
    </div>
  );
};
