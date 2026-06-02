/**
 * Footer rules for AI prompts (reserve band) and Cloudinary overlay (exact contact).
 */

import { getBrandPrimary, getBrandSecondary } from "./brandColors";
import {
  buildBusinessContactParts,
  buildTypesetTextMasterRules,
} from "./businessContact";
import { shouldForbidContactInAiImage } from "./flyerExactContactMode";
import { buildAiContactReserveBlock, buildStep1ExactContactLockBlock } from "./flyerContactPrompt";
import type { BusinessProfile, VideoFormat } from "./types";

function footerLines(business: BusinessProfile) {
  const { phone, email, website } = buildBusinessContactParts(business);
  const websiteDisplay = website
    .replace(/^https?:\/\//i, "")
    .replace(/\/$/, "");
  return { phone, email, website, websiteDisplay };
}

/** AI image: never paint contact — exact Step 1 values burned in after generation */
export function buildForbiddenContactInImageBlock(
  business: BusinessProfile,
  format: VideoFormat = "9:16"
): string {
  return buildAiContactReserveBlock(business, format);
}

/** Prompt contact rules: reserve band + exact Step 1 lock (default), or in-AI if opted in */
export function buildMandatoryExactContactBlock(
  business: BusinessProfile,
  format: VideoFormat = "9:16"
): string {
  if (shouldForbidContactInAiImage()) {
    return buildAiContactReserveBlock(business, format);
  }
  return buildInImageBottomContactBlock(business, format);
}

/** Contact painted in the AI image — full width at the bottom (no post overlay). */
export function buildInImageBottomContactBlock(
  business: BusinessProfile,
  format: VideoFormat = "9:16"
): string {
  const { phone, email, websiteDisplay } = footerLines(business);
  const primary = getBrandPrimary(business);
  const accent = getBrandSecondary(business);

  const lines: string[] = [
    "══════════════════════════════════════════════════════════",
    "MANDATORY — CONTACT TYPESET IN THE IMAGE (no post overlay)",
    "══════════════════════════════════════════════════════════",
    buildTypesetTextMasterRules(),
    "",
    "Place contact directly on the flyer artwork at the absolute bottom of the frame.",
    "Use the lowest 6–10% of the canvas — flush with the bottom edge, spanning full width.",
    "Layout: one horizontal row — phone on the LEFT, email CENTERED, website on the RIGHT.",
    "High-contrast professional sans-serif on a subtle dark strip or gradient integrated into the photo.",
    "Do NOT leave an empty footer band for later overlays. Do NOT omit any contact field below.",
  ];

  if (phone) lines.push(`PHONE (left): render exactly "${phone}"`);
  if (email) lines.push(`EMAIL (center): render exactly "${email}"`);
  if (websiteDisplay) {
    lines.push(`WEBSITE (right): render exactly "${websiteDisplay}"`);
  }

  lines.push(
    "",
    `Format: ${format}. Brand accents: ${primary}, ${accent}.`,
    "Marketing headline and CTA must sit above this bottom contact row.",
    "══════════════════════════════════════════════════════════"
  );
  return lines.join("\n");
}

/** @deprecated */
export function buildFooterVerificationBookend(
  business: BusinessProfile
): string {
  if (shouldForbidContactInAiImage()) {
    return [
      "FINAL CHECK: the AI image must contain ZERO phone numbers, emails, or URLs.",
      "Only Mysogi may place contact on the finished flyer — using Step 1 values only:",
      buildStep1ExactContactLockBlock(business),
    ].join("\n");
  }
  const { phone, email, websiteDisplay } = footerLines(business);
  const verify: string[] = ["FINAL FOOTER CHECK — TYPESET IN IMAGE, EXACTLY:"];
  if (phone) verify.push(`✓ PHONE: "${phone}"`);
  if (email) verify.push(`✓ EMAIL: "${email}"`);
  if (websiteDisplay) verify.push(`✓ WEBSITE: "${websiteDisplay}"`);
  return verify.join("\n");
}
