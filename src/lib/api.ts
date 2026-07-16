export async function generateGif(
  files: File[],
  duration: number,
  width: number,
  height: number
): Promise<Blob> {
  const formData = new FormData();
  
  files.forEach((file) => {
    formData.append("files", file);
  });
  
  formData.append("duration", duration.toString());
  formData.append("width", width.toString());
  formData.append("height", height.toString());

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

