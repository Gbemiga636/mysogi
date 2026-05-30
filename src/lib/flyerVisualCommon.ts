import type { VideoFormat } from "./types";

/** @deprecated Use flyerTextGuard exports — kept for imports */
export { FLYER_NO_TEXT_SUFFIX } from "./flyerTextGuard";

export function flyerFormatLabel(format: VideoFormat): string {
  const labels: Record<VideoFormat, string> = {
    "9:16": "Instagram Story / Reels vertical flyer (9:16)",
    "1:1": "square Instagram feed flyer (1:1)",
    "16:9": "YouTube / display banner flyer (16:9)",
    "4:5": "Instagram portrait feed flyer (4:5)",
  };
  return labels[format];
}

export function industryFlyerVisuals(industry: string): string {
  const key = industry.toLowerCase();
  if (/crypto|blockchain|web3|exchange|trading/.test(key)) {
    return "digital finance aesthetic, floating generic 3D coins without inscriptions, glowing chart lines without labels, holographic panels with blank glass surfaces";
  }
  if (/fintech|finance|bank|insurance/.test(key)) {
    return "secure banking aesthetic, abstract growth curves without labels, trust motifs, blank interface screens";
  }
  if (/food|restaurant|catering|bakery|chef/.test(key)) {
    return "sizzling hero food photography, steam rising, vibrant culinary styling, dramatic food close-up, warm appetizing glow, unbranded packaging only";
  }
  if (/fashion|beauty|cosmetic|salon|spa/.test(key)) {
    return "high-fashion editorial, luxury beauty textures, glossy highlights, Vogue-style campaign lighting, blank product labels";
  }
  if (/real estate|property|estate/.test(key)) {
    return "luxury property hero shot, golden hour architecture, aspirational lifestyle, blank street signs";
  }
  if (/tech|software|app|saas|startup/.test(key)) {
    return "sleek SaaS product glow, floating devices with completely blank black screens, futuristic dashboards with empty UI panels";
  }
  if (/health|medical|pharma|clinic/.test(key)) {
    return "premium wellness glow, clean clinical trust aesthetic, soft healing light, no medical labels visible";
  }
  if (/education|training|course|school/.test(key)) {
    return "dynamic success imagery, abstract growth motifs, inspiring achievement energy, blank books and screens";
  }
  if (/retail|shop|store|ecommerce/.test(key)) {
    return "vibrant product showcase, shopping energy, sale atmosphere without written signs";
  }
  return "premium hero visuals matched to the industry, trust and quality cues, no written signs or labels";
}
