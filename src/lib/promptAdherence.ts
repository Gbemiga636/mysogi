/**
 * Keep client creative direction and exact copy when assembling long image prompts.
 */

import { sanitizeExactTextFlyerPrompt } from "./flyerExactTextGuard";
import { SENIOR_DESIGNER_MAX_CHARS } from "./seniorDesignerEngine";
import type { BusinessProfile } from "./types";

export const CLIENT_DIRECTIVE_MARKER = "CLIENT-MANDATORY-DIRECTIVE";

export type PromptSection = {
  /** Higher = always kept (100 = client prompt) */
  priority: number;
  id: string;
  content: string;
};

export function getPrimaryClientPrompt(
  business: BusinessProfile,
  userPrompt: string
): string {
  const raw = userPrompt.trim();
  if (raw) return raw;
  return business.tagline?.trim() || "";
}

export function hasExplicitClientPrompt(userPrompt: string): boolean {
  return userPrompt.trim().length >= 8;
}

/** Highest-priority block — user's Step 2 idea + Step 1 items */
export function buildClientMandatoryDirectiveBlock(
  business: BusinessProfile,
  userPrompt: string
): string {
  const primary = getPrimaryClientPrompt(business, userPrompt);
  const parts: string[] = [];

  if (primary) {
    parts.push(
      `${CLIENT_DIRECTIVE_MARKER}: Implement this creative request EXACTLY — subject, mood, setting, props, and story must match: "${primary.replace(/"/g, "'")}"`
    );
  }

  if (business.imageProps?.trim()) {
    parts.push(
      `Mandatory elements visible in the ad: ${business.imageProps.trim().replace(/"/g, "'")}`
    );
  }

  if (!parts.length) return "";

  return [
    "HIGHEST PRIORITY (never ignore, never replace with generic stock):",
    parts.join(" "),
    "The finished image MUST match this directive — not a generic template for the industry.",
  ].join(" ");
}

export function buildClientDirectiveReminder(userPrompt: string): string {
  const p = userPrompt.trim();
  if (p.length < 8) return "";
  return `REMINDER — match client request: ${p.slice(0, 220).replace(/"/g, "'")}`;
}

/**
 * Assemble prompt sections by priority; always keep priority >= 90, trim lower first.
 */
export function assemblePromptWithAdherence(
  sections: PromptSection[],
  maxChars: number = SENIOR_DESIGNER_MAX_CHARS
): string {
  const sorted = [...sections]
    .filter((s) => s.content.trim())
    .sort((a, b) => b.priority - a.priority);

  const must: string[] = [];
  const optional: string[] = [];

  for (const s of sorted) {
    if (s.priority >= 90) must.push(s.content.trim());
    else optional.push(s.content.trim());
  }

  let result = must.join(" ");
  for (const chunk of optional) {
    const next = `${result} ${chunk}`.replace(/\s{2,}/g, " ").trim();
    if (next.length <= maxChars) result = next;
    else {
      const room = maxChars - result.length - 1;
      if (room > 120) {
        result = `${result} ${chunk.slice(0, room)}`.trim();
      }
      break;
    }
  }

  return sanitizeExactTextFlyerPrompt(result).slice(0, maxChars);
}

export function condenseForClientPriority(
  text: string,
  userPrompt: string,
  maxLen: number
): string {
  const limit = hasExplicitClientPrompt(userPrompt)
    ? Math.min(maxLen, 720)
    : maxLen;
  return text.length <= limit ? text : `${text.slice(0, limit - 1).trim()}…`;
}

export const OPENAI_ADHERENCE_PREAMBLE =
  "Follow every instruction below exactly. Client mandatory directive and exact marketing copy are non-negotiable. Create a trending premium social media flyer — centered hierarchy, glass overlays, cinematic depth, glowing CTA — all text must be premium digital typeset (Figma/InDesign quality), never hand-drawn. Do not invent different scenes, products, or messages.";

/** Stronger adherence when Creative Agency + Trial-4 blueprint is active. */
export const CREATIVE_AGENCY_OPENAI_PREAMBLE =
  "Render a FINISHED premium advertising poster at Trial-4 Nexora Exchange caliber: dense grid layout, frosted glass panels, 3D hero on glowing pedestal, horizontal stats/trust bar, feature icon row, promo glass card, wide glowing gradient CTA pill. Do NOT draw any logo, logomark, or brand icon — top band stays empty for client logo overlay. CTA and all UI must sit above the bottom footer reserve (calm dark strip for contact overlay). Every numbered zone in the IMAGE SCENE must be visible. Exact marketing copy must be typeset as specified. Never hand-drawn text, never sparse template. ";
