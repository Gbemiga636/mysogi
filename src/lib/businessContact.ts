import {
  buildBusinessContactLine,
  buildBusinessContactParts,
  estimateFooterDisplayLines,
  hasBusinessContact,
  type BusinessContactParts,
} from "./businessContactCore";
import {
  buildExactFooterSvgPromptBlock,
} from "./campaignMessagePrompt";
import {
  buildFooterReserveVisualBlock,
  computeFlyerVerticalBalance,
  pct,
} from "./flyerLayoutBalance";
import {
  buildForbiddenContactInImageBlock,
  buildInImageBottomContactBlock,
  buildMandatoryExactContactBlock,
} from "./flyerFooterLock";
import { shouldForbidContactInAiImage } from "./flyerExactContactMode";
import { buildAiContactReserveBlock } from "./flyerContactPrompt";
import type { CampaignCopy } from "./campaignTextLayers";
import type { BusinessProfile, VideoFormat } from "./types";

export {
  buildBusinessContactLine,
  buildBusinessContactParts,
  estimateFooterDisplayLines,
  hasBusinessContact,
};
export type { BusinessContactParts } from "./businessContactCore";
export { buildForbiddenContactInImageBlock } from "./flyerFooterLock";

/** Force profile phone/email onto copy — Groq or user prompts cannot drop contact */
export function ensureBusinessContactOnCopy(
  copy: CampaignCopy,
  business: BusinessProfile
): CampaignCopy {
  const { line } = buildBusinessContactParts(business);
  if (!line) return copy;
  return { ...copy, contact: line };
}

/** Shared negative prompt fragment for image models */
export const CONTACT_TEXT_NEGATIVE_PROMPT =
  "phone numbers, email addresses, website URLs, street address, location line, contact footer text, @ symbol, .com domain, readable signage with phone or email";

export const FORBIDDEN_CONTACT_IN_IMAGE =
  "FORBIDDEN IN THE IMAGE: phone numbers, email addresses, website URLs, @ symbols, .com domains, or any contact text — Mysogi burns EXACT Step 1 phone, email, and website onto the finished flyer after generation. Reserve empty dark footer band at bottom 12%.";

/** Master rules — all flyer text must look digitally typeset, never hand-drawn */
export function buildTypesetTextMasterRules(): string {
  return [
    "TYPESET TEXT MASTER RULES (non-negotiable):",
    "Every word must look like a Canva Pro / Adobe Express export — vector-crisp, even baselines, professional kerning, real font files (Inter, SF Pro, Poppins).",
    "FORBIDDEN: hand-drawn, brush, painted, chalk, marker, crayon, graffiti, sketched, doodled, wavy baselines, illustrated letterforms, smudged or painted-on letters, blurry text.",
    "Headline = boldest largest sans. CTA = real button with typeset label inside. Footer contact = smallest semi-bold sans — same digital quality as headline.",
    "Perfect spelling on every character — especially phone digits, email @domain, and website TLD.",
  ].join(" ");
}

/** Contact block for prompts — in-image bottom row, or forbid when overlay mode is on */
export function buildIntegratedContactTypesetBlock(
  business: BusinessProfile,
  _copy?: CampaignCopy,
  format: VideoFormat = "9:16"
): string {
  if (shouldForbidContactInAiImage()) {
    return buildForbiddenContactInImageBlock(business, format);
  }
  return buildMandatoryExactContactBlock(business, format);
}

/** Image model: reserve bottom band — contact is added via SVG after generation */
export function buildContactFooterReserveDirective(
  business: BusinessProfile,
  format: VideoFormat = "9:16",
  copy?: CampaignCopy
): string {
  const { phone, email, website } = buildBusinessContactParts(business);
  const loc = business.location?.trim();
  const hasAny = Boolean(phone || email || website || loc);
  const balance = computeFlyerVerticalBalance(business, format, copy);

  const forbidden: string[] = [FORBIDDEN_CONTACT_IN_IMAGE];
  if (phone) forbidden.push(`Never render phone "${phone}" or any phone number.`);
  if (email) forbidden.push(`Never render email "${email}" or any @ address.`);
  if (website) {
    forbidden.push(`Never render website "${website}" or any URL/domain text.`);
  }
  if (loc) {
    forbidden.push(
      `Never typeset location/address "${loc}" — use only as visual setting context if needed.`
    );
  }

  forbidden.push(
    hasAny
      ? `Reserve the bottom ${pct(balance.footerReserveRatio)}%: soft dark gradient strip, frosted bar, or calm negative space — zero readable contact characters. CTA must stay above ${pct(balance.footerReserveTopRatio)}% from top.`
      : "Reserve a clean bottom footer band with no readable contact text.",
    "Never place photography, CTA buttons, or busy texture where the SVG footer will sit.",
    buildFooterReserveVisualBlock(business, format, copy),
    buildExactFooterSvgPromptBlock(business, format, copy)
  );

  return forbidden.join(" ");
}

/** Finished-design contact rules — in-image bottom row, or reserve band when overlay mode is on */
export function buildNoContactTextInImageBlock(
  business: BusinessProfile,
  format: VideoFormat = "9:16",
  copy?: CampaignCopy
): string {
  if (shouldForbidContactInAiImage()) {
    return buildAiContactReserveBlock(business, format);
  }
  return buildInImageBottomContactBlock(business, format);
}

/** Prompt directive so image models reserve a readable footer for contact */
export function buildContactFooterDirective(business: BusinessProfile): string {
  const { phone, email, website, line } = buildBusinessContactParts(business);
  if (!line) {
    return "If contact details exist on the business profile, place them on a dedicated bottom footer line.";
  }

  const pieces: string[] = [
    "MANDATORY CONTACT — typeset directly on the image at the absolute bottom of the flyer (no overlay):",
    `Full width bottom row — render exactly: ${line}`,
  ];
  if (phone) pieces.push(`Left: phone "${phone}"`);
  if (email) pieces.push(`Center: email "${email}"`);
  if (website) pieces.push(`Right: website "${website}"`);
  pieces.push(
    "Lowest 6–10% of frame, flush with bottom edge. High contrast. Do not cover with photography or CTA."
  );
  return pieces.join(" ");
}
