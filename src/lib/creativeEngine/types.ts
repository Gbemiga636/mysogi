import type { CampaignCopy } from "../campaignTextLayers";
import type { BusinessProfile, VideoFormat } from "../types";

export type FontRole = "headline" | "subhead" | "cta" | "footer" | "brand";

export type FontPairing = {
  id: string;
  label: string;
  headline: string;
  subhead: string;
  cta: string;
  footer: string;
};

export type LuxuryPalette = {
  id: string;
  label: string;
  primary: string;
  accent: string;
  background: string;
  text: string;
  textMuted: string;
  ctaFill: string;
  ctaText: string;
  glow: string;
  gradient: string;
};

export type TypographyScale = {
  brand: number;
  headline: number;
  subhead: number;
  cta: number;
  footer: number;
  headlineLineHeight: number;
  subheadLineHeight: number;
  stackGap: number;
};

export type LayoutZone = {
  id: string;
  topRatio: number;
  bottomRatio: number;
  align: "center" | "left";
};

export type ComputedLayout = {
  canvasW: number;
  canvasH: number;
  safeMarginX: number;
  safeMarginY: number;
  zones: Record<string, LayoutZone>;
  stack: {
    brandY?: number;
    headlineY: number;
    subheadY?: number;
    ctaY?: number;
    footerY?: number;
  };
  typography: TypographyScale;
  fontPairing: FontPairing;
  palette: LuxuryPalette;
  balanceScore: number;
};

export type QualityIssue = {
  code: string;
  severity: "warn" | "error";
  message: string;
  autoFixed?: boolean;
};

export type QualityReport = {
  passed: boolean;
  score: number;
  issues: QualityIssue[];
};

export type CreativeFlyerContext = {
  business: BusinessProfile;
  copy: CampaignCopy;
  format: VideoFormat;
  userPrompt: string;
  enhancedCreativeDirection: string;
  imagePromptBlock: string;
  layout: ComputedLayout;
  quality: QualityReport;
  exportWidth: number;
  exportHeight: number;
};

export type ExportPresetId =
  | "instagram_story"
  | "instagram_portrait"
  | "instagram_square"
  | "a4_print"
  | "web_banner";
