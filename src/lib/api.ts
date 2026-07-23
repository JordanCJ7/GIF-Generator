export async function generateGif(
  files: File[],
  duration: number,
  width: number,
  height: number,
  perFrameDelays?: number[]
): Promise<Blob> {
  const formData = new FormData();

  files.forEach((file) => {
    formData.append("files", file);
  });

  formData.append("duration", duration.toString());
  formData.append("width", width.toString());
  formData.append("height", height.toString());

  // Send per-frame delays if provided
  if (perFrameDelays && perFrameDelays.length === files.length) {
    formData.append("durations", JSON.stringify(perFrameDelays));
  }

  const response = await fetch("http://127.0.0.1:8000/generate-gif", {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    const errorText = await response.text();
    let errorMessage = "Failed to generate GIF";
    try {
      const errorJson = JSON.parse(errorText);
      errorMessage = errorJson.detail || errorMessage;
    } catch {
      errorMessage = errorText || errorMessage;
    }
    throw new Error(errorMessage);
  }

  return await response.blob();
}

export async function compressGif(
  file: File,
  colors: number
): Promise<Blob> {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("colors", colors.toString());

  const response = await fetch("http://127.0.0.1:8000/compress-gif", {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    const errorText = await response.text();
    let errorMessage = "Failed to compress GIF";
    try {
      const errorJson = JSON.parse(errorText);
      errorMessage = errorJson.detail || errorMessage;
    } catch {
      errorMessage = errorText || errorMessage;
    }
    throw new Error(errorMessage);
  }

  return await response.blob();
}

export interface OptimizeResult {
  blob: Blob;
  originalSize: number;
  compressedSize: number;
  engine: string;
}

export async function optimizeGif(
  file: File,
  lossy: number,
  colors: number,
  optimize: number
): Promise<OptimizeResult> {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("lossy", lossy.toString());
  formData.append("colors", colors.toString());
  formData.append("optimize", optimize.toString());

  const response = await fetch("http://127.0.0.1:8000/optimize-gif", {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    const errorText = await response.text();
    let errorMessage = "Failed to optimize GIF";
    try {
      const errorJson = JSON.parse(errorText);
      errorMessage = errorJson.detail || errorMessage;
    } catch {
      errorMessage = errorText || errorMessage;
    }
    throw new Error(errorMessage);
  }

  const blob = await response.blob();
  const originalSize = parseInt(response.headers.get("X-Original-Size") ?? "0", 10);
  const compressedSize = parseInt(response.headers.get("X-Compressed-Size") ?? String(blob.size), 10);
  const engine = response.headers.get("X-Engine") ?? "unknown";

  return { blob, originalSize, compressedSize, engine };
}

export async function checkGifsicleStatus(): Promise<{ available: boolean; version: string | null }> {
  try {
    const res = await fetch("http://127.0.0.1:8000/gifsicle-status");
    return await res.json();
  } catch {
    return { available: false, version: null };
  }
}
