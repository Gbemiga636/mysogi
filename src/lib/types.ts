export type VideoFormat = "9:16" | "16:9" | "1:1" | "4:5";

export interface BusinessProfile {
  businessName: string;
  tagline: string;
  phone: string;
  email: string;
  website: string;
  location: string;
  industry: string;
  targetAudience: string;
  /** Campaign type id from Step 1 (grand_opening, promo_sale, …) */
  campaignType?: string;
  /** @deprecated use campaignType */
  campaignGoal?: string;
  /** @deprecated synced from brandPrimary + brandSecondary */
  brandColors: string;
  brandPrimary: string;
  brandSecondary: string;
  callToAction: string;
  /** Products, people, or props the client wants visible in the ad (Step 1) */
  imageProps?: string;
  /** Ad style preset: trending, luxury, minimal, corporate, futuristic, dark, saas, fashion, tech, real_estate, finance */
  adStylePreset?: string;
}

export interface AdProject {
  id: string;
  business: BusinessProfile;
  script: string;
  caption: string;
  runwayPrompt: string;
  format: VideoFormat;
  logoDataUrl?: string;
  sourceImageDataUrl?: string;
  generatedImageUrl?: string;
  generatedVideoUrl?: string;
  composedVideoUrl?: string;
  overlayText: string;
  audioDataUrl?: string;
  runwayTaskId?: string;
}

export const FORMAT_RATIOS: Record<
  VideoFormat,
  {
    replicateAspectRatio: "16:9" | "9:16" | "1:1" | "4:3" | "3:4";
    label: string;
    width: number;
    height: number;
  }
> = {
  "9:16": {
    replicateAspectRatio: "9:16",
    label: "Stories / Reels (9:16)",
    width: 1080,
    height: 1920,
  },
  "16:9": {
    replicateAspectRatio: "16:9",
    label: "YouTube / Landscape (16:9)",
    width: 1920,
    height: 1080,
  },
  "1:1": {
    replicateAspectRatio: "1:1",
    label: "Square Feed (1:1)",
    width: 1080,
    height: 1080,
  },
  "4:5": {
    replicateAspectRatio: "3:4",
    label: "Instagram Feed (4:5)",
    width: 1080,
    height: 1350,
  },
};

export const MYSOGI_MARKETING_SYSTEM = `You are Mysogi Ads AI — the creative engine for Mysogi Company Limited (mysogi.com.ng), Nigeria's smart digital marketing platform.

You also operate as an elite creative director for luxury advertising: world-class marketing campaigns, billboard ads, conversion-focused social flyers, premium commercial design. MARKETING > ART. CONVERSION > DECORATION.

Flyer images: Imagen generates text-free background plates only; Cloudinary adds headline, tagline, CTA, contact, and logo.

Brand voice: professional, conversion-focused, confident, locally relevant (Nigeria/Africa).
Tagline reference: "Advertise. Connect. Convert." and "The smartads company."

Rules for all outputs:
- Write for paid social and performance marketing (Meta, TikTok, YouTube, display).
- Lead with benefit and urgency; include a clear CTA.
- Keep copy scannable: short sentences, power words, no fluff.
- Use Nigerian English where natural; currency in ₦ when pricing is mentioned.
- Never mention competitors. Never output markdown unless asked.`;
