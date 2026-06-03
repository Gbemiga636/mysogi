import { getIndustryDesignSystem } from "./industrySystems";
import { visualEffectsEngine } from "./visualEffectsEngine";
import type { CreativeAgencyInput, ArtDirectorOutput } from "./types";

export function artDirector(input: CreativeAgencyInput): ArtDirectorOutput {
  const industry = getIndustryDesignSystem(input.business, input.userPrompt);
  const fx = visualEffectsEngine(input.business);

  return {
    visualStyle: [
      `VISUAL STYLE — ${industry.label}:`,
      industry.visualMotifs,
      industry.colorDirection,
      `Reference caliber: ${industry.referenceBrands}`,
    ].join(" "),
    composition: industry.layoutBias,
    lighting: fx.lighting,
    heroSubject: industry.heroSubjects,
    effects: fx.effects,
    qualityBar: fx.qualityBar,
  };
}
