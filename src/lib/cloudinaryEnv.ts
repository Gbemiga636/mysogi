/** Cloudinary env checks only — safe for prompt helpers (no Node SDK / fs). */

function cleanEnv(value: string | undefined): string | undefined {
  if (!value) return undefined;
  return value
    .replace(/^\uFEFF/, "")
    .trim()
    .replace(/^['"]|['"]$/g, "");
}

/** True when Cloudinary env vars are set (hybrid publish, footer overlay). */
export function isCloudinaryConfigured(): boolean {
  const cloudinaryUrl = cleanEnv(process.env.CLOUDINARY_URL);
  const cloudName = cleanEnv(process.env.CLOUDINARY_CLOUD_NAME);
  const apiKey = cleanEnv(process.env.CLOUDINARY_API_KEY);
  const apiSecret = cleanEnv(process.env.CLOUDINARY_API_SECRET);
  return Boolean(cloudinaryUrl || (cloudName && apiKey && apiSecret));
}
