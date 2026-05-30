import type { BusinessProfile } from "../types";
import type { FontPairing } from "./types";

export const FONT_PAIRINGS: Record<string, FontPairing> = {
  fintech: {
    id: "fintech",
    label: "Fintech Elite",
    headline: "General Sans, Satoshi, Inter, SF Pro Display",
    subhead: "Inter, Manrope, SF Pro Text",
    cta: "Inter SemiBold, Poppins SemiBold",
    footer: "Inter Medium, SF Pro Text",
  },
  luxury: {
    id: "luxury",
    label: "Luxury Editorial",
    headline: "Clash Display, Playfair Display, Bodoni Moda",
    subhead: "Montserrat, Cormorant Garamond",
    cta: "Montserrat SemiBold, Poppins",
    footer: "Montserrat Regular, Inter",
  },
  saas: {
    id: "saas",
    label: "Premium SaaS",
    headline: "Satoshi, Poppins Bold, Inter Black",
    subhead: "Inter, General Sans",
    cta: "Poppins SemiBold, Inter SemiBold",
    footer: "Inter Medium",
  },
  fashion: {
    id: "fashion",
    label: "Fashion Editorial",
    headline: "Clash Display, Oswald, Bebas Neue",
    subhead: "Montserrat Light, Raleway",
    cta: "Montserrat Medium",
    footer: "Raleway Regular",
  },
  default: {
    id: "default",
    label: "Modern Premium",
    headline: "Poppins Bold, Inter Black, SF Pro Display",
    subhead: "Inter, Manrope, General Sans",
    cta: "Poppins SemiBold, Inter SemiBold",
    footer: "Inter Medium, SF Pro Text",
  },
};

export function resolveFontPairing(business: BusinessProfile): FontPairing {
  const ind = (business.industry || "").toLowerCase();
  const preset = (business.adStylePreset || "").toLowerCase();

  if (/fintech|finance|crypto|bank/.test(ind) || preset === "finance") {
    return FONT_PAIRINGS.fintech;
  }
  if (/fashion|beauty|luxury/.test(ind) || preset === "fashion" || preset === "luxury") {
    return FONT_PAIRINGS.luxury;
  }
  if (/saas|software|tech|startup/.test(ind) || preset === "saas" || preset === "trending") {
    return FONT_PAIRINGS.saas;
  }
  if (/real estate|property/.test(ind) || preset === "real_estate") {
    return FONT_PAIRINGS.luxury;
  }
  return FONT_PAIRINGS.default;
}
