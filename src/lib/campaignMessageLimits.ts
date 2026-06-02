/** Client-safe campaign message length presets (no Groq / server imports). */

export const CAMPAIGN_MESSAGE_MAX = 160;
/** SMS/billboard messages should use nearly the full character budget. */
export const CAMPAIGN_MESSAGE_MIN = 145;
export const CAMPAIGN_MESSAGE_TARGET = 160;

export type CampaignMessageLimits = {
  minLength: number;
  maxLength: number;
};

export const DEFAULT_CAMPAIGN_MESSAGE_LIMITS: CampaignMessageLimits = {
  minLength: CAMPAIGN_MESSAGE_MIN,
  maxLength: CAMPAIGN_MESSAGE_MAX,
};

export const CAMPAIGN_MESSAGE_LIMIT_PRESETS = [
  { id: "sms", label: "SMS (160 chars)", maxLength: 160 },
  { id: "medium", label: "Medium (120 chars)", maxLength: 120 },
  { id: "short", label: "Short (90 chars)", maxLength: 90 },
  { id: "social", label: "Long social (280 chars)", maxLength: 280 },
  { id: "custom", label: "Custom limit", maxLength: 0 },
] as const;

export type CampaignMessageLimitPresetId =
  (typeof CAMPAIGN_MESSAGE_LIMIT_PRESETS)[number]["id"];

function clampInt(n: number, min: number, max: number): number {
  if (!Number.isFinite(n)) return min;
  return Math.min(max, Math.max(min, Math.round(n)));
}

/** Resolve min/max for generation and UI from optional API overrides. */
export function resolveCampaignMessageLimits(
  maxLength?: number,
  minLength?: number
): CampaignMessageLimits {
  const max = clampInt(
    maxLength ?? DEFAULT_CAMPAIGN_MESSAGE_LIMITS.maxLength,
    40,
    500
  );

  if (minLength != null && Number.isFinite(minLength)) {
    const min = clampInt(minLength, 1, max);
    return { minLength: min, maxLength: max };
  }

  if (max === CAMPAIGN_MESSAGE_MAX) {
    return { minLength: CAMPAIGN_MESSAGE_MIN, maxLength: max };
  }

  const min =
    max >= 100
      ? Math.max(max - 15, Math.floor(max * 0.9))
      : Math.max(Math.floor(max * 0.85), Math.min(40, max - 1));

  return { minLength: Math.min(min, max), maxLength: max };
}
