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
      "Dense premium grid: empty top band for client logo overlay, massive headline upper-left with gradient keyword, 3D hero center, glass data panel right, feature icon row, stats bar mid, glowing CTA above footer reserve",
    effects:
      "Glassmorphism, neon bloom, soft reflections on coins, cinematic depth haze, subtle particle dust",
    forbidden:
      "Generic office stock, food imagery, handwritten text, Canva template frames, clipart coins, AI-generated logos",
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
      "Headline on warm band or glass over photo, offer ribbon, CTA pill above footer reserve — NOT a tech dashboard",
    effects:
      "Soft vignette, steam wisps, subtle bokeh lights, warm grade — no holographic UI unless food-delivery app",
    forbidden:
      "Crypto charts, office workers, generic SaaS UI, cold blue fintech palette for a bakery, AI logos",
  },
  real_estate: {
    key: "real_estate",
    label: "Real Estate",
    referenceBrands: "Sotheby's, Compass, luxury property marketing",
    visualMotifs:
      "Architectural hero: golden hour facade, aerial or interior luxury, trust-driven navy + gold palette",
    colorDirection: "Navy, ivory, champagne gold accents, sky gradients",
    heroSubjects: "Property exterior, interior living space, skyline context",
    layoutBias: "Headline on translucent band, price/offer framed block, elegant CTA above footer reserve",
    effects: "Lens flare subtle, warm architectural grade, glass headline panel",
    forbidden: "Fast food, crypto UI, gym imagery, AI logos",
  },
  fashion_beauty: {
    key: "fashion_beauty",
    label: "Fashion & Beauty",
    referenceBrands: "Balenciaga, Nike editorial, Sephora premium",
    visualMotifs: "Editorial full-bleed model or product macro, high contrast, magazine cover energy",
    colorDirection: "High contrast B&W with one accent, or soft pearl pastels for beauty",
    heroSubjects: "Model, product hero, texture close-up",
    layoutBias: "Minimal copy on negative space, headline dominant, understated CTA above footer reserve",
    effects: "Editorial grain subtle, rim light, soft veil on text zones only",
    forbidden: "Dashboard UI, industrial machinery, restaurant food unless fashion food editorial, AI logos",
  },
  saas_tech: {
    key: "saas_tech",
    label: "SaaS / Tech Startup",
    referenceBrands: "Linear, Notion, Stripe, Apple keynote",
    visualMotifs:
      "Clean product UI mockups, soft purple-blue gradients, floating device frames, crisp studio lighting",
    colorDirection: "Soft gradients, white space, one vibrant accent",
    heroSubjects: "Laptop/phone with abstract UI (no readable text), 3D abstract shapes",
    layoutBias: "Headline left, product center-right, feature bullets, rounded CTA above footer reserve",
    effects: "Soft shadows, glass cards, subtle mesh gradient background",
    forbidden: "Food photography, real estate aerials for a SaaS product, AI logos",
  },
  healthcare: {
    key: "healthcare",
    label: "Healthcare & Wellness",
    referenceBrands: "Mayo Clinic campaigns, Calm, premium clinic brands",
    visualMotifs: "Clinical trust: clean whites, soft teal, caring photography, calm whitespace",
    colorDirection: "White, soft blue-teal, gentle green accents",
    heroSubjects: "Caring professional, patient wellness, clean facility",
    layoutBias: "Trust badges row, clear headline, booking CTA above footer reserve",
    effects: "Soft clinical light, minimal effects, high readability",
    forbidden: "Neon crypto, nightclub, aggressive sale graphics, AI logos",
  },
  ecommerce_retail: {
    key: "ecommerce_retail",
    label: "E-commerce & Retail",
    referenceBrands: "Apple Store promos, Amazon Prime style premium retail",
    visualMotifs: "Product-centric hero cluster, bold offer band, urgency when promo campaign",
    colorDirection: "Brand accent + high contrast promo zones",
    heroSubjects: "Products on pedestal or lifestyle in-use shot",
    layoutBias: "Discount headline dominant when sale, product grid accent, shop CTA above footer reserve",
    effects: "Spotlight on product, subtle starburst for offers only when appropriate",
    forbidden: "Unrelated industry scenes, AI logos",
  },
  fitness_sports: {
    key: "fitness_sports",
    label: "Fitness & Sports",
    referenceBrands: "Nike Training, Peloton, premium gym brands",
    visualMotifs: "High-energy athlete photography, electric accent, dynamic diagonal energy",
    colorDirection: "Dark charcoal, lime or red accent, high contrast",
    heroSubjects: "Athlete in motion, gym equipment hero, team spirit",
    layoutBias: "Bold headline, program stats bar, join CTA above footer reserve",
    effects: "Motion blur subtle, rim light, arena bokeh",
    forbidden: "Food hero, crypto UI, office stock, AI logos",
  },
  education: {
    key: "education",
    label: "Education & Training",
    referenceBrands: "Coursera, Khan Academy premium, university campaigns",
    visualMotifs: "Bright optimistic learning environment, books/devices, achievement energy",
    colorDirection: "Blue, yellow accents, clean whites",
    heroSubjects: "Students learning, instructor, classroom or online course visual",
    layoutBias: "Course headline, value props, enroll CTA above footer reserve",
    effects: "Soft optimistic lighting, subtle geometric shapes",
    forbidden: "Nightclub, crypto exchange UI, AI logos",
  },
  travel_hospitality: {
    key: "travel_hospitality",
    label: "Travel & Hospitality",
    referenceBrands: "Airbnb, Emirates, luxury resort marketing",
    visualMotifs: "Destination hero, saturated skies, wanderlust grade, postcard energy",
    colorDirection: "Sky blues, sunset gold, tropical greens",
    heroSubjects: "Landmark destination, resort pool, travel experience",
    layoutBias: "Destination headline, package panel, book CTA above footer reserve",
    effects: "Travel grade, lens flare subtle, glass info card",
    forbidden: "Office B2B, crypto UI, AI logos",
  },
  automotive: {
    key: "automotive",
    label: "Automotive",
    referenceBrands: "BMW, Tesla, premium dealership campaigns",
    visualMotifs: "Showroom lighting, reflective floor, metallic paint hero",
    colorDirection: "Dark slate, silver, brand accent",
    heroSubjects: "Vehicle 3/4 hero angle, dealership context",
    layoutBias: "Model headline, spec line, test-drive CTA above footer reserve",
    effects: "Studio rim light, floor reflection, subtle speed lines",
    forbidden: "Food, crypto, unrelated products, AI logos",
  },
  nightlife_events: {
    key: "nightlife_events",
    label: "Nightlife & Events",
    referenceBrands: "Premium festival posters, club promotions",
    visualMotifs: "Neon on black, smoke haze, laser accents, poster energy",
    colorDirection: "Black, neon pink/cyan, high saturation accents",
    heroSubjects: "DJ, crowd energy, stage lights — typeset poster layout",
    layoutBias: "Event headline dominant, date block, ticket CTA above footer reserve",
    effects: "Neon bloom, smoke, light streaks",
    forbidden: "Clinical healthcare, corporate office, AI logos",
  },
  legal_services: {
    key: "legal_services",
    label: "Legal Services",
    referenceBrands: "Premium law firm campaigns",
    visualMotifs: "City skyline muted, authority serif, trust navy/burgundy",
    colorDirection: "Navy, burgundy, gold accents",
    heroSubjects: "Courthouse abstract, professional counsel, city context",
    layoutBias: "Authority headline, practice area, consult CTA above footer reserve",
    effects: "Restrained shadows, glass headline band",
    forbidden: "Party neon, fast food, AI logos",
  },
  construction_trades: {
    key: "construction_trades",
    label: "Construction & Trades",
    referenceBrands: "Premium contractor marketing",
    visualMotifs: "Site photography, hard hat accents, steel and safety orange",
    colorDirection: "Charcoal, safety yellow/orange, steel blue",
    heroSubjects: "Active job site, craftsman, completed project",
    layoutBias: "Built-to-last headline, trust line, quote CTA above footer reserve",
    effects: "Industrial grade, daylight crisp",
    forbidden: "Fashion editorial, crypto UI, AI logos",
  },
  agriculture: {
    key: "agriculture",
    label: "Agriculture & Farming",
    referenceBrands: "Agro premium campaigns, farm-to-table brands",
    visualMotifs: "Golden hour fields, harvest hero, earth greens and golds",
    colorDirection: "Golden green, earth brown, sky blue",
    heroSubjects: "Harvest crops, farm landscape, fresh produce",
    layoutBias: "Fresh-from-farm headline, yield trust, CTA above footer reserve",
    effects: "Natural sunlight, organic texture subtle",
    forbidden: "Urban fintech UI, nightclub, AI logos",
  },
  nonprofit: {
    key: "nonprofit",
    label: "Nonprofit & Charity",
    referenceBrands: "UNICEF-style emotional impact campaigns",
    visualMotifs: "Human documentary warmth, hope-driven photography",
    colorDirection: "Warm human tones, hopeful blue/green accents",
    heroSubjects: "Community impact, people helped, cause visual",
    layoutBias: "Hope headline, impact stat bar, donate CTA above footer reserve",
    effects: "Documentary grade, soft vignette",
    forbidden: "Luxury fashion coldness, crypto UI, AI logos",
  },
  energy_green: {
    key: "energy_green",
    label: "Energy & Solar",
    referenceBrands: "Tesla Energy, premium solar installers",
    visualMotifs: "Home with solar panels, sky blue, green tech trust",
    colorDirection: "Sky blue, panel blue-black, green accent",
    heroSubjects: "Solar installation, sustainable home, clean energy",
    layoutBias: "Savings headline, stat callout, quote CTA above footer reserve",
    effects: "Clean daylight, eco grade",
    forbidden: "Nightclub, fast food, AI logos",
  },
  media_podcast: {
    key: "media_podcast",
    label: "Media & Podcast",
    referenceBrands: "Spotify-style show promos, YouTube premium",
    visualMotifs: "Studio mic, waveform graphic, dark purple accent",
    colorDirection: "Dark studio, purple/coral accent",
    heroSubjects: "Host photo, mic hero, waveform visual",
    layoutBias: "Show title headline, episode hook, listen CTA above footer reserve",
    effects: "Studio glow, audio wave accents",
    forbidden: "Real estate aerial default, AI logos",
  },
  pets_services: {
    key: "pets_services",
    label: "Pet Care & Veterinary",
    referenceBrands: "Premium pet brand campaigns",
    visualMotifs: "Bright studio pet photography, teal/coral friendly accents",
    colorDirection: "Bright white, teal, coral",
    heroSubjects: "Happy pet portrait, grooming, vet care",
    layoutBias: "Caring headline, services row, book CTA above footer reserve",
    effects: "Soft studio pet lighting",
    forbidden: "Crypto UI, industrial, AI logos",
  },
  corporate_b2b: {
    key: "corporate_b2b",
    label: "Corporate / B2B",
    referenceBrands: "IBM, McKinsey, Salesforce enterprise",
    visualMotifs: "Trust blue, team or workspace authenticity, structured grid",
    colorDirection: "Navy, slate, crisp daylight",
    heroSubjects: "Professional team, modern office, handshake abstract",
    layoutBias: "Value prop headline, three benefit icons, demo CTA above footer reserve",
    effects: "Subtle glass panels, restrained shadows",
    forbidden: "Party neon, fast food hero for consulting firm, AI logos",
  },
  default_premium: {
    key: "default_premium",
    label: "Premium Brand",
    referenceBrands: "Apple, Airbnb, top Behance agency campaigns",
    visualMotifs:
      "Award-winning integrated ad: cinematic photo + glass type panels + intentional grid, never template random floats",
    colorDirection: "Brand primary + secondary from profile, luxury contrast",
    heroSubjects: "Industry-authentic hero matching business category exactly",
    layoutBias: "Hero section, headline, subhead, benefits, visual focus, trust, CTA above footer reserve",
    effects: "Cinematic lighting, depth, premium grade only when fits industry",
    forbidden: "Generic stock unrelated to stated industry, AI logos",
  },
};

export function detectIndustryDesignKey(
  business: BusinessProfile,
  userPrompt?: string
): string {
  const ind = (business.industry || "").toLowerCase();
  const preset = (business.adStylePreset || "").toLowerCase();
  const combined = `${ind} ${userPrompt || ""} ${business.campaignGoal || ""} ${business.tagline || ""}`.toLowerCase();

  if (/crypto|web3|blockchain|exchange|trading|defi|nexora|bitcoin|ethereum|coin/.test(combined)) {
    return "crypto_fintech";
  }
  if (/fintech|finance|bank|invest|forex|payment|wallet|money transfer/.test(combined) || preset === "finance" || preset === "futuristic") {
    return "crypto_fintech";
  }
  if (/food|restaurant|catering|chef|bakery|dining|hospitality|bar|cafe|coffee|pizza|burger|kitchen|menu|grill/.test(combined)) {
    return "food_restaurant";
  }
  if (/real estate|property|estate|realtor|realtor|villa|apartment rent|housing/.test(combined) || preset === "real_estate") {
    return "real_estate";
  }
  if (/fashion|beauty|cosmetic|salon|spa|jewel|apparel|makeup|skincare|boutique/.test(combined) || preset === "fashion") {
    return "fashion_beauty";
  }
  if (/saas|software|app|startup|tech|ai|digital|agency|platform|cloud|devtools/.test(combined) || preset === "saas" || preset === "tech") {
    return "saas_tech";
  }
  if (/health|medical|wellness|clinic|pharma|hospital|doctor|dental|therapy|physio/.test(combined)) {
    return "healthcare";
  }
  if (/shop|store|retail|ecommerce|e-commerce|market|boutique sale|flash sale|black friday/.test(combined)) {
    return "ecommerce_retail";
  }
  if (/gym|fitness|workout|sport|yoga|pilates|athlete|training club|crossfit/.test(combined) || preset === "fitness") {
    return "fitness_sports";
  }
  if (/school|education|course|tutor|university|college|learn|academy|training institute/.test(combined) || preset === "education") {
    return "education";
  }
  if (/travel|tour|vacation|flight|tourism|airline|resort|hotel booking|destination/.test(combined) || preset === "travel") {
    return "travel_hospitality";
  }
  if (/auto|car|vehicle|dealer|motor|garage|mechanic|automotive|showroom/.test(combined) || preset === "auto") {
    return "automotive";
  }
  if (/club|nightlife|dj|concert|festival|party|ticket|night club|entertainment venue/.test(combined) || preset === "nightlife") {
    return "nightlife_events";
  }
  if (/law|legal|attorney|lawyer|solicitor|litigation|law firm/.test(combined) || preset === "legal") {
    return "legal_services";
  }
  if (/construction|contractor|builder|roof|plumb|electrician|hvac|renovation|handyman/.test(combined) || preset === "industrial") {
    return "construction_trades";
  }
  if (/farm|agric|agro|crop|livestock|harvest|farmers/.test(combined) || preset === "agriculture") {
    return "agriculture";
  }
  if (/ngo|charity|nonprofit|non-profit|donate|foundation|humanitarian/.test(combined)) {
    return "nonprofit";
  }
  if (/solar|energy|power|renewable|green tech|wind turbine|utility/.test(combined) || preset === "energy") {
    return "energy_green";
  }
  if (/podcast|media|youtube|influencer|stream|radio show|tv show|content creator/.test(combined) || preset === "media") {
    return "media_podcast";
  }
  if (/pet|vet|veterinary|grooming|dog|cat|animal care/.test(combined)) {
    return "pets_services";
  }
  if (/consult|corporate|legal|insurance|b2b|enterprise|hr software|accounting firm/.test(combined) || preset === "corporate") {
    return "corporate_b2b";
  }

  return "default_premium";
}

export function getIndustryDesignSystem(
  business: BusinessProfile,
  userPrompt?: string
): IndustryDesignSystem {
  const key = detectIndustryDesignKey(business, userPrompt);
  return SYSTEMS[key] ?? SYSTEMS.default_premium;
}

export function listIndustryDesignKeys(): string[] {
  return Object.keys(SYSTEMS);
}
