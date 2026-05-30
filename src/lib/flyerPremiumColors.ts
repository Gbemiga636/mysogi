/** Overlay text color helpers — brand-aware contrast for Sharp SVG layers */

export function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const h = hex.replace(/^#/, "");
  return {
    r: parseInt(h.slice(0, 2), 16),
    g: parseInt(h.slice(2, 4), 16),
    b: parseInt(h.slice(4, 6), 16),
  };
}

export function shadeHex(hex: string, factor: number): string {
  const { r, g, b } = hexToRgb(hex);
  const clamp = (n: number) =>
    Math.min(255, Math.max(0, Math.round(n * factor)));
  const rr = clamp(r).toString(16).padStart(2, "0");
  const gg = clamp(g).toString(16).padStart(2, "0");
  const bb = clamp(b).toString(16).padStart(2, "0");
  return `#${rr}${gg}${bb}`;
}

export function blendHex(a: string, b: string, weightB: number): string {
  const w = Math.min(1, Math.max(0, weightB));
  const A = hexToRgb(a);
  const B = hexToRgb(b);
  const mix = (x: number, y: number) =>
    Math.round(x * (1 - w) + y * w)
      .toString(16)
      .padStart(2, "0");
  return `#${mix(A.r, B.r)}${mix(A.g, B.g)}${mix(A.b, B.b)}`;
}

export function hexLuminance(hex: string): number {
  const { r, g, b } = hexToRgb(hex);
  const [rs, gs, bs] = [r, g, b].map((c) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

export function isLightHex(hex: string): boolean {
  return hexLuminance(hex) > 0.58;
}

/** Text on a brand-colored button */
export function textOnBrandFill(brandHex: string): string {
  return isLightHex(brandHex) ? "#1A1F2E" : "#FFFFFF";
}

/** Warm highlight for supporting copy */
export function premiumAccentTint(brandHex: string): string {
  return blendHex(brandHex, "#F4E8D4", 0.42);
}

/** Soft cream for secondary footer lines */
export function premiumMutedLight(): string {
  return "#E2E8F0";
}
