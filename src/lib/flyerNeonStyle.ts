import { blendHex, hexToRgb, shadeHex } from "./flyerPremiumColors";

export type NeonPalette = {
  primary: string;
  secondary: string;
  white: string;
  ice: string;
};

/** Push brand hex toward vivid neon */
export function neonBoost(hex: string): string {
  const { r, g, b } = hexToRgb(hex);
  const max = Math.max(r, g, b, 1);
  const lift = 255 / max;
  const mix = (c: number) => Math.min(255, Math.round(c * lift * 1.12 + 18));
  return `#${mix(r).toString(16).padStart(2, "0")}${mix(g).toString(16).padStart(2, "0")}${mix(b).toString(16).padStart(2, "0")}`;
}

export function buildNeonPalette(
  brandPrimary: string,
  brandSecondary: string
): NeonPalette {
  const secondary = neonBoost(brandSecondary || brandPrimary);
  return {
    primary: neonBoost(brandPrimary),
    secondary,
    white: "#FFFFFF",
    ice: blendHex(secondary, "#FFFFFF", 0.55),
  };
}

function escAttr(v: string): string {
  return v.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/'/g, "&apos;");
}

/** Multi-layer glow — reads like neon on photos */
export function svgNeonGlowFilter(
  id: string,
  glowColor: string,
  accentColor: string
): string {
  const glow = escAttr(glowColor);
  const accent = escAttr(accentColor);
  const bright = escAttr(shadeHex(glowColor, 1.25));
  return `<filter id="${id}" x="-80%" y="-80%" width="260%" height="260%">
<feDropShadow dx="0" dy="0" stdDeviation="10" flood-color="${accent}" flood-opacity="0.85"/>
<feDropShadow dx="0" dy="0" stdDeviation="5" flood-color="${glow}" flood-opacity="1"/>
<feDropShadow dx="0" dy="0" stdDeviation="2" flood-color="${bright}" flood-opacity="1"/>
<feDropShadow dx="0" dy="3" stdDeviation="4" flood-color="#000000" flood-opacity="0.8"/>
</filter>`;
}

export function neonStrokeWidth(fontSize: number, scale = 0.065): number {
  return Math.max(2, Math.round(fontSize * scale));
}

/** Poster-style uppercase for display lines */
export function formatFlyerDisplay(text: string): string {
  return text.trim().toUpperCase();
}
