import type {
  ArtDirectorOutput,
  BrandDesignerOutput,
  CreativeAgencyInput,
  CreativeDirectorOutput,
  LayoutPlan,
} from "./types";
import type { MarketingStrategistOutput } from "./marketingPsychology";

export type AgencyBriefCore = {
  leadNote: string;
  director: CreativeDirectorOutput;
  strategist: MarketingStrategistOutput;
  artDirector: ArtDirectorOutput;
  brand: BrandDesignerOutput;
  layout: LayoutPlan;
};
import { layoutPlanner } from "./layoutPlanner";
import { buildTrial4SceneParagraph } from "./trial4Blueprint";

/** Expand short user input into a full advertising brief (Trial-4 style depth). */
export function expandUserPromptToBrief(
  input: CreativeAgencyInput,
  brief: AgencyBriefCore
): string {
  const { business, userPrompt = "", campaignMessage = "" } = input;
  const name = business.businessName?.trim() || "the brand";
  const industry = brief.director.industryKey;
  const seed =
    userPrompt.trim() ||
    campaignMessage.trim() ||
    `Premium campaign for ${name}`;

  const layout = brief.layout;

  return [
    brief.leadNote,
    "",
    "=== CREATIVE DIRECTOR BRIEF ===",
    brief.director.creativeNorthStar,
    brief.director.audienceInsight,
    "",
    "=== USER REQUEST (expanded) ===",
    `Original request: "${seed}"`,
    `Expanded intent: Design a world-class ${brief.strategist.conversionGoal} campaign for ${name}.`,
    "",
    "=== DESIGN OBJECTIVES ===",
    ...brief.strategist.objectives.map((o) => `• ${o}`),
    `Value proposition: ${brief.strategist.valueProposition}`,
    `Primary conversion: ${brief.strategist.conversionGoal}`,
    "",
    "=== VISUAL STYLE ===",
    brief.artDirector.visualStyle,
    `Composition: ${brief.artDirector.composition}`,
    `Hero subject: ${brief.artDirector.heroSubject}`,
    `Lighting: ${brief.artDirector.lighting}`,
    `Effects (when appropriate): ${brief.artDirector.effects.join(", ")}`,
    brief.artDirector.qualityBar,
    "",
    "=== LAYOUT GRID (mandatory zones) ===",
    `Hero: ${layout.heroSection}`,
    `Headline: ${layout.headlineZone}`,
    `Subhead: ${layout.subheadZone}`,
    `Benefits/offer: ${layout.benefitsZone}`,
    `Visual focus: ${layout.visualFocus}`,
    `Trust: ${layout.trustZone}`,
    `CTA: ${layout.ctaZone}`,
    `Footer: ${layout.footerZone}`,
    "",
    "=== TYPOGRAPHY ===",
    brief.brand.typographyDirection,
    "",
    "=== BRAND ===",
    brief.brand.colorStrategy,
    brief.brand.logoPlacement,
    "",
    "=== MARKETING PSYCHOLOGY ===",
    ...brief.strategist.psychology.map((p) => `• ${p}`),
    `Trust signals: ${brief.strategist.trustSignals.join("; ")}`,
    brief.strategist.urgencyNote,
    "",
    "=== QUALITY TARGET ===",
    "Agency-level design. Behance/Dribbble showcase. Instagram sponsored ad. Billboard-ready hierarchy.",
    "Never: generic template, amateur spacing, floating random elements, unrelated stock industry.",
    industry === "crypto_fintech"
      ? "Reference caliber: Trial 4 Nexora Exchange — dark fintech UI, 3D coins, glass panels, stats bar, glowing CTA."
      : industry === "food_restaurant"
        ? "Reference caliber: premium food brand campaigns — hero food photography, warm appetite lighting, NO tech dashboards."
        : "",
  ]
    .filter(Boolean)
    .join("\n");
}

export function buildImageSceneParagraph(
  input: CreativeAgencyInput,
  brief: AgencyBriefCore
): string {
  return buildTrial4SceneParagraph(input, brief);
}
