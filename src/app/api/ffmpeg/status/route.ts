import { NextResponse } from "next/server";
import { execFile } from "child_process";
import { promisify } from "util";
const execFileAsync = promisify(execFile);

async function resolveFfmpegPath(): Promise<string> {
  const fromEnv = process.env.FFMPEG_PATH?.trim();
  if (fromEnv) return fromEnv;
  return "ffmpeg";
}

export async function GET() {
  const ffmpegPath = await resolveFfmpegPath();
  try {
    const { stdout } = await execFileAsync(ffmpegPath, ["-version"], {
      timeout: 10_000,
    });
    const firstLine = stdout.split("\n")[0]?.trim() ?? "FFmpeg OK";
    return NextResponse.json({
      ok: true,
      path: ffmpegPath,
      version: firstLine,
      configuredVia: process.env.FFMPEG_PATH ? "FFMPEG_PATH" : "PATH",
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json(
      {
        ok: false,
        path: ffmpegPath,
        error: msg,
        hint:
          "Set FFMPEG_PATH in .env.local to the full path to ffmpeg.exe, then restart npm run dev.",
      },
      { status: 503 }
    );
  }
}
