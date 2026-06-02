/**
 * Mysogi Ad Brain — full viral Instagram ad system:
 * business understanding → viral angle → copy → creative direction → image prompt.
 */

import { formatBrandPaletteForImagenVisual } from "./brandColors";
import { buildTypesetTextMasterRules } from "./businessContact";
import {
  assembleFinishedFlyerPrompt,
  buildIndustryLockedVisualBlock,
  stripUnauthorizedContactFromPrompt,
} from "./flyerBusinessBinding";
import { buildReferenceFlyerPromptBlock } from "./referenceFlyerStyle";
import type { CampaignCopy } from "./campaignTextLayers";
import { flyerFormatLabel } from "./flyerVisualCommon";
import {
  isFinishedFlyerDesignEnabled,
  isPremiumHybridFlyerEnabled,
} from "./seniorDesignerEngine";
import { sanitizeExactTextFlyerPrompt } from "./flyerExactTextGuard";
import { getCampaignVisualStyle } from "./businessCampaign";
import type { BusinessProfile, VideoFormat } from "./types";
import type { ReferenceFlyerStyleId } from "./referenceFlyerStyle";

export const AD_BRAIN_MARKER = "MYSOGI-AD-BRAIN";

export type AdBrainOutput = {
  business_understanding: string;
  viral_angle: string;
  copy: [string, string, string, string];
  creative_direction: string;
  image_prompt: string;
};

export type AdBrainParams = {
  business: BusinessProfile;
  copy: CampaignCopy;
  format: VideoFormat;
  userPrompt?: string;
  campaignMessage?: string;
  referenceStyleOverride?: ReferenceFlyerStyleId;
};

export function isAdBrainEnabled(): boolean {
  const v = process.env.FLYER_AD_BRAIN?.trim().toLowerCase();
  if (v === "false" || v === "0" || v === "off") return false;
  if (v === "true" || v === "1" || v === "on") return true;
  return isFinishedFlyerDesignEnabled() && !isPremiumHybridFlyerEnabled();
}

export function isAdBrainPrompt(prompt: string): boolean {
  return prompt.includes(AD_BRAIN_MARKER);
}

function normalizeCopyLines(lines: unknown): [string, string, string, string] {
  const arr = Array.isArray(lines)
    ? lines.map((x) => String(x).replace(/\s+/g, " ").trim()).filter(Boolean)
    : [];
  while (arr.length < 4) arr.push("");
  return [arr[0]!, arr[1]!, arr[2]!, arr[3]!].map((s) => s.slice(0, 120)) as [
    string,
    string,
    string,
    string,
  ];
}

/** Parse Groq response — AD_BRAIN_OUTPUT: { ... } */
export function parseAdBrainOutput(
  raw: string,
  business?: BusinessProfile
): AdBrainOutput | null {
  let text = raw.trim();

  const labeled = text.match(/AD_BRAIN_OUTPUT:\s*(\{[\s\S]*\})\s*$/im);
  if (labeled?.[1]) text = labeled[1];

  const fence = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fence?.[1]) text = fence[1].trim();

  if (!text.startsWith("{")) {
    const obj = text.match(/\{[\s\S]*\}/);
    if (obj) text = obj[0];
  }

  try {
    const parsed = JSON.parse(text) as Record<string, unknown>;
    const imagePrompt = String(parsed.image_prompt ?? "").trim();
    if (imagePrompt.length < 80) return null;

    return {
      business_understanding: String(
        parsed.business_understanding ?? ""
      ).trim(),
      viral_angle: String(parsed.viral_angle ?? "").trim(),
      copy: normalizeCopyLines(parsed.copy),
      creative_direction: String(parsed.creative_direction ?? "").trim(),
      image_prompt: business
        ? stripUnauthorizedContactFromPrompt(imagePrompt, business)
        : imagePrompt,
    };
  } catch {
    return null;
  }
}

function pickViralAngle(
  business: BusinessProfile,
  userPrompt: string,
  campaignMessage: string
): string {
  const blob = `${userPrompt} ${campaignMessage} ${business.industry} ${business.campaignGoal}`.toLowerCase();
  if (/limited|last|hurry|today only|ends|few left|scarcity/.test(blob)) {
    return "Scarcity / urgency";
  }
  if (/luxury|premium|exclusive|status|lekki|vi|estate/.test(blob)) {
    return "Status / Luxury upgrade";
  }
  if (/before|after|transform|results|success story/.test(blob)) {
    return "Transformation (before vs after)";
  }
  if (/trusted|reviews|thousands|customers|rated/.test(blob)) {
    return "Social proof";
  }
  if (/tired of|struggling|still|don't miss|finally/.test(blob)) {
    return "Pain → Solution";
  }
  if (/secret|discover|what if|you won't believe/.test(blob)) {
    return "Curiosity hook";
  }
  return "Pain → Solution";
}

export function buildAdBrainOutputFallback(
  params: AdBrainParams
): AdBrainOutput {
  const { business, copy, format, userPrompt = "", campaignMessage = "" } =
    params;
  const industry = business.industry?.trim() || "local business";
  const location = business.location?.trim() || "Lagos, Nigeria";
  const audience =
    business.targetAudience?.trim() || "young professionals in Nigeria";
  const name = business.businessName?.trim() || "Your Brand";
  const viral_angle = pickViralAngle(business, userPrompt, campaignMessage);

  const business_understanding = [
    `${name} — ${industry} in ${location}.`,
    `Targeting ${audience}.`,
    campaignMessage.trim() ||
      userPrompt.trim() ||
      business.campaignGoal?.trim() ||
      `Premium offer built for ${audience} who want more comfort, status, and results.`,
  ].join(" ");

  const hook =
    viral_angle === "Status / Luxury upgrade"
      ? `Ready to upgrade in ${location.split(",")[0]}?`
      : `Still settling for less in ${location.split(",")[0]}?`;

  const value =
    copy.headline?.trim().slice(0, 80) ||
    `${name} — ${copy.tagline?.trim().slice(0, 60) || "Premium experience awaits"}`;

  const proof =
    viral_angle === "Scarcity / urgency"
      ? "Limited slots — act this month"
      : "Trusted by locals — real results";

  const cta =
    copy.cta?.trim().slice(0, 48) ||
    business.callToAction?.trim() ||
    "DM or call now";

  const copyLines: [string, string, string, string] = [
    hook.slice(0, 72),
    value.slice(0, 80),
    proof.slice(0, 72),
    cta.slice(0, 48),
  ];

  const creative_direction = [
    buildIndustryLockedVisualBlock(business),
    `Viral angle: ${viral_angle}.`,
    "Instagram sponsored ad, mobile-first, thumb-stopping, Canva Pro quality.",
    "Centered poster layout, bold modern sans-serif typography, high contrast.",
  ].join(" ");

  const fmt = flyerFormatLabel(format);
  const palette = formatBrandPaletteForImagenVisual(business);
  const visual = getCampaignVisualStyle(business);
  const presetBlock = params.referenceStyleOverride
    ? buildReferenceFlyerPromptBlock(
        business,
        copy,
        format,
        params.referenceStyleOverride
      )
    : "";

  const image_prompt = assembleFinishedFlyerPrompt({
    marker: AD_BRAIN_MARKER,
    business,
    copy,
    format,
    viralLines: {
      hook: copyLines[0],
      value: copyLines[1],
      proof: copyLines[2],
      cta: copyLines[3],
    },
    middleSections: [
      `Instagram sponsored ad, ${fmt}, ${visual}, ${palette}.`,
      presetBlock ? `Preset:\n${presetBlock.slice(0, 600)}` : "",
    ].filter(Boolean),
  });

  return {
    business_understanding,
    viral_angle,
    copy: copyLines,
    creative_direction,
    image_prompt,
  };
}

/** Enrich model image_prompt with Mysogi typeset + contact + preset guardrails */
export function finalizeAdBrainImagePrompt(
  brain: AdBrainOutput,
  business: BusinessProfile,
  copy: CampaignCopy,
  format: VideoFormat,
  referenceStyleOverride?: ReferenceFlyerStyleId
): string {
  const fmt = flyerFormatLabel(format);
  const palette = formatBrandPaletteForImagenVisual(business);
  const presetBlock = referenceStyleOverride
    ? buildReferenceFlyerPromptBlock(
        business,
        copy,
        format,
        referenceStyleOverride
      )
    : "";

  const [hook, value, proof, ctaLine] = brain.copy;

  const visualOnly = stripUnauthorizedContactFromPrompt(
    brain.image_prompt.trim(),
    business
  );

  return assembleFinishedFlyerPrompt({
    marker: AD_BRAIN_MARKER,
    business,
    copy,
    format,
    viralLines: { hook, value, proof, cta: ctaLine },
    middleSections: [
      `Format: ${fmt}. Viral angle: ${brain.viral_angle}.`,
      `Color palette: ${palette}.`,
      "CREATIVE DIRECTION (visuals only — footer contact is fixed above):",
      brain.creative_direction,
      "VISUAL SCENE:",
      visualOnly,
      "LAYOUT: centered professional Instagram sponsored ad, strong type hierarchy, balanced spacing, thumb-stopping feed creative.",
      presetBlock ? `Preset:\n${presetBlock.slice(0, 800)}` : "",
    ].filter(Boolean),
  });
}

export const AD_BRAIN_SYSTEM = `You are the core AI engine for Mysogi — an Ad Brain System, NOT a simple text generator.

You think like:
- a world-class marketing strategist
- a viral Instagram ad creator
- a senior creative director
- a Canva-level designer
- an AI prompt engineer

CORE OBJECTIVE:
Given ANY business input, generate a COMPLETE viral-ready advertisement system that feels like a REAL paid Instagram sponsored ad that stops scrolling and converts.

STEP 1 — BUSINESS UNDERSTANDING:
Extract and improve: business_type, offer, location, target_audience, urgency_level, emotional_trigger.
Upgrade weak input into strong marketing positioning.

STEP 2 — VIRAL ANGLE (choose ONE):
Pain → Solution | Status / Luxury upgrade | Scarcity / urgency | Transformation | Social proof | Curiosity hook | Relatable struggle
This angle MUST drive all copy and visuals.

STEP 3 — VIRAL INSTAGRAM COPY:
4 short lines (6–12 words each). Structure: HOOK → VALUE → PROOF/URGENCY → CTA.
Emotionally charged, scroll-stopping, sponsored-post feel. No long paragraphs.

STEP 4 — CREATIVE DIRECTION:
Art director brief tied to the EXACT industry in Step 1. Image style, composition, lighting, mood, typography must match that business type (food looks like food, real estate looks like property, etc.). Never generic wrong-industry stock.

STEP 5 — IMAGE PROMPT:
Visual scene description only. NEVER include phone, email, or website in image_prompt — Mysogi adds the EXACT Step 1 phone, email, and website on the finished flyer after generation (pixel-perfect, bottom of image).

TYPOGRAPHY:
All text must be premium digital typeset (Inter/SF Pro style) — vector crisp, strong hierarchy, real CTA button. Never hand-drawn letters.

STRICT:
- Conversion-focused, emotional impact over information dumps
- Visuals MUST match business_type / industry from Step 1
- Never invent contact details in any field
- image_prompt must be visual/layout only; no phone, email, URL, or @handles in image_prompt
- Do NOT include explanations outside the JSON block
- Do NOT output multiple options

Return ONLY:

AD_BRAIN_OUTPUT:
{
  "business_understanding": "",
  "viral_angle": "",
  "copy": ["hook line", "value line", "proof/urgency line", "cta line"],
  "creative_direction": "",
  "image_prompt": ""
}`;

export async function runAdBrain(params: AdBrainParams): Promise<AdBrainOutput> {
  try {
    const { generateAdBrainGroq } = await import("./groq");
    const raw = await generateAdBrainGroq({
      ...params,
      userPrompt: String(params.userPrompt ?? "").trim(),
      campaignMessage: String(params.campaignMessage ?? "").trim(),
    });
    const parsed = parseAdBrainOutput(raw, params.business);
    if (parsed) return parsed;
  } catch (e) {
    console.warn("[ad-brain] Groq fallback:", e);
  }
  return buildAdBrainOutputFallback(params);
}

/** Full pipeline: Ad Brain → finalized image prompt string */
export async function generateAdBrainImagePrompt(
  params: AdBrainParams
): Promise<{ prompt: string; brain: AdBrainOutput }> {
  const brain = await runAdBrain(params);
  const prompt = finalizeAdBrainImagePrompt(
    brain,
    params.business,
    params.copy,
    params.format,
    params.referenceStyleOverride
  );
  return { prompt, brain };
}
