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
import type { CampaignCopy } from "./campaignTextLayers";
import type { BusinessProfile, VideoFormat } from "./types";

export {
  buildBusinessContactLine,
  buildBusinessContactParts,
  estimateFooterDisplayLines,
  hasBusinessContact,
  type BusinessContactParts,
};

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
  "FORBIDDEN IN THE IMAGE: phone numbers, email addresses, website URLs, street addresses, city/location lines, @ symbols, .com domains, or any contact footer — contact is added AFTER generation as SVG overlay only.";

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

/** Highest-priority block for finished-design image prompts */
export function buildNoContactTextInImageBlock(
  business: BusinessProfile,
  format: VideoFormat = "9:16",
  copy?: CampaignCopy
): string {
  return [
    buildContactFooterReserveDirective(business, format, copy),
    "Only these text layers may appear in the image: brand name, headline, subheadline, CTA button label.",
    `Negative: ${CONTACT_TEXT_NEGATIVE_PROMPT}.`,
  ].join(" ");
}

/** Prompt directive so image models reserve a readable footer for contact */
export function buildContactFooterDirective(business: BusinessProfile): string {
  const { phone, email, website, line } = buildBusinessContactParts(business);
  if (!line) {
    return "If contact details exist on the business profile, place them on a dedicated bottom footer line.";
  }

  const pieces: string[] = [
    "MANDATORY FOOTER CONTACT — must appear on the finished flyer, bottom edge, clearly readable, never cropped:",
    `Full contact line — render exactly: ${line}`,
  ];
  if (phone) pieces.push(`Phone — render exactly: ${phone}`);
  if (email) pieces.push(`Email — render exactly: ${email}`);
  if (website) pieces.push(`Website — render exactly: ${website}`);
  pieces.push(
    "Reserve a clean footer band for contact. Do not cover with photography. Smallest type size but high contrast."
  );
  return pieces.join(" ");
}
