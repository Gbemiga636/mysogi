import type { BusinessProfile } from "./types";

export type MobileAdPresetId =
  | "trending"
  | "luxury"
  | "minimal"
  | "corporate"
  | "futuristic"
  | "dark"
  | "saas"
  | "fashion"
  | "tech"
  | "real_estate"
  | "finance"
  | "food";

export type MobileAdPreset = {
  id: MobileAdPresetId;
  label: string;
  reference: string;
  typography: string;
  colorGrade: string;
  overlayStyle: string;
  ctaStyle: string;
  composition: string;
};

export const MOBILE_AD_PRESETS: Record<MobileAdPresetId, MobileAdPreset> = {
  trending: {
    id: "trending",
    label: "Trending Social",
    reference: "Trial 4 NEXORA fintech UI ad — dark neon, glass panels, 3D hero, dense premium grid",
    typography:
      "Montserrat/Inter Black — massive gradient headline word, white/silver UI labels, glowing CTA caps",
    colorGrade:
      "Near-black base, electric blue + purple neon accents, glassmorphism bloom, cinematic depth",
    overlayStyle:
      "Glass UI cards, live market panel, stats bar, 3D floating icons on glowing pedestal, chart grid background",
    ctaStyle:
      "Large glowing pill with neon edge bloom, bottom-center, bold all-caps label",
    composition:
      "Trial 4 grid: headline upper-left, 3D hero center, data panel right, promo + features mid, stats bar, CTA bottom",
  },
  luxury: {
    id: "luxury",
    label: "Luxury",
    reference: "Apple Services, Rolex, premium editorial",
    typography:
      "Refined serif headline (Playfair/Bodoni feel), light sans subhead, gold or ivory accents, wide letter-spacing on headline",
    colorGrade: "Deep blacks, warm gold highlights, soft vignette, rich contrast",
    overlayStyle:
      "Frosted glass headline card, subtle gold line accents, dark gradient veil upper third",
    ctaStyle:
      "Elegant pill button, ivory or gold fill, soft shadow, placed to balance layout",
    composition:
      "Hero product or lifestyle lower two-thirds; headline on calm dark glass band upper-left",
  },
  minimal: {
    id: "minimal",
    label: "Minimal",
    reference: "Apple product launch, Stripe landing hero",
    typography:
      "SF Pro / Inter style — very large bold headline, medium weight subhead, extreme whitespace",
    colorGrade: "Clean neutrals, soft daylight, restrained saturation",
    overlayStyle: "Thin glass strip or none — rely on soft top gradient only",
    ctaStyle: "Simple rounded pill — black, white, or brand fill — editorial placement",
    composition: "Single hero object center-right, vast negative space for type left",
  },
  corporate: {
    id: "corporate",
    label: "Corporate",
    reference: "McKinsey, IBM, trusted B2B",
    typography:
      "Professional grotesk (Inter/Helvetica Neue), structured grid, confident headline",
    colorGrade: "Navy, slate, crisp daylight office tones",
    overlayStyle: "Structured rectangular glass panel behind headline, subtle grid lines",
    ctaStyle: "Solid brand-color rectangle with rounded corners, bold label",
    composition: "Team or workspace hero, balanced symmetry, clear footer strip",
  },
  futuristic: {
    id: "futuristic",
    label: "Futuristic",
    reference: "Cyberpunk fintech, neon tech launch",
    typography:
      "Geometric sans, tight tracking headline, subtle glow on CTA only",
    colorGrade: "Teal/cyan rim light, dark base, controlled neon accents",
    overlayStyle: "Holographic UI frames, hex grid at 8% opacity, volumetric haze",
    ctaStyle: "Glowing pill with cyan edge light, dark fill, editorial placement",
    composition: "Diagonal energy, device or abstract tech hero, depth haze",
  },
  dark: {
    id: "dark",
    label: "Dark mode",
    reference: "Spotify, Netflix, premium dark UI",
    typography: "Bold headline (ivory or soft white on dark scrim), muted subhead, accent on CTA pill",
    colorGrade: "Near-black background, moody contrast, colored rim on subject",
    overlayStyle: "Heavy top and bottom gradient scrims (40% black), glass cards",
    ctaStyle: "Bright accent pill (brand color) with soft outer glow",
    composition: "Subject lit against darkness, text in upper safe zone",
  },
  saas: {
    id: "saas",
    label: "Startup SaaS",
    reference: "Linear, Notion, Stripe",
    typography:
      "Inter/Poppins — extra-bold headline, friendly subhead, modern SaaS hierarchy",
    colorGrade: "Soft purple/blue gradients, clean studio light",
    overlayStyle: "Floating UI mockup card, soft blur panel behind headline",
    ctaStyle: "Rounded gradient pill CTA, white label, subtle shadow",
    composition: "Laptop or app UI hero mid-frame, headline above, CTA below UI",
  },
  fashion: {
    id: "fashion",
    label: "Fashion brand",
    reference: "Balenciaga, Nike editorial",
    typography: "High-fashion condensed sans or Didone headline, airy subhead",
    colorGrade: "High contrast, editorial flash or golden hour",
    overlayStyle: "Minimal overlay — typography integrated on negative space",
    ctaStyle: "Outlined or solid pill, understated, bottom center",
    composition: "Full-bleed model, headline overlapping sky or dark veil only",
  },
  tech: {
    id: "tech",
    label: "Tech product",
    reference: "Apple hardware, Samsung launch",
    typography: "SF Pro style, large product name headline, spec subhead",
    colorGrade: "Studio gradient backdrop, product rim light",
    overlayStyle: "Clean reflection floor, soft spotlight, no clutter",
    ctaStyle: "Blue or brand accent pill, Apple-like restraint",
    composition: "Hero device 45° angle center, text left aligned in safe column",
  },
  real_estate: {
    id: "real_estate",
    label: "Real estate",
    reference: "Sotheby's, luxury property",
    typography: "Elegant serif headline, clean sans details",
    colorGrade: "Golden hour architecture, warm sky",
    overlayStyle: "Dark translucent footer band, glass headline top-left",
    ctaStyle: "Gold or white CTA on dark strip, 'Schedule viewing' style",
    composition: "Property fills lower frame, headline on sky gradient",
  },
  food: {
    id: "food",
    label: "Food & Restaurant",
    reference: "Premium food brand campaigns — golden-hour hero dish, steam, appetite styling",
    typography:
      "Friendly rounded serif headline + clean sans — warm cream band behind type",
    colorGrade:
      "Warm amber, cream, rich browns — appetizing grade, never cold fintech neon",
    overlayStyle:
      "Headline on warm glass or cream band over photo, offer ribbon, wood-texture footer strip",
    ctaStyle: "Warm solid or gradient pill — Order Now / Visit Us, high contrast on dark band",
    composition:
      "Food photography dominates top 55%, headline mid-lower on band, CTA below, contact footer — NO tech dashboards",
  },
  finance: {
    id: "finance",
    label: "Finance",
    reference: "Stripe, Revolut, premium banking",
    typography: "Trustworthy grotesk, bold headline, concise subhead",
    colorGrade: "Deep navy, emerald or teal trust accents",
    overlayStyle: "Glass dashboard card motifs, subtle chart shapes without readable numbers",
    ctaStyle: "Solid trust-green or brand pill, high contrast",
    composition: "Professional + device, headline clear of face, CTA mid-lower",
  },
};

const PRESET_LIST = Object.values(MOBILE_AD_PRESETS);

export function isMobileAdPresetId(id: string): id is MobileAdPresetId {
  return id in MOBILE_AD_PRESETS;
}

export function resolveMobileAdPreset(business: BusinessProfile): MobileAdPreset {
  const explicit = business.adStylePreset?.trim().toLowerCase();
  if (explicit && isMobileAdPresetId(explicit)) {
    return MOBILE_AD_PRESETS[explicit];
  }

  const ind = (business.industry || "").toLowerCase();
  if (/fashion|beauty|cosmetic/.test(ind)) return MOBILE_AD_PRESETS.fashion;
  if (/real estate|property|estate/.test(ind)) return MOBILE_AD_PRESETS.real_estate;
  if (/crypto|web3|ai|gaming/.test(ind)) return MOBILE_AD_PRESETS.futuristic;
  if (/fintech|finance|bank|insurance/.test(ind)) return MOBILE_AD_PRESETS.finance;
  if (/tech|saas|software|app|startup/.test(ind)) return MOBILE_AD_PRESETS.trending;
  if (/food|restaurant|hospitality|bakery|cafe|coffee|catering|chef|dining|bar/.test(ind)) {
    return MOBILE_AD_PRESETS.food;
  }
  if (/corporate|consult|legal|b2b/.test(ind)) return MOBILE_AD_PRESETS.corporate;
  if (/auto|car|motor/.test(ind)) return MOBILE_AD_PRESETS.luxury;
  if (/luxury|premium|vip/.test(business.tagline + business.campaignGoal)) {
    return MOBILE_AD_PRESETS.luxury;
  }
  return MOBILE_AD_PRESETS.trending;
}

export function listMobileAdPresets(): MobileAdPreset[] {
  return PRESET_LIST;
}
