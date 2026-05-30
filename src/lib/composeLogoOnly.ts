import { composeCampaignFlyerSharp } from "./composeFlyerSharp";
import type { ComposedFlyerResult, ComposeCampaignFlyerParams } from "./composeCampaignFlyer";
import {
  isCloudinaryConfigured,
  overlayLogoBesideHeadline,
} from "./cloudinary";
import { getLogoComposeEngine } from "./composeEngine";
import { fetchFlyerImageBuffer, putFlyerImage, resolveFlyerImageUrl } from "./flyerImageStore";
import { publishFlyerAssets } from "./flyerPublish";

async function fetchImageBuffer(url: string): Promise<Buffer> {
  return fetchFlyerImageBuffer(url);
}

/** Logo only — small, centered at top of flyer. No text overlays. */
export async function composeLogoOnlyFlyer(
  params: ComposeCampaignFlyerParams
): Promise<ComposedFlyerResult> {
  const skipLogo = params.skipLogoInCompose ?? false;
  const logoDataUrl = params.logoDataUrl;

  if (skipLogo || !logoDataUrl) {
    const buffer = await fetchImageBuffer(params.imageUrl);
    return publishFlyerAssets({
      composedBuffer: buffer,
      baseBuffer: buffer,
      width: 1080,
      height: 1920,
      requestOrigin: params.requestOrigin,
      preferCloudinary: false,
    });
  }

  const engine = getLogoComposeEngine();

  if (engine === "cloudinary" && isCloudinaryConfigured()) {
    try {
      const uploaded = await overlayLogoBesideHeadline(
        params.imageUrl,
        logoDataUrl,
        params.format
      );
      const local = await putFlyerImage(await fetchImageBuffer(uploaded.secureUrl));
      const localUrl = resolveFlyerImageUrl(local.url, params.requestOrigin);
      return {
        publicId: uploaded.publicId,
        secureUrl: uploaded.secureUrl,
        width: uploaded.width,
        height: uploaded.height,
        baseImageUrl: params.imageUrl,
        basePublicId: "replicate",
        localImageUrl: localUrl,
        localBaseImageUrl: params.imageUrl,
        composeEngine: "cloudinary",
      };
    } catch (e) {
      console.warn("[composeLogoOnly] Cloudinary logo failed, using Sharp:", e);
    }
  }

  return composeCampaignFlyerSharp({
    ...params,
    skipTextInCompose: true,
    skipLogoInCompose: false,
    preferCloudinary: false,
    logoBesideHeadline: true,
  });
}
