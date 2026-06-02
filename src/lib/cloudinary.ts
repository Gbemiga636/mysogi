import "server-only";

import { createHash } from "crypto";
import { v2 as cloudinary } from "cloudinary";
import { isCloudinaryConfigured } from "./cloudinaryEnv";
import { getFlyerLogoSize } from "./logoBesideHeadline";
import type { VideoFormat } from "./types";

/** Strip quotes, spaces, and BOM from .env values */
function cleanEnv(value: string | undefined): string | undefined {
  if (!value) return undefined;
  return value
    .replace(/^\uFEFF/, "")
    .trim()
    .replace(/^['"]|['"]$/g, "");
}

let configured = false;
let cachedUnsignedPreset: string | null = null;

const DEFAULT_UNSIGNED_PRESET = "mysogi_unsigned";

type Credentials = {
  cloudName: string;
  apiKey: string;
  apiSecret: string;
};

/** Parse cloudinary://key:secret@cloud_name */
function parseCloudinaryUrl(url: string): Credentials {
  const match = url.match(/^cloudinary:\/\/([^:]+):([^@]+)@([^/?#]+)/i);
  if (!match) {
    throw new Error(
      "CLOUDINARY_URL is invalid. Use cloudinary://API_KEY:API_SECRET@CLOUD_NAME from Dashboard → API Keys."
    );
  }
  return {
    apiKey: decodeURIComponent(match[1]),
    apiSecret: decodeURIComponent(match[2]),
    cloudName: decodeURIComponent(match[3]),
  };
}

function applyConfig(): Credentials {
  const cloudinaryUrl = cleanEnv(process.env.CLOUDINARY_URL);
  const cloudName = cleanEnv(process.env.CLOUDINARY_CLOUD_NAME);
  const apiKey = cleanEnv(process.env.CLOUDINARY_API_KEY);
  const apiSecret = cleanEnv(process.env.CLOUDINARY_API_SECRET);

  if (cloudinaryUrl) {
    const parsed = parseCloudinaryUrl(cloudinaryUrl);
    cloudinary.config({
      cloud_name: parsed.cloudName,
      api_key: parsed.apiKey,
      api_secret: parsed.apiSecret,
      secure: true,
      api_timeout: 120_000,
    });
    configured = true;
    return parsed;
  }

  if (!cloudName || !apiKey || !apiSecret) {
    throw new Error(
      "Cloudinary is not configured. Set CLOUDINARY_URL in .env.local and restart npm run dev."
    );
  }

  const creds = { cloudName, apiKey, apiSecret };
  cloudinary.config({
    cloud_name: cloudName,
    api_key: apiKey,
    api_secret: apiSecret,
    secure: true,
    api_timeout: 120_000,
  });
  configured = true;
  return creds;
}

function getCredentials(): Credentials {
  return applyConfig();
}

export { isCloudinaryConfigured };

/** Upload composed flyer buffer (hybrid pipeline) */
export async function uploadFlyerBuffer(
  buffer: Buffer,
  folder = "mysogi-ads"
): Promise<CloudinaryUploadResult> {
  return uploadBufferWithFallback(buffer, "image/jpeg", folder, "image");
}

function isStaleCloudinaryError(error: unknown): boolean {
  const raw =
    error instanceof Error
      ? error.message
      : String((error as { message?: string })?.message ?? error);
  return /stale request/i.test(raw);
}

function cloudinaryErrorMessage(body: unknown): string {
  if (body && typeof body === "object" && "error" in body) {
    const err = (body as { error?: { message?: string } }).error;
    if (err?.message) return err.message;
  }
  return "Cloudinary upload failed";
}

/** UTC unix time from the internet (signed HTTP fallback only) */
let trustedTsCache: { ts: number; at: number } | null = null;

async function getTrustedUploadTimestamp(): Promise<number> {
  if (trustedTsCache && Date.now() - trustedTsCache.at < 30_000) {
    return trustedTsCache.ts;
  }

  const sources: Array<() => Promise<number>> = [
    async () => {
      const r = await fetch(
        "https://worldtimeapi.org/api/timezone/Etc/UTC",
        { signal: AbortSignal.timeout(8000) }
      );
      const j = (await r.json()) as { unixtime?: number };
      if (!j.unixtime) throw new Error("no unixtime");
      return j.unixtime;
    },
    async () => {
      const r = await fetch(
        "https://timeapi.io/api/Time/current/zone?timeZone=UTC",
        { signal: AbortSignal.timeout(8000) }
      );
      const j = (await r.json()) as { epochSeconds?: number };
      if (!j.epochSeconds) throw new Error("no epoch");
      return j.epochSeconds;
    },
  ];

  for (const load of sources) {
    try {
      const ts = await load();
      trustedTsCache = { ts, at: Date.now() };
      return ts;
    } catch {
      /* next */
    }
  }

  const ts = Math.floor(Date.now() / 1000);
  trustedTsCache = { ts, at: Date.now() };
  return ts;
}

/**
 * Ensure unsigned preset exists (admin API only — not used for upload signing).
 */
export async function ensureUnsignedUploadPreset(): Promise<string> {
  if (cachedUnsignedPreset) return cachedUnsignedPreset;

  getCredentials();
  const presetName =
    cleanEnv(process.env.CLOUDINARY_UPLOAD_PRESET) ?? DEFAULT_UNSIGNED_PRESET;

  try {
    await cloudinary.api.upload_preset(presetName);
  } catch {
    try {
      await cloudinary.api.create_upload_preset({
        name: presetName,
        unsigned: true,
      } as { name: string; unsigned: boolean });
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      throw new Error(`Could not create upload preset "${presetName}": ${msg}`);
    }
  }

  cachedUnsignedPreset = presetName;
  return presetName;
}

type CloudinaryUploadApiResponse = {
  public_id: string;
  secure_url: string;
  width: number;
  height: number;
  error?: { message: string };
};

function toResult(result: CloudinaryUploadApiResponse): CloudinaryUploadResult {
  if (!result.public_id || !result.secure_url) {
    throw new Error(cloudinaryErrorMessage(result));
  }
  return {
    publicId: result.public_id,
    secureUrl: result.secure_url,
    width: result.width ?? 0,
    height: result.height ?? 0,
  };
}

function signParams(
  params: Record<string, string>,
  apiSecret: string
): string {
  const toSign = Object.keys(params)
    .sort()
    .map((k) => `${k}=${params[k]}`)
    .join("&");
  return createHash("sha256").update(toSign + apiSecret).digest("hex");
}

/**
 * Direct HTTP upload — unsigned preset only (NO timestamp, NO signature).
 * The Node SDK still signs when api_secret is set; this bypasses that completely.
 */
async function uploadBufferUnsignedHttp(
  buffer: Buffer,
  mime: string,
  folder: string,
  resourceType: "image" | "video" = "image"
): Promise<CloudinaryUploadResult> {
  const creds = getCredentials();
  const preset = await ensureUnsignedUploadPreset();

  const form = new FormData();
  const ext = mime.includes("png") ? "png" : mime.includes("jpeg") || mime.includes("jpg") ? "jpg" : "bin";
  form.append("file", new Blob([new Uint8Array(buffer)], { type: mime }), `upload.${ext}`);
  form.append("upload_preset", preset);
  form.append("api_key", creds.apiKey);
  if (folder) form.append("folder", folder);

  const url = `https://api.cloudinary.com/v1_1/${creds.cloudName}/${resourceType}/upload`;
  const res = await fetch(url, {
    method: "POST",
    body: form,
    signal: AbortSignal.timeout(120_000),
  });

  const json = (await res.json()) as CloudinaryUploadApiResponse;
  if (!res.ok) {
    throw new Error(cloudinaryErrorMessage(json));
  }
  return toResult(json);
}

/** Signed HTTP upload with network UTC timestamp (fallback) */
async function uploadBufferSignedHttp(
  buffer: Buffer,
  mime: string,
  folder: string,
  resourceType: "image" | "video" = "image"
): Promise<CloudinaryUploadResult> {
  const creds = getCredentials();
  const timestamp = String(await getTrustedUploadTimestamp());

  const signPayload: Record<string, string> = { timestamp, folder };
  const signature = signParams(signPayload, creds.apiSecret);

  const form = new FormData();
  const ext = mime.includes("png") ? "png" : "jpg";
  form.append("file", new Blob([new Uint8Array(buffer)], { type: mime }), `upload.${ext}`);
  form.append("api_key", creds.apiKey);
  form.append("timestamp", timestamp);
  form.append("signature", signature);
  form.append("folder", folder);

  const url = `https://api.cloudinary.com/v1_1/${creds.cloudName}/${resourceType}/upload`;
  const res = await fetch(url, {
    method: "POST",
    body: form,
    signal: AbortSignal.timeout(120_000),
  });

  const json = (await res.json()) as CloudinaryUploadApiResponse;
  if (!res.ok) {
    throw new Error(cloudinaryErrorMessage(json));
  }
  return toResult(json);
}

async function uploadBufferWithFallback(
  buffer: Buffer,
  mime: string,
  folder: string,
  resourceType: "image" | "video" = "image"
): Promise<CloudinaryUploadResult> {
  try {
    return await uploadBufferUnsignedHttp(buffer, mime, folder, resourceType);
  } catch (first) {
    if (isStaleCloudinaryError(first)) {
      trustedTsCache = null;
      return await uploadBufferSignedHttp(buffer, mime, folder, resourceType);
    }
    const msg = first instanceof Error ? first.message : String(first);
    if (/upload preset|unsigned|Invalid preset/i.test(msg)) {
      cachedUnsignedPreset = null;
      await ensureUnsignedUploadPreset();
      return await uploadBufferUnsignedHttp(buffer, mime, folder, resourceType);
    }
    throw first;
  }
}

function parseDataUrl(dataUrl: string): { buffer: Buffer; mime: string } {
  const match = dataUrl.match(/^data:([^;]+);base64,([\s\S]+)$/);
  if (!match) throw new Error("Invalid image data URL");
  return {
    mime: match[1],
    buffer: Buffer.from(match[2], "base64"),
  };
}

export function parseCloudinaryError(error: unknown): string {
  const err = error as {
    message?: string;
    error?: { message?: string };
    http_response?: { body?: { error?: { message?: string } } };
  };
  const raw =
    err?.error?.message ??
    err?.http_response?.body?.error?.message ??
    err?.message ??
    "Cloudinary upload failed";

  if (raw.includes("cloud_name mismatch")) {
    return "Cloudinary cloud name is wrong. Copy CLOUDINARY_URL from Dashboard → API Keys into .env.local.";
  }
  if (raw.includes("api_secret mismatch") || raw.includes("Invalid signature")) {
    return "Cloudinary API secret is wrong. Update CLOUDINARY_URL in .env.local.";
  }
  if (raw.includes("Unknown API key")) {
    return "Cloudinary API key is wrong. Update CLOUDINARY_URL in .env.local.";
  }
  if (/Upload preset.*not found|Invalid upload preset/i.test(raw)) {
    return 'Cloudinary preset missing — restart npm run dev (creates "mysogi_unsigned" automatically).';
  }
  if (/timeout|timed out|499/i.test(raw)) {
    return "Cloudinary timed out. Try a smaller logo (under 2MB) and generate again.";
  }
  if (/stale request/i.test(raw)) {
    return "Cloudinary upload failed after retry. Restart npm run dev and try again.";
  }
  return raw;
}

export async function testCloudinaryConnection(): Promise<{
  ok: boolean;
  cloudName?: string;
  uploadMode?: string;
  uploadPreset?: string;
  error?: string;
}> {
  try {
    const creds = getCredentials();
    await cloudinary.api.ping();

    const preset = await ensureUnsignedUploadPreset();
    const tiny = Buffer.from(
      "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
      "base64"
    );
    await uploadBufferUnsignedHttp(tiny, "image/png", "mysogi-test");

    return {
      ok: true,
      cloudName: creds.cloudName,
      uploadMode: "unsigned-http",
      uploadPreset: preset,
    };
  } catch (e) {
    return { ok: false, error: parseCloudinaryError(e) };
  }
}

export type CloudinaryUploadResult = {
  publicId: string;
  secureUrl: string;
  width: number;
  height: number;
};

export async function uploadVideoBuffer(
  buffer: Buffer,
  mime = "video/mp4",
  folder = "mysogi-videos"
): Promise<CloudinaryUploadResult> {
  return uploadBufferWithFallback(buffer, mime, folder, "video");
}

export async function uploadFromRemoteBuffer(
  sourceUrl: string,
  folder = "mysogi-ads"
): Promise<CloudinaryUploadResult> {
  const res = await fetch(sourceUrl, {
    headers: { "User-Agent": "Mysogi-Ad-Studio/1.0" },
    signal: AbortSignal.timeout(90_000),
  });

  if (!res.ok) {
    throw new Error(
      `Could not download your image (${res.status}). Try generating the image again.`
    );
  }

  const buffer = Buffer.from(await res.arrayBuffer());
  if (buffer.length < 100) {
    throw new Error("Downloaded image was empty. Generate the image again.");
  }

  const contentType = (res.headers.get("content-type") ?? "image/png")
    .split(";")[0]
    .trim();
  const mime = contentType.startsWith("image/") ? contentType : "image/png";

  return uploadBufferWithFallback(buffer, mime, folder, "image");
}

export async function uploadFromUrl(
  sourceUrl: string,
  folder = "mysogi-ads"
): Promise<CloudinaryUploadResult> {
  return uploadFromRemoteBuffer(sourceUrl, folder);
}

export async function uploadFromDataUrl(
  dataUrl: string,
  folder = "mysogi-ads",
  options?: { preserveTransparency?: boolean }
): Promise<CloudinaryUploadResult> {
  if (dataUrl.length > 12_000_000) {
    throw new Error("Logo file is too large. Use a PNG under 2MB in Step 1.");
  }
  const { buffer, mime } = parseDataUrl(dataUrl);
  const uploadMime =
    options?.preserveTransparency || mime.includes("png") ? "image/png" : mime;
  return uploadBufferWithFallback(buffer, uploadMime, folder, "image");
}

export async function uploadImage(input: {
  imageUrl?: string;
  dataUrl?: string;
  preserveTransparency?: boolean;
}): Promise<CloudinaryUploadResult> {
  if (input.dataUrl) {
    return uploadFromDataUrl(input.dataUrl, "mysogi-ads", {
      preserveTransparency: input.preserveTransparency,
    });
  }
  if (!input.imageUrl) throw new Error("Provide imageUrl or dataUrl");
  return uploadFromUrl(input.imageUrl);
}

export function transparentPngDeliveryUrl(publicId: string): string {
  const { cloudName } = getCredentials();
  return `https://res.cloudinary.com/${cloudName}/image/upload/e_background_removal/f_png/fl_preserve_transparency/${publicId}.png`;
}

function ensurePngTransparency(url: string, publicId: string): string {
  if (url.includes("f_png") && url.includes("preserve_transparency")) return url;
  if (publicId) return transparentPngDeliveryUrl(publicId);
  return url.replace("/upload/", "/upload/f_png/fl_preserve_transparency/");
}

export async function applyBackgroundRemoval(
  publicId: string
): Promise<CloudinaryUploadResult> {
  getCredentials();

  const deliveryUrl = transparentPngDeliveryUrl(publicId);

  try {
    const uploaded = await uploadFromUrl(deliveryUrl);
    return {
      ...uploaded,
      secureUrl: ensurePngTransparency(uploaded.secureUrl, uploaded.publicId),
    };
  } catch {
    const result = await cloudinary.uploader.explicit(publicId, {
      type: "upload",
      eager: [
        {
          effect: "background_removal",
          fetch_format: "png",
          flags: "preserve_transparency",
        },
      ],
      eager_async: false,
    });
    const eager = result.eager?.[0];
    if (eager?.secure_url) {
      const secureUrl = ensurePngTransparency(
        eager.secure_url,
        result.public_id
      );
      return {
        publicId: result.public_id,
        secureUrl,
        width: eager.width ?? result.width,
        height: eager.height ?? result.height,
      };
    }
    throw new Error(
      "Background removal failed. Enable the Background Removal add-on in your Cloudinary console."
    );
  }
}

export function getCloudName(): string {
  return getCredentials().cloudName;
}

export async function overlayLogoOnImage(
  imageUrl: string,
  logoDataUrl: string
): Promise<CloudinaryUploadResult> {
  return overlayLogoBesideHeadline(imageUrl, logoDataUrl, "9:16");
}

/** Small logo centered at top of flyer content (above headline) */
export async function overlayLogoBesideHeadline(
  imageUrl: string,
  logoDataUrl: string,
  _format: VideoFormat = "9:16"
): Promise<CloudinaryUploadResult> {
  const base = await uploadFromUrl(imageUrl, "mysogi-ads");
  const logo = await uploadFromDataUrl(logoDataUrl, "mysogi-logos");

  getCredentials();
  const overlayId = logo.publicId.includes("/")
    ? logo.publicId.replace(/\//g, ":")
    : logo.publicId;

  const canvasW = base.width || 1080;
  const canvasH = base.height || 1920;
  const logoWidth = getFlyerLogoSize(canvasW);

  const composedUrl = cloudinary.url(base.publicId, {
    transformation: [
      {
        overlay: overlayId,
        width: logoWidth,
        crop: "scale",
        gravity: "north",
        x: 0,
        y: Math.round(canvasH * 0.028),
        opacity: 100,
      },
    ],
    secure: true,
    format: "jpg",
    quality: "auto:good",
  });

  return uploadFromRemoteBuffer(composedUrl, "mysogi-ads");
}

/** Place logo on AI flyer — corner placement (legacy) */
export async function overlayLogoOnFlyer(
  imageUrl: string,
  logoDataUrl: string,
  corner: "top-left" | "top-right" | "bottom-left" | "bottom-right" = "top-right"
): Promise<CloudinaryUploadResult> {
  const base = await uploadFromUrl(imageUrl, "mysogi-ads");
  const logo = await uploadFromDataUrl(logoDataUrl, "mysogi-logos");

  getCredentials();
  const overlayId = logo.publicId.includes("/")
    ? logo.publicId.replace(/\//g, ":")
    : logo.publicId;

  const logoWidth = Math.round(Math.min((base.width || 1080) * 0.09, 96));

  const gravityMap = {
    "top-left": "north_west",
    "top-right": "north_east",
    "bottom-left": "south_west",
    "bottom-right": "south_east",
  } as const;

  const composedUrl = cloudinary.url(base.publicId, {
    transformation: [
      {
        overlay: overlayId,
        width: logoWidth,
        crop: "scale",
        gravity: gravityMap[corner],
        x: 36,
        y: 36,
        opacity: 100,
      },
    ],
    secure: true,
    format: "jpg",
    quality: "auto:good",
  });

  return uploadFromRemoteBuffer(composedUrl, "mysogi-ads");
}
