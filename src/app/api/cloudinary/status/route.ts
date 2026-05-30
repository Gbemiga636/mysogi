import { NextResponse } from "next/server";
import { getFlyerComposeEngine, getFlyerTextMode, getLogoComposeEngine } from "@/lib/composeEngine";
import { flyerImageCount } from "@/lib/flyerImageStore";
import {
  ensureUnsignedUploadPreset,
  testCloudinaryConnection,
} from "@/lib/cloudinary";

export async function GET() {
  const textMode = getFlyerTextMode();
  const composeEngine = getFlyerComposeEngine();
  const logoCompose = getLogoComposeEngine();

  const cacheCount = await flyerImageCount();

  const base = {
    textMode,
    composeEngine,
    logoCompose,
    flyerPipeline:
      textMode === "ai"
        ? "imagen-exact-text + logo-only"
        : textMode === "hybrid"
          ? "cinematic-plate + pixel-perfect-text + logo"
          : "zero-text + overlay compose",
    localFlyerCacheCount: cacheCount,
  };

  if (textMode === "hybrid") {
    return NextResponse.json({
      ok: true,
      message:
        "Hybrid (default): rich text-free Imagen scene + Sharp/Cloudinary exact copy overlay + logo.",
      ...base,
    });
  }

  if (textMode === "ai") {
    if (logoCompose === "cloudinary") {
      try {
        await ensureUnsignedUploadPreset();
      } catch {
        /* fallback */
      }
      const result = await testCloudinaryConnection();
      return NextResponse.json({
        ...base,
        ...result,
        ok: result.ok,
        message: result.ok
          ? "AI renders all flyer text; Cloudinary adds your logo (top center)."
          : "AI text works; Cloudinary logo failed — check CLOUDINARY_URL. Logo falls back to Sharp.",
      });
    }
    return NextResponse.json({
      ok: true,
      message:
        "AI renders all flyer text; Sharp adds logo locally. Set CLOUDINARY_URL for Cloudinary logo.",
      ...base,
    });
  }

  const cloudinaryOn = composeEngine !== "sharp";

  const legacyBase = {
    ...base,
    cloudinaryConfigured: cloudinaryOn,
    flyerCompose:
      composeEngine === "hybrid"
        ? "sharp-compose + cloudinary-cdn"
        : composeEngine === "sharp"
          ? "local-sharp"
          : "cloudinary",
  };

  if (composeEngine === "sharp") {
    return NextResponse.json({
      ok: true,
      message:
        "Overlay mode: Sharp composes text. Set FLYER_TEXT_MODE=ai for AI-rendered copy.",
      ...legacyBase,
    });
  }

  if (composeEngine === "hybrid" && textMode === "overlay") {
    try {
      await ensureUnsignedUploadPreset();
    } catch {
      /* signed fallback */
    }
    const result = await testCloudinaryConnection();
    return NextResponse.json({
      ...base,
      ...result,
      message: result.ok
        ? "Hybrid: Sharp composes text/logo, Cloudinary hosts CDN URLs."
        : "Sharp works locally; Cloudinary upload failed — check CLOUDINARY_URL.",
    });
  }

  try {
    await ensureUnsignedUploadPreset();
  } catch {
    /* signed fallback */
  }
  const result = await testCloudinaryConnection();
  if (!result.ok) {
    return NextResponse.json({ ...base, ...result }, { status: 503 });
  }
  return NextResponse.json({ ...base, ...result });
}
