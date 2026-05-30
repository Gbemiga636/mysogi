import { estimateFooterDisplayLines } from "./businessContactCore";
import { getCampaignTypeLabel } from "./campaignProfile";
import { pct, computeFlyerVerticalBalance } from "./flyerLayoutBalance";
import type { CampaignCopy } from "./campaignTextLayers";
import type { BusinessProfile, VideoFormat } from "./types";

/** Primary creative driver — the SMS / campaign message the user chose in Step 2. */
export function buildCampaignMessagePrimaryBlock(
  campaignMessage: string,
  business: BusinessProfile
): string {
  const msg = campaignMessage.trim();
  if (!msg) return "";

  const typeLabel = getCampaignTypeLabel(business);
  return [
    "PRIMARY CREATIVE BRIEF — CAMPAIGN MESSAGE (this defines the entire ad):",
    `"${msg}"`,
    "The visual story, tagline angle, promo badges, and CTA energy MUST reflect this message.",
    "Business name stays the HERO HEADLINE — exact spelling — never replace headline with this message text.",
    typeLabel ? `Campaign type context: ${typeLabel}.` : "",
    "Do NOT typeset the raw campaign message as a second headline — express it through subhead, visuals, and CTA mood.",
  ].join(" ");
}

/** Tell the image model exactly what contact lines Sharp will render (never in the image). */
export function buildExactFooterSvgPromptBlock(
  business: BusinessProfile,
  format: VideoFormat,
  copy?: CampaignCopy
): string {
  const lines = estimateFooterDisplayLines(business, copy);
  const balance = computeFlyerVerticalBalance(business, format, copy);

  if (!lines.length) {
    return [
      `Reserve bottom ${pct(balance.footerReserveRatio)}% calm strip for optional SVG footer — no contact text in image.`,
    ].join(" ");
  }

  return [
    "FOOTER CONTACT — NEVER DRAW IN IMAGE (pixel-perfect SVG overlay after generation from Step 1):",
    ...lines.map((line, i) => `Footer line ${i + 1} (SVG only, exact): "${line}"`),
    `Reserve bottom ${pct(balance.footerReserveRatio)}% (${lines.length} lines). Zero readable phone, email, URL, or address characters in the artwork.`,
    "That band is dark gradient / frosted strip only — Sharp typesets contact perfectly.",
  ].join(" ");
}
