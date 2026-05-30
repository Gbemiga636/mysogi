/**
 * Reference flyer styles — encoded from client trial ads (trial 2, 3, 4).
 * Trial 4 = primary target: dense premium fintech UI ad (NEXORA-style).
 * Trial 2 = dark SaaS + phone mockups (Mysogi-style).
 * Trial 3 = cinematic luxury night editorial (FORSAGEE-style).
 */

import type { CampaignCopy } from "./campaignTextLayers";
import { getBrandPrimary, getBrandSecondary } from "./brandColors";
import type { BusinessProfile, VideoFormat } from "./types";
import { FORMAT_RATIOS } from "./types";

export const REFERENCE_FLYER_MARKER = "REFERENCE-FLYER-STYLE";

export type ReferenceFlyerStyleId = "trial2" | "trial3" | "trial4";

export function isReferenceFlyerStyleEnabled(): boolean {
  const v = process.env.REFERENCE_FLYER_STYLE?.trim().toLowerCase();
  if (v === "false" || v === "off") return false;
  return true;
}

export function resolveReferenceFlyerStyle(
  business: BusinessProfile,
  override?: ReferenceFlyerStyleId
): ReferenceFlyerStyleId {
  if (override) return override;

  const explicit = process.env.REFERENCE_FLYER_STYLE?.trim().toLowerCase();
  if (explicit === "trial2" || explicit === "2") return "trial2";
  if (explicit === "trial3" || explicit === "3") return "trial3";
  if (explicit === "trial4" || explicit === "4") return "trial4";

  const ind = (business.industry || "").toLowerCase();
  const name = (business.businessName || "").toLowerCase();
  const preset = business.adStylePreset?.trim().toLowerCase();

  if (/auto|car|rental|motor|vehicle|luxury transport/.test(ind)) return "trial3";
  if (/real estate|property|estate|hotel|hospitality/.test(ind)) return "trial3";

  if (
    /advertis|marketing|saas|software|app|platform|startup|agency|mysogi/.test(
      ind + name
    )
  ) {
    return "trial2";
  }

  if (
    /crypto|web3|exchange|trading|fintech|finance|bank|blockchain/.test(ind)
  ) {
    return "trial4";
  }

  if (preset === "luxury" || preset === "real_estate") return "trial3";
  if (preset === "saas" || preset === "dark") return "trial2";
  if (preset === "futuristic" || preset === "finance" || preset === "tech") {
    return "trial4";
  }

  /** Default: trial 4 — dense premium fintech UI ad (client primary reference) */
  return "trial4";
}

export function resolveAlternateReferenceStyle(
  primary: ReferenceFlyerStyleId
): ReferenceFlyerStyleId {
  const alternates: Record<ReferenceFlyerStyleId, ReferenceFlyerStyleId> = {
    trial2: "trial4",
    trial3: "trial2",
    trial4: "trial3",
  };
  return alternates[primary];
}

export const REFERENCE_STYLE_LABELS: Record<ReferenceFlyerStyleId, string> = {
  trial2: "Dark SaaS + Phone Mockups",
  trial3: "Cinematic Luxury Night",
  trial4: "Premium Fintech UI Ad",
};

function brandAccentHint(business: BusinessProfile): string {
  const accent = getBrandSecondary(business) || "#F26522";
  const primary = getBrandPrimary(business) || "#0B1F3A";
  return `Brand primary ${primary}, accent ${accent} — use accent for CTA pill, glows, UI borders, and hero rim light.`;
}

export function buildTrial4LayoutBlueprint(format: VideoFormat): string {
  const fmt = FORMAT_RATIOS[format].label;
  return [
    "TRIAL 4 REFERENCE LAYOUT — NEXORA-style premium fintech exchange ad (Behance agency quality):",
    `Format ${format} (${fmt}). Dense multi-zone grid — organized, NOT cluttered.`,
    "[TOP-LEFT 0–8%] Small brand name label zone (logo composited after — leave calm dark corner).",
    "[UPPER-LEFT 10–38%] MASSIVE HERO HEADLINE — extra-bold geometric sans, 2–3 lines max, left-aligned.",
    "One power word in headline uses blue-to-purple gradient fill (like 'BEYOND' in reference).",
    "[CENTER 35–65%] 3D hero visual — floating product icons/coins/devices on glowing circular pedestal with bloom.",
    "[RIGHT 30–70%] Glassmorphism 'Live Market' or stats panel — candlestick chart shapes, price rows (decorative numbers OK).",
    "[MID 55–68%] Promo glass card — e.g. welcome bonus or key offer in glowing bordered box.",
    "[MID-LOW 68–78%] Three feature icon row — Secure / Fast / Smart (or industry equivalents) with thin line icons.",
    "[LOW 72–80%] Horizontal glass stats bar — 4 metrics with icons (users, pairs, countries, security).",
    "[LOWER-CENTER 46–62%] Large glowing CTA pill button — center, neon edge bloom, bold label inside. MUST stay above footer reserve.",
    "[BOTTOM 70–100%] Calm dark strip — reserved for SVG contact footer overlay (no phone/email/CTA in image).",
    "Layer depth: background chart grid → midground 3D hero → foreground UI panels and type.",
  ].join(" ");
}

export function buildTrial2LayoutBlueprint(format: VideoFormat): string {
  const fmt = FORMAT_RATIOS[format].label;
  return [
    "TRIAL 2 REFERENCE LAYOUT — Mysogi-style dark SaaS marketing ad:",
    `Format ${format} (${fmt}). Matte charcoal near-black background.`,
    "[TOP-LEFT] Headline block — bold white sans, left-aligned, 2 lines max.",
    "[TOP-LEFT under headline] Subheadline — lighter weight, left-aligned, generous line-height.",
    "[CENTER 40–72%] Three overlapping smartphone mockups at dynamic angles — UI dashboards visible on screens.",
    "Phones framed with vibrant accent glow borders; floating accent rectangles for depth.",
    "[LOWER-CENTER 46–62%] Wide rounded CTA pill — accent fill, dark bold label, soft outer glow. Never overlap footer band.",
    "[BOTTOM 70–100%] Calm band for SVG contact footer — geometric wireframe cubes in corners at low opacity.",
    "Corner accents: thin isometric cube outlines + dot-grid patterns in accent color (8% opacity).",
  ].join(" ");
}

export function buildTrial3LayoutBlueprint(format: VideoFormat): string {
  const fmt = FORMAT_RATIOS[format].label;
  return [
    "TRIAL 3 REFERENCE LAYOUT — FORSAGEE-style cinematic luxury night ad:",
    `Format ${format} (${fmt}). Centered symmetrical editorial composition.`,
    "[TOP-CENTER] Brand name — elegant serif + accent icon feel, centered.",
    "[UPPER-CENTER 12–32%] Split headline: first word large high-contrast SERIF in teal; second word tracked CAPS sans in gold with thin gold horizontal rules flanking.",
    "[CENTER 34–42%] Tagline — small caps sans, teal, centered.",
    "[MID 45–78%] Cinematic hero photograph — luxury vehicles/property/people at night, chiaroscuro lighting, reflections on wet pavement.",
    "[LOWER 68–76%] Pricing or offer block — gold thin rectangular frame, large serif number + small caps labels.",
    "[LOWER-CENTER 46–60%] CTA 'BOOK NOW' in gold — center aligned, above footer reserve.",
    "[BOTTOM 70–100%] Dark calm strip for SVG contact footer only.",
    "Palette: deep black, rich teal (#2D6A6A), muted metallic gold. Night sky, warm villa glow, rim-lit hero.",
  ].join(" ");
}

export function buildTrial4VisualSystem(business: BusinessProfile): string {
  return [
    "TRIAL 4 VISUAL SYSTEM (match reference exactly):",
    "Near-black matte background (#050508 to #0a0a12).",
    "Electric blue (#4F7CFF) + purple (#9B59FF) neon accents — controlled bloom, not garish.",
    "Glassmorphism: frosted semi-transparent UI cards, thin glowing borders, backdrop blur.",
    "3D rendered hero objects with realistic shadows on glowing pedestal.",
    "Decorative candlestick chart grid at 15% opacity behind hero.",
    "Neon edge rim on CTA and key UI panels; subtle particle haze.",
    brandAccentHint(business),
    "NOT: flat template, Canva layout, hand-drawn type, white background, amateur spacing.",
  ].join(" ");
}

export function buildTrial2VisualSystem(business: BusinessProfile): string {
  return [
    "TRIAL 2 VISUAL SYSTEM (match reference exactly):",
    "Matte charcoal / near-black background with subtle depth gradient.",
    "Vibrant orange accent glow on phone borders and CTA (use brand accent if set).",
    brandAccentHint(business),
    "Isometric wireframe cube outlines in top-right and bottom-left corners.",
    "Dot-grid pattern accents in accent color at low opacity.",
    "Realistic phone mockups with tilt — dashboard UI on screens, premium SaaS polish.",
    "Clean white typography on dark — high contrast, left-aligned editorial grid.",
  ].join(" ");
}

export function buildTrial3VisualSystem(business: BusinessProfile): string {
  return [
    "TRIAL 3 VISUAL SYSTEM (match reference exactly):",
    "Cinematic night photography — low-key lighting, dramatic chiaroscuro.",
    "Deep black shadows, rich teal typography accents, muted metallic gold details.",
    "Wet reflective surfaces, volumetric light from architecture, palm silhouettes optional.",
    "High-end editorial grade — luxury automotive / real estate campaign quality.",
    brandAccentHint(business),
    "Typography integrated into composition — serif + sans pairing, gold rules and frames.",
  ].join(" ");
}

export function buildReferenceCopyStructure(
  style: ReferenceFlyerStyleId,
  business: BusinessProfile,
  copy: CampaignCopy
): string {
  const name = business.businessName?.trim() || copy.headline?.trim() || "Brand";
  const tagline = copy.tagline?.trim();
  const cta = copy.cta?.trim();

  if (style === "trial4") {
    const accentWord =
      tagline?.split(/\s+/).find((w) => w.length >= 4)?.toUpperCase() ||
      name.split(/\s+/).pop()?.toUpperCase() ||
      "PRO";
    return [
      "EXACT TYPESET COPY (Trial 4 fintech UI ad — spell perfectly):",
      `HERO HEADLINE (massive bold sans, upper-left): "${name.toUpperCase()}" or power headline featuring "${name}" — one keyword in blue-purple gradient (like "${accentWord}").`,
      tagline
        ? `SUBHEAD / VALUE PROP (smaller, under headline): "${tagline}"`
        : "",
      "DECORATIVE UI LABELS (small, no contact info): 'Live Market' panel header, 3 feature labels, 4 stat metrics — design-appropriate filler.",
      cta
        ? `CTA BUTTON (large glowing pill, bottom-center): "${cta.toUpperCase()}"`
        : "",
      "Promo box text if space: short offer line derived from tagline — never phone/email/URL.",
    ]
      .filter(Boolean)
      .join(" ");
  }

  if (style === "trial2") {
    return [
      "EXACT TYPESET COPY (Trial 2 dark SaaS ad — spell perfectly):",
      `HEADLINE (bold white, top-left): "${name}"${tagline ? ` — or "${name}: ${tagline.split(/\s+/).slice(0, 4).join(" ")}"` : ""}`,
      tagline
        ? `SUBHEADLINE (lighter weight, under headline): "${tagline}"`
        : "",
      cta ? `CTA PILL (accent fill, center-lower): "${cta}"` : "",
      "Phone mockup screens show abstract dashboard UI — no readable contact info.",
    ]
      .filter(Boolean)
      .join(" ");
  }

  // trial3
  const words = name.split(/\s+/);
  const first = words[0]?.toUpperCase() || name.toUpperCase();
  const rest = words.slice(1).join(" ").toUpperCase() || "PREMIUM";
  return [
    "EXACT TYPESET COPY (Trial 3 luxury night ad — spell perfectly):",
    `BRAND (top-center): "${name.toUpperCase()}"`,
    `HEADLINE SPLIT: "${first}" in large teal serif + "${rest}" in gold tracked caps with gold horizontal rules.`,
    tagline ? `TAGLINE (center, small caps teal): "${tagline.toUpperCase()}"` : "",
    cta ? `CTA (bottom-center, gold): "${cta.toUpperCase()}"` : "",
    "Optional pricing block: derive short offer from tagline in gold frame — no contact details.",
  ]
    .filter(Boolean)
    .join(" ");
}

export function buildReferenceTypographyBlock(
  style: ReferenceFlyerStyleId,
  business: BusinessProfile
): string {
  const name = business.businessName?.trim() || "Brand";

  if (style === "trial4") {
    return [
      "TYPOGRAPHY (Trial 4 — NEXORA reference):",
      "Geometric sans-serif (Montserrat/Gotham/Inter Black) — massive headline, tight line-height.",
      `Business name "${name}" as dominant hero type or integrated into power headline.`,
      "Gradient fill on one headline keyword (blue → purple). White/silver body text.",
      "CTA: bold all-caps inside glowing pill. UI labels: small caps, muted silver.",
      "Digital typesetting only — crisp kerning, NOT hand-drawn or painted letters.",
    ].join(" ");
  }

  if (style === "trial2") {
    return [
      "TYPOGRAPHY (Trial 2 — Mysogi SaaS reference):",
      `Business name "${name}" — bold modern sans, largest element, left-aligned white.`,
      "Subhead: regular/light weight, smaller, high line-height.",
      "CTA pill: bold label, dark text on accent fill.",
      "Clean Inter/Poppins hierarchy — premium startup marketing ad.",
    ].join(" ");
  }

  return [
    "TYPOGRAPHY (Trial 3 — FORSAGEE luxury reference):",
    `Brand "${name}" — centered, elegant serif + refined sans pairing.`,
    "Headline: high-contrast serif (Playfair/Cinzel feel) + tracked gold caps.",
    "Tagline: small caps teal sans. CTA: gold serif or caps.",
    "Editorial luxury — wide letter-spacing on secondary lines.",
  ].join(" ");
}

export type ReferenceFlyerPromptBlocks = {
  styleId: ReferenceFlyerStyleId;
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
  styleOverride?: ReferenceFlyerStyleId
): ReferenceFlyerPromptBlocks {
  const styleId = resolveReferenceFlyerStyle(business, styleOverride);
  const labels: Record<ReferenceFlyerStyleId, string> = {
    trial2: "Trial 2 — Dark SaaS + Phone Mockups (Mysogi)",
    trial3: "Trial 3 — Cinematic Luxury Night (FORSAGEE)",
    trial4: "Trial 4 — Premium Fintech UI Ad (NEXORA)",
  };

  const layoutFns = {
    trial2: buildTrial2LayoutBlueprint,
    trial3: buildTrial3LayoutBlueprint,
    trial4: buildTrial4LayoutBlueprint,
  };
  const visualFns = {
    trial2: buildTrial2VisualSystem,
    trial3: buildTrial3VisualSystem,
    trial4: buildTrial4VisualSystem,
  };

  return {
    styleId,
    styleLabel: labels[styleId],
    system: [
      `${REFERENCE_FLYER_MARKER} — reproduce client reference ad quality: ${labels[styleId]}.`,
      "Professional creative director output — integrated UI ad, NOT text pasted on a stock photo.",
      "Every text layer typeset inside the image with premium digital fonts.",
      "Match reference: layering, glow effects, glass panels, geometric decoration, cinematic depth.",
    ].join(" "),
    layout: layoutFns[styleId](format),
    visual: visualFns[styleId](business),
    typography: buildReferenceTypographyBlock(styleId, business),
    copyStructure: buildReferenceCopyStructure(styleId, business, copy),
    quality: [
      `OUTPUT: ${labels[styleId]} — pixel-perfect agency flyer matching client reference trials.`,
      "Multi-layer composition: dark base + 3D hero + glass UI panels + typeset headline + glowing CTA.",
      "FORBIDDEN: Canva template, centered plain stack on photo, missing text, amateur spacing, cheap clip art.",
    ].join(" "),
  };
}

export function buildReferenceFlyerPromptBlock(
  business: BusinessProfile,
  copy: CampaignCopy,
  format: VideoFormat,
  styleOverride?: ReferenceFlyerStyleId
): string {
  const b = buildReferenceFlyerPromptBlocks(business, copy, format, styleOverride);
  return [
    b.system,
    b.layout,
    b.visual,
    b.typography,
    b.copyStructure,
    b.quality,
  ].join("\n\n");
}
