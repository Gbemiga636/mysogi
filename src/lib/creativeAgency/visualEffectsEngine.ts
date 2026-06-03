import { getIndustryDesignSystem } from "./industrySystems";
import type { BusinessProfile } from "../types";

export function visualEffectsEngine(business: BusinessProfile): {
  effects: string[];
  lighting: string;
  qualityBar: string;
} {
  const industry = getIndustryDesignSystem(business);

  const baseEffects = industry.effects.split(",").map((e) => e.trim()).filter(Boolean);

  const lighting =
    industry.key === "crypto_fintech"
      ? "Cinematic rim light on 3D hero, volumetric blue glow from platform, soft top fill, chart area darker"
      : industry.key === "food_restaurant"
        ? "Golden-hour key light, warm fill, steam backlight, appetizing specular highlights on food"
        : "Professional commercial key + fill, controlled shadows, depth of field on hero subject";

  const qualityBar = [
    "Behance featured / Dribbble shot quality",
    "Paid social campaign ready (Meta, Instagram sponsored)",
    "Agency pitch-deck hero slide quality",
    "8K advertising finish — sharp typeset edges, no muddy compression",
    "NOT: Canva template, amateur collage, random floating stickers",
  ].join(". ");

  return { effects: baseEffects, lighting, qualityBar };
}
