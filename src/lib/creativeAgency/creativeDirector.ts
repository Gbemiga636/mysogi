import { buildCampaignTypePromptLead, detectCampaignType } from "../campaignTypeEngine";
import { getIndustryDesignSystem } from "./industrySystems";
import type { CreativeAgencyInput, CreativeDirectorOutput } from "./types";

export function creativeDirector(input: CreativeAgencyInput): CreativeDirectorOutput {
  const { business, userPrompt = "", campaignMessage = "" } = input;
  const industry = getIndustryDesignSystem(business, userPrompt);
  const campaign = detectCampaignType(business, userPrompt, campaignMessage);
  const name = business.businessName?.trim() || "the brand";
  const seed = userPrompt.trim() || campaignMessage.trim() || campaign.label;

  return {
    industryKey: industry.key,
    campaignIntent: buildCampaignTypePromptLead(business, userPrompt, campaignMessage),
    audienceInsight: business.targetAudience?.trim()
      ? `Primary audience: ${business.targetAudience.trim()} — visuals and tone must resonate with them in ${business.location || "their market"}.`
      : `Audience: motivated buyers in ${business.location || "local market"} seeking ${industry.label} solutions.`,
    creativeNorthStar: [
      `Create a ${campaign.label} advertisement for ${name} at ${industry.referenceBrands} quality level.`,
      `Industry lock: ${industry.label} — ${industry.visualMotifs}`,
      `User brief: "${seed.slice(0, 200)}"`,
      `Forbidden: ${industry.forbidden}`,
      "This is NOT a generic flyer — it is a finished paid-social campaign creative with integrated typography and UI-grade layout.",
    ].join(" "),
  };
}
