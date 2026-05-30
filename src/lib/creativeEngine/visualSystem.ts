export const ELITE_VISUAL_SYSTEM = [
  "ELITE VISUAL DESIGN SYSTEM (Behance/Dribbble agency quality):",
  "Soft ambient glow, cinematic lighting, glassmorphism panels, realistic drop shadows,",
  "blurred gradient scrims, floating geometric accents (thin lines, arcs, hex at 8% opacity),",
  "luxury borders, controlled neon rim on hero subject, layered foreground/midground/background depth.",
  "Futuristic premium — never garish template clutter.",
].join(" ");

export const GEOMETRIC_DECORATION = [
  "GEOMETRIC DECORATION:",
  "Subtle corner arcs, thin gold/silver rules, floating circles at low opacity,",
  "diagonal light streaks, frame the hero without competing with typography.",
].join(" ");

export const CINEMATIC_COMPOSITION = [
  "CINEMATIC IMAGE COMPOSITION:",
  "Hero subject lower-center or center-right; auto-blur busy regions behind text;",
  "darken zones under type; volumetric light; professional color grade;",
  "depth haze and bokeh; realistic contact shadows on products/devices;",
  "app showcase tilt 4–8° when showing UI mockups — elite fintech ad style.",
].join(" ");

export const LUXURY_AESTHETIC_RULES = [
  "LUXURY AESTHETIC RULES:",
  "Elegance, emotional impact, visual storytelling, premium whitespace.",
  "NEVER: Canva template, random AI poster, overcrowded layout, amateur type, cheap neon soup.",
].join(" ");

export function buildVisualSystemPromptBlock(): string {
  return [
    ELITE_VISUAL_SYSTEM,
    GEOMETRIC_DECORATION,
    CINEMATIC_COMPOSITION,
    LUXURY_AESTHETIC_RULES,
  ].join(" ");
}
