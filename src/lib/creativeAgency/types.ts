import type { CampaignCopy } from "../campaignTextLayers";
import type { BusinessProfile, VideoFormat } from "../types";

export const CREATIVE_AGENCY_MARKER = "MYSOGI-CREATIVE-AGENCY";

export type CreativeAgencyInput = {
  business: BusinessProfile;
  copy: CampaignCopy;
  format: VideoFormat;
  userPrompt?: string;
  campaignMessage?: string;
  referenceStyleOverride?: string;
};

export type CreativeDirectorOutput = {
  campaignIntent: string;
  audienceInsight: string;
  creativeNorthStar: string;
  industryKey: string;
};

export type MarketingStrategistOutput = {
  objectives: string[];
  valueProposition: string;
  conversionGoal: string;
  psychology: string[];
  trustSignals: string[];
  urgencyNote: string;
};

export type ArtDirectorOutput = {
  visualStyle: string;
  composition: string;
  lighting: string;
  heroSubject: string;
  effects: string[];
  qualityBar: string;
};

export type BrandDesignerOutput = {
  colorStrategy: string;
  typographyDirection: string;
  logoPlacement: string;
  brandVoice: string;
};

export type LayoutPlan = {
  heroSection: string;
  headlineZone: string;
  subheadZone: string;
  benefitsZone: string;
  visualFocus: string;
  trustZone: string;
  ctaZone: string;
  footerZone: string;
};

export type QualityScores = {
  visualImpact: number;
  typography: number;
  marketing: number;
  conversion: number;
  professionalism: number;
  total: number;
};

export type CreativeAgencyBrief = {
  marker: string;
  leadNote: string;
  director: CreativeDirectorOutput;
  strategist: MarketingStrategistOutput;
  artDirector: ArtDirectorOutput;
  brand: BrandDesignerOutput;
  layout: LayoutPlan;
  expandedBrief: string;
  imageSceneParagraph: string;
  scores: QualityScores;
};
