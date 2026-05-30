import { getBusinessNameHeadline, ensureBusinessNameAsHeadline } from "../campaignGoalImageGuard";
import type { CampaignCopy } from "../campaignTextLayers";
import type { BusinessProfile } from "../types";
import type { ComputedLayout, QualityIssue, QualityReport } from "./types";

function contrastOk(text: string, bg: string): boolean {
  const lum = (hex: string) => {
    const h = hex.replace("#", "");
    if (h.length < 6) return 0.5;
    const r = parseInt(h.slice(0, 2), 16) / 255;
    const g = parseInt(h.slice(2, 4), 16) / 255;
    const b = parseInt(h.slice(4, 6), 16) / 255;
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  };
  return Math.abs(lum(text) - lum(bg)) > 0.35;
}

export function runQualityGate(
  business: BusinessProfile,
  copy: CampaignCopy,
  layout: ComputedLayout
): { copy: CampaignCopy; report: QualityReport } {
  const issues: QualityIssue[] = [];
  let fixed = ensureBusinessNameAsHeadline(copy, business);

  const name = getBusinessNameHeadline(business);
  if (fixed.headline !== name) {
    fixed = { ...fixed, headline: name };
    issues.push({
      code: "headline_not_business_name",
      severity: "error",
      message: "Headline must be Step 1 business name",
      autoFixed: true,
    });
  }

  if (name.length > 48) {
    issues.push({
      code: "headline_long",
      severity: "warn",
      message: "Long business name — typography engine will shrink and wrap",
    });
  }

  if (!fixed.tagline?.trim()) {
    issues.push({
      code: "missing_subhead",
      severity: "warn",
      message: "No subheadline — layout will use headline + CTA only",
    });
  }

  if (!fixed.cta?.trim()) {
    issues.push({
      code: "missing_cta",
      severity: "warn",
      message: "No CTA text",
    });
  }

  if (layout.balanceScore < 0.7) {
    issues.push({
      code: "weak_balance",
      severity: "warn",
      message: "Layout balance below target — spacing adjusted in prompt",
    });
  }

  const palette = layout.palette;
  if (!contrastOk(palette.text, palette.background)) {
    issues.push({
      code: "low_contrast",
      severity: "warn",
      message: "Text/background contrast may be weak — prompts request scrim panels",
    });
  }

  const errors = issues.filter((i) => i.severity === "error").length;
  const score = Math.max(
    0,
    Math.min(
      1,
      layout.balanceScore * 0.5 +
        (errors === 0 ? 0.35 : 0) +
        (fixed.cta ? 0.08 : 0) +
        (fixed.tagline ? 0.07 : 0)
    )
  );

  return {
    copy: fixed,
    report: {
      passed: errors === 0 && score >= 0.65,
      score: Math.round(score * 100) / 100,
      issues,
    },
  };
}
