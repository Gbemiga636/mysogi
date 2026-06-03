import { formatBrandPaletteForImagenVisual } from "../brandColors";
import { resolveMobileAdPreset } from "../mobileAdPresets";
import type { CreativeAgencyInput, BrandDesignerOutput } from "./types";

export function brandDesigner(input: CreativeAgencyInput): BrandDesignerOutput {
  const { business } = input;
  const name = business.businessName?.trim() || "Brand";
  const preset = resolveMobileAdPreset(business);
  const palette = formatBrandPaletteForImagenVisual(business);

  return {
    colorStrategy: `${palette}. Apply brand colors on CTA, accents, and UI glows — never as hex text in image.`,
    typographyDirection: [
      `Typography system: ${preset.typography}`,
      "Hero headline largest element — modern geometric sans or editorial serif per industry",
      "Perfect spacing, line height, and contrast — digital typeset only, never hand-drawn",
      `Business name "${name}" as masthead or dominant headline — exact spelling`,
    ].join(" "),
    logoPlacement:
      "NO logo in the AI image — top 8–10% calm empty band; client's real logo is composited larger at top-center after generation",
    brandVoice:
      business.tagline?.trim() ||
      `${preset.label} campaign voice — premium, confident, conversion-focused`,
  };
}
