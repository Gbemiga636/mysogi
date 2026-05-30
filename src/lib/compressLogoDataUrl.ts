/** Shrink logo uploads so API requests stay under Vercel's ~4.5MB body limit. */
export async function compressLogoDataUrl(
  dataUrl: string,
  maxDim = 512,
  quality = 0.82
): Promise<string> {
  if (typeof document === "undefined") return dataUrl;

  // Already small enough — skip re-encoding
  if (dataUrl.length < 400_000) return dataUrl;

  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const scale = Math.min(1, maxDim / Math.max(img.width, img.height, 1));
      const w = Math.max(1, Math.round(img.width * scale));
      const h = Math.max(1, Math.round(img.height * scale));
      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        resolve(dataUrl);
        return;
      }
      ctx.drawImage(img, 0, 0, w, h);
      resolve(canvas.toDataURL("image/jpeg", quality));
    };
    img.onerror = () => reject(new Error("Could not read logo image"));
    img.src = dataUrl;
  });
}
