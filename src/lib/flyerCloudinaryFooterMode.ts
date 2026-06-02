import { isCloudinaryConfigured } from "./cloudinaryEnv";

export {
  shouldPaintContactInAiImage,
  shouldUseExactContactFooterCompose,
  shouldForbidContactInAiImage,
  businessHasExactContactFields,
  shouldUseFooterOverlayCompose,
} from "./flyerExactContactMode";

export { isSvgFlyerFooterMode } from "./flyerSvgFooterMode";

/** Cloudinary text footer — opt-in only. Default is Sharp SVG. */
export function isCloudinaryFooterOverlayEnabled(): boolean {
  const flag = process.env.FLYER_CLOUDINARY_FOOTER?.trim().toLowerCase();
  if (flag !== "true" && flag !== "1" && flag !== "on") return false;
  return isCloudinaryConfigured();
}
