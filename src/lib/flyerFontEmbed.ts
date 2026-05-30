import fs from "fs";
import path from "path";

export type EmbeddedFont = {
  /** CSS font-family name used in SVG */
  family: string;
  package: string;
  file: string;
  weight: number;
};

const FONT_ROOT = path.join(process.cwd(), "node_modules", "@fontsource");
const cache = new Map<string, string>();

function fontFilePath(pkg: string, file: string): string {
  return path.join(FONT_ROOT, pkg, "files", file);
}

function loadFontBase64(pkg: string, file: string): string {
  const key = `${pkg}/${file}`;
  const hit = cache.get(key);
  if (hit) return hit;
  const p = fontFilePath(pkg, file);
  const b64 = fs.readFileSync(p).toString("base64");
  cache.set(key, b64);
  return b64;
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
      const family = f.family.replace(/'/g, "\\'");
      return `@font-face{font-family:'${family}';font-style:normal;font-weight:${f.weight};src:url(data:font/woff2;base64,${b64}) format('woff2');}`;
    })
    .join("");
}

export function svgFontFamily(name: string): string {
  return `'${name.replace(/'/g, "")}', sans-serif`;
}
