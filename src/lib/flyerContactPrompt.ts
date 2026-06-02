/**
 * Prompt blocks that lock flyer contact to Step 1 profile values only.
 */

import { buildBusinessContactParts } from "./businessContactCore";
import { shouldForbidContactInAiImage } from "./flyerExactContactMode";
import { buildInImageBottomContactBlock } from "./flyerFooterLock";
import type { BusinessProfile, VideoFormat } from "./types";

function quoteExact(value: string): string {
  return value.replace(/"/g, "'").trim();
}

/** Highest priority — exact strings from Step 1 (for post-compose reference in prompts). */
export function buildStep1ExactContactLockBlock(
  business: BusinessProfile
): string {
  const { phone, email, website } = buildBusinessContactParts(business);
  const websiteDisplay = website
    .replace(/^https?:\/\//i, "")
    .replace(/\/$/, "");

  if (!phone && !email && !website) {
    return "STEP 1 CONTACT: (none provided — do not invent phone, email, or website).";
  }

  const lines: string[] = [
    "╔══════════════════════════════════════════════════════════╗",
    "║  STEP 1 CONTACT — ONLY THESE VALUES (CHARACTER-PERFECT)  ║",
    "╚══════════════════════════════════════════════════════════╝",
  ];

  if (phone) {
    lines.push(`PHONE (copy exactly, every digit): "${quoteExact(phone)}"`);
  }
  if (email) {
    lines.push(`EMAIL (copy exactly, including @ and domain): "${quoteExact(email)}"`);
  }
  if (websiteDisplay) {
    lines.push(
      `WEBSITE (copy exactly): "${quoteExact(websiteDisplay)}"`
    );
  }
  if (website && website !== websiteDisplay) {
    lines.push(`(Full URL in profile: "${quoteExact(website)}")`);
  }

  lines.push(
    "FORBIDDEN: placeholder numbers, fake emails, different domains, old contact, competitor details, or 'example.com'.",
    "If the image model cannot guarantee perfect spelling, leave the bottom band empty — Mysogi applies these exact values on the final image."
  );

  return lines.join("\n");
}

/** AI image: empty bottom band; exact contact applied after generation. */
export function buildAiContactReserveBlock(
  business: BusinessProfile,
  format: VideoFormat = "9:16"
): string {
  const { phone, email, website } = buildBusinessContactParts(business);
  const websiteDisplay = website
    .replace(/^https?:\/\//i, "")
    .replace(/\/$/, "");

  const lines: string[] = [
    "══════════════════════════════════════════════════════════",
    "PRIORITY 1 — DO NOT PAINT CONTACT IN THE AI IMAGE",
    "══════════════════════════════════════════════════════════",
    "Mysogi will place the EXACT Step 1 phone, email, and website on the finished flyer.",
    "Your job: marketing headline, subhead, CTA, and visuals ONLY.",
    "",
    "FORBIDDEN in the generated image:",
    "any phone number, email, @ symbol, website, URL, .com, WhatsApp, or footer contact text.",
  ];

  if (phone) {
    lines.push(
      `Do NOT render "${quoteExact(phone)}" or ANY other phone — wrong digits are unacceptable.`
    );
  }
  if (email) {
    lines.push(
      `Do NOT render "${quoteExact(email)}" or ANY other email address.`
    );
  }
  if (websiteDisplay) {
    lines.push(
      `Do NOT render "${quoteExact(websiteDisplay)}" or ANY other website/domain.`
    );
  }

  lines.push(
    "",
    `Reserve the bottom 12–14% of the ${format} frame: calm dark gradient strip with ZERO readable characters.`,
    "No signage, screens, posters, or business cards in the photo may show contact details.",
    "Headline and CTA must stay above this reserved band.",
    "",
    buildStep1ExactContactLockBlock(business),
    "══════════════════════════════════════════════════════════"
  );

  return lines.join("\n");
}

export function buildFlyerContactPromptBlock(
  business: BusinessProfile,
  format: VideoFormat = "9:16"
): string {
  if (shouldForbidContactInAiImage()) {
    return buildAiContactReserveBlock(business, format);
  }
  return buildInImageBottomContactBlock(business, format);
}
