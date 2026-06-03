import type { BusinessProfile } from "../types";

export type IndustryDesignSystem = {
  key: string;
  label: string;
  visualMotifs: string;
  colorDirection: string;
  heroSubjects: string;
  layoutBias: string;
  effects: string;
  forbidden: string;
  referenceBrands: string;
};

const SYSTEMS: Record<string, IndustryDesignSystem> = {
  crypto_fintech: {
    key: "crypto_fintech",
    label: "Crypto / Fintech",
    referenceBrands: "Binance, Coinbase, Stripe, Nexora-style premium exchange UI",
    visualMotifs:
      "Trial-4 caliber: near-black UI canvas, electric blue + purple neon, 3D metallic coins on glowing pedestal, candlestick chart grid at 12% opacity, glass Live Market panel, stats trust bar, bonus glass card, volumetric rim light",
    colorDirection:
      "Deep navy-black base (#0a0e1a), cyan-blue primary glow, purple gradient accent on one headline word, green only for positive ticks",
    heroSubjects:
      "Floating 3D Bitcoin/Ethereum/USDT coins, trading dashboard depth, holographic UI frames — NO readable fake tickers",
    layoutBias:
      "Dense premium grid: logo top-left, massive headline upper-left with gradient keyword, 3D hero center, glass data panel right, feature icon row, stats bar, glowing CTA pill bottom-center, app badges optional",
    effects:
      "Glassmorphism, neon bloom, soft reflections on coins, cinematic depth haze, subtle particle dust",
    forbidden:
      "Generic office stock, food imagery, handwritten text, Canva template frames, clipart coins",
  },
  food_restaurant: {
    key: "food_restaurant",
    label: "Food & Restaurant",
    referenceBrands: "McDonald's premium campaigns, Sweetgreen, high-end food delivery apps",
    visualMotifs:
      "Hero food photography dominates 50–60%: steam, golden-hour warmth, shallow depth of field, appetite-triggering styling, wood or marble surfaces",
    colorDirection:
      "Warm amber, cream, rich browns, appetite reds sparingly; avoid cold fintech neon unless brand demands",
    heroSubjects:
      "Signature dish or spread, chef hands plating, restaurant interior bokeh — unmistakably FOOD industry",
    layoutBias:
      "Headline on warm band or glass over photo, offer ribbon, CTA pill, generous food negative space — NOT a tech dashboard",
    effects:
      "Soft vignette, steam wisps, subtle bokeh lights, warm grade — no holographic UI unless food-delivery app",
    forbidden:
      "Crypto charts, office workers, generic SaaS UI, cold blue fintech palette for a bakery",
  },
  real_estate: {
    key: "real_estate",
    label: "Real Estate",
    referenceBrands: "Sotheby's, Compass, luxury property marketing",
    visualMotifs:
      "Architectural hero: golden hour facade, aerial or interior luxury, trust-driven navy + gold palette",
    colorDirection: "Navy, ivory, champagne gold accents, sky gradients",
    heroSubjects: "Property exterior, interior living space, skyline context",
    layoutBias: "Headline on translucent band, price/offer framed block, elegant CTA, contact footer strip",
    effects: "Lens flare subtle, warm architectural grade, glass headline panel",
    forbidden: "Fast food, crypto UI, gym imagery",
  },
  fashion_beauty: {
    key: "fashion_beauty",
    label: "Fashion & Beauty",
    referenceBrands: "Balenciaga, Nike editorial, Sephora premium",
    visualMotifs: "Editorial full-bleed model or product macro, high contrast, magazine cover energy",
    colorDirection: "High contrast B&W with one accent, or soft pearl pastels for beauty",
    heroSubjects: "Model, product hero, texture close-up",
    layoutBias: "Minimal copy on negative space, masthead brand, understated CTA",
    effects: "Editorial grain subtle, rim light, soft veil on text zones only",
    forbidden: "Dashboard UI, industrial machinery, restaurant food unless fashion food editorial",
  },
  saas_tech: {
    key: "saas_tech",
    label: "SaaS / Tech Startup",
    referenceBrands: "Linear, Notion, Stripe, Apple keynote",
    visualMotifs:
      "Clean product UI mockups, soft purple-blue gradients, floating device frames, crisp studio lighting",
    colorDirection: "Soft gradients, white space, one vibrant accent",
    heroSubjects: "Laptop/phone with abstract UI (no readable text), 3D abstract shapes",
    layoutBias: "Headline left, product right, feature bullets, rounded CTA",
    effects: "Soft shadows, glass cards, subtle mesh gradient background",
    forbidden: "Food photography, real estate aerials for a SaaS product",
  },
  healthcare: {
    key: "healthcare",
    label: "Healthcare & Wellness",
    referenceBrands: "Mayo Clinic campaigns, Calm, premium clinic brands",
    visualMotifs: "Clinical trust: clean whites, soft teal, caring photography, calm whitespace",
    colorDirection: "White, soft blue-teal, gentle green accents",
    heroSubjects: "Caring professional, patient wellness, clean facility",
    layoutBias: "Trust badges row, clear headline, booking CTA, credentials footer",
    effects: "Soft clinical light, minimal effects, high readability",
    forbidden: "Neon crypto, nightclub, aggressive sale graphics",
  },
  ecommerce_retail: {
    key: "ecommerce_retail",
    label: "E-commerce & Retail",
    referenceBrands: "Apple Store promos, Amazon Prime style premium retail",
    visualMotifs: "Product-centric hero cluster, bold offer band, urgency when promo campaign",
    colorDirection: "Brand accent + high contrast promo zones",
    heroSubjects: "Products on pedestal or lifestyle in-use shot",
    layoutBias: "Discount headline dominant when sale, product grid accent, shop CTA",
    effects: "Spotlight on product, subtle starburst for offers only when appropriate",
    forbidden: "Unrelated industry scenes",
  },
  corporate_b2b: {
    key: "corporate_b2b",
    label: "Corporate / B2B",
    referenceBrands: "IBM, McKinsey, Salesforce enterprise",
    visualMotifs: "Trust blue, team or workspace authenticity, structured grid",
    colorDirection: "Navy, slate, crisp daylight",
    heroSubjects: "Professional team, modern office, handshake abstract",
    layoutBias: "Value prop headline, three benefit icons, demo CTA",
    effects: "Subtle glass panels, restrained shadows",
    forbidden: "Party neon, fast food hero for consulting firm",
  },
  default_premium: {
    key: "default_premium",
    label: "Premium Brand",
    referenceBrands: "Apple, Airbnb, top Behance agency campaigns",
    visualMotifs:
      "Award-winning integrated ad: cinematic photo + glass type panels + intentional grid, never template random floats",
    colorDirection: "Brand primary + secondary from profile, luxury contrast",
    heroSubjects: "Industry-authentic hero matching business category exactly",
    layoutBias: "Hero section, headline, subhead, benefits, visual focus, trust, CTA — full grid",
    effects: "Cinematic lighting, depth, premium grade only when fits industry",
    forbidden: "Generic stock unrelated to stated industry",
  },
};

export function detectIndustryDesignKey(business: BusinessProfile): string {
  const ind = (business.industry || "").toLowerCase();
  const preset = (business.adStylePreset || "").toLowerCase();

  if (/crypto|web3|blockchain|exchange|trading|defi/.test(ind)) return "crypto_fintech";
  if (/fintech|finance|bank|invest|forex/.test(ind) || preset === "finance" || preset === "futuristic") {
    return "crypto_fintech";
  }
  if (/food|restaurant|catering|chef|bakery|dining|hospitality|bar|cafe|coffee/.test(ind)) {
    return "food_restaurant";
  }
  if (/real estate|property|estate|realtor|hotel/.test(ind) || preset === "real_estate") {
    return "real_estate";
  }
  if (/fashion|beauty|cosmetic|salon|spa|jewel|apparel/.test(ind) || preset === "fashion") {
    return "fashion_beauty";
  }
  if (/saas|software|app|startup|tech|ai|digital|agency/.test(ind) || preset === "saas" || preset === "tech") {
    return "saas_tech";
  }
  if (/health|medical|wellness|clinic|pharma|hospital/.test(ind)) return "healthcare";
  if (/shop|store|retail|ecommerce|e-commerce|market/.test(ind)) return "ecommerce_retail";
  if (/consult|corporate|legal|insurance|b2b/.test(ind) || preset === "corporate") {
    return "corporate_b2b";
  }

  return "default_premium";
}

export function getIndustryDesignSystem(business: BusinessProfile): IndustryDesignSystem {
  const key = detectIndustryDesignKey(business);
  return SYSTEMS[key] ?? SYSTEMS.default_premium;
}
