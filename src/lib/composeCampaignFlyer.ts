import { getFlyerComposeEngine, getFlyerTextMode } from "./composeEngine";
import { composeLogoOnlyFlyer } from "./composeLogoOnly";
import { composeCampaignFlyerSharp } from "./composeFlyerSharp";
import {
  shouldUseFooterOverlayCompose,
  isCloudinaryFooterOverlayEnabled,
} from "./flyerCloudinaryFooterMode";
import { isCloudinaryConfigured } from "./cloudinary";
import type { CampaignCopy } from "./campaignTextLayers";
import type { LogoCorner } from "./campaignLayout";
import type { BusinessProfile, VideoFormat } from "./types";

export type ComposedFlyerResult = {
  publicId: string;
  secureUrl: string;
  width: number;
  height: number;
  baseImageUrl: string;
  basePublicId: string;
  composeEngine?: "sharp" | "cloudinary" | "hybrid";
  localImageUrl?: string;
  localBaseImageUrl?: string;
};

export type ComposeCampaignFlyerParams = {
  imageUrl: string;
  business: BusinessProfile;
  format: VideoFormat;
  copy?: CampaignCopy;
  logoDataUrl?: string;
  /** Skip Sharp/Cloudinary headline — copy is in the AI image */
  skipTextInCompose?: boolean;
  /** Add contact footer only (Cloudinary horizontal bar or Sharp SVG) */
  footerOnlyInCompose?: boolean;
  skipLogoInCompose?: boolean;
  logoCorner?: LogoCorner;
  requestOrigin?: string;
  logoBesideHeadline?: boolean;
};

/**
 * Default: contact typeset in the AI image at the bottom; Sharp adds a small centered logo on top.
 * Set FLYER_CLOUDINARY_FOOTER=true for optional Cloudinary footer overlay.
 */
export async function composeCampaignFlyer(
  params: ComposeCampaignFlyerParams
): Promise<ComposedFlyerResult> {
  const footerOverlay =
    params.footerOnlyInCompose ?? shouldUseFooterOverlayCompose();

  if (footerOverlay) {
    const composeParams = {
      ...params,
      skipTextInCompose: true,
      footerOnlyInCompose: true,
    };

    if (isCloudinaryFooterOverlayEnabled() && isCloudinaryConfigured()) {
      const { composeCloudinaryFooterOnly } = await import(
        "./composeCloudinaryFooterOnly"
      );
      return composeCloudinaryFooterOnly(composeParams);
    }

    return composeCampaignFlyerSharp({
      ...composeParams,
      /** Upload composed buffer (with footer) to CDN — never skip footer for hybrid URL */
      preferCloudinary: isCloudinaryConfigured(),
    });
  }

  if (getFlyerTextMode() === "ai" || params.skipTextInCompose) {
    return composeLogoOnlyFlyer({
      ...params,
      skipTextInCompose: true,
      footerOnlyInCompose: false,
      logoBesideHeadline: true,
    });
  }

  const engine = getFlyerComposeEngine();
  if (engine === "cloudinary") {
    const { composeCampaignFlyerCloudinary } = await import(
      "./composeCampaignFlyerCloudinary"
    );
    return composeCampaignFlyerCloudinary(params);
  }
  return composeCampaignFlyerSharp({
    ...params,
    preferCloudinary: engine === "hybrid",
  });
}
