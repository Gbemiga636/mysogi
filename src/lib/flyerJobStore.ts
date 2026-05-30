import { randomUUID } from "crypto";
import fs from "fs/promises";
import os from "os";
import path from "path";

export type FlyerJobStatus = "queued" | "running" | "succeeded" | "failed";

export type FlyerJobProgress =
  | "queued"
  | "messages"
  | "copy"
  | "variants"
  | "compose"
  | "done";

export type FlyerJobRecord = {
  id: string;
  status: FlyerJobStatus;
  progress: FlyerJobProgress;
  action: "flyer" | "full";
  createdAt: number;
  updatedAt: number;
  error?: string;
  result?: Record<string, unknown>;
};

const KV_PREFIX = "flyer-job:";
const TTL_SECONDS = 86_400;

function isKvConfigured(): boolean {
  return Boolean(
    process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN
  );
}

async function kvGet(id: string): Promise<FlyerJobRecord | null> {
  const { kv } = await import("@vercel/kv");
  const data = await kv.get<FlyerJobRecord>(`${KV_PREFIX}${id}`);
  return data ?? null;
}

async function kvSet(record: FlyerJobRecord): Promise<void> {
  const { kv } = await import("@vercel/kv");
  await kv.set(`${KV_PREFIX}${record.id}`, record, { ex: TTL_SECONDS });
}

function jobsDir(): string {
  if (process.env.VERCEL) {
    return path.join(os.tmpdir(), "mysogi-flyer-jobs");
  }
  return path.join(process.cwd(), ".data", "flyer-jobs");
}

function jobPath(id: string): string {
  return path.join(jobsDir(), `${id}.json`);
}

async function fsGet(id: string): Promise<FlyerJobRecord | null> {
  try {
    const raw = await fs.readFile(jobPath(id), "utf8");
    return JSON.parse(raw) as FlyerJobRecord;
  } catch {
    return null;
  }
}

async function fsSet(record: FlyerJobRecord): Promise<void> {
  await fs.mkdir(jobsDir(), { recursive: true });
  await fs.writeFile(jobPath(record.id), JSON.stringify(record), "utf8");
}

export async function createFlyerJob(
  action: "flyer" | "full"
): Promise<FlyerJobRecord> {
  const now = Date.now();
  const record: FlyerJobRecord = {
    id: randomUUID(),
    status: "queued",
    progress: "queued",
    action,
    createdAt: now,
    updatedAt: now,
  };
  if (isKvConfigured()) {
    await kvSet(record);
  } else {
    await fsSet(record);
  }
  return record;
}

export async function getFlyerJob(id: string): Promise<FlyerJobRecord | null> {
  if (isKvConfigured()) return kvGet(id);
  return fsGet(id);
}

export async function patchFlyerJob(
  id: string,
  patch: Partial<FlyerJobRecord>
): Promise<FlyerJobRecord | null> {
  const current = await getFlyerJob(id);
  if (!current) return null;
  const next: FlyerJobRecord = {
    ...current,
    ...patch,
    updatedAt: Date.now(),
  };
  if (isKvConfigured()) {
    await kvSet(next);
  } else {
    await fsSet(next);
  }
  return next;
}

export function flyerJobStorageMode(): "kv" | "filesystem" {
  return isKvConfigured() ? "kv" : "filesystem";
}
