import { assemblePromptWithAdherence } from "../promptAdherence";
import { SENIOR_DESIGNER_MARKER, SENIOR_SCENE_MARKER } from "../seniorDesignerEngine";
import { buildNoContactTextInImageBlock } from "../businessContact";
import {
  buildCtaFooterBalancePromptBlock,
} from "../flyerLayoutBalance";
import {
  buildCampaignTypePromptBlock,
} from "../campaignTypeEngine";
import { buildCampaignMessagePrimaryBlock } from "../campaignMessagePrompt";
import { shouldCompositeFlyerCopyInSharp } from "../composeEngine";
import { isSvgFlyerFooterMode } from "../flyerSvgFooterMode";
import { buildMobileExactCopyLayoutBlock } from "../mobileAdInImageLayout";
import type { CampaignCopy } from "../campaignTextLayers";
import type { BusinessProfile, VideoFormat } from "../types";
import { FORMAT_RATIOS } from "../types";
import { buildColorPromptBlock } from "./colorEngine";
import { formatToExportPreset, resolveExportProfile } from "./exportProfiles";
import { buildLayoutPromptBlock, computeSmartLayout } from "./layoutEngine";
import { buildPromptEnhancementBlock } from "./promptEnhancer";
import { runQualityGate } from "./qualityGate";
import {
  buildReferenceFlyerPromptBlock,
  isReferenceFlyerStyleEnabled,
  resolveReferenceFlyerStyle,
  type ReferenceFlyerStyleId,
} from "../referenceFlyerStyle";
import type { CreativeFlyerContext } from "./types";
import { buildTypographyPromptBlock } from "./typographyEngine";
import { buildVisualSystemPromptBlock } from "./visualSystem";

export const ELITE_CREATIVE_ENGINE_MARKER = "ELITE-CREATIVE-ENGINE";

export function isEliteCreativeEngineEnabled(): boolean {
  return process.env.ELITE_CREATIVE_ENGINE?.trim().toLowerCase() !== "false";
}

/**
 * Full creative director context — typography, layout, color, quality, export.
 */
export function buildCreativeFlyerContext(
  business: BusinessProfile,
  copy: CampaignCopy,
  format: VideoFormat,
  userPrompt = "",
  referenceStyleOverride?: ReferenceFlyerStyleId,
  campaignMessage = ""
): CreativeFlyerContext {
  const layout = computeSmartLayout(business, copy, format);
  const { copy: gatedCopy, report } = runQualityGate(business, copy, layout);
  const exportPreset = resolveExportProfile(formatToExportPreset(format));

  const enhancedCreativeDirection = buildPromptEnhancementBlock(
    business,
    userPrompt,
    format
  );

  const imagePromptBlock = assembleEliteImagePrompt(
    business,
    gatedCopy,
    format,
    userPrompt,
    layout,
    referenceStyleOverride,
    campaignMessage
  );

  return {
    business,
    copy: gatedCopy,
    format,
    userPrompt,
    enhancedCreativeDirection,
    imagePromptBlock,
    layout,
    quality: report,
    exportWidth: exportPreset.width,
    exportHeight: exportPreset.height,
  };
}

export function assembleEliteImagePrompt(
  business: BusinessProfile,
  copy: CampaignCopy,
  format: VideoFormat,
  userPrompt: string,
  layout = computeSmartLayout(business, copy, format),
  referenceStyleOverride?: ReferenceFlyerStyleId,
  campaignMessage = ""
): string {
  if (shouldCompositeFlyerCopyInSharp()) {
    return assembleHybridScenePrompt(business, format, userPrompt, layout);
  }

  const svgFooter = isSvgFlyerFooterMode();
  const copyBlock = buildMobileExactCopyLayoutBlock(business, copy, {
    svgFooter,
    format,
  });

  const referenceBlock = isReferenceFlyerStyleEnabled()
    ? buildReferenceFlyerPromptBlock(
        business,
        copy,
        format,
        referenceStyleOverride
      )
    : "";

  return assemblePromptWithAdherence([
    {
      priority: 100,
      id: "marker",
      content: `${ELITE_CREATIVE_ENGINE_MARKER} ${SENIOR_DESIGNER_MARKER} Elite agency flyer — Behance/Dribbble quality, client reference-matched composition.`,
    },
    ...(referenceBlock
      ? [{ priority: 100, id: "reference", content: referenceBlock.slice(0, 3200) }]
      : []),
    {
      priority: 100,
      id: "enhanced",
      content: buildPromptEnhancementBlock(business, userPrompt, format),
    },
    {
      priority: 100,
      id: "campaign-message",
      content: buildCampaignMessagePrimaryBlock(campaignMessage, business),
    },
    {
      priority: 100,
      id: "campaign-type",
      content: buildCampaignTypePromptBlock(business, userPrompt, campaignMessage),
    },
    {
      priority: 100,
      id: "layout-balance",
      content: buildCtaFooterBalancePromptBlock(business, format, copy),
    },
    ...(svgFooter
      ? [
          {
            priority: 100,
            id: "no-contact",
            content: buildNoContactTextInImageBlock(business, format, copy),
          },
        ]
      : []),
    { priority: 99, id: "copy", content: copyBlock },
    { priority: 98, id: "typography", content: buildTypographyPromptBlock(business, copy, format) },
    { priority: 97, id: "layout", content: buildLayoutPromptBlock(layout) },
    { priority: 96, id: "color", content: buildColorPromptBlock(business) },
    { priority: 95, id: "visual", content: buildVisualSystemPromptBlock() },
    {
      priority: 94,
      id: "format",
      content: `Output ${FORMAT_RATIOS[format].label} (${FORMAT_RATIOS[format].width}×${FORMAT_RATIOS[format].height}). Retina-sharp typeset layers. Business name as hero headline — exact spelling.`,
    },
    {
      priority: 100,
      id: "final",
      content: isReferenceFlyerStyleEnabled()
        ? `FINAL: Match client reference style ${resolveReferenceFlyerStyle(business, referenceStyleOverride)} — dense premium UI ad, 3D hero, glass panels, glowing CTA, integrated typography, NOT a template.`
        : "FINAL: World-class marketing flyer — intelligent spacing, premium hierarchy, glowing CTA, geometric accents, NOT a template.",
    },
  ]);
}

/** Text-free cinematic scene — copy is composited via Sharp after generation. */
export function assembleHybridScenePrompt(
  business: BusinessProfile,
  format: VideoFormat,
  userPrompt: string,
  layout = computeSmartLayout(
    business,
    {
      headline: business.businessName || "",
      tagline: business.tagline || "",
      cta: business.callToAction || "",
      location: business.location || "",
      contact: "",
    },
    format
  )
): string {
  const name = business.businessName?.trim() || "the brand";
  const industry = business.industry?.trim() || "local business";
  const props = business.imageProps?.trim();
  const audience = business.targetAudience?.trim();

  return assemblePromptWithAdherence([
    {
      priority: 100,
      id: "marker",
      content: `${SENIOR_SCENE_MARKER} ${ELITE_CREATIVE_ENGINE_MARKER} Premium advertising key visual for ${name} — ${industry}. ZERO readable text in image.`,
    },
    {
      priority: 100,
      id: "enhanced",
      content: buildPromptEnhancementBlock(business, userPrompt, format),
    },
    {
      priority: 99,
      id: "business",
      content: [
        `Business: ${name}. Industry: ${industry}.`,
        business.tagline?.trim() ? `Brand tagline mood: ${business.tagline.trim()}.` : "",
        audience ? `Target audience: ${audience}.` : "",
        business.location?.trim()
          ? `Setting inspired by ${business.location.trim()} — visual mood only, no typeset location text.`
          : "",
        props ? `Mandatory hero elements in scene: ${props}.` : "",
      ]
        .filter(Boolean)
        .join(" "),
    },
    {
      priority: 98,
      id: "no-text",
      content: buildNoContactTextInImageBlock(business, format),
    },
    {
      priority: 97,
      id: "layout-balance",
      content: buildCtaFooterBalancePromptBlock(business, format),
    },
    {
      priority: 96,
      id: "overlay-zones",
      content: [
        "COMPOSITION FOR TYPOGRAPHY OVERLAY (do not draw any letters):",
        "Top 35%: calm negative space — soft gradient, bokeh sky, or frosted dark band for headline overlay.",
        "Center-lower: hero subject — people, product, or environment matching the industry.",
        `Bottom ${Math.round((1 - layout.zones.footer.topRatio) * 100)}%: empty calm strip reserved for contact footer overlay — no busy texture, no CTA.`,
        `Layout balance score target: ${Math.round(layout.balanceScore * 100)}/100.`,
      ].join(" "),
    },
    { priority: 95, id: "color", content: buildColorPromptBlock(business) },
    { priority: 95, id: "visual", content: buildVisualSystemPromptBlock() },
    {
      priority: 94,
      id: "format",
      content: `Output ${FORMAT_RATIOS[format].label} (${FORMAT_RATIOS[format].width}×${FORMAT_RATIOS[format].height}). Cinematic commercial photography, luxury grade, NOT a template.`,
    },
    {
      priority: 100,
      id: "final",
      content:
        "FINAL: World-class text-free campaign photograph — exact business industry visible, premium lighting, depth, hero subject — all copy added after as SVG overlay.",
    },
  ]);
}

export {
  buildColorPromptBlock,
  buildLayoutPromptBlock,
  buildTypographyPromptBlock,
  buildVisualSystemPromptBlock,
  computeSmartLayout,
  runQualityGate,
};
