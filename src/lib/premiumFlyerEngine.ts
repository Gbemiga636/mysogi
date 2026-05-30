import {
  buildBusinessContactParts,
  buildContactFooterDirective,
  ensureBusinessContactOnCopy,
} from "./businessContact";
import { formatBrandPaletteForImagenVisual } from "./brandColors";
import type { CampaignCopy } from "./campaignTextLayers";
import { analyzeBrandPsychology } from "./eliteCreativeDirector";
import { getFlyerTypeTheme } from "./flyerTypeTheme";
import { flyerFormatLabel } from "./flyerVisualCommon";
import type { BusinessProfile, VideoFormat } from "./types";

/** Typography overlay system (SVG/Sharp) — pairs with adAgencyEngine cinematic visuals */
export const PREMIUM_FLYER_ENGINE_SYSTEM = `You are CREATIVE DIRECTOR + SENIOR GRAPHIC DESIGNER + CINEMATOGRAPHER + BRAND STRATEGIST for an AI AD AGENCY ENGINE.

Produce cinematic luxury marketing advertisement environments — never generic business flyers or AI posters.

The photograph has NO readable text. Typography is composited via professional SVG overlay (headline, CTA, contact, logo).

ALWAYS: creative direction first, foreground/midground/background depth, cinematic lighting, negative space for type, agency-intentional composition.`;

export type PremiumAdStyle = {
  id: string;
  label: string;
  aesthetic: string;
  lighting: string;
  composition: string;
  typographyMood: string;
};

const STYLE_CATALOG: Record<string, PremiumAdStyle> = {
  luxury: {
    id: "luxury",
    label: "Luxury branding",
    aesthetic:
      "Understated opulence, black gold ivory, editorial negative space, Vogue campaign restraint",
    lighting: "Soft key with golden rim, deep shadows, glossy specular highlights",
    composition: "Asymmetric editorial grid, hero right, headline left, breathing room",
    typographyMood: "High-contrast serif headline, refined sans supporting, glass CTA",
  },
  crypto: {
    id: "crypto",
    label: "Crypto ad agency",
    aesthetic:
      "Digital wealth momentum, glass UI panels, abstract chart energy without readable tickers",
    lighting: "Neon rim on navy, volumetric haze, screen glow accents — controlled not chaotic",
    composition: "Diagonal energy, hero device or coin cluster, CTA anchored lower third",
    typographyMood: "Bold geometric sans headline, tight tracking, luminous CTA pill",
  },
  fintech: {
    id: "fintech",
    label: "Premium fintech",
    aesthetic:
      "Trust and innovation, clean navy teal, glass morphism, Series-B launch polish",
    lighting: "Cool studio key, cyan accent rim, soft gradient environment",
    composition: "Apple-keynote balance, product hero center-right, calm upper headline band",
    typographyMood: "Modern grotesk headline, medium weight subline, solid contrast CTA",
  },
  automotive: {
    id: "automotive",
    label: "High-end automotive",
    aesthetic:
      "Sculpted metal, motion blur hints, prestige showroom or coastal road",
    lighting: "Dramatic rim on body lines, sunset or studio sweep, reflective paint",
    composition: "Low angle three-quarter hero car, headline top, CTA on dark gradient strip",
    typographyMood: "Wide bold sans headline, condensed supporting, premium pill CTA",
  },
  fashion: {
    id: "fashion",
    label: "Fashion editorial",
    aesthetic: "Runway authority, fabric texture, model and product hero, glossy skin",
    lighting: "Beauty dish key, soft fill, high-fashion contrast",
    composition: "Editorial crop, model offset, headline overlapping negative space carefully",
    typographyMood: "Didone or high-fashion serif headline, light sans subline",
  },
  real_estate: {
    id: "real_estate",
    label: "Luxury real estate",
    aesthetic: "Architectural prestige, golden hour villa or tower, aspirational lifestyle",
    lighting: "Warm sun, sky gradient, interior window glow",
    composition: "Property hero fills midground, headline on sky or dark veil, CTA on lower band",
    typographyMood: "Elegant serif headline, clean sans details, gold-accent CTA",
  },
  nightlife: {
    id: "nightlife",
    label: "Nightlife premium",
    aesthetic: "Velvet mood, bottle service, crowd energy, amber purple club grade",
    lighting: "Practical club lights, bokeh, controlled glow on CTA only",
    composition: "Dynamic asymmetry, crowd midground, headline on dark upper veil",
    typographyMood: "Bold sans headline, neon-edge CTA button integrated not floating",
  },
  restaurant: {
    id: "restaurant",
    label: "Premium restaurant",
    aesthetic: "Hero dish steam, warm interior bokeh, appetite-driven close-up",
    lighting: "Warm 45-degree key, steam backlight, rich food speculars",
    composition: "Dish foreground, dining scene midground, headline on soft dark top",
    typographyMood: "Classic serif headline, friendly sans subline, warm CTA button",
  },
  event: {
    id: "event",
    label: "Event promotion",
    aesthetic: "Stage energy, celebration, ticket urgency without clutter",
    lighting: "Spotlights, haze, color gels, cinematic concert feel",
    composition: "Performer or crowd hero, diagonal stage lines, CTA high contrast lower third",
    typographyMood: "Impact sans headline, secondary clean, glowing CTA with restraint",
  },
  corporate: {
    id: "corporate",
    label: "Modern corporate",
    aesthetic: "Trust, glass office, diverse team, restrained premium palette",
    lighting: "Soft daylight through windows, clean corporate key",
    composition: "Team or workspace hero, headline left grid, structured footer",
    typographyMood: "Professional grotesk headline, neutral subline, solid brand CTA",
  },
  premium_tech: {
    id: "premium_tech",
    label: "Premium tech",
    aesthetic: "Floating device hero, minimal gradient studio, innovation clarity",
    lighting: "Soft gradient backdrop, product rim light, subtle caustics",
    composition: "Product center-weight, headline top-left, Apple-launch symmetry option",
    typographyMood: "SF-style grotesk headline, light subline, frosted glass CTA",
  },
};

export function resolvePremiumAdStyle(business: BusinessProfile): PremiumAdStyle {
  const ind = (business.industry || "").toLowerCase();
  const mood = [business.tagline, business.campaignGoal]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  if (/crypto|web3|blockchain|nft|defi/.test(ind)) return STYLE_CATALOG.crypto;
  if (/fintech|finance|bank|trading|invest/.test(ind)) return STYLE_CATALOG.fintech;
  if (/auto|car|motor|vehicle|garage/.test(ind)) return STYLE_CATALOG.automotive;
  if (/fashion|beauty|cosmetic|salon/.test(ind)) return STYLE_CATALOG.fashion;
  if (/real estate|property|estate/.test(ind)) return STYLE_CATALOG.real_estate;
  if (/nightlife|club|bar|lounge/.test(ind)) return STYLE_CATALOG.nightlife;
  if (/food|restaurant|catering|bakery|chef/.test(ind)) return STYLE_CATALOG.restaurant;
  if (/event|wedding|party|concert|festival/.test(ind)) return STYLE_CATALOG.event;
  if (/tech|saas|software|app|startup|ai/.test(ind)) return STYLE_CATALOG.premium_tech;
  if (/corporate|consult|legal|b2b/.test(ind)) return STYLE_CATALOG.corporate;
  if (/luxury|premium|jewel|hotel|spa/.test(ind) || /luxury|premium|exclusive/.test(mood)) {
    return STYLE_CATALOG.luxury;
  }
  return STYLE_CATALOG.luxury;
}

/** Remove text-free / plate language from Groq output */
export function stripTextFreeLanguage(text: string): string {
  return text
    .replace(
      /\b(text-free|zero-text|zero text|no text|no letters|no words|no readable writing|background plate only|blank signs|blank screens|post[- ]?production overlay|composited after|added later|cloudinary adds|imagen generates)\b/gi,
      ""
    )
    .replace(/\s{2,}/g, " ")
    .trim();
}

export function formatPremiumFlyerBriefForGroq(
  business: BusinessProfile,
  format: VideoFormat
): string {
  const psych = analyzeBrandPsychology(business);
  const style = resolvePremiumAdStyle(business);
  const palette = formatBrandPaletteForImagenVisual(business);
  const fmt = flyerFormatLabel(format);

  return [
    `Campaign style: ${style.label} — ${style.aesthetic}.`,
    `Composition rules: ${style.composition}.`,
    `Lighting: ${style.lighting}.`,
    `Typography mood: ${style.typographyMood}.`,
    `Format: ${fmt} finished flyer with integrated type and CTA.`,
    `Brand psychology: sell ${psych.selling}, evoke ${psych.emotion}, tone ${psych.tone}.`,
    `Color harmony in grade: ${palette}.`,
    "Output a FINISHED agency ad — full layout, depth, premium fonts, CTA button, exact copy added by system.",
  ].join(" ");
}

function quote(s: string): string {
  return s.replace(/"/g, "'").trim();
}

/** OpenAI renders typography inside the image — agency typesetting rules */
export const OPENAI_INTEGRATED_TYPOGRAPHY_CRAFT = [
  "INTEGRATED TYPOGRAPHY (render inside the artwork): world-class agency typesetting — not cheap AI text.",
  "Headline: oversized bold display type, crisp edges, perfect spelling, strong contrast, subtle shadow or veil behind type only where needed for readability.",
  "Subheadline: refined secondary font, clearly smaller, generous line height, aligned to grid.",
  "CTA: premium pill or glass button with depth, inner highlight, padding, and label centered — designed UI element, not plain underlined text.",
  "Footer: phone and email on one or two lines, smallest size but fully legible, high contrast strip or soft dark gradient behind contact.",
  "Use intentional font pairing, Swiss-grid alignment, luxury letterspacing, balanced margins, asymmetrical layout when it elevates the brand.",
  "Never warp, melt, duplicate, or misspell words. No lorem ipsum. No placeholder boxes.",
].join(" ");

/** Exact copy + premium typography system for OpenAI render */
export function buildPremiumTypographyBlock(
  business: BusinessProfile,
  copy: CampaignCopy
): string {
  const theme = getFlyerTypeTheme(business);
  const style = resolvePremiumAdStyle(business);
  const safeCopy = ensureBusinessContactOnCopy(copy, business);
  const contactParts = buildBusinessContactParts(business);
  const parts: string[] = [];
  const add = (role: string, text: string) => {
    const q = quote(text);
    if (q) parts.push(`${role} — render exactly: ${q}`);
  };

  add("HEADLINE (bold dominant, largest scale)", safeCopy.headline);
  if (safeCopy.tagline) add("SUBHEADLINE (smaller, cleaner, supporting)", safeCopy.tagline);
  if (safeCopy.cta) add("CTA BUTTON (premium pill or glass, high contrast)", safeCopy.cta);
  if (safeCopy.location) add("LOCATION (footer, subtle)", safeCopy.location);
  if (contactParts.phone) {
    add("PHONE (footer, must be visible)", contactParts.phone);
  }
  if (contactParts.email) {
    add("EMAIL (footer beside phone, must be visible)", contactParts.email);
  }
  if (contactParts.website) {
    add("WEBSITE (footer, optional third line)", contactParts.website);
  }
  if (safeCopy.contact) {
    add("CONTACT LINE (footer, combined)", safeCopy.contact);
  }

  return [
    OPENAI_INTEGRATED_TYPOGRAPHY_CRAFT,
    "TYPOGRAPHY SYSTEM — render all copy inside the finished ad:",
    `Headline font: ${theme.headline.family} bold display.`,
    `Subhead font: ${theme.tagline.family} medium.`,
    `CTA font: ${theme.cta.family} semibold inside premium button.`,
    style.typographyMood,
    buildContactFooterDirective(business),
    parts.join(" | "),
    "Only these exact phrases as visible writing. Spell every character correctly.",
  ].join(" ");
}

export function buildPremiumCompositionBlock(format: VideoFormat): string {
  const fmt = flyerFormatLabel(format);
  return [
    `COMPOSITION (${fmt}): professional ad grid — not flat poster.`,
    "Depth: distinct foreground props or subject, midground hero action, atmospheric background.",
    "Camera: commercial advertising photography — 35mm or 50mm hero, shallow depth of field on subject, environmental context sharp enough for industry read.",
    "Hierarchy: eye flows headline → hero → offer energy → CTA → footer contact.",
    "Balance: asymmetry when it adds prestige; contrast guides the eye; readability always preserved.",
    "CTA: polished section mid-lower — glass, pill, or solid with shadow and realistic reflection, not floating plain text.",
    "Effects: cinematic shadows, layered lighting, luxury grade, realistic materials — subtle controlled glow on CTA only, never random neon.",
    "Rendering: ultra-detailed premium ad photography, studio quality, advertising campaign realism, octane-quality materials and reflections.",
  ].join(" ");
}

export function buildPremiumEngineCoreBrief(): string {
  return [
    "PREMIUM AI MARKETING FLYER ENGINE — elite studio finished artwork, print-ready.",
    "Think: creative director + senior graphic designer + cinematographer + brand strategist.",
    "Scene direction, camera direction, typography behavior, rendering style, lighting, emotional tone, luxury aesthetics, composition rules, texture quality, branding placement, subtle iconography or UI glass panels only when industry-appropriate.",
    "Marketing psychology drives every choice: contrast, desire, trust, urgency as appropriate.",
  ].join(" ");
}

export function buildPremiumDirectorStack(
  business: BusinessProfile,
  format: VideoFormat
): string {
  const style = resolvePremiumAdStyle(business);
  return [
    buildPremiumEngineCoreBrief(),
    `ACTIVE CAMPAIGN STYLE: ${style.label}. ${style.aesthetic}.`,
    buildPremiumCompositionBlock(format),
    `Lighting style: ${style.lighting}.`,
  ].join(" ");
}
