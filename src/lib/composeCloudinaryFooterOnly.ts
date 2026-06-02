/**
 * Logo + horizontal contact footer via Cloudinary (phone · email · website).
 * AI image must have no contact text — marketing copy only.
 */

import { buildBusinessContactParts } from "./businessContact";
import { sanitizeCampaignCopyForFlyer } from "./campaignCopySanitize";
import { buildCampaignCopy } from "./campaignTextLayers";
import { getFlyerLayout, trimOverlayText } from "./campaignLayout";
import { uploadFromDataUrl, uploadFromUrl } from "./cloudinary";
import { fetchFlyerImageBuffer } from "./flyerImageStore";
import { publishFlyerAssets } from "./flyerPublish";
import { waitForImageUrl } from "./waitForImageUrl";
import type {
  ComposedFlyerResult,
  ComposeCampaignFlyerParams,
} from "./composeCampaignFlyer";
import type { BusinessProfile } from "./types";
import { FORMAT_RATIOS } from "./types";
import { v2 as cloudinary } from "cloudinary";

function footerTextLayer(opts: {
  text: string;
  fontFamily: string;
  fontSize: number;
  fontWeight: string;
  color: string;
  y: number;
  x: number;
  width: number;
}): Record<string, unknown> {
  const text = trimOverlayText(opts.text, 48);
  if (!text) return {};
  return {
    overlay: {
      font_family: opts.fontFamily,
      font_size: opts.fontSize,
      font_weight: opts.fontWeight,
      text,
    },
    color: opts.color,
    gravity: "south",
    y: opts.y,
    x: opts.x,
    width: opts.width,
    crop: "fit",
  };
}

/**
 * Full-width dark band behind footer contact row.
 * Must use a text overlay — image overlays require public_id.
 */
function buildFooterBarLayer(
  canvasW: number,
  barH: number
): Record<string, unknown> {
  return {
    overlay: {
      font_family: "Arial",
      font_size: Math.max(12, Math.min(64, Math.round(barH * 0.5))),
      font_weight: "normal",
      text: "\u00a0",
    },
    width: canvasW,
    height: barH,
    crop: "scale",
    gravity: "south",
    y: 0,
    background: "rgb:000000",
    opacity: 72,
  };
}

/** Horizontal row at bottom: phone (left), email (center), website (right) */
function buildHorizontalFooterTransforms(
  business: BusinessProfile,
  canvasW: number,
  canvasH: number,
  layout: ReturnType<typeof getFlyerLayout>
): Record<string, unknown>[] {
  const { phone, email, website } = buildBusinessContactParts(business);
  const websiteDisplay = website
    .replace(/^https?:\/\//i, "")
    .replace(/\/$/, "");

  const slots: { text: string; x: number }[] = [];
  if (phone) slots.push({ text: phone, x: -Math.round(canvasW * 0.3) });
  if (email) slots.push({ text: email, x: 0 });
  if (websiteDisplay) {
    slots.push({ text: websiteDisplay, x: Math.round(canvasW * 0.3) });
  }

  if (!slots.length) return [];

  const out: Record<string, unknown>[] = [];
  const barH = Math.round(canvasH * 0.1);
  out.push(buildFooterBarLayer(canvasW, barH));

  const fontSize = Math.max(16, Math.round(layout.contact.fontSize * 0.92));
  const y = Math.max(22, layout.contact.y);
  const itemWidth = Math.round(canvasW * 0.28);

  for (const slot of slots) {
    const layer = footerTextLayer({
      text: slot.text,
      fontFamily: layout.fontFamily,
      fontSize,
      fontWeight: "600",
      color: layout.contact.color,
      y,
      x: slot.x,
      width: itemWidth,
    });
    if (Object.keys(layer).length > 0) out.push(layer);
  }

  return out;
}

export async function composeCloudinaryFooterOnly(
  params: ComposeCampaignFlyerParams
): Promise<ComposedFlyerResult> {
  const skipLogo = params.skipLogoInCompose ?? false;

  const logoPromise =
    params.logoDataUrl && !skipLogo
      ? uploadFromDataUrl(params.logoDataUrl, "mysogi-logos")
      : Promise.resolve(null);

  const [base, logoUpload] = await Promise.all([
    uploadFromUrl(params.imageUrl, "mysogi-ads"),
    logoPromise,
  ]);

  const layout = getFlyerLayout(params.format);
  const canvasW = base.width || FORMAT_RATIOS[params.format].width;
  const canvasH = base.height || FORMAT_RATIOS[params.format].height;
  const transformations: Record<string, unknown>[] = [];

  transformations.push(
    ...buildHorizontalFooterTransforms(
      params.business,
      canvasW,
      canvasH,
      layout
    )
  );

  if (logoUpload?.publicId && params.logoDataUrl && !skipLogo) {
    const logoCorner = params.logoCorner ?? layout.logo.corner;
    const logoLayout = { ...layout.logo, corner: logoCorner };
    const overlayId = logoUpload.publicId.includes("/")
      ? logoUpload.publicId.replace(/\//g, ":")
      : logoUpload.publicId;
    const logoWidth = Math.round(canvasW * logoLayout.widthRatio);

    transformations.push({
      overlay: overlayId,
      width: logoWidth,
      crop: "scale",
      gravity: logoLayout.gravity,
      x: logoLayout.x,
      y: logoLayout.y,
      opacity: 100,
    });
  }

  let composedUrl = base.secureUrl;
  if (transformations.length > 0) {
    composedUrl = cloudinary.url(base.publicId, {
      transformation: transformations,
      secure: true,
      format: "jpg",
      quality: "auto:good",
    });
    await waitForImageUrl(composedUrl, { maxWaitMs: 120_000 });
  }

  const composedBuffer = await fetchFlyerImageBuffer(composedUrl);
  const baseBuffer = await fetchFlyerImageBuffer(base.secureUrl);

  return publishFlyerAssets({
    composedBuffer,
    baseBuffer,
    width: canvasW,
    height: canvasH,
    requestOrigin: params.requestOrigin,
    preferCloudinary: true,
  });
}
