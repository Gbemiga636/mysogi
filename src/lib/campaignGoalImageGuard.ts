import type { CampaignCopy } from "./campaignTextLayers";
import { defaultTagline } from "./campaignTextLayers";
import { getCampaignTypeInput } from "./campaignProfile";
import type { BusinessProfile } from "./types";

function normalizeForCompare(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Exact Step 1 business name — always the flyer headline. */
export function getBusinessNameHeadline(business: BusinessProfile): string {
  return business.businessName?.trim() || "Your Brand";
}

/** Force headline to Step 1 business name (never Groq hooks or campaign goal). */
export function ensureBusinessNameAsHeadline(
  copy: CampaignCopy,
  business: BusinessProfile
): CampaignCopy {
  return { ...copy, headline: getBusinessNameHeadline(business) };
}

/** True when overlay copy repeats the Step 1 campaign goal (should stay off the image). */
export function fieldEchoesCampaignGoal(field: string, goal: string): boolean {
  const f = normalizeForCompare(field);
  const g = normalizeForCompare(goal);
  if (!f || !g) return false;
  if (f === g) return true;
  if (g.length >= 10 && (f.includes(g) || g.includes(f))) return true;

  const goalWords = g.split(" ").filter((w) => w.length > 3);
  if (goalWords.length >= 3) {
    const matched = goalWords.filter((w) => f.includes(w)).length;
    if (matched / goalWords.length >= 0.8) return true;
  }
  return false;
}

/** Remove campaign type / goal echoes from tagline if they leaked in. */
export function stripCampaignGoalFromFlyerCopy(
  copy: CampaignCopy,
  business: BusinessProfile
): CampaignCopy {
  const goal = getCampaignTypeInput(business);
  let next = ensureBusinessNameAsHeadline(copy, business);
  if (!goal) return next;

  if (fieldEchoesCampaignGoal(next.tagline, goal)) {
    next = {
      ...next,
      tagline: business.tagline?.trim() || defaultTagline(business),
    };
  }

  return next;
}

/** Image prompt block — business name IS the hero headline. */
export function businessNameHeadlinePrompt(name: string): string {
  return [
    `HERO HEADLINE (dominant, center aligned, extra-bold premium sans — largest text on the flyer):`,
    `Typeset EXACTLY character-for-character: "${name}"`,
    "This IS the Step 1 business name — never shorten, reword, or swap for marketing hooks.",
    "Scale large on center axis (2 lines max if long); glass or gradient panel behind; perfect kerning and spelling.",
  ].join(" ");
}

/** @deprecated use businessNameHeadlinePrompt */
export const BUSINESS_NAME_ALWAYS_IN_IMAGE = businessNameHeadlinePrompt;

export const CAMPAIGN_GOAL_NOT_IN_IMAGE =
  "Never typeset the Step 1 campaign type field — it is not part of the flyer copy.";
