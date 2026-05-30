import { uploadImage } from "./cloudinary";
import type { BusinessProfile, VideoFormat } from "./types";
import {
  getVideoTask,
  setVideoTask,
  updateVideoTask,
} from "./videoTaskStore";

const BASE_URL = "https://api.piapi.ai";

const VIDEO_NEGATIVE =
  "readable text, letters, words, typography, subtitles, watermarks";

/** Approximate points frozen per job (from PiAPI usage) */
export const VIDEO_COST_POINTS = {
  "hailuo-fast": 1_600_000,
  "kling-2.5-std": 2_000_000,
  "kling-1.6-std": 2_600_000,
} as const;

export type PiApiVideoProvider = "auto" | "hailuo" | "kling";

type PiApiResponse<T> = {
  code: number;
  message: string;
  data: T;
};

type PiApiTaskData = {
  task_id: string;
  model: string;
  task_type: string;
  status: string;
  input?: Record<string, unknown>;
  output?: {
    video_url?: string;
    video?: string;
    download_url?: string;
    works?: Array<{
      video?: {
        resource?: string;
        resource_without_watermark?: string;
      };
    }>;
  };
  meta?: {
    usage?: { frozen?: number; consume?: number };
  };
  error?: {
    message?: string;
    raw_message?: string;
  };
};

export type PiApiWalletSummary = {
  pointRemain: number;
  pointFrozen: number;
  pointUsed: number;
  equivalentUsd: number;
  plan: string;
};

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function getApiKey(): string {
  const key =
    process.env.PIAPI_API_KEY?.trim() || process.env.PIAPI_KEY?.trim();
  if (!key) {
    throw new Error(
      "PIAPI_API_KEY is required in .env.local. Restart npm run dev after adding it."
    );
  }
  return key;
}

function videoProviderPref(): PiApiVideoProvider {
  const p = process.env.PIAPI_VIDEO_MODEL?.trim().toLowerCase();
  if (p === "hailuo" || p === "kling") return p;
  return "auto";
}

const PIAPI_POLL_INTERVAL_MS = 10_000;
const piapiDirectPollAt = new Map<string, number>();

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

async function piapiRequest<T>(
  path: string,
  init: RequestInit = {},
  attempt = 0
): Promise<T> {
  const headers = new Headers(init.headers);
  headers.set("X-API-Key", getApiKey());
  if (!headers.has("Content-Type") && init.body) {
    headers.set("Content-Type", "application/json");
  }

  const res = await fetch(`${BASE_URL}${path}`, { ...init, headers });
  const text = await res.text();
  let json: PiApiResponse<T>;
  try {
    json = JSON.parse(text) as PiApiResponse<T>;
  } catch {
    throw new Error(`PiAPI error (${res.status}): ${text.slice(0, 200)}`);
  }

  const rateLimited =
    res.status === 429 ||
    /too many requests/i.test(json.message ?? "") ||
    /too many requests/i.test(text);

  if (rateLimited && attempt < 2) {
    await sleep(12_000 * (attempt + 1));
    return piapiRequest<T>(path, init, attempt + 1);
  }

  if (json.code !== 200) {
    throw new Error(json.message || `PiAPI error ${json.code}`);
  }

  return json.data;
}

export function isPiApiTaskId(id: string): boolean {
  return UUID_RE.test(id);
}

export async function getPiApiAccountInfo(): Promise<{
  wallet: PiApiWalletSummary;
  accountId: number;
  email?: string;
}> {
  const data = await piapiRequest<{
    id: number;
    name?: string;
    plan?: string;
    equivalent_in_usd?: number;
    wallet?: {
      point_remain?: number;
      point_frozen?: number;
      point_used?: number;
    };
  }>("/account/info", { method: "GET" });

  const w = data.wallet ?? {};
  return {
    accountId: data.id,
    email: data.name,
    wallet: {
      pointRemain: w.point_remain ?? 0,
      pointFrozen: w.point_frozen ?? 0,
      pointUsed: w.point_used ?? 0,
      equivalentUsd: data.equivalent_in_usd ?? 0,
      plan: data.plan ?? "unknown",
    },
  };
}

/** Pick cheapest provider that fits remaining points */
export function selectVideoProvider(
  pointRemain: number,
  pref: PiApiVideoProvider = videoProviderPref()
): "hailuo" | "kling" {
  if (pref === "hailuo") return "hailuo";
  if (pref === "kling") return "kling";

  if (pointRemain >= VIDEO_COST_POINTS["hailuo-fast"]) {
    return "hailuo";
  }
  if (pointRemain >= VIDEO_COST_POINTS["kling-2.5-std"]) {
    return "kling";
  }
  return "hailuo";
}

export function estimateVideoCost(provider: "hailuo" | "kling"): number {
  return provider === "hailuo"
    ? VIDEO_COST_POINTS["hailuo-fast"]
    : VIDEO_COST_POINTS["kling-2.5-std"];
}

export function mapFormatToAspectHint(format: VideoFormat): string {
  if (format === "16:9") return "widescreen 16:9 horizontal framing";
  if (format === "1:1") return "square 1:1 framing";
  if (format === "4:5") return "vertical 4:5 portrait framing";
  return "vertical 9:16 mobile portrait framing";
}

export function mapFormatToKling(
  format: VideoFormat
): { aspect_ratio: string } {
  if (format === "16:9") return { aspect_ratio: "16:9" };
  if (format === "1:1") return { aspect_ratio: "1:1" };
  if (format === "4:5") return { aspect_ratio: "3:4" };
  return { aspect_ratio: "9:16" };
}

function klingVersion(): string {
  return process.env.PIAPI_KLING_VERSION?.trim() || "2.5";
}

function klingMode(): "std" | "pro" {
  const m = process.env.PIAPI_KLING_MODE?.trim()?.toLowerCase();
  return m === "pro" ? "pro" : "std";
}

function enrichPrompt(
  promptText: string,
  format: VideoFormat,
  business?: BusinessProfile
): string {
  const base = promptText.trim();
  const brand = business?.businessName
    ? `Brand: ${business.businessName}. `
    : "";
  const framing = mapFormatToAspectHint(format);
  return `${brand}${base}. ${framing}. Cinematic ad b-roll, no on-screen text.`.slice(
    0,
    2000
  );
}

async function resolveImageUrl(source: string): Promise<string> {
  if (source.startsWith("http://") || source.startsWith("https://")) {
    return source;
  }
  const uploaded = await uploadImage({ dataUrl: source });
  return uploaded.secureUrl;
}

async function createHailuoVideoTask(input: {
  prompt: string;
  imageUrl?: string;
}): Promise<{ taskId: string; estimatedCost: number }> {
  const body: Record<string, unknown> = {
    model: "hailuo",
    task_type: "video_generation",
    input: {
      prompt: input.prompt,
      model: "v2.3-fast",
      duration: 6,
      resolution: 768,
      expand_prompt: false,
      ...(input.imageUrl ? { image_url: input.imageUrl } : {}),
    },
    config: { service_mode: "public" },
  };

  const data = await piapiRequest<PiApiTaskData>("/api/v1/task", {
    method: "POST",
    body: JSON.stringify(body),
  });

  const frozen = data.meta?.usage?.frozen ?? VIDEO_COST_POINTS["hailuo-fast"];
  return { taskId: data.task_id, estimatedCost: frozen };
}

async function createKlingVideoTask(input: {
  prompt: string;
  format: VideoFormat;
  duration?: number;
  imageUrl?: string;
}): Promise<{ taskId: string; estimatedCost: number }> {
  const { aspect_ratio } = mapFormatToKling(input.format);
  const duration = input.duration === 10 ? 10 : 5;

  const body: Record<string, unknown> = {
    model: "kling",
    task_type: "video_generation",
    input: {
      prompt: input.prompt,
      negative_prompt: VIDEO_NEGATIVE,
      duration,
      aspect_ratio,
      mode: klingMode(),
      version: klingVersion(),
      ...(input.imageUrl ? { image_url: input.imageUrl } : {}),
    },
    config: {
      service_mode: process.env.PIAPI_SERVICE_MODE?.trim() || "public",
    },
  };

  const data = await piapiRequest<PiApiTaskData>("/api/v1/task", {
    method: "POST",
    body: JSON.stringify(body),
  });

  const frozen =
    data.meta?.usage?.frozen ?? VIDEO_COST_POINTS["kling-2.5-std"];
  return { taskId: data.task_id, estimatedCost: frozen };
}

async function createVideoTask(input: {
  prompt: string;
  format: VideoFormat;
  duration?: number;
  imageUrl?: string;
  provider: "hailuo" | "kling";
}): Promise<{ taskId: string; provider: string; estimatedCost: number }> {
  if (input.provider === "hailuo") {
    const { taskId, estimatedCost } = await createHailuoVideoTask({
      prompt: input.prompt,
      imageUrl: input.imageUrl,
    });
    return { taskId, provider: "hailuo-fast", estimatedCost };
  }

  const { taskId, estimatedCost } = await createKlingVideoTask({
    prompt: input.prompt,
    format: input.format,
    duration: input.duration,
    imageUrl: input.imageUrl,
  });
  return {
    taskId,
    provider: `kling-${klingVersion()}-${klingMode()}`,
    estimatedCost,
  };
}

export async function getPiApiTask(taskId: string): Promise<{
  status: "SUCCEEDED" | "FAILED" | "RUNNING";
  outputUrl?: string | null;
  error?: string;
  piapiStatus?: string;
}> {
  const data = await piapiRequest<PiApiTaskData>(`/api/v1/task/${taskId}`, {
    method: "GET",
  });

  const status = (data.status ?? "").toLowerCase();

  if (status === "completed") {
    const url = extractVideoUrl(data.output);
    if (url) {
      return { status: "SUCCEEDED", outputUrl: url, piapiStatus: status };
    }
    return {
      status: "FAILED",
      error: "PiAPI completed but no video URL in response",
      piapiStatus: status,
    };
  }

  if (status === "failed" || status === "error") {
    return {
      status: "FAILED",
      error:
        data.error?.message ||
        data.error?.raw_message ||
        "PiAPI video generation failed",
      piapiStatus: status,
    };
  }

  return { status: "RUNNING", piapiStatus: status };
}

function extractVideoUrl(
  output: PiApiTaskData["output"] | undefined
): string | null {
  if (!output) return null;
  if (typeof output.video_url === "string" && output.video_url) {
    return output.video_url;
  }
  if (typeof output.download_url === "string" && output.download_url) {
    return output.download_url;
  }
  if (typeof output.video === "string" && output.video) {
    return output.video;
  }
  const work = output.works?.[0];
  const v = work?.video;
  if (v?.resource_without_watermark) return v.resource_without_watermark;
  if (v?.resource) return v.resource;
  return null;
}

export function parsePiApiError(error: unknown): string {
  const raw = error instanceof Error ? error.message : String(error);
  if (/insufficient|balance|credit|point/i.test(raw)) {
    return (
      "PiAPI points are too low for this video. Use Hailuo (cheapest, ~1.6M points) " +
      "or top up at app.piapi.ai → Workspace. Check GET /api/piapi/status"
    );
  }
  if (/401|invalid.*key|unauthorized/i.test(raw)) {
    return "Invalid PIAPI_API_KEY. Check .env.local and restart npm run dev.";
  }
  if (/too many requests|rate limit|429/i.test(raw)) {
    return (
      "PiAPI rate limit — wait 30–60 seconds, then try one video at a time. " +
      "Avoid clicking Generate multiple times."
    );
  }
  return raw || "PiAPI request failed";
}

async function runPiApiPollJob(taskId: string): Promise<void> {
  const maxWait = Date.now() + 600000;
  while (Date.now() < maxWait) {
    try {
      const result = await getPiApiTask(taskId);
      if (result.status === "SUCCEEDED") {
        updateVideoTask(taskId, {
          status: "SUCCEEDED",
          outputUrl: result.outputUrl,
          provider: "piapi",
        });
        return;
      }
      if (result.status === "FAILED") {
        updateVideoTask(taskId, {
          status: "FAILED",
          error: result.error ?? "PiAPI generation failed",
          provider: "piapi",
        });
        return;
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      if (/too many requests|429|rate limit/i.test(msg)) {
        await sleep(15_000);
        continue;
      }
      updateVideoTask(taskId, {
        status: "FAILED",
        error: parsePiApiError(e),
        provider: "piapi",
      });
      return;
    }
    await sleep(PIAPI_POLL_INTERVAL_MS);
  }
  updateVideoTask(taskId, {
    status: "FAILED",
    error: "PiAPI video generation timed out",
    provider: "piapi",
  });
}

async function assertCanAffordVideo(): Promise<"hailuo" | "kling"> {
  const info = await getPiApiAccountInfo();
  const available = info.wallet.pointRemain - info.wallet.pointFrozen;
  const provider = selectVideoProvider(available);
  const cost = estimateVideoCost(provider);

  if (available < cost) {
    const hailuoCost = VIDEO_COST_POINTS["hailuo-fast"];
    throw new Error(
      `Not enough PiAPI points (${available.toLocaleString()} available, need ~${cost.toLocaleString()}). ` +
        `Cheapest option is Hailuo v2.3-fast (~${hailuoCost.toLocaleString()} points for 6s). Top up at app.piapi.ai`
    );
  }

  return provider;
}

export function startPiApiTextToVideoJob(params: {
  promptText: string;
  format: VideoFormat;
  duration?: number;
  business?: BusinessProfile;
}): Promise<string> {
  return (async () => {
    const provider = await assertCanAffordVideo();
    const prompt = enrichPrompt(params.promptText, params.format, params.business);
    const { taskId } = await createVideoTask({
      prompt,
      format: params.format,
      duration: params.duration,
      provider,
    });
    setVideoTask(taskId, { status: "RUNNING", provider: "piapi" });
    void runPiApiPollJob(taskId);
    return taskId;
  })();
}

export function startPiApiImageToVideoJob(params: {
  promptImage: string;
  promptText: string;
  format: VideoFormat;
  duration?: number;
  business?: BusinessProfile;
}): Promise<string> {
  return (async () => {
    const provider = await assertCanAffordVideo();
    const imageUrl = await resolveImageUrl(params.promptImage);
    const prompt = enrichPrompt(params.promptText, params.format, params.business);
    const { taskId } = await createVideoTask({
      prompt,
      format: params.format,
      duration: params.duration,
      imageUrl,
      provider,
    });
    setVideoTask(taskId, { status: "RUNNING", provider: "piapi" });
    void runPiApiPollJob(taskId);
    return taskId;
  })();
}

/**
 * Client-facing status — prefers in-memory cache updated by the background
 * poller so we do not hammer PiAPI on every browser poll.
 */
export async function pollPiApiTask(taskId: string): Promise<{
  status: "SUCCEEDED" | "FAILED" | "RUNNING";
  outputUrl?: string | null;
  error?: string;
}> {
  const cached = getVideoTask(taskId);
  if (cached) {
    return {
      status: cached.status,
      outputUrl: cached.outputUrl,
      error: cached.error,
    };
  }

  const now = Date.now();
  const last = piapiDirectPollAt.get(taskId) ?? 0;
  if (now - last < PIAPI_POLL_INTERVAL_MS) {
    return { status: "RUNNING" };
  }
  piapiDirectPollAt.set(taskId, now);

  try {
    const result = await getPiApiTask(taskId);
    if (result.status === "SUCCEEDED") {
      updateVideoTask(taskId, {
        status: "SUCCEEDED",
        outputUrl: result.outputUrl,
        provider: "piapi",
      });
    } else if (result.status === "FAILED") {
      updateVideoTask(taskId, {
        status: "FAILED",
        error: result.error,
        provider: "piapi",
      });
    } else {
      setVideoTask(taskId, { status: "RUNNING", provider: "piapi" });
    }
    return result;
  } catch (e) {
    if (/too many requests|429|rate limit/i.test(String(e))) {
      return { status: "RUNNING" };
    }
    throw e;
  }
}
