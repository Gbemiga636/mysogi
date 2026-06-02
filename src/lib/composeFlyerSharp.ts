import sharp from "sharp";
import { getBrandPrimary, getBrandSecondary } from "./brandColors";
import { buildCampaignCopy } from "./campaignTextLayers";
import { sanitizeCampaignCopyForFlyer } from "./campaignCopySanitize";
import {
  getFlyerLayout,
  trimOverlayText,
  type LogoCorner,
} from "./campaignLayout";
import {
  getFlyerLogoCenterTopPosition,
  getFlyerLogoSize,
} from "./logoBesideHeadline";
import { analyzeAdAgencyDirection } from "./adAgencyEngine";
import { getAgencyLayoutHints } from "./adAgencyLayout";
import {
  fitFontSizeToWidth,
  layoutFlyerCopyStack,
  roleMinFontSize,
} from "./flyerOverlayTypography";
import { getFlyerTypeTheme } from "./flyerTypeTheme";
import {
  buildClassyCtaSvg,
  buildClassyFooterSvg,
  buildClassyHeadlineSvg,
  buildClassyTaglineSvg,
  buildLuxuryPalette,
  estimateClassyCtaHeight,
  estimateClassyFooterHeight,
  estimateClassyHeadlineHeight,
  estimateClassyTaglineHeight,
  formatClassyText,
} from "./flyerClassyType";
import { appendFlyerFooterSvgComposites } from "./flyerFooterOverlay";
import { enhanceMobileAdBaseImage } from "./mobileAdImageEnhance";
import { fetchFlyerImageBuffer } from "./flyerImageStore";
import { publishFlyerAssets } from "./flyerPublish";
import type { BusinessProfile, VideoFormat } from "./types";
import type { ComposedFlyerResult, ComposeCampaignFlyerParams } from "./composeCampaignFlyer";

function wrapLines(text: string, maxChars: number, maxLines: number): string[] {
  const words = text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let line = "";
  for (const word of words) {
    const next = line ? `${line} ${word}` : word;
    if (next.length > maxChars && line) {
      lines.push(line);
      line = word;
    } else {
      line = next;
    }
    if (lines.length >= maxLines) break;
  }
  if (line && lines.length < maxLines) lines.push(line);
  return lines.length ? lines : [text.slice(0, maxChars)];
}

function logoPosition(
  corner: LogoCorner,
  canvasW: number,
  canvasH: number,
  logoW: number,
  logoH: number
): { left: number; top: number } {
  const pad = Math.round(canvasW * 0.04);
  switch (corner) {
    case "top-left":
      return { left: pad, top: Math.round(canvasH * 0.02) };
    case "top-right":
      return {
        left: canvasW - logoW - pad,
        top: Math.round(canvasH * 0.02),
      };
    case "bottom-left":
      return { left: pad, top: canvasH - logoH - pad };
    case "bottom-right":
      return { left: canvasW - logoW - pad, top: canvasH - logoH - pad };
    default:
      return { left: canvasW - logoW - pad, top: pad };
  }
}

export async function composeCampaignFlyerSharp(
  params: ComposeCampaignFlyerParams & { preferCloudinary?: boolean }
): Promise<ComposedFlyerResult> {
  const baseBuffer = await fetchFlyerImageBuffer(params.imageUrl);
  const meta = await sharp(baseBuffer).metadata();
  const canvasW = meta.width ?? 1080;
  const canvasH = meta.height ?? 1080;

  const skipText = params.skipTextInCompose ?? false;
  const footerOnly = params.footerOnlyInCompose ?? false;
  const contactViaFooter = footerOnly && !skipText;
  let baseJpeg = await sharp(baseBuffer)
    .jpeg({ quality: 92, mozjpeg: true })
    .toBuffer();

  if (skipText || footerOnly) {
    baseJpeg = await enhanceMobileAdBaseImage(baseJpeg);
  }
  const skipLogo = params.skipLogoInCompose ?? false;
  const copy = sanitizeCampaignCopyForFlyer(
    params.copy ?? buildCampaignCopy(params.business),
    params.business
  );
  const layout = getFlyerLayout(params.format);
  const brandAccent = getBrandSecondary(params.business);
  const brandPrimary = getBrandPrimary(params.business);
  const centerX = Math.round(canvasW / 2);
  const typeTheme = getFlyerTypeTheme(params.business);
  const luxuryPalette = buildLuxuryPalette(params.business);

  const composites: sharp.OverlayOptions[] = [];

  if (!skipText) {
    let headlineBlock: {
      lines: string[];
      fontSize: number;
      blockH: number;
      maxW: number;
    } | null = null;
    let taglineBlock: {
      lines: string[];
      fontSize: number;
      blockH: number;
      maxW: number;
    } | null = null;
    let ctaBlock: { text: string; fontSize: number; blockH: number; maxW: number } | null =
      null;
    let locationBlock: {
      lines: string[];
      fontSize: number;
      blockH: number;
      maxW: number;
    } | null = null;
    let contactBlock: {
      lines: string[];
      fontSize: number;
      blockH: number;
      maxW: number;
    } | null = null;

    if (copy.headline) {
      const maxW = Math.round(canvasW * layout.headline.widthRatio);
      const lines = wrapLines(
        trimOverlayText(copy.headline, 48),
        Math.floor(maxW / (layout.headline.fontSize * 0.42)),
        2
      );
      const fontSize = fitFontSizeToWidth(
        lines.map((l) => formatClassyText(l)),
        maxW,
        layout.headline.fontSize,
        roleMinFontSize("headline", canvasW),
        "headline"
      );
      headlineBlock = {
        lines,
        fontSize,
        maxW,
        blockH: estimateClassyHeadlineHeight(lines.length, fontSize),
      };
    }

    if (copy.tagline?.trim()) {
      const maxW = Math.round(canvasW * layout.tagline.widthRatio);
      const lines = wrapLines(
        trimOverlayText(copy.tagline, 56),
        Math.floor(maxW / (layout.tagline.fontSize * 0.4)),
        2
      );
      const fontSize = fitFontSizeToWidth(
        lines.map((l) => formatClassyText(l)),
        maxW,
        layout.tagline.fontSize,
        roleMinFontSize("tagline", canvasW),
        "tagline"
      );
      taglineBlock = {
        lines,
        fontSize,
        maxW,
        blockH: estimateClassyTaglineHeight(lines.length, fontSize),
      };
    }

    if (copy.cta) {
      const ctaText = trimOverlayText(copy.cta, 24);
      const maxW = Math.round(canvasW * layout.cta.widthRatio);
      const fontSize = fitFontSizeToWidth(
        [formatClassyText(ctaText)],
        maxW,
        layout.cta.fontSize,
        roleMinFontSize("cta", canvasW),
        "cta"
      );
      ctaBlock = {
        text: ctaText,
        fontSize,
        maxW,
        blockH: estimateClassyCtaHeight(fontSize),
      };
    }

    if (copy.location && !contactViaFooter) {
      const maxW = Math.round(canvasW * layout.location.widthRatio);
      const lines = wrapLines(trimOverlayText(copy.location, 52), 42, 2);
      const fontSize = fitFontSizeToWidth(
        lines,
        maxW,
        layout.location.fontSize,
        roleMinFontSize("location", canvasW),
        "location"
      );
      locationBlock = {
        lines,
        fontSize,
        maxW,
        blockH: estimateClassyFooterHeight(lines.length, fontSize),
      };
    }

    if (copy.contact && !contactViaFooter) {
      const maxW = Math.round(canvasW * layout.contact.widthRatio);
      const lines = wrapLines(trimOverlayText(copy.contact, 64), 48, 2);
      const fontSize = fitFontSizeToWidth(
        lines,
        maxW,
        layout.contact.fontSize,
        roleMinFontSize("contact", canvasW),
        "contact"
      );
      contactBlock = {
        lines,
        fontSize,
        maxW,
        blockH: estimateClassyFooterHeight(lines.length, fontSize),
      };
    }

    const agencyDirection = analyzeAdAgencyDirection(
      params.business,
      params.format
    );
    const agencyHints = getAgencyLayoutHints(agencyDirection);

    const footerReserveH = contactViaFooter
      ? Math.round(canvasH * 0.1)
      : undefined;

    const positions = layoutFlyerCopyStack(
      canvasH,
      {
        headline: headlineBlock?.blockH ?? 0,
        tagline: taglineBlock?.blockH,
        cta: ctaBlock?.blockH,
        location: contactViaFooter ? undefined : locationBlock?.blockH,
        contact: contactViaFooter ? footerReserveH : contactBlock?.blockH,
      },
      agencyHints
    );

    if (headlineBlock) {
      composites.push({
        input: buildClassyHeadlineSvg({
          canvasW,
          canvasH,
          lines: headlineBlock.lines,
          fontSize: headlineBlock.fontSize,
          centerX,
          topY: positions.headlineY,
          maxWidth: headlineBlock.maxW,
          accentColor: brandAccent || brandPrimary,
          businessName: params.business.businessName?.trim() || "",
          theme: typeTheme,
          palette: luxuryPalette,
        }),
        top: 0,
        left: 0,
      });
    }

    if (taglineBlock && positions.taglineY != null) {
      composites.push({
        input: buildClassyTaglineSvg({
          canvasW,
          canvasH,
          lines: taglineBlock.lines,
          fontSize: taglineBlock.fontSize,
          centerX,
          topY: positions.taglineY,
          maxWidth: taglineBlock.maxW,
          theme: typeTheme,
          palette: luxuryPalette,
        }),
        top: 0,
        left: 0,
      });
    }

    if (ctaBlock && positions.ctaY != null) {
      composites.push({
        input: buildClassyCtaSvg({
          canvasW,
          canvasH,
          text: ctaBlock.text,
          fontSize: ctaBlock.fontSize,
          brandColor: brandAccent || brandPrimary,
          centerX,
          topY: positions.ctaY,
          maxWidth: ctaBlock.maxW,
          theme: typeTheme,
          palette: luxuryPalette,
        }),
        top: 0,
        left: 0,
      });
    }

    if (locationBlock && positions.locationY != null) {
      composites.push({
        input: buildClassyFooterSvg({
          canvasW,
          canvasH,
          lines: locationBlock.lines,
          fontSize: locationBlock.fontSize,
          centerX,
          topY: positions.locationY,
          maxWidth: locationBlock.maxW,
          theme: typeTheme,
          role: "location",
          letterSpacing: "0.04em",
          palette: luxuryPalette,
        }),
        top: 0,
        left: 0,
      });
    }

    if (contactBlock && positions.contactY != null) {
      composites.push({
        input: buildClassyFooterSvg({
          canvasW,
          canvasH,
          lines: contactBlock.lines,
          fontSize: contactBlock.fontSize,
          centerX,
          topY: positions.contactY,
          maxWidth: contactBlock.maxW,
          theme: typeTheme,
          role: "contact",
          letterSpacing: "0.04em",
          palette: luxuryPalette,
        }),
        top: 0,
        left: 0,
      });
    }

    if (contactViaFooter) {
      appendFlyerFooterSvgComposites(composites, {
        canvasW,
        canvasH,
        format: params.format,
        business: params.business,
        copy,
      });
    }
  } else if (footerOnly) {
    const footerOk = appendFlyerFooterSvgComposites(composites, {
      canvasW,
      canvasH,
      format: params.format,
      business: params.business,
      copy,
    });
    if (!footerOk) {
      console.warn(
        "[composeFlyerSharp] Contact footer not applied — add phone, email, or website in Step 1."
      );
    }
  }

  if (!skipLogo && params.logoDataUrl) {
    const logoBuf = parseLogoDataUrl(params.logoDataUrl);
    const centerTop =
      params.logoBesideHeadline ?? (params.skipTextInCompose || footerOnly);
    const logoW = centerTop
      ? getFlyerLogoSize(canvasW)
      : Math.round(canvasW * layout.logo.widthRatio);
    const resized = await sharp(logoBuf)
      .resize({ width: logoW, withoutEnlargement: true })
      .png()
      .toBuffer();
    const logoMeta = await sharp(resized).metadata();
    const lw = logoMeta.width ?? logoW;
    const lh = logoMeta.height ?? logoW;
    const pos = centerTop
      ? getFlyerLogoCenterTopPosition(canvasW, canvasH, lw, lh)
      : logoPosition(
          params.logoCorner ?? layout.logo.corner,
          canvasW,
          canvasH,
          lw,
          lh
        );
    composites.push({ input: resized, left: pos.left, top: pos.top });
  }

  const composed =
    composites.length > 0
      ? await sharp(baseJpeg).composite(composites).jpeg({ quality: 93, mozjpeg: true }).toBuffer()
      : baseJpeg;

  return publishFlyerAssets({
    composedBuffer: composed,
    baseBuffer: baseJpeg,
    width: canvasW,
    height: canvasH,
    requestOrigin: params.requestOrigin,
    preferCloudinary: params.preferCloudinary,
  });
}

function parseLogoDataUrl(dataUrl: string): Buffer {
  const match = dataUrl.match(/^data:([^;]+);base64,([\s\S]+)$/);
  if (!match) throw new Error("Invalid logo data URL");
  if (dataUrl.length > 12_000_000) {
    throw new Error("Logo file is too large. Use a PNG under 2MB in Step 1.");
  }
  return Buffer.from(match[2], "base64");
}
