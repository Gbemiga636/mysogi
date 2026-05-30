import sharp from "sharp";
import { resolveExportProfile, type ExportProfile } from "../creativeEngine/exportProfiles";
import type { ExportPresetId } from "../creativeEngine/types";

export type ExportFlyerResult = {
  buffer: Buffer;
  width: number;
  height: number;
  mime: string;
  preset: ExportPresetId;
};

export async function exportFlyerBuffer(
  input: Buffer,
  preset: ExportPresetId = "instagram_story"
): Promise<ExportFlyerResult> {
  const profile = resolveExportProfile(preset);
  let pipeline = sharp(input).resize(profile.width, profile.height, {
    fit: "cover",
    position: "centre",
  });

  if (profile.sharpen) {
    pipeline = pipeline.sharpen({ sigma: 0.8, m1: 0.5, m2: 0.35 });
  }

  const buffer = await pipeline
    .jpeg({ quality: profile.jpegQuality, mozjpeg: true, chromaSubsampling: "4:4:4" })
    .toBuffer();

  return {
    buffer,
    width: profile.width,
    height: profile.height,
    mime: "image/jpeg",
    preset,
  };
}

export function getExportProfile(preset: ExportPresetId): ExportProfile {
  return resolveExportProfile(preset);
}
