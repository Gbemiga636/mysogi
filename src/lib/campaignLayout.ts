import {
  FLYER_ZONE_PERCENT,
  zoneFontSize,
  zoneYOffset,
} from "./flyerZoneSpec";
import type { VideoFormat } from "./types";

export type LogoCorner = "top-left" | "top-right" | "bottom-left" | "bottom-right";

export type TextPlacement = {
  gravity: "north" | "south";
  y: number;
  fontSize: number;
  topRatio: number;
  fontWeight: "bold" | "normal" | 600;
  color: string;
  widthRatio: number;
  textBackground?: string;
  radius?: number;
};

export type LogoPlacement = {
  corner: LogoCorner;
  gravity: "north_west" | "north_east" | "south_west" | "south_east";
  x: number;
  y: number;
  widthRatio: number;
  leftRatio: number;
  topRatio: number;
};

export type FlyerLayout = {
  fontFamily: string;
  headline: TextPlacement;
  tagline: TextPlacement;
  cta: TextPlacement;
  location: TextPlacement;
  contact: TextPlacement;
  logo: LogoPlacement;
};

const LOGO_CORNERS: Record<LogoCorner, Omit<LogoPlacement, "corner" | "widthRatio">> = {
  "top-left": {
    gravity: "north_west",
    x: 36,
    y: 36,
    leftRatio: 0.04,
    topRatio: FLYER_ZONE_PERCENT.logo.top,
  },
  "top-right": {
    gravity: "north_east",
    x: 36,
    y: 36,
    leftRatio: 0.78,
    topRatio: FLYER_ZONE_PERCENT.logo.top,
  },
  "bottom-left": {
    gravity: "south_west",
    x: 36,
    y: 36,
    leftRatio: 0.04,
    topRatio: 0.86,
  },
  "bottom-right": {
    gravity: "south_east",
    x: 36,
    y: 36,
    leftRatio: 0.78,
    topRatio: 0.86,
  },
};

export function getLogoPlacement(
  corner: LogoCorner,
  widthRatio = 0.17
): LogoPlacement {
  return { corner, widthRatio, ...LOGO_CORNERS[corner] };
}

/** Cloudinary text/logo placement — aligned with Imagen zone map */
export function getFlyerLayout(format: VideoFormat): FlyerLayout {
  return {
    /** Poppins — premium sans on Cloudinary */
    fontFamily: "Poppins",
    headline: {
      gravity: "north",
      y: zoneYOffset(format, "headline", "north"),
      fontSize: zoneFontSize(format, "headline"),
      topRatio: FLYER_ZONE_PERCENT.headline.top,
      fontWeight: "bold",
      color: "#FFFFFF",
      widthRatio: 0.88,
      textBackground: "rgb:00000092",
      radius: 18,
    },
    tagline: {
      gravity: "north",
      y: zoneYOffset(format, "tagline", "north"),
      fontSize: zoneFontSize(format, "tagline"),
      topRatio: FLYER_ZONE_PERCENT.tagline.top,
      fontWeight: 600,
      color: "rgba(255,255,255,0.94)",
      widthRatio: 0.86,
      textBackground: "rgb:00000050",
      radius: 14,
    },
    cta: {
      gravity: "south",
      y: zoneYOffset(format, "cta", "south"),
      fontSize: zoneFontSize(format, "cta"),
      topRatio: FLYER_ZONE_PERCENT.cta.top,
      fontWeight: "bold",
      color: "#FFFFFF",
      widthRatio: 0.66,
      radius: 999,
    },
    location: {
      gravity: "south",
      y: zoneYOffset(format, "location", "south"),
      fontSize: zoneFontSize(format, "location"),
      topRatio: FLYER_ZONE_PERCENT.location.top,
      fontWeight: 600,
      color: "#E8EDF4",
      widthRatio: 0.9,
      textBackground: "rgb:00000050",
      radius: 8,
    },
    contact: {
      gravity: "south",
      y: zoneYOffset(format, "contact", "south"),
      fontSize: zoneFontSize(format, "contact"),
      topRatio: FLYER_ZONE_PERCENT.contact.top,
      fontWeight: 600,
      color: "#D1D9E6",
      widthRatio: 0.9,
      textBackground: "rgb:00000050",
      radius: 8,
    },
    logo: getLogoPlacement("top-right", 0.17),
  };
}

export function trimOverlayText(text: string, max = 56): string {
  const t = text.trim();
  if (t.length <= max) return t;
  return `${t.slice(0, max - 1)}…`;
}
