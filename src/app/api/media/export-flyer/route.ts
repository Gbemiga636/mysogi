import { NextRequest, NextResponse } from "next/server";
import {
  exportFlyerBuffer,
  resolveExportProfile,
} from "@/lib/creativeEngine";
import type { ExportPresetId } from "@/lib/creativeEngine/types";

export const maxDuration = 120;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const imageUrl = String(body.imageUrl ?? "").trim();
    const preset = (body.preset ?? "instagram_story") as ExportPresetId;

    if (!imageUrl) {
      return NextResponse.json({ error: "imageUrl is required" }, { status: 400 });
    }

    const res = await fetch(imageUrl, {
      headers: { "User-Agent": "Mysogi-Ad-Studio/1.0" },
      signal: AbortSignal.timeout(90_000),
    });
    if (!res.ok) {
      return NextResponse.json(
        { error: `Could not download image (${res.status})` },
        { status: 400 }
      );
    }

    const input = Buffer.from(await res.arrayBuffer());
    const exported = await exportFlyerBuffer(input, preset);
    const profile = resolveExportProfile(preset);

    return NextResponse.json({
      dataUrl: `data:image/jpeg;base64,${exported.buffer.toString("base64")}`,
      width: exported.width,
      height: exported.height,
      preset: exported.preset,
      label: profile.label,
      mime: exported.mime,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Export failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
