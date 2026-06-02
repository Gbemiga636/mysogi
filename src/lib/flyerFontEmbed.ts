import fs from "fs";
import { resolveBundledFontPath, getFlyerFontSearchDirs } from "./flyerFontPaths";

export type EmbeddedFont = {
  /** CSS font-family name used in SVG */
  family: string;
  package: string;
  file: string;
  weight: number;
};

const cache = new Map<string, string>();

function loadFontBase64(pkg: string, file: string): string {
  const key = `${pkg}/${file}`;
  if (cache.has(key)) return cache.get(key) ?? "";

  const fontPath = resolveBundledFontPath(pkg, file);
  if (!fontPath) {
    console.warn(`[flyerFontEmbed] font missing: ${pkg}/${file}`, {
      dirs: getFlyerFontSearchDirs(),
    });
    cache.set(key, "");
    return "";
  }

  try {
    const b64 = fs.readFileSync(fontPath).toString("base64");
    cache.set(key, b64);
    return b64;
  } catch (e) {
    console.warn(`[flyerFontEmbed] font load failed: ${pkg}/${file}`, e);
    cache.set(key, "");
    return "";
  }
}

/** Warm font cache before compose (serverless cold starts). */
export function preloadFlyerFonts(fonts: EmbeddedFont[]): void {
  for (const f of fonts) {
    loadFontBase64(f.package, f.file);
  }
}

/** Inline @font-face rules for Sharp/librsvg SVG text (local dev fallback only). */
export function buildSvgEmbeddedFontDefs(fonts: EmbeddedFont[]): string {
  const unique = new Map<string, EmbeddedFont>();
  for (const f of fonts) {
    unique.set(`${f.package}/${f.file}`, f);
  }

  return [...unique.values()]
    .map((f) => {
      const b64 = loadFontBase64(f.package, f.file);
      if (!b64) return "";
      const family = f.family.replace(/'/g, "");
      return `@font-face{font-family:'${family}';font-style:normal;font-weight:${f.weight};src:url(data:font/woff2;base64,${b64}) format('woff2');}`;
    })
    .filter(Boolean)
    .join("");
}

/** CSS font-family for <style> blocks */
export function svgFontFamily(name: string): string {
  return `'${name.replace(/'/g, "")}', sans-serif`;
}

/** font-family XML attribute — single family name, no nested quotes */
export function svgFontFamilyAttr(name: string): string {
  const clean = name.replace(/['"]/g, "").trim() || "Inter";
  return clean
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function areFlyerFontsEmbeddable(): boolean {
  const css = buildSvgEmbeddedFontDefs([
    {
      family: "Inter",
      package: "inter",
      file: "inter-latin-500-normal.woff2",
      weight: 500,
    },
  ]);
  return css.length > 80;
}
