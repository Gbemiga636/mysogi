import type { CreativeAgencyBrief, QualityScores } from "./types";

const MIN_PASS = 90;

export function scoreCreativeAgencyBrief(brief: CreativeAgencyBrief): QualityScores {
  const text = [
    brief.expandedBrief,
    brief.imageSceneParagraph,
    brief.artDirector.visualStyle,
    brief.layout.heroSection,
    brief.strategist.objectives.join(" "),
  ]
    .join(" ")
    .toLowerCase();

  let visualImpact = 70;
  if (/3d|glass|cinematic|neon|hero|behance|dribbble|premium|volumetric/.test(text)) {
    visualImpact += 15;
  }
  if (/trial-4|nexora|floating|pedestal|glassmorphism/.test(text)) visualImpact += 10;
  if (brief.artDirector.effects.length >= 2) visualImpact += 5;

  let typography = 65;
  if (/headline|hierarchy|gradient keyword|typeset|font|sans|serif/.test(text)) typography += 20;
  if (/massive|hero type|masthead/.test(text)) typography += 10;

  let marketing = 70;
  if (/cta|trust|conversion|proof|stats|offer|bonus/.test(text)) marketing += 15;
  if (brief.strategist.psychology.length >= 4) marketing += 5;

  let conversion = 68;
  if (/cta pill|glowing|call to action|shop now|start trading|order/.test(text)) conversion += 18;
  if (brief.layout.ctaZone.length > 20) conversion += 8;

  let professionalism = 72;
  if (/agency|grid|aligned|spacing|not canva|not template/.test(text)) professionalism += 18;
  if (/industry|forbidden|must match/.test(text)) professionalism += 8;

  const clamp = (n: number) => Math.min(100, Math.max(0, n));
  visualImpact = clamp(visualImpact);
  typography = clamp(typography);
  marketing = clamp(marketing);
  conversion = clamp(conversion);
  professionalism = clamp(professionalism);

  const total = Math.round(
    (visualImpact + typography + marketing + conversion + professionalism) / 5
  );

  return { visualImpact, typography, marketing, conversion, professionalism, total };
}

export function passesQualityGate(scores: QualityScores): boolean {
  return scores.total >= MIN_PASS;
}

export function boostBriefForQuality(brief: CreativeAgencyBrief): CreativeAgencyBrief {
  const extra = [
    "QUALITY BOOST — mandatory:",
    "Ultra-premium integrated advertising layout like top Behance fintech campaigns (Trial 4 reference for tech/finance only).",
    "Strong focal 3D or photographic hero, glass UI panels, stats trust bar, glowing CTA, perfect grid alignment.",
    "Large hero headline with one gradient accent word, professional digital typeset only.",
    "Cinematic lighting with depth, shadows, and controlled neon glow — never flat template.",
    brief.director.industryKey === "food_restaurant"
      ? "FOOD: dominating appetite photography, warm grade, NO crypto dashboards."
      : "",
  ]
    .filter(Boolean)
    .join("\n");

  return {
    ...brief,
    expandedBrief: `${brief.expandedBrief}\n\n${extra}`,
    imageSceneParagraph: `${brief.imageSceneParagraph} ${extra}`.slice(0, 2200),
  };
}
