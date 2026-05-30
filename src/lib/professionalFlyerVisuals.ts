import type { BusinessProfile, VideoFormat } from "./types";

/**
 * Agency-style shot recipes — visual direction only (no copy in image).
 * Referenced by creative director + Groq prompt builder.
 */
export function getProfessionalShotRecipe(
  business: BusinessProfile,
  format: VideoFormat
): string {
  const ind = (business.industry || "").toLowerCase();
  const mood = (business.tagline || business.campaignGoal || "").toLowerCase();

  const formatCue =
    format === "9:16"
      ? "vertical paid social story, thumb-stopping top-third hook zone"
      : format === "1:1"
        ? "Instagram feed square, balanced symmetry, scroll-stop center weight"
        : format === "4:5"
          ? "portrait feed ad, editorial crop, strong vertical rhythm"
          : "landscape display banner, wide cinematic negative space";

  let recipe =
    "Award-winning performance marketing still: medium-format commercial photography look, shallow depth of field on hero, subtle film grain, color-graded for paid social, looks like Cannes Lions / D&AD shortlisted campaign key visual";

  if (/food|restaurant|catering|bakery/.test(ind)) {
    recipe +=
      ", hero dish macro with steam and specular highlights, dark moody restaurant bokeh background, warm key light 45° camera-left, appetite appeal like premium delivery app launch creative";
  } else if (/fashion|beauty|cosmetic/.test(ind)) {
    recipe +=
      ", high-fashion editorial lighting, glossy skin/product highlights, neutral studio gradient backdrop, Vogue beauty campaign composition, luxury negative space";
  } else if (/crypto|fintech|finance|bank/.test(ind)) {
    recipe +=
      ", premium fintech launch aesthetic, deep navy environment, cyan accent rim light, floating 3D coins and chart lines without labels, glass morphism panels with blank surfaces, trust and momentum";
  } else if (/real estate|property/.test(ind)) {
    recipe +=
      ", golden hour architectural hero, aspirational lifestyle, wide angle luxury property, sky gradient, prestige real estate brochure quality";
  } else if (/tech|saas|app|software/.test(ind)) {
    recipe +=
      ", Apple-style product hero, floating device with blank OLED screen, soft gradient studio, futuristic but clean, SaaS Series B launch campaign";
  } else if (/health|medical|wellness|clinic/.test(ind)) {
    recipe +=
      ", calm clinical premium, soft diffused key light, wellness spa atmosphere, trustworthy healthcare brand campaign";
  } else if (/retail|shop|ecommerce|market/.test(ind)) {
    recipe +=
      ", vibrant product hero cluster, dynamic sale energy, retail poster composition, bold color blocking using brand palette";
  } else if (/event|wedding|party|entertainment/.test(ind)) {
    recipe +=
      ", energetic event promotion, dramatic stage lighting, celebration atmosphere, nightlife commercial photography";
  } else {
    recipe +=
      ", confident local brand campaign, authentic Nigerian market premium feel, professional service hero visual";
  }

  if (/luxury|premium|exclusive/.test(mood)) {
    recipe += ", ultra-premium understated elegance, restrained props, black and gold accent grade";
  } else if (/urgent|sale|discount|offer|fast/.test(mood)) {
    recipe += ", high energy contrast, dynamic diagonal composition, promotional glow accents without written offers";
  }

  return `${recipe}. ${formatCue}.`;
}

export const PRO_AGENCY_COMPOSITION_RULES = [
  "Rule of thirds: hero subject on lower-center power point",
  "Upper third intentionally calm for post-production overlay bands",
  "Leading lines draw eye to hero then to lower glow band",
  "Foreground depth: subtle blur layers, never flat stock look",
  "Brand palette as rim light and accent glow only — not flat color wash",
  "Must read instantly as a finished paid ad layout awaiting copy — not a raw photo",
].join(" ");
