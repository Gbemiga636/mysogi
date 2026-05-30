import { buildCampaignCopy } from "./campaignTextLayers";
import {
  getCampaignTypeId,
  getCampaignTypeInput,
  getCampaignTypeLabel,
} from "./campaignProfile";
import type { BusinessProfile } from "./types";

export type CampaignTypeId =
  | "general_brand"
  | "grand_opening"
  | "promo_sale"
  | "seasonal_offer"
  | "product_launch"
  | "event"
  | "limited_time";

export type CampaignTypeProfile = {
  id: CampaignTypeId;
  label: string;
  taglineAngle: string;
  ctaSuggestions: string[];
  visualMotifs: string;
  promoBadge?: string;
  urgency: "low" | "medium" | "high";
};

const PROFILES: Record<CampaignTypeId, CampaignTypeProfile> = {
  general_brand: {
    id: "general_brand",
    label: "Brand awareness",
    taglineAngle: "Trust, quality, and why this brand wins",
    ctaSuggestions: ["Get Started Today", "Learn More", "Visit Us", "Contact Us"],
    visualMotifs:
      "Premium brand hero, confident lighting, subtle logo energy, no discount clutter",
    urgency: "low",
  },
  grand_opening: {
    id: "grand_opening",
    label: "Grand opening / Now open",
    taglineAngle: "Celebration, welcome, newly opened, ribbon-cutting energy",
    ctaSuggestions: ["Visit Us Today", "Grand Opening", "Now Open", "Come Celebrate"],
    visualMotifs:
      "Grand opening mood: warm celebration, ribbon accents, festive lighting, welcome atmosphere",
    promoBadge: "NOW OPEN",
    urgency: "high",
  },
  promo_sale: {
    id: "promo_sale",
    label: "Promo / sale / offer",
    taglineAngle: "Limited offer, discount, deal, savings, act now",
    ctaSuggestions: ["Shop Now", "Grab the Deal", "Claim Offer", "Order Today"],
    visualMotifs:
      "Promo sale ad: glowing offer badge, discount ribbon, urgency accent color, premium deal composition",
    promoBadge: "SPECIAL OFFER",
    urgency: "high",
  },
  seasonal_offer: {
    id: "seasonal_offer",
    label: "Seasonal / holiday",
    taglineAngle: "Seasonal relevance, holiday spirit, timely offer",
    ctaSuggestions: ["Celebrate With Us", "Seasonal Special", "Book Now", "Shop Season"],
    visualMotifs:
      "Seasonal campaign: tasteful holiday/season cues, festive grade, timely offer badge",
    promoBadge: "SEASON SPECIAL",
    urgency: "medium",
  },
  product_launch: {
    id: "product_launch",
    label: "Product / service launch",
    taglineAngle: "New arrival, introducing, just launched, innovation",
    ctaSuggestions: ["Discover Now", "Try It Today", "Get Early Access", "Explore New"],
    visualMotifs:
      "Launch campaign: hero product reveal, spotlight, fresh modern energy, NEW accent badge",
    promoBadge: "NEW",
    urgency: "medium",
  },
  event: {
    id: "event",
    label: "Event / workshop",
    taglineAngle: "Date, venue vibe, registration, don't miss out",
    ctaSuggestions: ["Register Now", "Book Your Spot", "Join Us", "RSVP Today"],
    visualMotifs:
      "Event poster energy: crowd or venue mood, energetic but premium",
    urgency: "high",
  },
  limited_time: {
    id: "limited_time",
    label: "Limited time offer",
    taglineAngle: "Ends soon, last chance, limited slots, hurry",
    ctaSuggestions: ["Act Now", "Limited Time", "Don't Miss Out", "Claim Yours"],
    visualMotifs:
      "Urgency campaign: countdown energy, bold accent glow on offer, scarcity without spam",
    promoBadge: "LIMITED TIME",
    urgency: "high",
  },
};

export const PROFILES_BY_ID = PROFILES;

function scanText(...parts: (string | undefined)[]): string {
  return parts.filter(Boolean).join(" ").toLowerCase();
}

export function detectCampaignType(
  business: BusinessProfile,
  userPrompt = "",
  campaignMessage = ""
): CampaignTypeProfile {
  const explicitId = getCampaignTypeId(business);
  if (explicitId) return PROFILES[explicitId];

  const text = scanText(
    getCampaignTypeInput(business),
    business.tagline,
    userPrompt,
    campaignMessage,
    business.imageProps
  );

  if (
    /grand opening|now open|newly open|soft launch|official launch|opening day|just opened|doors open/.test(
      text
    )
  ) {
    return PROFILES.grand_opening;
  }
  if (
    /(\d+\s*%\s*off|discount|promo|promotion|sale|deal|offer|clearance|black friday|buy one|bogo|save \d|special price)/.test(
      text
    )
  ) {
    return PROFILES.promo_sale;
  }
  if (
    /christmas|easter|valentine|ramadan|eid|new year|holiday|festive|seasonal|december|halloween/.test(
      text
    )
  ) {
    return PROFILES.seasonal_offer;
  }
  if (
    /workshop|webinar|concert|festival|expo|conference|seminar|event|live show|ticket/.test(
      text
    )
  ) {
    return PROFILES.event;
  }
  if (
    /new product|product launch|introducing|just launched|now available|new service|new menu|new collection/.test(
      text
    )
  ) {
    return PROFILES.product_launch;
  }
  if (/limited time|ends soon|last chance|hurry|while stocks|today only|this week only/.test(text)) {
    return PROFILES.limited_time;
  }

  return PROFILES.general_brand;
}

export function buildCampaignTypePromptBlock(
  business: BusinessProfile,
  userPrompt = "",
  campaignMessage = ""
): string {
  const profile = detectCampaignType(business, userPrompt, campaignMessage);
  const name = business.businessName?.trim() || "the brand";

  return [
    `CAMPAIGN TYPE: ${profile.label} (${profile.id}).`,
    `Business name "${name}" stays the HERO HEADLINE — exact spelling.`,
    `Subhead/tagline angle: ${profile.taglineAngle}.`,
    profile.promoBadge
      ? `Optional promo badge near CTA (small, premium): "${profile.promoBadge}" — NOT replacing business name headline.`
      : "",
    `Visual direction: ${profile.visualMotifs}.`,
    getCampaignTypeLabel(business)
      ? `Campaign type (Step 1): ${getCampaignTypeLabel(business)}.`
      : "",
    userPrompt.trim()
      ? `Creative direction: ${userPrompt.trim().slice(0, 280)}.`
      : "",
    campaignMessage.trim()
      ? `SMS/message mood: ${campaignMessage.trim().slice(0, 160)}.`
      : "",
    profile.urgency === "high"
      ? "High urgency — bold CTA, glowing accent, but keep layout balanced above footer."
      : "Premium calm urgency — elegant conversion focus.",
  ]
    .filter(Boolean)
    .join(" ");
}

export function buildCampaignTypeCopyHints(
  business: BusinessProfile,
  userPrompt = "",
  campaignMessage = ""
): string {
  const profile = detectCampaignType(business, userPrompt, campaignMessage);
  return [
    `Campaign type: ${profile.label}.`,
    `Tagline should reflect: ${profile.taglineAngle}.`,
    `CTA prefer one of: ${profile.ctaSuggestions.join(", ")}.`,
    "Headline is ALWAYS the business name — put promo/opening angle in tagline only.",
  ].join(" ");
}

export function applyCampaignTypeToCopyFallback(
  business: BusinessProfile,
  userPrompt = "",
  campaignMessage = ""
): ReturnType<typeof buildCampaignCopy> {
  const copy = buildCampaignCopy(business);
  const profile = detectCampaignType(business, userPrompt, campaignMessage);

  if (profile.id === "general_brand") return copy;

  let tagline = copy.tagline;
  if (!business.tagline?.trim() && campaignMessage.trim()) {
    tagline = campaignMessage.trim().slice(0, 90);
  } else if (!business.tagline?.trim() && getCampaignTypeInput(business)) {
    tagline = getCampaignTypeInput(business).slice(0, 90);
  } else if (profile.id === "grand_opening") {
    tagline = tagline.includes("open")
      ? tagline
      : `Now open — ${tagline}`.slice(0, 90);
  } else if (profile.id === "promo_sale" && !/%|off|deal|offer|sale/i.test(tagline)) {
    tagline = `Special offer — ${tagline}`.slice(0, 90);
  }

  const cta = profile.ctaSuggestions.includes(copy.cta)
    ? copy.cta
    : business.callToAction?.trim() || profile.ctaSuggestions[0];

  return { ...copy, tagline, cta };
}
