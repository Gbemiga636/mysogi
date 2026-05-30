import type { BusinessProfile } from "./types";

/** Step 1 — client-requested products, people, or props (woven into scene direction) */
export function buildClientFeaturedPropsProse(business: BusinessProfile): string {
  const props = business.imageProps?.trim();
  if (!props) return "";
  return [
    `Client-requested elements (mandatory, art-directed): ${props}.`,
    "Place as hero focal or foreground props with natural scale and interaction —",
    "real hands, real surfaces, premium styling, never floating or collage-like.",
  ].join(" ");
}

/** Industry scene as flowing prose — no section headers or labels Imagen could paint */
export function buildSceneElementsProse(business: BusinessProfile): string {
  const clientProps = buildClientFeaturedPropsProse(business);
  const ind = (business.industry || "").toLowerCase();
  const trade = business.industry?.trim() || "local business";
  const market = business.location?.trim() || "a vibrant city";
  const audience = business.targetAudience?.trim() || "local customers";
  const goal = business.campaignGoal?.trim();

  const opening = [
    clientProps,
    `This image advertises a ${trade} business`,
    goal ? `focused on ${goal}` : "",
    `in ${market} for ${audience}.`,
    "Layered depth: foreground props, mid-frame hero subject, atmospheric background.",
    "Real people in natural poses, authentic emotion, premium wardrobe without logos or writing.",
    `Every object and building must belong to ${trade}, never a random unrelated industry.`,
  ]
    .filter(Boolean)
    .join(" ");

  if (/real estate|property|estate/.test(ind)) {
    return `${opening} Luxury villa or modern tower exterior, glass facade, landscaped driveway, golden-hour skyline, palm trees, marble entry, aspirational couple or agent beside the property, car in drive, keys on counter.`;
  }
  if (/food|restaurant|catering|bakery|chef/.test(ind)) {
    return `${opening} Signature dish as star on rustic table with steam and fresh herbs, warm restaurant interior, pendant lights, brick wall, chef plating or diners laughing, wine glass, busy kitchen depth, appetizing close-up.`;
  }
  if (/fashion|beauty|cosmetic|salon/.test(ind)) {
    return `${opening} Editorial model with hero product, boutique mirrors, fabric drapes, runway lighting, mannequins, makeup brushes, glossy skin, perfume reflections.`;
  }
  if (/crypto|fintech|finance|bank/.test(ind)) {
    return `${opening} Sleek finance district towers at night, glass office interior, confident professional in blazer with tablet, trading floor monitors with dark screens, city lights through windows, premium corporate realism.`;
  }
  if (/nightlife|club|bar|lounge|event/.test(ind)) {
    return `${opening} Premium nightclub interior, bottle service, DJ lights, velvet ropes, cocktails, stylish crowd celebrating, purple and amber glow, city night through windows.`;
  }
  if (/health|medical|clinic|hospital|wellness|pharma/.test(ind)) {
    return `${opening} Modern clinic reception, caring doctor with patient, clean white architecture, plants, medical equipment, soft daylight, trust and calm.`;
  }
  if (/education|school|training|course|university/.test(ind)) {
    return `${opening} Bright campus classroom, students and mentor collaborating, laptops, books, graduation caps, library shelves, achievement mood.`;
  }
  if (/tech|saas|software|app|startup/.test(ind)) {
    return `${opening} Open-plan tech office, diverse team around laptop, glass walls, plants, city view, device mockups with dark screens, innovation energy.`;
  }
  if (/auto|car|motor|garage/.test(ind)) {
    return `${opening} Showroom or coastal road, gleaming vehicle three-quarter angle, leather interior detail, driver beside car, mountain or ocean backdrop.`;
  }
  if (/travel|hotel|tourism|resort/.test(ind)) {
    return `${opening} Resort pool and ocean horizon, suite balcony, palm silhouettes, sunset sky, traveler with luggage, adventure props.`;
  }
  if (/gym|fitness|sport/.test(ind)) {
    return `${opening} Premium gym with athlete mid-action, weights, turf, dramatic rim light, mirrors, water bottle, power and discipline.`;
  }
  if (/retail|shop|store|ecommerce|market/.test(ind)) {
    return `${opening} Styled retail display, shopper smiling with product, storefront with foot traffic, shelves, shopping bags, desire to buy.`;
  }
  if (/construction|build|architect/.test(ind)) {
    return `${opening} Active construction site or finished building, cranes, blueprints on table, engineers in hard hats, steel and glass, progress and strength.`;
  }

  return `${opening} Commercial set built specifically for ${trade}: iconic product or service as focal point, matching storefront or workspace, lifestyle props, natural and studio light mix, human connection.`;
}

/** @deprecated Use buildSceneElementsProse — avoids header labels */
export function buildSceneElementsBlock(business: BusinessProfile): string {
  return buildSceneElementsProse(business);
}
