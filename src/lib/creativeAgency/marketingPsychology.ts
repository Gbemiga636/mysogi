import { detectCampaignType } from "../campaignTypeEngine";
import type { BusinessProfile } from "../types";

export type MarketingStrategistOutput = {
  objectives: string[];
  valueProposition: string;
  conversionGoal: string;
  psychology: string[];
  trustSignals: string[];
  urgencyNote: string;
};

export function marketingStrategist(
  business: BusinessProfile,
  userPrompt = "",
  campaignMessage = ""
): MarketingStrategistOutput {
  const profile = detectCampaignType(business, userPrompt, campaignMessage);
  const name = business.businessName?.trim() || "the brand";
  const audience = business.targetAudience?.trim() || "local customers ready to buy";

  const objectives = [
    "Stop the scroll in under 0.8 seconds",
    "Build instant trust for " + name,
    "Make the offer/value obvious without reading twice",
    "Drive one clear conversion action",
  ];

  if (profile.id === "general_brand") {
    objectives.push("Increase brand recall and perceived quality");
  } else if (profile.id === "promo_sale" || profile.id === "limited_time") {
    objectives.push("Trigger urgency without looking spammy");
  } else if (profile.id === "grand_opening") {
    objectives.push("Celebrate newness and welcome first visits");
  }

  const psychology = [
    "Attention hierarchy: logo → headline → hero visual → proof → CTA",
    "Eye-tracking path: Z-pattern or F-pattern for dense UI ads; centered stack for editorial",
    "Contrast: headline 3× brighter than background scrim",
    "CTA isolation: glowing pill with 24px+ clear space around it",
    "Cognitive load: max 6 distinct text zones, no floating random badges",
  ];

  if (profile.urgency === "high") {
    psychology.push("Scarcity: limited time / bonus language near CTA — not in headline");
  }

  const trustSignals = [
    "Social proof stats bar when space allows (users, countries, security)",
    "Micro trust labels: Secure, Fast, Verified — icon + short label only",
    "Professional finish cues: glass panels, aligned grid, no clipart",
  ];

  return {
    objectives,
    valueProposition:
      business.tagline?.trim() ||
      campaignMessage.trim().slice(0, 120) ||
      profile.taglineAngle,
    conversionGoal: business.callToAction?.trim() || profile.ctaSuggestions[0],
    psychology,
    trustSignals,
    urgencyNote:
      profile.urgency === "high"
        ? "High urgency campaign — bold accent on CTA and offer card, calm premium elsewhere"
        : "Premium calm urgency — elegant conversion focus, no shouty discount clutter unless promo campaign",
  };
}
