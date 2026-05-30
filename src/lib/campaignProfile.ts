import type { CampaignTypeId } from "./campaignTypeEngine";
import type { BusinessProfile } from "./types";

const TYPE_LABELS: Record<CampaignTypeId, string> = {
  general_brand: "Brand awareness",
  grand_opening: "Grand opening / Now open",
  promo_sale: "Promo / sale / offer",
  seasonal_offer: "Seasonal / holiday",
  product_launch: "Product / service launch",
  event: "Event / workshop",
  limited_time: "Limited time offer",
};

export const CAMPAIGN_TYPE_OPTIONS: {
  value: CampaignTypeId | "";
  label: string;
  placeholder: string;
}[] = [
  { value: "", label: "Select campaign type", placeholder: "" },
  {
    value: "grand_opening",
    label: TYPE_LABELS.grand_opening,
    placeholder: "e.g. Grand opening this Saturday — ribbon cutting",
  },
  {
    value: "promo_sale",
    label: TYPE_LABELS.promo_sale,
    placeholder: "e.g. 30% off all items this weekend",
  },
  {
    value: "product_launch",
    label: TYPE_LABELS.product_launch,
    placeholder: "e.g. Introducing our new premium menu",
  },
  {
    value: "event",
    label: TYPE_LABELS.event,
    placeholder: "e.g. Live masterclass — register today",
  },
  {
    value: "seasonal_offer",
    label: TYPE_LABELS.seasonal_offer,
    placeholder: "e.g. Christmas special — book early",
  },
  {
    value: "limited_time",
    label: TYPE_LABELS.limited_time,
    placeholder: "e.g. Ends Sunday — while stocks last",
  },
  {
    value: "general_brand",
    label: TYPE_LABELS.general_brand,
    placeholder: "e.g. Trusted quality for your family",
  },
];

export function getCampaignTypeInput(business: BusinessProfile): string {
  const explicit = business.campaignType?.trim();
  if (explicit && explicit in TYPE_LABELS) {
    return TYPE_LABELS[explicit as CampaignTypeId];
  }
  if (explicit) return explicit;
  return business.campaignGoal?.trim() || "";
}

export function getCampaignTypeId(
  business: BusinessProfile
): CampaignTypeId | "" {
  const id = business.campaignType?.trim();
  if (id && id in TYPE_LABELS) return id as CampaignTypeId;
  return "";
}

export function getCampaignTypeLabel(business: BusinessProfile): string {
  const id = getCampaignTypeId(business);
  if (id) return TYPE_LABELS[id];
  return "";
}
