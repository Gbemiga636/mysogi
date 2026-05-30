import { InferenceClient } from "@huggingface/inference";
import { uploadVideoBuffer } from "./cloudinary";
import type { VideoFormat } from "./types";
import {
  getVideoTask,
  setVideoTask,
  updateVideoTask,
} from "./videoTaskStore";

const HF_PREFIX = "hf-";

/** Lighter / popular models — tried in order (Inference Providers) */
export const HF_VIDEO_MODELS: {
  model: string;
  provider?: "fal-ai" | "replicate" | "wavespeed";
  label: string;
}[] = [
  {
    model: "Wan-AI/Wan2.2-TI2V-5B",
    provider: "fal-ai",
    label: "Wan 2.2 TI2V 5B (lighter)",
  },
  {
    model: "Wan-AI/Wan2.2-TI2V-5B",
    provider: "replicate",
    label: "Wan 2.2 via Replicate",
  },
  {
    model: "tencent/HunyuanVideo",
    provider: "fal-ai",
    label: "HunyuanVideo",
  },
  {
    model: "Wan-AI/Wan2.2-TI2V-5B",
    provider: "wavespeed",
    label: "Wan 2.2 via WaveSpeed",
  },
];

const DEFAULT_MODEL =
  process.env.HF_VIDEO_MODEL?.trim() || HF_VIDEO_MODELS[0]!.model;

const DEFAULT_PROVIDER = process.env.HF_VIDEO_PROVIDER?.trim() as
  | "fal-ai"
  | "replicate"
  | "wavespeed"
  | undefined;

const VIDEO_NEGATIVE =
  "readable text, letters, words, typography, subtitles, watermarks";

let client: InferenceClient | null = null;

export function getHfToken(): string {
  const token =
    process.env.HF_TOKEN?.trim() ||
    process.env.HUGGINGFACE_API_KEY?.trim() ||
    process.env.HUGGINGFACE_TOKEN?.trim();
  if (!token) {
    throw new Error(
      "HF_TOKEN is required in .env.local for Hugging Face video generation."
    );
  }
  return token;
}

export function getHfClient(): InferenceClient {
  if (!client) {
    client = new InferenceClient(getHfToken());
  }
  return client;
}

export function isHfTaskId(id: string): boolean {
  return id.startsWith(HF_PREFIX);
}

export function buildHfTaskId(uuid: string): string {
  return `${HF_PREFIX}${uuid}`;
}

function aspectHint(format: VideoFormat): string {
  if (format === "9:16" || format === "4:5") {
    return "vertical 9:16 portrait video";
  }
  if (format === "1:1") return "square 1:1 video";
  return "widescreen 16:9 cinematic video";
}

async function blobToVideoUrl(blob: Blob): Promise<string> {
  const buffer = Buffer.from(await blob.arrayBuffer());
  const mime = blob.type || "video/mp4";
  const uploaded = await uploadVideoBuffer(buffer, mime, "mysogi-videos");
  return uploaded.secureUrl;
}

async function imageSourceToBlob(source: string): Promise<Blob> {
  if (source.startsWith("data:")) {
    const res = await fetch(source);
    return res.blob();
  }
  const res = await fetch(source, {
    headers: { "User-Agent": "Mysogi-Ad-Studio/1.0" },
  });
  if (!res.ok) throw new Error(`Could not load source image (${res.status})`);
  return res.blob();
}

export function parseHfVideoError(error: unknown): string {
  const raw = error instanceof Error ? error.message : String(error);
  if (/depleted.*credits|included credits|pre-paid credits/i.test(raw)) {
    return "Hugging Face Inference credits are used up. Add credits at huggingface.co/settings/billing or enable a provider (fal/replicate) in Inference Provider settings.";
  }
  if (/401|unauthorized|invalid.*token/i.test(raw)) {
    return "Invalid HF_TOKEN. Create a token with Inference Providers permission at huggingface.co/settings/tokens";
  }
  if (/not supported for task/i.test(raw)) {
    return `Model not available for text-to-video on this provider. ${raw}`;
  }
  return raw || "Hugging Face video generation failed";
}

async function generateTextToVideoBlob(
  promptText: string,
  format: VideoFormat
): Promise<{ blob: Blob; model: string; provider?: string }> {
  const hf = getHfClient();
  const prompt = `${promptText}. ${aspectHint(format)}. Smooth motion, professional ad quality.`;
  const errors: string[] = [];

  const attempts = DEFAULT_PROVIDER
    ? [
        {
          model: DEFAULT_MODEL,
          provider: DEFAULT_PROVIDER,
          label: `${DEFAULT_MODEL} (${DEFAULT_PROVIDER})`,
        },
      ]
    : HF_VIDEO_MODELS;

  for (const entry of attempts) {
    try {
      const blob = await hf.textToVideo({
        model: entry.model,
        provider: entry.provider,
        inputs: prompt,
        parameters: {
          negative_prompt: [VIDEO_NEGATIVE],
          num_inference_steps: 25,
        },
      });
      return { blob, model: entry.model, provider: entry.provider };
    } catch (e) {
      errors.push(
        `${entry.label}: ${e instanceof Error ? e.message : String(e)}`
      );
    }
  }

  throw new Error(errors.join(" | ") || "All Hugging Face video models failed");
}

async function generateImageToVideoBlob(
  promptImage: string,
  promptText: string,
  format: VideoFormat
): Promise<{ blob: Blob; model: string }> {
  const hf = getHfClient();
  const prompt = `${promptText}. ${aspectHint(format)}. Animate smoothly.`;
  const imageBlob = await imageSourceToBlob(promptImage);

  const blob = await hf.imageToVideo({
    model: DEFAULT_MODEL,
    provider: DEFAULT_PROVIDER ?? "fal-ai",
    inputs: imageBlob,
    parameters: {
      prompt,
      negative_prompt: VIDEO_NEGATIVE,
      num_inference_steps: 25,
    },
  });

  return { blob, model: DEFAULT_MODEL };
}

async function runHfVideoJob(
  taskId: string,
  job: () => Promise<string>
): Promise<void> {
  try {
    const url = await job();
    updateVideoTask(taskId, {
      status: "SUCCEEDED",
      outputUrl: url,
      provider: "huggingface",
    });
  } catch (e) {
    updateVideoTask(taskId, {
      status: "FAILED",
      error: parseHfVideoError(e),
      provider: "huggingface",
    });
  }
}

export function startHfTextToVideoJob(params: {
  promptText: string;
  format: VideoFormat;
}): string {
  const taskId = buildHfTaskId(crypto.randomUUID());
  setVideoTask(taskId, { status: "RUNNING", provider: "huggingface" });

  void runHfVideoJob(taskId, async () => {
    const { blob } = await generateTextToVideoBlob(
      params.promptText,
      params.format
    );
    return blobToVideoUrl(blob);
  });

  return taskId;
}

export function startHfImageToVideoJob(params: {
  promptImage: string;
  promptText: string;
  format: VideoFormat;
}): string {
  const taskId = buildHfTaskId(crypto.randomUUID());
  setVideoTask(taskId, { status: "RUNNING", provider: "huggingface" });

  void runHfVideoJob(taskId, async () => {
    const { blob } = await generateImageToVideoBlob(
      params.promptImage,
      params.promptText,
      params.format
    );
    return blobToVideoUrl(blob);
  });

  return taskId;
}

export function getHfTask(taskId: string): {
  status: "SUCCEEDED" | "FAILED" | "RUNNING";
  outputUrl?: string | null;
  error?: string;
} {
  const record = getVideoTask(taskId);
  if (!record) {
    return { status: "FAILED", error: "Task not found or expired (restart server)" };
  }
  return {
    status: record.status,
    outputUrl: record.outputUrl,
    error: record.error,
  };
}
