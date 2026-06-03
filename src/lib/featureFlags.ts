/** Server-side feature toggles — set in .env.local and restart dev server. */

function envFlag(name: string, defaultOn = false): boolean {
  const v = process.env[name]?.trim().toLowerCase();
  if (v === "true" || v === "1" || v === "on" || v === "yes") return true;
  if (v === "false" || v === "0" || v === "off" || v === "no") return false;
  return defaultOn;
}

/** AI video generation + video prompt UI (MiniMax / Replicate). Default off. */
export function isVideoGeneratorEnabled(): boolean {
  return envFlag("MYSOGI_VIDEO_GENERATOR", false);
}

export function getAppFeatureConfig() {
  return {
    videoGenerator: isVideoGeneratorEnabled(),
  };
}
