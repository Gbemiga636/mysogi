import type { EmbeddedFont } from "./flyerFontEmbed";
import type { BusinessProfile } from "./types";

export type FlyerTypeTheme = {
  id: string;
  label: string;
  headline: EmbeddedFont;
  tagline: EmbeddedFont;
  cta: EmbeddedFont;
  location: EmbeddedFont;
  contact: EmbeddedFont;
};

function font(
  family: string,
  pkg: string,
  file: string,
  weight: number
): EmbeddedFont {
  return { family, package: pkg, file, weight };
}

const bodoni700 = font(
  "Bodoni Moda",
  "bodoni-moda",
  "bodoni-moda-latin-700-normal.woff2",
  700
);

const playfair700 = font(
  "Playfair Display",
  "playfair-display",
  "playfair-display-latin-700-normal.woff2",
  700
);

const cormorant700 = font(
  "Cormorant Garamond",
  "cormorant-garamond",
  "cormorant-garamond-latin-700-normal.woff2",
  700
);

const inter600 = font(
  "Inter",
  "inter",
  "inter-latin-600-normal.woff2",
  600
);

const inter500 = font(
  "Inter",
  "inter",
  "inter-latin-500-normal.woff2",
  500
);

const manrope600 = font(
  "Manrope",
  "manrope",
  "manrope-latin-600-normal.woff2",
  600
);

const manrope500 = font(
  "Manrope",
  "manrope",
  "manrope-latin-500-normal.woff2",
  500
);

const poppins600 = font(
  "Poppins",
  "poppins",
  "poppins-latin-600-normal.woff2",
  600
);

/** Fashion, beauty, property — editorial serif */
const EDITORIAL: FlyerTypeTheme = {
  id: "editorial",
  label: "Editorial luxury",
  headline: bodoni700,
  tagline: manrope500,
  cta: poppins600,
  location: inter500,
  contact: inter500,
};

/** Warm hospitality — classic serif */
const CLASSIC: FlyerTypeTheme = {
  id: "classic",
  label: "Classic luxury",
  headline: playfair700,
  tagline: inter500,
  cta: poppins600,
  location: inter500,
  contact: inter500,
};

/** Lifestyle / artisan — refined serif */
const REFINED: FlyerTypeTheme = {
  id: "refined",
  label: "Refined serif",
  headline: cormorant700,
  tagline: manrope500,
  cta: poppins600,
  location: inter500,
  contact: inter500,
};

/** Tech / modern brands — clean sans headline */
const MODERN: FlyerTypeTheme = {
  id: "modern",
  label: "Modern luxury",
  headline: manrope600,
  tagline: inter500,
  cta: poppins600,
  location: inter500,
  contact: inter500,
};

const DEFAULT_THEME = EDITORIAL;

export function getFlyerTypeTheme(business: BusinessProfile): FlyerTypeTheme {
  const ind = (business.industry || "").toLowerCase();

  if (
    /fashion|beauty|cosmetic|salon|spa|luxury|jewel|wedding|real estate|property|estate/.test(
      ind
    )
  ) {
    return EDITORIAL;
  }
  if (/food|restaurant|catering|bakery|chef|bar|hospitality|hotel/.test(ind)) {
    return CLASSIC;
  }
  if (/health|wellness|art|design|gallery|boutique/.test(ind)) {
    return REFINED;
  }
  if (/tech|software|saas|startup|crypto|fintech|finance|digital|ai|consult/.test(ind)) {
    return MODERN;
  }
  return DEFAULT_THEME;
}

export function themeFonts(theme: FlyerTypeTheme): EmbeddedFont[] {
  return [theme.headline, theme.tagline, theme.cta, theme.location, theme.contact];
}
