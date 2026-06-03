/**
 * 50 paid creative-director flyer presets — unique layout + visual systems.
 * All copy (including contact) is typeset inside the AI image (no SVG text).
 */

import type { CampaignCopy } from "./campaignTextLayers";
import { getBrandPrimary, getBrandSecondary } from "./brandColors";
import {
  buildIntegratedContactTypesetBlock,
  buildTypesetTextMasterRules,
} from "./businessContact";
import type { BusinessProfile, VideoFormat } from "./types";
import { FORMAT_RATIOS } from "./types";

export const REFERENCE_FLYER_MARKER = "CREATIVE-DIRECTOR-FLYER-PRESET";

export type FlyerCreativePresetId = `cd_${string}`;

export type FlyerCreativePreset = {
  id: FlyerCreativePresetId;
  label: string;
  category: string;
  layoutHint: string;
  visualHint: string;
  typoHint: string;
  copyHint: string;
};

function brandHint(business: BusinessProfile): string {
  const accent = getBrandSecondary(business) || "#F26522";
  const primary = getBrandPrimary(business) || "#0B1F3A";
  return `Brand primary ${primary}, accent ${accent} — CTA pill, glows, UI accents.`;
}

function fmtLabel(format: VideoFormat): string {
  return `${format} (${FORMAT_RATIOS[format].label})`;
}

/** Core 50 presets — each is a distinct agency look */
const PRESET_DATA: Omit<FlyerCreativePreset, "id">[] = [
  { label: "Premium Fintech UI", category: "fintech", layoutHint: "Dense grid: hero headline upper-left, 3D coins/devices center, glass market panel right, stats bar, glowing CTA pill center-lower, contact footer strip bottom.", visualHint: "Near-black matte, electric blue + purple neon, glassmorphism, chart grid at 15% opacity.", typoHint: "Geometric sans Black — gradient keyword in headline.", copyHint: "Power headline with one gradient word; promo glass card mid; feature icon row." },
  { label: "Dark SaaS + Phone Mockups", category: "saas", layoutHint: "Charcoal canvas, headline top-left, three tilted phone mockups center with UI glow borders, wide CTA pill lower-center, contact footer bottom.", visualHint: "Matte charcoal, accent orange glow on devices, isometric cube wireframes in corners.", typoHint: "Bold white sans left-aligned; subhead lighter weight.", copyHint: "Headline + subhead stack left; phones show abstract dashboards only." },
  { label: "Cinematic Luxury Night", category: "luxury", layoutHint: "Centered editorial: brand top, split serif headline, tagline, night hero photo mid, gold-framed offer, CTA, contact footer.", visualHint: "Chiaroscuro night photography, teal + muted gold, wet reflections.", typoHint: "Serif + tracked gold caps with thin rules.", copyHint: "Split headline: first word teal serif, rest gold caps." },
  { label: "Swiss Minimal Grid", category: "minimal", layoutHint: "Strict grid: oversized headline left third, hero product right, thin rules, small CTA rectangle, contact block bottom-left aligned to grid.", visualHint: "Off-white or soft gray field, one accent color, lots of negative space.", typoHint: "Helvetica/Neue style — tight tracking, black on white.", copyHint: "Restrained copy hierarchy; maximum 4 text zones." },
  { label: "Neon Gradient Burst", category: "bold", layoutHint: "Diagonal gradient mesh background, headline overlapping hero subject, floating CTA chip, contact on dark glass bar bottom.", visualHint: "Vivid magenta-cyan-orange gradient mesh, soft bloom, Gen-Z premium.", typoHint: "Extra-bold rounded sans, white or deep navy on gradient panels.", copyHint: "Short punchy headline; emoji-free; high energy CTA." },
  { label: "Editorial Magazine Cover", category: "editorial", layoutHint: "Full-bleed photo, masthead brand top, cover-line headline lower-third, deck subhead, CTA bar, contact in masthead footer.", visualHint: "High-fashion editorial crop, film grain subtle, Vogue/Bloomberg feel.", typoHint: "Didone serif headline + grotesque subheads.", copyHint: "Magazine cover-lines style; business name as masthead." },
  { label: "Glassmorphism Mobile App", category: "app", layoutHint: "Blurred colorful backdrop, frosted cards for headline and features, app icon zone top, CTA button card, contact on frosted footer.", visualHint: "iOS-style blur panels, soft pastels behind glass.", typoHint: "SF Pro style clean sans throughout.", copyHint: "Feature bullets as short typeset labels on glass tiles." },
  { label: "Brutalist Typographic", category: "bold", layoutHint: "Oversized headline dominates 70% width, small hero inset, stark CTA block, contact in monospace row at bottom.", visualHint: "Concrete gray or stark white, one brutal accent, hard shadows.", typoHint: "Ultra-bold grotesque, tight leading, optional mono footer.", copyHint: "Headline IS the visual; minimal supporting copy." },
  { label: "Warm Bakery / Food Hero", category: "food", layoutHint: "Warm hero food photography top 55%, headline on cream band, offer ribbon, CTA, contact footer on wood texture strip.", visualHint: "Golden hour food styling, steam, shallow DOF, appetizing warmth.", typoHint: "Friendly rounded serif headline + clean sans body.", copyHint: "Sensory tagline; grand opening or promo as ribbon text." },
  { label: "Real Estate Aerial", category: "property", layoutHint: "Aerial property hero, headline on semi-transparent navy band left, price/offer block, CTA, contact footer white bar.", visualHint: "Blue hour aerial, luxury villa, lens flare subtle.", typoHint: "Elegant serif + light sans; gold accent on price.", copyHint: "Location as hero subhead; offer in framed box." },
  { label: "Fitness Energy Diagonal", category: "fitness", layoutHint: "Diagonal split: dark triangle with headline, photo triangle with athlete, CTA band across seam, contact bottom.", visualHint: "High contrast, electric lime or red accent, motion blur subtle.", typoHint: "Condensed bold sans, italic CTA.", copyHint: "Power words; urgency CTA." },
  { label: "Beauty Skincare Soft", category: "beauty", layoutHint: "Soft pastel gradient, product center, headline above product, benefit line, CTA pill, contact delicate footer.", visualHint: "Pearlescent highlights, cream and blush tones, spa luxury.", typoHint: "Thin serif + light sans, generous letter-spacing.", copyHint: "Benefit-led tagline; minimal words." },
  { label: "Crypto Exchange Dark", category: "fintech", layoutHint: "Dark UI dashboard aesthetic, headline left, live chart decorative right, bonus card, CTA, contact strip.", visualHint: "Purple-green candlestick glow, dark #0a0a12 base.", typoHint: "Tech sans numerals tabular for stats.", copyHint: "Bonus % as hero secondary; trust micro-labels." },
  { label: "Fashion Runway", category: "fashion", layoutHint: "Full-bleed model, brand vertical left margin, headline bottom-left white on gradient scrim, CTA, contact vertical or bottom.", visualHint: "High contrast B&W photo with one color accent.", typoHint: "High-fashion serif, extreme size contrast.", copyHint: "Season/collection line; minimal copy." },
  { label: "Kids / Family Bright", category: "retail", layoutHint: "Bright flat illustration + photo blend, playful headline top, balloons/shapes, CTA button chunky, contact friendly footer.", visualHint: "Primary colors balanced, rounded shapes, cheerful.", typoHint: "Rounded bold sans — still typeset, not hand-drawn.", copyHint: "Welcoming tone; event date prominent if applicable." },
  { label: "Medical Clean Trust", category: "health", layoutHint: "White and soft blue, headline left, trustworthy photo right, icon row trust badges, CTA, contact footer with credentials line.", visualHint: "Clinical clean, soft shadows, teal accent.", typoHint: "Humanist sans — approachable, readable.", copyHint: "Trust tagline; hours or booking CTA." },
  { label: "Automotive Showroom", category: "auto", layoutHint: "Car hero 3/4 angle, headline top-right on dark gradient, spec line, CTA, contact dealer footer.", visualHint: "Showroom lighting, reflective floor, metallic paint pop.", typoHint: "Wide sans headline, silver or white type.", copyHint: "Model name as headline; offer financing line." },
  { label: "Restaurant Night Bistro", category: "hospitality", layoutHint: "Dark moody interior photo, headline gold center, menu hook line, reservation CTA, contact footer.", visualHint: "Candlelight bokeh, deep burgundy and gold.", typoHint: "Script-free serif elegance — typeset only.", copyHint: "Reservation CTA; hours in footer." },
  { label: "E-commerce Flash Sale", category: "retail", layoutHint: "Split red/yellow promo band, HUGE discount headline, product cluster, countdown feel CTA, contact small footer.", visualHint: "Bold sale graphics, starburst optional, high urgency.", typoHint: "Ultra-bold sans, black on yellow or white on red.", copyHint: "Discount % dominant; limited time words." },
  { label: "Travel Wanderlust", category: "travel", layoutHint: "Destination hero full bleed, headline on postcard frame, subhead, CTA book now, contact agency footer.", visualHint: "Saturated sky, travel postcard border, wanderlust grade.", typoHint: "Mixed serif headline + sans body.", copyHint: "Destination name large; package offer sub." },
  { label: "Education / Course Launch", category: "education", layoutHint: "Instructor photo + classroom visual, headline left, bullet value props typeset, enroll CTA, contact footer.", visualHint: "Bright optimistic, blue and yellow accents.", typoHint: "Clean geometric sans hierarchy.", copyHint: "Course name headline; start date." },
  { label: "Wedding / Event Elegant", category: "event", layoutHint: "Floral soft border, centered headline, date line, venue line, RSVP CTA, contact footer.", visualHint: "Soft blush ivory, botanical accents, romantic.", typoHint: "Refined serif centered — digital typeset.", copyHint: "Names or event title; date/time exact." },
  { label: "Tech Product Launch", category: "tech", layoutHint: "Product hero floating, headline above, feature callouts left/right, pre-order CTA, contact bottom.", visualHint: "Apple-style clean, soft gray gradient, product rim light.", typoHint: "SF Pro wide tracking headline.", copyHint: "Product name as headline; one killer feature." },
  { label: "Organic / Eco Green", category: "sustainability", layoutHint: "Natural texture background, headline left, leaf motifs, CTA green pill, contact footer on craft paper tone.", visualHint: "Earth tones, green accents, natural light photo.", typoHint: "Organic sans + light serif pairing.", copyHint: "Eco tagline; certification line optional." },
  { label: "Nightclub / Entertainment", category: "nightlife", layoutHint: "Dark with laser accents, headline explosive center, date/DJ line, ticket CTA, contact bottom.", visualHint: "Neon pink/blue on black, smoke haze.", typoHint: "Bold extended sans, neon glow on type edges OK as effect not hand-drawn.", copyHint: "Event date prominent; venue." },
  { label: "Insurance / Corporate", category: "corporate", layoutHint: "Navy header band with headline, photo family/trust center, benefit icons, CTA, contact compliance footer.", visualHint: "Trust blue, white, subtle gold.", typoHint: "Corporate grotesque — sober, clear.", copyHint: "Protection tagline; phone prominent." },
  { label: "Pet Care Friendly", category: "services", layoutHint: "Pet photo hero, headline playful, services line, book CTA, contact footer with hours.", visualHint: "Bright studio pet photo, teal or coral accent.", typoHint: "Rounded friendly sans.", copyHint: "Pet business name; caring tone." },
  { label: "Architecture Studio", category: "design", layoutHint: "Building render photo, headline minimal bottom-left, project line, inquire CTA, contact footer.", visualHint: "Desaturated architectural photo, black white accent.", typoHint: "Architectural grotesque, small caps labels.", copyHint: "Studio name; project type." },
  { label: "Coffee Shop Artisan", category: "food", layoutHint: "Top-down coffee art photo, headline on kraft band, offer, CTA, contact footer.", visualHint: "Warm browns, craft texture, steam.", typoHint: "Retro serif + clean sans — typeset.", copyHint: "Grand opening or daily special." },
  { label: "Jewelry Luxury Macro", category: "luxury", layoutHint: "Macro jewelry hero black velvet, headline minimal top, collection line, CTA, contact discreet footer.", visualHint: "Black velvet, sparkle highlights, gold type.", typoHint: "Thin serif, wide spacing.", copyHint: "Collection name; exclusivity." },
  { label: "Sports Team Spirit", category: "sports", layoutHint: "Action photo full bleed, headline angled dynamic, score/event line, ticket CTA, contact footer.", visualHint: "Team colors bold, motion energy.", typoHint: "Condensed athletic sans.", copyHint: "Game day; team name." },
  { label: "Pharmacy / Wellness Promo", category: "health", layoutHint: "Product grid small, headline offer top, percent off badge, CTA, contact footer.", visualHint: "Clean white green cross accent.", typoHint: "Readable sans hierarchy.", copyHint: "Offer % ; valid dates." },
  { label: "Startup Pitch Bold", category: "startup", layoutHint: "Abstract 3D shapes, headline left massive, traction stat, CTA, contact bottom.", visualHint: "Purple blue startup gradient, YC deck aesthetic.", typoHint: "Inter bold + mono stats.", copyHint: "One stat hero; signup CTA." },
  { label: "Black Friday Retail", category: "retail", layoutHint: "Black gold palette, HUGE sale headline, product peek, shop CTA, contact footer.", visualHint: "Black Friday gold foil effect on type OK as render.", typoHint: "Ultra bold gold on black.", copyHint: "SALE headline; dates." },
  { label: "Interior Design Mood", category: "design", layoutHint: "Room hero, headline on white panel overlay, style tag, consult CTA, contact.", visualHint: "Scandinavian or luxe interior, soft neutrals.", typoHint: "Editorial serif headline.", copyHint: "Style descriptor; book consult." },
  { label: "Music Festival Poster", category: "event", layoutHint: "Illustrated poster style but typeset text, lineup headline, date block, ticket CTA, contact.", visualHint: "Retro poster gradients, halftone optional.", typoHint: "Bold poster sans — still crisp vector type.", copyHint: "Festival name; date city." },
  { label: "Legal / Law Firm", category: "corporate", layoutHint: "City skyline muted, headline serif left, practice line, consult CTA, contact footer formal.", visualHint: "Navy burgundy trust palette.", typoHint: "Traditional serif authority.", copyHint: "Firm name; practice area." },
  { label: "Grocery / Supermarket", category: "retail", layoutHint: "Fresh produce burst, headline offer banner, price point, CTA, contact store footer.", visualHint: "Fresh vibrant greens reds, market energy.", typoHint: "Bold friendly sans.", copyHint: "Weekly deals headline." },
  { label: "Gaming / Esports", category: "gaming", layoutHint: "Character render hero, headline glitch-edge OK as effect, rank/event line, CTA, contact.", visualHint: "RGB gaming lights, dark arena.", typoHint: "Aggressive angular sans.", copyHint: "Game title; play now." },
  { label: "Solar / Energy Green Tech", category: "energy", layoutHint: "Home with solar hero, headline savings, stat callout, quote CTA, contact footer.", visualHint: "Sky blue panels green accent.", typoHint: "Clean tech sans.", copyHint: "Savings %; free quote." },
  { label: "Florist / Botanical", category: "retail", layoutHint: "Floral wreath frame, centered headline, occasion line, order CTA, contact.", visualHint: "Soft botanical photo, pastel.", typoHint: "Elegant script-free serif.", copyHint: "Occasion; delivery CTA." },
  { label: "Watch / Accessories Lux", category: "luxury", layoutHint: "Watch macro, headline small caps top, heritage line, boutique CTA, contact.", visualHint: "Dark slate, silver dial highlight.", typoHint: "Small caps tracked.", copyHint: "Heritage since line." },
  { label: "Delivery / Logistics", category: "services", layoutHint: "Van/route graphic, headline fast delivery, tracking CTA, contact hotline footer.", visualHint: "Orange blue logistics palette.", typoHint: "Bold sans urgency.", copyHint: "Speed promise; phone large." },
  { label: "Book Launch / Author", category: "media", layoutHint: "Book 3D mockup center, title headline, author line, buy CTA, contact.", visualHint: "Literary moody background.", typoHint: "Serif title typography.", copyHint: "Book title; author name." },
  { label: "Holiday Seasonal", category: "seasonal", layoutHint: "Seasonal motifs subtle, headline festive, gift offer, shop CTA, contact.", visualHint: "Season appropriate palette without clip art mess.", typoHint: "Warm friendly sans.", copyHint: "Holiday greeting + offer." },
  { label: "Art Gallery Exhibition", category: "culture", layoutHint: "Gallery white cube, artwork on wall, headline minimal, dates, visit CTA, contact.", visualHint: "Gallery white, black type.", typoHint: "Minimal modern sans.", copyHint: "Exhibition title; dates." },
  { label: "Mobile Money / Africa Fintech", category: "fintech", layoutHint: "Vibrant African premium pattern subtle, phone UI, headline, trust badges, CTA, contact.", visualHint: "Green gold vibrant, Lagos fintech premium.", typoHint: "Clean bold sans.", copyHint: "Send money / pay bills hook." },
  { label: "Construction / Industrial", category: "industrial", layoutHint: "Site photo, headline bold yellow on dark, safety trust line, quote CTA, contact.", visualHint: "Steel orange hard hat accents.", typoHint: "Stencil-inspired but typeset sans.", copyHint: "Built to last tagline." },
  { label: "Podcast / Media Show", category: "media", layoutHint: "Host photo + waveform graphic, show title headline, episode hook, listen CTA, contact.", visualHint: "Dark studio mic purple accent.", typoHint: "Bold podcast sans.", copyHint: "Show name; new episode." },
  { label: "Luxury Spa Wellness", category: "wellness", layoutHint: "Spa photo serene, headline thin serif, package line, book CTA, contact.", visualHint: "Water stone bamboo calm.", typoHint: "Light serif airy.", copyHint: "Package name; relax CTA." },
  { label: "Agriculture / Agro", category: "agriculture", layoutHint: "Field harvest golden hour, headline green, yield/trust line, CTA, contact.", visualHint: "Golden green earth tones.", typoHint: "Sturdy sans.", copyHint: "Fresh from farm." },
  { label: "Vintage Retro Print", category: "retro", layoutHint: "Retro halftone texture, headline bold retro sans, starburst badge, CTA, contact.", visualHint: "70s warm ink colors — typeset not hand.", typoHint: "Retro bold sans.", copyHint: "Retro sale vibe." },
  { label: "Minimal Japanese Zen", category: "minimal", layoutHint: "Asymmetric white space, small headline, red circle accent, CTA minimal, contact tiny footer.", visualHint: "Wabi-sabi white, one red accent.", typoHint: "Clean geometric sans.", copyHint: "Less is more copy." },
  { label: "Dual Panel Split", category: "layout", layoutHint: "50/50 vertical split color left type right photo, CTA span bottom, contact full width footer.", visualHint: "Bold color block + photo contrast.", typoHint: "Contrast type colors per panel.", copyHint: "Split layout headline left." },
  { label: "Holographic Iridescent", category: "bold", layoutHint: "Iridescent foil background, headline center, product float, CTA, contact.", visualHint: "Holographic gradient mesh trendy.", typoHint: "Bold sans dark on light shift.", copyHint: "New drop energy." },
  { label: "Professional Services B2B", category: "corporate", layoutHint: "Team photo office, headline value prop, three icon benefits, demo CTA, contact.", visualHint: "Corporate blue white trustworthy.", typoHint: "B2B sans professional.", copyHint: "ROI value headline." },
  { label: "Streetwear Drop", category: "fashion", layoutHint: "Urban wall texture, headline massive, drop date, shop CTA, contact.", visualHint: "Gritty urban flash photography.", typoHint: "Street bold sans.", copyHint: "DROP date; limited." },
  { label: "Charity / NGO Impact", category: "nonprofit", layoutHint: "Emotional photo, headline hope, impact stat, donate CTA, contact.", visualHint: "Warm human documentary style.", typoHint: "Hopeful clean sans.", copyHint: "Impact number; donate." },
];

export const FLYER_CREATIVE_PRESETS: FlyerCreativePreset[] = PRESET_DATA.map(
  (p, i) => ({
    ...p,
    id: `cd_${String(i + 1).padStart(2, "0")}` as FlyerCreativePresetId,
  })
);

export const PRESET_COUNT = FLYER_CREATIVE_PRESETS.length;

const PRESET_BY_ID = new Map(
  FLYER_CREATIVE_PRESETS.map((p) => [p.id, p])
);

const LEGACY_TRIAL_MAP: Record<string, FlyerCreativePresetId> = {
  trial2: "cd_02",
  trial3: "cd_03",
  trial4: "cd_01",
  "2": "cd_02",
  "3": "cd_03",
  "4": "cd_01",
};

export function normalizePresetId(
  id?: string | null
): FlyerCreativePresetId | undefined {
  if (!id) return undefined;
  const key = id.trim().toLowerCase();
  if (LEGACY_TRIAL_MAP[key]) return LEGACY_TRIAL_MAP[key];
  if (PRESET_BY_ID.has(key as FlyerCreativePresetId)) {
    return key as FlyerCreativePresetId;
  }
  return undefined;
}

export function getFlyerCreativePreset(
  id: FlyerCreativePresetId
): FlyerCreativePreset {
  return PRESET_BY_ID.get(id) ?? FLYER_CREATIVE_PRESETS[0];
}

export function getPresetLabel(id: FlyerCreativePresetId): string {
  return getFlyerCreativePreset(id).label;
}

function hashString(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (h * 31 + s.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

const CATEGORY_PRESET_INDEX: Record<string, number[]> = {
  fintech: [0, 11, 45],
  saas: [1, 19, 46],
  luxury: [2, 9, 14, 30],
  food: [7, 26, 27, 68, 57],
  restaurant: [7, 57, 68],
  hospitality: [57, 7, 68],
  retail: [12, 16, 35, 36],
  fashion: [10, 13, 48],
  event: [19, 31, 32],
  health: [14, 28],
  corporate: [24, 33, 47],
  tech: [5, 18],
  property: [8],
  fitness: [9],
  beauty: [10],
  minimal: [3, 49],
  bold: [4, 6, 50],
};

export function resolveFlyerCreativePreset(
  business: BusinessProfile,
  override?: FlyerCreativePresetId | string
): FlyerCreativePresetId {
  const normalized = normalizePresetId(override);
  if (normalized) return normalized;

  const explicit = process.env.REFERENCE_FLYER_STYLE?.trim().toLowerCase();
  const fromEnv = normalizePresetId(explicit);
  if (fromEnv) return fromEnv;

  const ind = (business.industry || "").toLowerCase();
  const preset = business.adStylePreset?.trim().toLowerCase() || "";

  for (const [cat, indices] of Object.entries(CATEGORY_PRESET_INDEX)) {
    if (ind.includes(cat) || preset.includes(cat)) {
      const idx = indices[hashString(business.businessName || "") % indices.length];
      return FLYER_CREATIVE_PRESETS[idx].id;
    }
  }

  if (/saas|software|app|startup|agency|mysogi/.test(ind)) return "cd_02";
  if (/crypto|fintech|finance|bank/.test(ind)) return "cd_01";
  if (/real estate|property|hotel|auto|luxury/.test(ind)) return "cd_03";
  if (preset === "luxury" || preset === "real_estate") return "cd_03";
  if (preset === "saas" || preset === "dark") return "cd_02";
  if (preset === "futuristic" || preset === "finance" || preset === "tech") {
    return "cd_01";
  }

  const h = hashString(
    `${ind}|${preset}|${business.businessName || ""}|${business.campaignType || ""}`
  );
  return FLYER_CREATIVE_PRESETS[h % PRESET_COUNT].id;
}

export function resolveAlternateFlyerPreset(
  primary: FlyerCreativePresetId
): FlyerCreativePresetId {
  const idx = FLYER_CREATIVE_PRESETS.findIndex((p) => p.id === primary);
  const offset = 17;
  const next = (idx + offset + PRESET_COUNT) % PRESET_COUNT;
  return FLYER_CREATIVE_PRESETS[next].id;
}

export function buildPresetLayoutBlueprint(
  preset: FlyerCreativePreset,
  format: VideoFormat
): string {
  return [
    `PRESET ${preset.id.toUpperCase()} — ${preset.label}:`,
    `Format ${fmtLabel(format)}.`,
    preset.layoutHint,
    "BOTTOM 10–15%: integrated contact footer — location, phone, email, website as crisp typeset lines (digital fonts, NOT hand-drawn).",
    "CTA must sit above contact band with clear spacing.",
  ].join(" ");
}

export function buildPresetVisualSystem(
  preset: FlyerCreativePreset,
  business: BusinessProfile
): string {
  return [
    `VISUAL SYSTEM — ${preset.label}:`,
    preset.visualHint,
    brandHint(business),
    "Agency-grade finish — layered depth, intentional lighting, no Canva template feel.",
  ].join(" ");
}

export function buildPresetTypographyBlock(
  preset: FlyerCreativePreset,
  business: BusinessProfile
): string {
  const name = business.businessName?.trim() || "Brand";
  return [
    `TYPOGRAPHY — ${preset.label}:`,
    preset.typoHint,
    buildTypesetTextMasterRules(),
    `Business name "${name}" as typeset headline text only — never as a logo graphic or logomark.`,
  ].join(" ");
}

export function buildPresetCopyStructure(
  preset: FlyerCreativePreset,
  business: BusinessProfile,
  copy: CampaignCopy,
  format: VideoFormat
): string {
  const name = business.businessName?.trim() || copy.headline?.trim() || "Brand";
  const tagline = copy.tagline?.trim();
  const cta = copy.cta?.trim();

  return [
    `EXACT TYPESET COPY — ${preset.label} (spell every character perfectly):`,
    preset.copyHint,
    `HERO HEADLINE (largest typeset layer): "${name}"`,
    tagline ? `SUBHEAD / TAGLINE: "${tagline}"` : "",
    cta ? `CTA BUTTON (real UI pill with typeset label inside): "${cta}"` : "",
    buildIntegratedContactTypesetBlock(business, copy, format),
    "NO extra marketing sentences beyond listed phrases.",
  ]
    .filter(Boolean)
    .join(" ");
}

export type ReferenceFlyerPromptBlocks = {
  styleId: FlyerCreativePresetId;
  styleLabel: string;
  system: string;
  layout: string;
  visual: string;
  typography: string;
  copyStructure: string;
  quality: string;
};

export function buildReferenceFlyerPromptBlocks(
  business: BusinessProfile,
  copy: CampaignCopy,
  format: VideoFormat,
  styleOverride?: FlyerCreativePresetId | string
): ReferenceFlyerPromptBlocks {
  const styleId = resolveFlyerCreativePreset(business, styleOverride);
  const preset = getFlyerCreativePreset(styleId);

  return {
    styleId,
    styleLabel: preset.label,
    system: [
      `${REFERENCE_FLYER_MARKER} — ${preset.label} (${preset.category}).`,
      "Paid creative director output — complete finished flyer in ONE image.",
      "Every word including contact is premium digital typeset inside the artwork — NO SVG overlays.",
      buildTypesetTextMasterRules(),
    ].join(" "),
    layout: buildPresetLayoutBlueprint(preset, format),
    visual: buildPresetVisualSystem(preset, business),
    typography: buildPresetTypographyBlock(preset, business),
    copyStructure: buildPresetCopyStructure(preset, business, copy, format),
    quality: [
      `OUTPUT: ${preset.label} — world-class integrated ad, ${fmtLabel(format)}.`,
      "Multi-layer composition with typeset headline, body, CTA, and contact footer.",
      "FORBIDDEN: hand-drawn text, painted letters, SVG-style pasted text, missing contact, Canva template slop.",
    ].join(" "),
  };
}

export function buildReferenceFlyerPromptBlock(
  business: BusinessProfile,
  copy: CampaignCopy,
  format: VideoFormat,
  styleOverride?: FlyerCreativePresetId | string
): string {
  const b = buildReferenceFlyerPromptBlocks(business, copy, format, styleOverride);
  return [b.system, b.layout, b.visual, b.typography, b.copyStructure, b.quality].join(
    "\n\n"
  );
}

/** @deprecated use FlyerCreativePresetId */
export type ReferenceFlyerStyleId = FlyerCreativePresetId;

export function isReferenceFlyerStyleEnabled(): boolean {
  const v = process.env.REFERENCE_FLYER_STYLE?.trim().toLowerCase();
  if (v === "false" || v === "off") return false;
  return true;
}

export function resolveReferenceFlyerStyle(
  business: BusinessProfile,
  override?: ReferenceFlyerStyleId | string
): ReferenceFlyerStyleId {
  return resolveFlyerCreativePreset(business, override);
}

export function resolveAlternateReferenceStyle(
  primary: ReferenceFlyerStyleId
): ReferenceFlyerStyleId {
  return resolveAlternateFlyerPreset(primary);
}

export const REFERENCE_STYLE_LABELS: Record<string, string> =
  Object.fromEntries(
    FLYER_CREATIVE_PRESETS.map((p) => [p.id, p.label])
  );
