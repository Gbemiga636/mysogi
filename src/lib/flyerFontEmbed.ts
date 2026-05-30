import fs from "fs";
import path from "path";
import { createRequire } from "module";

export type EmbeddedFont = {
  /** CSS font-family name used in SVG */
  family: string;
  package: string;
  file: string;
  weight: number;
};

const FONT_ROOT = path.join(process.cwd(), "node_modules", "@fontsource");
const cache = new Map<string, string>();
const nodeRequire = createRequire(path.join(process.cwd(), "package.json"));

function resolveFontPath(pkg: string, file: string): string | null {
  try {
    return nodeRequire.resolve(`@fontsource/${pkg}/files/${file}`);
  } catch {
    const fallback = path.join(FONT_ROOT, pkg, "files", file);
    return fs.existsSync(fallback) ? fallback : null;
  }
}

function loadFontBase64(pkg: string, file: string): string {
  const key = `${pkg}/${file}`;
  if (cache.has(key)) return cache.get(key) ?? "";

  const fontPath = resolveFontPath(pkg, file);
  if (!fontPath) {
    console.warn(`[flyerFontEmbed] font missing: ${pkg}/${file}`);
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

/** Inline @font-face rules for Sharp/librsvg SVG text */
export function buildSvgEmbeddedFontDefs(fonts: EmbeddedFont[]): string {
  const unique = new Map<string, EmbeddedFont>();
  for (const f of fonts) {
    unique.set(`${f.package}/${f.file}`, f);
  }

  return [...unique.values()]
    .map((f) => {
      const b64 = loadFontBase64(f.package, f.file);
      if (!b64) return "";
      const family = f.family.replace(/'/g, "\\'");
      return `@font-face{font-family:'${family}';font-style:normal;font-weight:${f.weight};src:url(data:font/woff2;base64,${b64}) format('woff2');}`;
    })
    .filter(Boolean)
    .join("");
}

export function svgFontFamily(name: string): string {
  return `'${name.replace(/'/g, "")}', sans-serif`;
}
