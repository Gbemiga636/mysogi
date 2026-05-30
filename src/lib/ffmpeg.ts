import ffmpeg from "fluent-ffmpeg";
import fs from "fs/promises";
import path from "path";
import { v4 as uuidv4 } from "uuid";
import type { VideoFormat } from "./types";
import { FORMAT_RATIOS } from "./types";

const STORAGE = path.join(process.cwd(), "storage");
const PUBLIC_GENERATED = path.join(process.cwd(), "public", "generated");

/** FFmpeg on Windows: forward slashes avoid "Invalid argument" on paths with spaces */
function ffmpegPath(filePath: string): string {
  return path.resolve(filePath).replace(/\\/g, "/");
}

/** Drive letter colon escaped for filter textfile= paths */
function filterTextfilePath(filePath: string): string {
  const p = ffmpegPath(filePath);
  return p.replace(/^([A-Za-z]):\//, "$1\\:/");
}

function configureFfmpeg() {
  if (process.env.FFMPEG_PATH) {
    ffmpeg.setFfmpegPath(ffmpegPath(process.env.FFMPEG_PATH));
  }
}

async function ensureDirs() {
  await fs.mkdir(STORAGE, { recursive: true });
  await fs.mkdir(PUBLIC_GENERATED, { recursive: true });
}

async function writeDataUrl(filePath: string, dataUrl: string) {
  const base64 = dataUrl.includes(",") ? dataUrl.split(",")[1] : dataUrl;
  await fs.writeFile(filePath, Buffer.from(base64, "base64"));
}

async function downloadToFile(url: string, filePath: string) {
  const res = await fetch(url, {
    headers: { "User-Agent": "Mysogi-Ad-Studio/1.0" },
    signal: AbortSignal.timeout(120_000),
  });
  if (!res.ok) throw new Error(`Failed to download video (${res.status})`);
  const buf = Buffer.from(await res.arrayBuffer());
  if (buf.length < 1000) throw new Error("Downloaded video was empty or too small");
  await fs.writeFile(filePath, buf);
}

async function writeTextFile(filePath: string, text: string) {
  await fs.writeFile(filePath, text.replace(/\r?\n/g, " ").trim(), "utf8");
}

export interface ComposeOptions {
  videoSource: string;
  format: VideoFormat;
  overlayText?: string;
  logoDataUrl?: string;
  audioDataUrl?: string;
  businessName?: string;
  phone?: string;
}

function buildFilterComplex(opts: {
  width: number;
  height: number;
  headlinePath?: string;
  footerPath?: string;
  hasLogo: boolean;
}): { graph: string; videoLabel: string } {
  const { width, height } = opts;
  const fontfile = filterTextfilePath("C:/Windows/Fonts/arial.ttf");
  const pad = `scale=${width}:${height}:force_original_aspect_ratio=decrease,pad=${width}:${height}:(ow-iw)/2:(oh-ih)/2:color=black`;

  const filters: string[] = [`[0:v]${pad}[v0]`];
  let label = "v0";

  if (opts.headlinePath) {
    const tf = filterTextfilePath(opts.headlinePath);
    filters.push(
      `[${label}]drawtext=fontfile='${fontfile}':textfile='${tf}':fontsize=42:fontcolor=white:borderw=3:bordercolor=black@0.6:x=(w-text_w)/2:y=h*0.10[vtop]`
    );
    label = "vtop";
  }

  if (opts.footerPath) {
    const tf = filterTextfilePath(opts.footerPath);
    filters.push(
      `[${label}]drawtext=fontfile='${fontfile}':textfile='${tf}':fontsize=28:fontcolor=white:borderw=2:bordercolor=black@0.5:x=(w-text_w)/2:y=h*0.86[vfoot]`
    );
    label = "vfoot";
  }

  if (opts.hasLogo) {
    const logoW = Math.round(width * 0.22);
    filters.push(`[1:v]scale=${logoW}:-1[logo]`);
    filters.push(`[${label}][logo]overlay=24:24[outv]`);
    label = "outv";
  }

  return { graph: filters.join(";"), videoLabel: label };
}

export async function composeAdVideo(
  options: ComposeOptions
): Promise<{ outputUrl: string; outputPath: string }> {
  configureFfmpeg();
  await ensureDirs();

  const id = uuidv4();
  const workDir = path.join(STORAGE, id);
  await fs.mkdir(workDir, { recursive: true });

  const inputVideo = path.join(workDir, "input.mp4");
  const outputTemp = path.join(workDir, "output.mp4");
  const outputName = `ad-${id}.mp4`;
  const outputFinal = path.join(PUBLIC_GENERATED, outputName);

  if (options.videoSource.startsWith("http")) {
    await downloadToFile(options.videoSource, inputVideo);
  } else if (options.videoSource.startsWith("data:")) {
    await writeDataUrl(inputVideo, options.videoSource);
  } else if (options.videoSource.startsWith("/")) {
    const localPath = path.join(
      process.cwd(),
      "public",
      options.videoSource.replace(/^\//, "")
    );
    await fs.copyFile(localPath, inputVideo);
  } else {
    await fs.copyFile(options.videoSource, inputVideo);
  }

  const { width, height } = FORMAT_RATIOS[options.format];
  const logoPath = options.logoDataUrl
    ? path.join(workDir, "logo.png")
    : undefined;
  const audioPath = options.audioDataUrl
    ? path.join(workDir, "audio.mp3")
    : undefined;

  if (logoPath && options.logoDataUrl) {
    await writeDataUrl(logoPath, options.logoDataUrl);
  }
  if (audioPath && options.audioDataUrl) {
    await writeDataUrl(audioPath, options.audioDataUrl);
  }

  const headline = (options.overlayText ?? "").trim();
  const footer = [options.businessName, options.phone]
    .filter(Boolean)
    .join(" - ");
  const headlinePath = headline ? path.join(workDir, "headline.txt") : undefined;
  const footerPath = footer ? path.join(workDir, "footer.txt") : undefined;

  if (headlinePath) await writeTextFile(headlinePath, headline);
  if (footerPath) await writeTextFile(footerPath, footer);

  const { graph, videoLabel } = buildFilterComplex({
    width,
    height,
    headlinePath,
    footerPath,
    hasLogo: Boolean(logoPath),
  });

  const audioIndex = logoPath ? 2 : 1;

  await new Promise<void>((resolve, reject) => {
    let command = ffmpeg(ffmpegPath(inputVideo))
      .videoCodec("libx264")
      .audioCodec("aac")
      .complexFilter(graph)
      .outputOptions([
        "-pix_fmt yuv420p",
        "-movflags +faststart",
        `-map [${videoLabel}]`,
        audioPath ? `-map ${audioIndex}:a:0` : "-map 0:a?",
        ...(audioPath ? ["-shortest"] : []),
        "-y",
      ])
      .output(ffmpegPath(outputTemp));

    if (logoPath) command = command.input(ffmpegPath(logoPath));
    if (audioPath) command = command.input(ffmpegPath(audioPath));

    command
      .on("end", () => resolve())
      .on("error", (err, _stdout, stderr) => {
        const tail = stderr?.slice(-600)?.trim();
        reject(
          new Error(
            tail
              ? `FFmpeg failed: ${tail}`
              : err.message || "FFmpeg compose failed"
          )
        );
      })
      .run();
  });

  await fs.copyFile(outputTemp, outputFinal);

  return {
    outputUrl: `/generated/${outputName}`,
    outputPath: outputFinal,
  };
}
