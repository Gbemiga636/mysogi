import { cloudinaryColor, getBrandSecondary } from "./brandColors";
import { buildCampaignCopy } from "./campaignTextLayers";
import {
  getFlyerLayout,
  trimOverlayText,
} from "./campaignLayout";
import {
  uploadFromDataUrl,
  uploadFromUrl,
} from "./cloudinary";
import { waitForImageUrl } from "./waitForImageUrl";
import { sanitizeCampaignCopyForFlyer } from "./campaignCopySanitize";
import type { ComposedFlyerResult, ComposeCampaignFlyerParams } from "./composeCampaignFlyer";
import { FORMAT_RATIOS } from "./types";
import { v2 as cloudinary } from "cloudinary";

type TextLayerOpts = {
  text: string;
  fontFamily: string;
  fontSize: number;
  fontWeight: string;
  color: string;
  gravity: "north" | "south";
  y: number;
  width: number;
  background?: string;
  radius?: number;
};

function textLayer(opts: TextLayerOpts): Record<string, unknown> {
  const maxLen = opts.background ? 36 : 42;
  const layer: Record<string, unknown> = {
    overlay: {
      font_family: opts.fontFamily,
      font_size: opts.fontSize,
      font_weight: opts.fontWeight,
      text: trimOverlayText(opts.text, maxLen),
    },
    color: opts.color,
    gravity: opts.gravity,
    y: opts.y,
    width: opts.width,
    crop: "fit",
  };
  if (opts.background) {
    layer.background = opts.background;
    layer.radius = opts.radius ?? 24;
  }
  return layer;
}

export async function composeCampaignFlyerCloudinary(
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

  const skipText = params.skipTextInCompose ?? false;
  const footerOnly = params.footerOnlyInCompose ?? false;
  const ctaFill = cloudinaryColor(getBrandSecondary(params.business));

  const copy = sanitizeCampaignCopyForFlyer(
    params.copy ?? buildCampaignCopy(params.business),
    params.business
  );

  if (skipText && !params.logoDataUrl && !footerOnly) {
    return {
      publicId: base.publicId,
      secureUrl: base.secureUrl,
      width: base.width,
      height: base.height,
      baseImageUrl: base.secureUrl,
      basePublicId: base.publicId,
      composeEngine: "cloudinary",
    };
  }
  const layout = getFlyerLayout(params.format);
  const canvasW = base.width || FORMAT_RATIOS[params.format].width;
  const transformations: Record<string, unknown>[] = [];

  if (!skipText && copy.headline) {
    transformations.push(
      textLayer({
        text: copy.headline.toUpperCase(),
        fontFamily: layout.fontFamily,
        fontSize: layout.headline.fontSize,
        fontWeight: "bold",
        color: layout.headline.color,
        gravity: layout.headline.gravity,
        y: layout.headline.y,
        width: Math.round(canvasW * layout.headline.widthRatio),
        background: layout.headline.textBackground,
        radius: layout.headline.radius,
      })
    );
  }

  if (!skipText && copy.tagline) {
    transformations.push(
      textLayer({
        text: copy.tagline,
        fontFamily: layout.fontFamily,
        fontSize: layout.tagline.fontSize,
        fontWeight: "600",
        color: layout.tagline.color,
        gravity: layout.tagline.gravity,
        y: layout.tagline.y,
        width: Math.round(canvasW * layout.tagline.widthRatio),
        background: layout.tagline.textBackground,
        radius: layout.tagline.radius,
      })
    );
  }

  if (!skipText && copy.cta) {
    transformations.push(
      textLayer({
        text: copy.cta.toUpperCase(),
        fontFamily: layout.fontFamily,
        fontSize: layout.cta.fontSize,
        fontWeight: "bold",
        color: layout.cta.color,
        gravity: layout.cta.gravity,
        y: layout.cta.y,
        width: Math.round(canvasW * layout.cta.widthRatio),
        background: ctaFill,
        radius: layout.cta.radius ?? 28,
      })
    );
  }

  if (!skipText && copy.location) {
    transformations.push(
      textLayer({
        text: copy.location,
        fontFamily: layout.fontFamily,
        fontSize: layout.location.fontSize,
        fontWeight: "600",
        color: layout.location.color,
        gravity: layout.location.gravity,
        y: layout.location.y,
        width: Math.round(canvasW * layout.location.widthRatio),
        background: layout.location.textBackground,
        radius: layout.location.radius,
      })
    );
  }

  if (!skipText && copy.contact) {
    transformations.push(
      textLayer({
        text: copy.contact,
        fontFamily: layout.fontFamily,
        fontSize: layout.contact.fontSize,
        fontWeight: "normal",
        color: layout.contact.color,
        gravity: layout.contact.gravity,
        y: layout.contact.y,
        width: Math.round(canvasW * layout.contact.widthRatio),
        background: layout.contact.textBackground,
        radius: layout.contact.radius,
      })
    );
  }

  if (logoUpload && params.logoDataUrl && !skipLogo) {
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

  if (transformations.length === 0) {
    return {
      publicId: base.publicId,
      secureUrl: base.secureUrl,
      width: base.width,
      height: base.height,
      baseImageUrl: base.secureUrl,
      basePublicId: base.publicId,
      composeEngine: "cloudinary",
    };
  }

  const composedUrl = cloudinary.url(base.publicId, {
    transformation: transformations,
    secure: true,
    format: "jpg",
    quality: "auto:good",
  });

  await waitForImageUrl(composedUrl, { maxWaitMs: 120_000 });

  return {
    publicId: base.publicId,
    secureUrl: composedUrl,
    width: base.width,
    height: base.height,
    baseImageUrl: base.secureUrl,
    basePublicId: base.publicId,
    composeEngine: "cloudinary",
  };
}
