import { buildBusinessContactLine } from "./businessContactCore";
import { getBrandSecondary } from "./brandColors";
import { getFlyerLayout } from "./campaignLayout";
import type { BusinessProfile, VideoFormat } from "./types";

export type CampaignCopy = {
  headline: string;
  tagline: string;
  cta: string;
  location: string;
  contact: string;
};

export type CampaignTextSpec = {
  role: keyof CampaignCopy | "cta-bg";
  text: string;
  topRatio: number;
  fontSize: number;
  fontWeight?: string | number;
  fill?: string;
  ctaButton?: boolean;
  ctaFill?: string;
  maxWidthRatio?: number;
};

export function defaultTagline(business: BusinessProfile): string {
  const industry = (business.industry || "").toLowerCase();
  const name = business.businessName?.trim() || "us";
  if (/crypto|blockchain|web3|exchange|trading/.test(industry)) {
    return "Secure. Fast. Built for you.";
  }
  if (/food|restaurant|catering|bakery/.test(industry)) {
    return "Taste the difference — order today.";
  }
  if (/fashion|beauty|cosmetic/.test(industry)) {
    return "Style that speaks for itself.";
  }
  if (/real estate|property/.test(industry)) {
    return "Your next chapter starts here.";
  }
  if (/health|medical|wellness|clinic/.test(industry)) {
    return "Care you can trust.";
  }
  if (/education|training|course/.test(industry)) {
    return "Learn. Grow. Succeed.";
  }
  return `Quality you can trust from ${name}.`;
}

export function buildCampaignCopy(business: BusinessProfile): CampaignCopy {
  const contact = buildBusinessContactLine(business);
  const name = business.businessName?.trim() || "Your Brand";
  const cta = business.callToAction?.trim() || "Get Started Today";

  return {
    headline: name,
    tagline: business.tagline?.trim() || defaultTagline(business),
    cta,
    location: business.location?.trim() || "",
    contact,
  };
}

export function getCampaignTextSpecs(
  copy: CampaignCopy,
  format: VideoFormat = "9:16",
  business?: BusinessProfile
): CampaignTextSpec[] {
  const layout = getFlyerLayout(format);
  const ctaFill = business ? getBrandSecondary(business) : "#F26522";

  const specs: CampaignTextSpec[] = [
    {
      role: "headline",
      text: copy.headline,
      topRatio: layout.headline.topRatio,
      fontSize: layout.headline.fontSize,
      fontWeight: layout.headline.fontWeight,
      fill: layout.headline.color,
      maxWidthRatio: layout.headline.widthRatio,
    },
  ];

  if (copy.tagline) {
    specs.push({
      role: "tagline",
      text: copy.tagline,
      topRatio: layout.tagline.topRatio,
      fontSize: layout.tagline.fontSize,
      fontWeight: layout.tagline.fontWeight,
      fill: layout.tagline.color,
      maxWidthRatio: layout.tagline.widthRatio,
    });
  }

  if (copy.cta) {
    specs.push({
      role: "cta",
      text: copy.cta,
      topRatio: layout.cta.topRatio,
      fontSize: layout.cta.fontSize,
      fontWeight: layout.cta.fontWeight,
      fill: layout.cta.color,
      ctaButton: true,
      ctaFill,
      maxWidthRatio: layout.cta.widthRatio,
    });
  }

  if (copy.location) {
    specs.push({
      role: "location",
      text: copy.location,
      topRatio: layout.location.topRatio,
      fontSize: layout.location.fontSize,
      fontWeight: layout.location.fontWeight,
      fill: layout.location.color,
      maxWidthRatio: layout.location.widthRatio,
    });
  }

  if (copy.contact) {
    specs.push({
      role: "contact",
      text: copy.contact,
      topRatio: layout.contact.topRatio,
      fontSize: layout.contact.fontSize,
      fontWeight: layout.contact.fontWeight,
      fill: layout.contact.color,
      maxWidthRatio: layout.contact.widthRatio,
    });
  }

  return specs;
}
