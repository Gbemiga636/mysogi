/**
 * Mysogi world-class flyer engine — single IMAGE_PROMPT for text-perfect models.
 * Step 1: intelligent ad understanding (internal via Groq).
 * Step 2: one final image prompt with exact copy, layout, and typography rules.
 */

import { formatBrandPaletteForImagenVisual } from "./brandColors";
import { getCampaignVisualStyle } from "./businessCampaign";
import { assembleFinishedFlyerPrompt } from "./flyerBusinessBinding";
import { buildReferenceFlyerPromptBlock } from "./referenceFlyerStyle";
import type { CampaignCopy } from "./campaignTextLayers";
import { flyerFormatLabel } from "./flyerVisualCommon";
import {
  isFinishedFlyerDesignEnabled,
  isPremiumHybridFlyerEnabled,
} from "./seniorDesignerEngine";
import { sanitizeExactTextFlyerPrompt } from "./flyerExactTextGuard";
import type { BusinessProfile, VideoFormat } from "./types";
import type { ReferenceFlyerStyleId } from "./referenceFlyerStyle";

export const WORLD_CLASS_FLYER_MARKER = "MYSOGI-WORLD-CLASS-FLYER";

export type WorldClassAdUnderstanding = {
  businessType: string;
  offer: string;
  urgencyLevel: string;
  targetAudience: string;
  tone: string;
  headline: string;
  subheadline: string;
  price: string;
  cta: string;
  visualStyle: string;
};

function isAdBrainEnvActive(): boolean {
  const v = process.env.FLYER_AD_BRAIN?.trim().toLowerCase();
  if (v === "false" || v === "0" || v === "off") return false;
  if (v === "true" || v === "1" || v === "on") return true;
  return isFinishedFlyerDesignEnabled() && !isPremiumHybridFlyerEnabled();
}

export function isWorldClassFlyerEnabled(): boolean {
  if (isAdBrainEnvActive()) return false;
  const v = process.env.FLYER_WORLD_CLASS?.trim().toLowerCase();
  if (v === "false" || v === "0" || v === "off") return false;
  if (v === "true" || v === "1" || v === "on") return true;
  return isFinishedFlyerDesignEnabled() && !isPremiumHybridFlyerEnabled();
}

export function isWorldClassFlyerPrompt(prompt: string): boolean {
  return prompt.includes(WORLD_CLASS_FLYER_MARKER);
}

/** Parse model output — expects IMAGE_PROMPT: """...""" */
export function parseImagePromptFromModelOutput(raw: string): string {
  const trimmed = raw.trim();
  const triple = trimmed.match(/IMAGE_PROMPT:\s*"""([\s\S]*?)"""/i);
  if (triple?.[1]) return triple[1].trim();

  const single = trimmed.match(/IMAGE_PROMPT:\s*"([\s\S]*?)"/i);
  if (single?.[1]) return single[1].trim();

  const block = trimmed.match(/IMAGE_PROMPT:\s*([\s\S]+)/i);
  if (block?.[1]) {
    return block[1]
      .replace(/^"""|"""$/g, "")
      .trim();
  }

  if (trimmed.length >= 180 && /HEADLINE:|headline:/i.test(trimmed)) {
    return trimmed;
  }
  return "";
}

function inferPriceLine(
  business: BusinessProfile,
  userPrompt: string,
  campaignMessage: string
): string {
  const combined = `${userPrompt} ${campaignMessage} ${business.tagline ?? ""} ${business.campaignGoal ?? ""}`;
  const naira = combined.match(/₦[\d,]+(?:\s*(?:\/|per)\s*\w+)?/i);
  if (naira) return naira[0].trim();
  const usd = combined.match(/\$[\d,]+(?:\s*(?:\/|per)\s*\w+)?/i);
  if (usd) return usd[0].trim();

  const industry = (business.industry || "").toLowerCase();
  if (/real estate|property|rent|lease|apartment|house/.test(industry + combined.toLowerCase())) {
    return "₦___/year — inquire for current rate";
  }
  if (/sale|discount|off|%/.test(combined.toLowerCase())) {
    return "Limited-time offer — see details";
  }
  return "";
}

/** Deterministic fallback when Groq is unavailable */
export function buildWorldClassAdUnderstanding(
  business: BusinessProfile,
  copy: CampaignCopy,
  userPrompt: string,
  campaignMessage: string
): WorldClassAdUnderstanding {
  const industry = business.industry?.trim() || "local business";
  const audience = business.targetAudience?.trim() || "Nigerian consumers";
  const goal = business.campaignGoal?.trim() || "drive leads and sales";
  const tone =
    /luxury|premium|estate|jewel|fashion/i.test(industry)
      ? "luxury, premium"
      : /urgent|sale|flash|limited/i.test(
            `${userPrompt} ${campaignMessage}`.toLowerCase()
          )
        ? "urgent, high-conversion"
        : "professional, trustworthy";

  const headline =
    copy.headline?.trim() ||
    business.businessName?.trim() ||
    "Your Premium Offer";
  const subheadline =
    copy.tagline?.trim() ||
    business.tagline?.trim() ||
    campaignMessage.trim().slice(0, 120) ||
    `Quality ${industry} for ${audience}`;
  const price = inferPriceLine(business, userPrompt, campaignMessage);
  const cta = copy.cta?.trim() || business.callToAction?.trim() || "Call Now";

  return {
    businessType: industry,
    offer: campaignMessage.trim() || userPrompt.trim() || goal,
    urgencyLevel: /urgent|today|now|limited|hurry/i.test(
      `${userPrompt} ${campaignMessage}`
    )
      ? "high"
      : "moderate",
    targetAudience: audience,
    tone,
    headline: headline.slice(0, 72),
    subheadline: subheadline.slice(0, 140),
    price,
    cta: cta.slice(0, 48),
    visualStyle: getCampaignVisualStyle(business),
  };
}

export function buildWorldClassImagePromptFallback(
  business: BusinessProfile,
  copy: CampaignCopy,
  format: VideoFormat,
  userPrompt: string,
  campaignMessage: string,
  referenceStyleOverride?: ReferenceFlyerStyleId
): string {
  const ad = buildWorldClassAdUnderstanding(
    business,
    copy,
    userPrompt,
    campaignMessage
  );
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

  const priceLine = ad.price
    ? `PRICE: ${ad.price}`
    : "PRICE: (omit if not applicable — do not invent fake numbers)";

  return assembleFinishedFlyerPrompt({
    marker: WORLD_CLASS_FLYER_MARKER,
    business,
    copy,
    format,
    userPrompt,
    campaignMessage,
    viralLines: {
      hook: ad.headline,
      value: ad.subheadline,
      proof: priceLine.replace(/^PRICE:\s*/i, ""),
      cta: ad.cta,
    },
    middleSections: [
      `${ad.tone} advertising flyer for ${ad.businessType}, ${fmt}, Canva Pro quality.`,
      `Industry-matched hero: ${ad.visualStyle} — scene must match ${ad.businessType}.`,
      `Color palette: ${palette}.`,
      "centered professional layout, strong typography hierarchy, Instagram-ready.",
      presetBlock ? `Creative direction:\n${presetBlock.slice(0, 900)}` : "",
      userPrompt.trim() ? `Client brief: ${userPrompt.trim().slice(0, 200)}` : "",
    ].filter(Boolean),
  });
}

export const WORLD_CLASS_FLYER_SYSTEM = `You are the Mysogi world-class AI flyer generation system.

Your job is to produce HIGH-CONVERSION, DESIGN-PERFECT marketing flyers where text is fully accurate, typography is clean, layout is professionally balanced, and the result looks like Canva Pro or Adobe Express — everything in ONE generated image (no external text overlays).

WORKFLOW (internal — do not expose steps):
1) Convert business input into structured ad meaning: business type, offer, urgency, audience, tone. Upgrade weak input into strong marketing copy (headline, subheadline, price if relevant, CTA).
2) Output ONLY ONE final image prompt optimized for text-perfect models (Ideogram, GPT Image, DALL·E).

STRICT TEXT RULES:
- SHORT, CLEAN, MARKETING-READY copy only
- Hierarchy: HEADLINE → PRICE (if any) → SUBTEXT → CTA → contact lines
- Spell every character exactly as given — no variations
- High contrast text vs background
- Professional digital typeset only — never hand-drawn or brush lettering

LAYOUT (must appear in prompt):
- centered professional flyer layout
- strong visual hierarchy
- balanced spacing
- clear typography zones
- minimal clutter
- premium advertising style
- Instagram-ready poster design

OUTPUT FORMAT — return ONLY this, nothing else:

IMAGE_PROMPT: """
[fully optimized prompt here]
"""

Do NOT return JSON. Do NOT return explanations. Do NOT return multiple options.`;

export type WorldClassFlyerPromptParams = {
  business: BusinessProfile;
  copy: CampaignCopy;
  format: VideoFormat;
  userPrompt?: string;
  campaignMessage?: string;
  referenceStyleOverride?: ReferenceFlyerStyleId;
};

export async function generateWorldClassFlyerImagePrompt(
  params: WorldClassFlyerPromptParams
): Promise<string> {
  const userPrompt = String(params.userPrompt ?? "").trim();
  const campaignMessage = String(params.campaignMessage ?? "").trim();

  try {
    const { generateWorldClassFlyerImagePromptGroq } = await import("./groq");
    const raw = await generateWorldClassFlyerImagePromptGroq({
      ...params,
      userPrompt,
      campaignMessage,
    });
    const parsed = parseImagePromptFromModelOutput(raw);
    if (parsed.length >= 160) {
      const withMarker = parsed.includes(WORLD_CLASS_FLYER_MARKER)
        ? parsed
        : `${WORLD_CLASS_FLYER_MARKER}\n${parsed}`;
      return sanitizeExactTextFlyerPrompt(withMarker).slice(0, 3900);
    }
  } catch (e) {
    console.warn("[world-class-flyer] Groq prompt fallback:", e);
  }

  return buildWorldClassImagePromptFallback(
    params.business,
    params.copy,
    params.format,
    userPrompt,
    campaignMessage,
    params.referenceStyleOverride
  );
}
