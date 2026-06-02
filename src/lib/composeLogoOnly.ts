import { composeCampaignFlyerSharp } from "./composeFlyerSharp";
import type { ComposedFlyerResult, ComposeCampaignFlyerParams } from "./composeCampaignFlyer";
import { fetchFlyerImageBuffer } from "./flyerImageStore";
import { publishFlyerAssets } from "./flyerPublish";

/** Logo only — small, centered at top via Sharp. No text or contact overlays. */
export async function composeLogoOnlyFlyer(
  params: ComposeCampaignFlyerParams
): Promise<ComposedFlyerResult> {
  const skipLogo = params.skipLogoInCompose ?? false;
  const logoDataUrl = params.logoDataUrl;

  if (skipLogo || !logoDataUrl) {
    const buffer = await fetchFlyerImageBuffer(params.imageUrl);
    return publishFlyerAssets({
      composedBuffer: buffer,
      baseBuffer: buffer,
      width: 1080,
      height: 1920,
      requestOrigin: params.requestOrigin,
      preferCloudinary: false,
    });
  }

  return composeCampaignFlyerSharp({
    ...params,
    skipTextInCompose: true,
    skipLogoInCompose: false,
    footerOnlyInCompose: false,
    preferCloudinary: false,
    logoBesideHeadline: true,
  });
}
