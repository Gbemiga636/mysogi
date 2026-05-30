import { randomUUID } from "crypto";
import fs from "fs/promises";
import path from "path";

type FlyerImageMeta = {
  mime: string;
  ext: string;
  created: number;
};

const CACHE_DIR = path.join(process.cwd(), ".data", "flyer-images");
const TTL_MS = 24 * 60 * 60 * 1000;

async function ensureCacheDir(): Promise<void> {
  await fs.mkdir(CACHE_DIR, { recursive: true });
}

function metaPath(id: string): string {
  return path.join(CACHE_DIR, `${id}.meta.json`);
}

function filePath(id: string, ext: string): string {
  return path.join(CACHE_DIR, `${id}.${ext}`);
}

function extFromMime(mime: string): string {
  return mime.includes("png") ? "png" : "jpg";
}

async function pruneOld(): Promise<void> {
  try {
    const files = await fs.readdir(CACHE_DIR);
    const cutoff = Date.now() - TTL_MS;
    for (const name of files) {
      if (!name.endsWith(".meta.json")) continue;
      const id = name.replace(".meta.json", "");
      const metaFile = path.join(CACHE_DIR, name);
      try {
        const meta = JSON.parse(
          await fs.readFile(metaFile, "utf8")
        ) as FlyerImageMeta;
        if (meta.created < cutoff) {
          await fs.unlink(metaFile).catch(() => {});
          await fs.unlink(filePath(id, meta.ext)).catch(() => {});
        }
      } catch {
        /* ignore corrupt meta */
      }
    }
  } catch {
    /* cache dir may not exist yet */
  }
}

/** Persist flyer bytes to disk (survives Next.js hot reload) */
export async function putFlyerImage(
  buffer: Buffer,
  mime = "image/jpeg"
): Promise<{ id: string; url: string }> {
  await ensureCacheDir();
  await pruneOld();

  const id = randomUUID();
  const ext = extFromMime(mime);
  const meta: FlyerImageMeta = { mime, ext, created: Date.now() };

  await fs.writeFile(filePath(id, ext), buffer);
  await fs.writeFile(metaPath(id), JSON.stringify(meta));

  return { id, url: `/api/flyer-image/${id}` };
}

export async function getFlyerImage(
  id: string
): Promise<{ buffer: Buffer; mime: string } | undefined> {
  await ensureCacheDir();
  try {
    const raw = await fs.readFile(metaPath(id), "utf8");
    const meta = JSON.parse(raw) as FlyerImageMeta;
    const buffer = await fs.readFile(filePath(id, meta.ext));
    return { buffer, mime: meta.mime };
  } catch {
    return undefined;
  }
}

export async function flyerImageCount(): Promise<number> {
  try {
    const files = await fs.readdir(CACHE_DIR);
    return files.filter((f) => f.endsWith(".meta.json")).length;
  } catch {
    return 0;
  }
}

export function resolveFlyerImageUrl(
  relativeOrAbsolute: string,
  requestOrigin?: string
): string {
  if (relativeOrAbsolute.startsWith("http://") || relativeOrAbsolute.startsWith("https://")) {
    return relativeOrAbsolute;
  }
  const origin =
    requestOrigin?.replace(/\/$/, "") ||
    process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ||
    "http://localhost:3000";
  return `${origin}${relativeOrAbsolute.startsWith("/") ? "" : "/"}${relativeOrAbsolute}`;
}
