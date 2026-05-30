import Replicate from "replicate";
import { isExactTextFlyerPrompt } from "./flyerExactTextPrompt";
import { scrubPromptForImagen } from "./flyerImagenScrub";
import {
  flattenErrorMessage,
  isReplicateHostError,
  isTransientNetworkError,
  withNetworkRetry,
} from "./networkRetry";
import type { VideoFormat } from "./types";
import { FORMAT_RATIOS } from "./types";

export const REPLICATE_MODELS = {
  video: "minimax/video-01",
  image: "google/imagen-4",
} as const;

let client: Replicate | null = null;

export function getReplicateToken(): string {
  const token = process.env.REPLICATE_API_TOKEN?.trim();
  if (!token) {
    throw new Error(
      "REPLICATE_API_TOKEN is not set. Add it to .env.local and restart the dev server."
    );
  }
  return token;
}

export function getReplicate(): Replicate {
  if (!client) {
    client = new Replicate({ auth: getReplicateToken() });
  }
  return client;
}

/** User-friendly message from Replicate API errors */
export function parseReplicateError(error: unknown): string {
  const raw = flattenErrorMessage(error);

  if (/402|insufficient credit|payment required/i.test(raw)) {
    return "Replicate account needs credit. Add billing at replicate.com/account/billing, wait a few minutes, then try again.";
  }
  if (/401|unauthorized|invalid.*token/i.test(raw)) {
    return "Invalid REPLICATE_API_TOKEN. Check .env.local and restart npm run dev.";
  }
  if (/404|not found/i.test(raw) && /model/i.test(raw)) {
    return "Image model unavailable on Replicate. Check REPLICATE_MODELS.image in the project.";
  }

  if (
    isTransientNetworkError(error) &&
    (isReplicateHostError(error) || /fetch failed/i.test(raw))
  ) {
    return "Could not reach Replicate (api.replicate.com). This is usually a temporary internet or DNS issue — check your connection, wait 10–20 seconds, and try again.";
  }

  if (/EAI_AGAIN|ENOTFOUND|getaddrinfo/i.test(raw)) {
    return "DNS could not resolve api.replicate.com (EAI_AGAIN). Check Wi‑Fi or mobile data, disable VPN if it blocks Replicate, then try again.";
  }

  return raw.length > 200 ? `${raw.slice(0, 200)}…` : raw || "Replicate request failed";
}

export function mapReplicateStatus(
  status: string
): "SUCCEEDED" | "FAILED" | "RUNNING" {
  const s = status.toLowerCase();
  if (s === "succeeded") return "SUCCEEDED";
  if (s === "failed" || s === "canceled") return "FAILED";
  return "RUNNING";
}

function replicateCall<T>(label: string, fn: () => Promise<T>): Promise<T> {
  return withNetworkRetry(fn, { retries: 4, label });
}

/** Upload data URI for use as first_frame_image on Replicate */
export async function uploadDataUri(dataUri: string): Promise<string> {
  return replicateCall("replicate.files.create", async () => {
    const replicate = getReplicate();
    const base64 = dataUri.includes(",") ? dataUri.split(",")[1] : dataUri;
    const buffer = Buffer.from(base64, "base64");
    const mimeMatch = dataUri.match(/data:([^;]+);/);
    const mime = mimeMatch?.[1] ?? "image/png";

    const file = await replicate.files.create(buffer, { contentType: mime });
    const url = file.urls?.get;
    if (!url) throw new Error("Failed to upload image to Replicate");
    return url;
  });
}

async function resolveImageUrl(image: string): Promise<string> {
  if (image.startsWith("http://") || image.startsWith("https://")) {
    return image;
  }
  if (image.startsWith("data:")) {
    return uploadDataUri(image);
  }
  throw new Error("Invalid image source — use URL or file upload");
}

export async function createTextToVideo(params: {
  promptText: string;
  format: VideoFormat;
  duration?: number;
}) {
  void params.duration;
  void params.format;

  return replicateCall("predictions.create.video", async () => {
    const replicate = getReplicate();
    const prediction = await replicate.predictions.create({
      model: REPLICATE_MODELS.video,
      input: {
        prompt: params.promptText,
        prompt_optimizer: true,
      },
    });
    if (!prediction.id) throw new Error("Replicate did not return a prediction id");
    return { id: prediction.id };
  });
}

export async function createImageToVideo(params: {
  promptImage: string;
  promptText: string;
  format: VideoFormat;
  duration?: number;
}) {
  void params.format;
  void params.duration;

  const firstFrame = await resolveImageUrl(params.promptImage);

  return replicateCall("predictions.create.image2video", async () => {
    const replicate = getReplicate();
    const prediction = await replicate.predictions.create({
      model: REPLICATE_MODELS.video,
      input: {
        prompt: params.promptText,
        first_frame_image: firstFrame,
        prompt_optimizer: true,
      },
    });
    if (!prediction.id) throw new Error("Replicate did not return a prediction id");
    return { id: prediction.id };
  });
}

export async function createTextToImage(params: {
  promptText: string;
  format: VideoFormat;
  renderTextInImage?: boolean;
}) {
  const { replicateAspectRatio } = FORMAT_RATIOS[params.format];

  let prompt: string;
  if (
    params.renderTextInImage ||
    isExactTextFlyerPrompt(params.promptText)
  ) {
    const exactPrefix =
      "Finished luxury marketing flyer photograph. Spell provided phrases exactly. No extra writing in the image.";
    prompt = scrubPromptForImagen(`${exactPrefix} ${params.promptText}`);
  } else if (params.promptText.startsWith("ZERO-TEXT")) {
    prompt = params.promptText;
  } else {
    prompt = `ZERO-TEXT BACKGROUND PLATE — absolutely no letters, numbers, words, logos with text, or signage in the image. Marketing copy is added after generation. ${params.promptText}`;
  }

  return replicateCall("predictions.create.imagen", async () => {
    const replicate = getReplicate();
    const prediction = await replicate.predictions.create({
      model: REPLICATE_MODELS.image,
      input: {
        prompt,
        aspect_ratio: replicateAspectRatio,
        safety_filter_level: "block_only_high",
        output_format: "png",
      },
    });
    if (!prediction.id) throw new Error("Replicate did not return a prediction id");
    return { id: prediction.id };
  });
}

export async function getPrediction(predictionId: string) {
  return replicateCall(`predictions.get.${predictionId.slice(0, 8)}`, () =>
    getReplicate().predictions.get(predictionId)
  );
}

export async function waitForTask(predictionId: string, maxWaitMs = 600000) {
  const start = Date.now();

  while (Date.now() - start < maxWaitMs) {
    const prediction = await getPrediction(predictionId);
    const mapped = mapReplicateStatus(prediction.status);

    if (mapped === "SUCCEEDED") {
      return {
        status: "SUCCEEDED",
        output: prediction.output,
      };
    }

    if (mapped === "FAILED") {
      throw new Error(
        `Replicate generation failed: ${prediction.error ?? prediction.status}`
      );
    }

    await new Promise((r) => setTimeout(r, 4000));
  }

  throw new Error("Replicate prediction timed out — try again.");
}

function pickUrl(value: unknown): string | null {
  if (!value) return null;
  if (typeof value === "string") {
    return value.startsWith("http") ? value : null;
  }
  if (typeof value === "object" && value !== null) {
    const o = value as Record<string, unknown>;
    if (typeof o.url === "string") return o.url;
    if (typeof o.uri === "string") return o.uri;
    if (typeof o.video === "string") return o.video;
    if (typeof o.output === "string") return o.output;
  }
  return null;
}

export function extractOutputUrl(result: {
  output?: unknown;
  data?: unknown;
}): string | null {
  const output = result.output ?? result.data;
  if (!output) return null;

  const direct = pickUrl(output);
  if (direct) return direct;

  if (Array.isArray(output)) {
    for (const item of output) {
      const url = pickUrl(item);
      if (url) return url;
    }
  }

  if (typeof output === "object" && output !== null) {
    const o = output as Record<string, unknown>;
    for (const key of ["video", "url", "output", "result"]) {
      const url = pickUrl(o[key]);
      if (url) return url;
    }
  }

  return null;
}

/** Quick connectivity check for status page / debugging */
export async function testReplicateConnection(): Promise<{
  ok: boolean;
  error?: string;
}> {
  try {
    await replicateCall("api.ping", async () => {
      await getReplicate().predictions.list();
      return true;
    });
    return { ok: true };
  } catch (e) {
    return { ok: false, error: parseReplicateError(e) };
  }
}
