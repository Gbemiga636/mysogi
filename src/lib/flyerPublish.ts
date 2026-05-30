import {
  isCloudinaryConfigured,
  uploadFlyerBuffer,
} from "./cloudinary";
import { putFlyerImage, resolveFlyerImageUrl } from "./flyerImageStore";
import type { ComposedFlyerResult } from "./composeCampaignFlyer";

export type PublishFlyerOptions = {
  composedBuffer: Buffer;
  baseBuffer: Buffer;
  width: number;
  height: number;
  requestOrigin?: string;
  preferCloudinary?: boolean;
};

/**
 * Save composed flyer locally (always) and upload to Cloudinary when configured.
 * Primary URL: Cloudinary CDN if upload succeeds, else local API URL.
 */
export async function publishFlyerAssets(
  opts: PublishFlyerOptions
): Promise<ComposedFlyerResult> {
  const [localComposed, localBase] = await Promise.all([
    putFlyerImage(opts.composedBuffer, "image/jpeg"),
    putFlyerImage(opts.baseBuffer, "image/jpeg"),
  ]);

  const localImageUrl = resolveFlyerImageUrl(localComposed.url, opts.requestOrigin);
  const localBaseUrl = resolveFlyerImageUrl(localBase.url, opts.requestOrigin);

  const result: ComposedFlyerResult = {
    publicId: localComposed.id,
    secureUrl: localImageUrl,
    width: opts.width,
    height: opts.height,
    baseImageUrl: localBaseUrl,
    basePublicId: localBase.id,
    localImageUrl,
    localBaseImageUrl: localBaseUrl,
    composeEngine: "sharp",
  };

  if (!opts.preferCloudinary || !isCloudinaryConfigured()) {
    return result;
  }

  try {
    const [cloudComposed, cloudBase] = await Promise.all([
      uploadFlyerBuffer(opts.composedBuffer, "mysogi-ads"),
      uploadFlyerBuffer(opts.baseBuffer, "mysogi-ads-base"),
    ]);

    return {
      ...result,
      publicId: cloudComposed.publicId,
      secureUrl: cloudComposed.secureUrl,
      baseImageUrl: cloudBase.secureUrl,
      basePublicId: cloudBase.publicId,
      composeEngine: "hybrid",
    };
  } catch (e) {
    console.warn("[flyerPublish] Cloudinary upload failed, using local URLs:", e);
    return result;
  }
}
