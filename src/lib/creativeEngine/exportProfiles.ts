import type { ExportPresetId } from "./types";

export type ExportProfile = {
  id: ExportPresetId;
  label: string;
  width: number;
  height: number;
  dpi: number;
  jpegQuality: number;
  sharpen: boolean;
};

export const EXPORT_PROFILES: Record<ExportPresetId, ExportProfile> = {
  instagram_story: {
    id: "instagram_story",
    label: "Instagram Story (9:16)",
    width: 1080,
    height: 1920,
    dpi: 72,
    jpegQuality: 93,
    sharpen: true,
  },
  instagram_portrait: {
    id: "instagram_portrait",
    label: "Instagram Portrait (4:5)",
    width: 1080,
    height: 1350,
    dpi: 72,
    jpegQuality: 93,
    sharpen: true,
  },
  instagram_square: {
    id: "instagram_square",
    label: "Instagram Square (1:1)",
    width: 1080,
    height: 1080,
    dpi: 72,
    jpegQuality: 93,
    sharpen: true,
  },
  a4_print: {
    id: "a4_print",
    label: "A4 Print",
    width: 2480,
    height: 3508,
    dpi: 300,
    jpegQuality: 95,
    sharpen: true,
  },
  web_banner: {
    id: "web_banner",
    label: "Web Banner (16:9)",
    width: 1920,
    height: 1080,
    dpi: 72,
    jpegQuality: 92,
    sharpen: true,
  },
};

export function resolveExportProfile(
  preset: ExportPresetId = "instagram_story"
): ExportProfile {
  return EXPORT_PROFILES[preset];
}

export function formatToExportPreset(
  format: string
): ExportPresetId {
  switch (format) {
    case "9:16":
      return "instagram_story";
    case "4:5":
      return "instagram_portrait";
    case "1:1":
      return "instagram_square";
    case "16:9":
      return "web_banner";
    default:
      return "instagram_story";
  }
}
