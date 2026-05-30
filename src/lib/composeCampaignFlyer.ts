import { getFlyerComposeEngine, getFlyerTextMode } from "./composeEngine";
import { composeLogoOnlyFlyer } from "./composeLogoOnly";
import { composeCampaignFlyerSharp } from "./composeFlyerSharp";
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
  /** Always set — reliable local preview if CDN URL fails */
  localImageUrl?: string;
  localBaseImageUrl?: string;
};

export type ComposeCampaignFlyerParams = {
  imageUrl: string;
  business: BusinessProfile;
  format: VideoFormat;
  copy?: CampaignCopy;
  logoDataUrl?: string;
  skipTextInCompose?: boolean;
  /** Phone, email, website, location via SVG at bottom (headline/CTA stay in AI image). */
  footerOnlyInCompose?: boolean;
  skipLogoInCompose?: boolean;
  logoCorner?: LogoCorner;
  requestOrigin?: string;
  /** Small logo centered at top (not corner). Default when text is in the AI image. */
  logoBesideHeadline?: boolean;
};

/**
 * Finished design: logo-only compose. Hybrid/overlay: SVG text + logo.
 */
export async function composeCampaignFlyer(
  params: ComposeCampaignFlyerParams
): Promise<ComposedFlyerResult> {
  if (getFlyerTextMode() === "ai") {
    return composeLogoOnlyFlyer({
      ...params,
      skipTextInCompose: true,
    });
  }

  const engine = getFlyerComposeEngine();
  if (engine === "cloudinary" && params.footerOnlyInCompose) {
    return composeCampaignFlyerSharp({
      ...params,
      preferCloudinary: true,
    });
  }
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
