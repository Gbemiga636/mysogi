import OpenAI from "openai";
import type { ImageGenerateParams } from "openai/resources/images";
import { isExactTextFlyerPrompt } from "./flyerExactTextPrompt";
import { sanitizeExactTextFlyerPrompt } from "./flyerExactTextGuard";
import { scrubPromptForImagen } from "./flyerImagenScrub";
import { isAdAgencyCinematicPrompt } from "./adAgencyEngine";
import { isDirectFlyerPrompt } from "./directFlyerPrompt";
import { isEliteAgencyPrompt } from "./eliteAdCreativeDirector";
import { isSeniorDesignerPrompt } from "./seniorDesignerEngine";
import { isAdBrainPrompt } from "./adBrainEngine";
import { isWorldClassFlyerPrompt } from "./worldClassFlyerEngine";
import {
  FORBIDDEN_CONTACT_IN_IMAGE,
  buildTypesetTextMasterRules,
} from "./businessContact";
import { shouldForbidContactInAiImage } from "./flyerExactContactMode";
import { OPENAI_ADHERENCE_PREAMBLE } from "./promptAdherence";
import { isEliteMasterFlyerPrompt } from "./eliteFlyerMasterPrompt";
import {
  isOpenAIIntegratedFlyerPrompt,
  OPENAI_MAX_PROMPT_CHARS,
} from "./openaiFlyerDesign";
import { putFlyerImage, resolveFlyerImageUrl } from "./flyerImageStore";
import { flattenErrorMessage, withNetworkRetry } from "./networkRetry";
import type { VideoFormat } from "./types";

export const OPENAI_IMAGE_SYNC_PREFIX = "openai-done|";

const MAX_PROMPT_CHARS = OPENAI_MAX_PROMPT_CHARS;

/** gpt-image-1 API (2025+) — no style, response_format, or DALL·E-only fields */
type GptImageQuality = "low" | "medium" | "high" | "auto";
type GptImageSize = "1024x1024" | "1024x1536" | "1536x1024" | "auto";
type DalleImageSize = "1024x1024" | "1024x1792" | "1792x1024";

export type OpenAIApiFamily = "gpt" | "dalle";

let client: OpenAI | null = null;

export function getOpenAIApiKey(): string {
  const key = process.env.OPENAI_API_KEY?.trim();
  if (!key) {
    throw new Error(
      "OPENAI_API_KEY is not set. Add it to .env.local and set FLYER_IMAGE_PROVIDER=openai, then restart npm run dev."
    );
  }
  return key;
}

export function getOpenAIImageClient(): OpenAI {
  if (!client) {
    client = new OpenAI({
      apiKey: getOpenAIApiKey(),
      maxRetries: 0,
      timeout: 180_000,
    });
  }
  return client;
}

export function normalizeOpenAIModel(raw?: string): string {
  const m = (raw?.trim() || "gpt-image-1").toLowerCase();
  if (m === "dalle-3" || m === "dall_e_3") return "dall-e-3";
  if (m === "dalle-2" || m === "dall_e_2") return "dall-e-2";
  if (m === "gpt-image-1" || m === "gptimage1" || m === "gpt-image") {
    return "gpt-image-1";
  }
  return m;
}

/**
 * Which OpenAI Images API parameter set to use.
 * Default "gpt" — current keys often reject style / response_format (DALL·E-only).
 * Set FLYER_OPENAI_API_FAMILY=dalle only if your account still supports DALL·E 3 fields.
 */
export function getOpenAIApiFamily(model: string): OpenAIApiFamily {
  const env = process.env.FLYER_OPENAI_API_FAMILY?.trim().toLowerCase();
  if (env === "dalle" || env === "dall-e" || env === "legacy") return "dalle";
  if (env === "gpt" || env === "gpt-image" || env === "modern") return "gpt";
  if (model === "gpt-image-1") return "gpt";
  if (model === "dall-e-2" || model === "dall-e-3") return "dalle";
  return "gpt";
}

export function isGptImageModel(model: string): boolean {
  return model === "gpt-image-1" || getOpenAIApiFamily(model) === "gpt";
}

export function resolveGptImageSize(format: VideoFormat): GptImageSize {
  if (process.env.FLYER_OPENAI_FORCE_SQUARE !== "false") {
    return "1024x1024";
  }
  switch (format) {
    case "9:16":
    case "4:5":
      return "1024x1536";
    case "16:9":
      return "1536x1024";
    default:
      return "1024x1024";
  }
}

export function resolveDalleImageSize(format: VideoFormat): DalleImageSize {
  if (process.env.FLYER_OPENAI_FORCE_SQUARE !== "false") {
    return "1024x1024";
  }
  switch (format) {
    case "9:16":
    case "4:5":
      return "1024x1792";
    case "16:9":
      return "1792x1024";
    default:
      return "1024x1024";
  }
}

export function resolveGptQuality(): GptImageQuality {
  const q = (process.env.FLYER_OPENAI_QUALITY?.trim() || "medium").toLowerCase();
  if (q === "low" || q === "medium" || q === "high" || q === "auto") return q;
  if (q === "standard") return "medium";
  if (q === "hd") return "high";
  return "medium";
}

/** Strict body — only parameters valid for the chosen API family */
export function buildImageGenerateParams(
  model: string,
  prompt: string,
  format: VideoFormat
): ImageGenerateParams {
  const family = getOpenAIApiFamily(model);
  const qualityEnv = process.env.FLYER_OPENAI_QUALITY?.trim() || "medium";

  if (family === "gpt") {
    return {
      model: "gpt-image-1",
      prompt,
      n: 1,
      size: resolveGptImageSize(format),
      quality: resolveGptQuality(),
    };
  }

  const body: ImageGenerateParams = {
    model: model === "dall-e-2" ? "dall-e-2" : "dall-e-3",
    prompt,
    n: 1,
    size: resolveDalleImageSize(format),
  };

  if (body.model === "dall-e-3") {
    body.quality = qualityEnv === "hd" ? "hd" : "standard";
    body.style = "natural";
  }

  return body;
}

export function buildOpenAIFlyerPrompt(
  promptText: string,
  renderTextInImage?: boolean
): string {
  let prompt: string;
  if (
    isAdBrainPrompt(promptText) ||
    isWorldClassFlyerPrompt(promptText) ||
    isSeniorDesignerPrompt(promptText) ||
    isEliteAgencyPrompt(promptText) ||
    isDirectFlyerPrompt(promptText) ||
    isAdAgencyCinematicPrompt(promptText) ||
    isEliteMasterFlyerPrompt(promptText) ||
    isOpenAIIntegratedFlyerPrompt(promptText)
  ) {
    const contactRule = shouldForbidContactInAiImage()
      ? ` ${FORBIDDEN_CONTACT_IN_IMAGE}`
      : ` ${buildTypesetTextMasterRules()}`;
    prompt = `${OPENAI_ADHERENCE_PREAMBLE}${contactRule} ${sanitizeExactTextFlyerPrompt(promptText)}`;
  } else if (renderTextInImage || isExactTextFlyerPrompt(promptText)) {
    const exactPrefix =
      "Premium luxury marketing flyer photograph. Render only the specified marketing copy as clean typography. ";
    prompt = scrubPromptForImagen(`${exactPrefix}${promptText}`);
  } else if (promptText.startsWith("ZERO-TEXT")) {
    prompt = scrubPromptForImagen(promptText);
  } else {
    prompt = scrubPromptForImagen(
      `ZERO-TEXT luxury advertising background plate for a premium international campaign. Absolutely no letters, numbers, words, logos with text, or signage in the image. Marketing copy is composited after generation. Cinematic lighting, editorial composition, high-end commercial photography. ${promptText}`
    );
  }
  return prompt.slice(0, MAX_PROMPT_CHARS);
}

export function parseOpenAIImageError(error: unknown): string {
  const raw = flattenErrorMessage(error);

  if (/401|invalid.*api.*key|incorrect api key/i.test(raw)) {
    return "Invalid OPENAI_API_KEY. Check .env.local and restart the dev server.";
  }
  if (/429|rate limit/i.test(raw)) {
    return "OpenAI rate limit hit. Wait a minute or switch FLYER_IMAGE_PROVIDER=replicate in .env.local.";
  }
  if (/billing|insufficient|quota|exceeded/i.test(raw)) {
    return "OpenAI billing or quota limit. Add credit at platform.openai.com or switch FLYER_IMAGE_PROVIDER=replicate.";
  }
  if (/content policy|safety|moderation/i.test(raw)) {
    return "OpenAI rejected the prompt (content policy). Try a simpler creative idea or switch to Replicate.";
  }
  if (
    /ECONNRESET|socket hang up|ETIMEDOUT|ENOTFOUND|EAI_AGAIN|fetch failed|Connection error/i.test(
      raw
    )
  ) {
    return "Network dropped while talking to OpenAI (common on slow or mobile internet). Check your connection and try again — the app will auto-retry a few times.";
  }
  if (/unknown parameter/i.test(raw)) {
    const param = raw.match(/Unknown parameter:\s*'([^']+)'/i)?.[1];
    return param
      ? `OpenAI rejected parameter "${param}". Set FLYER_OPENAI_MODEL=gpt-image-1 and FLYER_OPENAI_API_FAMILY=gpt in .env.local, restart npm run dev, then try again.`
      : "OpenAI rejected an API parameter. Use gpt-image-1 settings in .env.local (see .env.example).";
  }

  return raw.length > 220 ? `${raw.slice(0, 220)}…` : raw || "OpenAI image generation failed";
}

async function resolveImageUrlFromResponse(
  data: { url?: string; b64_json?: string } | undefined,
  requestOrigin?: string
): Promise<string> {
  if (data?.url) return data.url;
  if (data?.b64_json) {
    const buffer = Buffer.from(data.b64_json, "base64");
    const stored = await putFlyerImage(buffer, "image/png");
    return resolveFlyerImageUrl(stored.url, requestOrigin);
  }
  throw new Error("OpenAI returned no image URL or image data");
}

/**
 * OpenAI image generation with retries on flaky networks (ECONNRESET, socket hang up).
 */
export async function createOpenAITextToImage(params: {
  promptText: string;
  format: VideoFormat;
  renderTextInImage?: boolean;
  requestOrigin?: string;
}): Promise<{ id: string; imageUrl: string }> {
  const prompt = buildOpenAIFlyerPrompt(
    params.promptText,
    params.renderTextInImage
  );
  const model = normalizeOpenAIModel(process.env.FLYER_OPENAI_MODEL);
  const body = buildImageGenerateParams(model, prompt, params.format);

  const openai = getOpenAIImageClient();
  const response = await withNetworkRetry(
    () => openai.images.generate(body),
    { retries: 4, label: "openai.images.generate" }
  );

  const imageUrl = await resolveImageUrlFromResponse(
    response.data?.[0],
    params.requestOrigin
  );

  return {
    id: `${OPENAI_IMAGE_SYNC_PREFIX}${imageUrl}`,
    imageUrl,
  };
}

export function isOpenAISyncTaskId(taskId: string): boolean {
  return taskId.startsWith(OPENAI_IMAGE_SYNC_PREFIX);
}

export function extractOpenAISyncUrl(taskId: string): string {
  return taskId.slice(OPENAI_IMAGE_SYNC_PREFIX.length);
}

/** @deprecated use resolveGptImageSize / resolveDalleImageSize */
export function resolveOpenAIImageSize(
  format: VideoFormat,
  model: string
): string {
  return getOpenAIApiFamily(model) === "gpt"
    ? resolveGptImageSize(format)
    : resolveDalleImageSize(format);
}
