/** Ephemeral serverless cache — often 404 on Vercel when a different instance serves the request */
export function isEphemeralFlyerApiUrl(url: string): boolean {
  return /\/api\/flyer-image\/[0-9a-f-]{36}/i.test(url);
}

export function isStableCdnUrl(url: string): boolean {
  const u = url.trim();
  return (
    /^https:\/\//i.test(u) &&
    !isEphemeralFlyerApiUrl(u) &&
    (u.includes("cloudinary.com") ||
      u.includes("blob.core.windows.net") ||
      u.includes("amazonaws.com"))
  );
}

/**
 * Best URL for <img src> — prefer Cloudinary/CDN over /api/flyer-image on production.
 */
export function pickFlyerDisplayUrl(
  imageUrl?: string | null,
  localImageUrl?: string | null
): string {
  const primary = imageUrl?.trim() || "";
  const local = localImageUrl?.trim() || "";

  if (primary && isStableCdnUrl(primary)) return primary;
  if (local && isStableCdnUrl(local)) return local;

  if (primary && !isEphemeralFlyerApiUrl(primary)) return primary;
  if (local && !isEphemeralFlyerApiUrl(local)) return local;
  return primary || local;
}

/** Ordered fallbacks for img onError / reload */
export function buildFlyerImageCandidateUrls(
  imageUrl?: string | null,
  localImageUrl?: string | null
): string[] {
  const ordered: string[] = [];
  const add = (u?: string) => {
    const t = u?.trim();
    if (!t || ordered.includes(t)) return;
    ordered.push(t);
  };

  const primary = imageUrl?.trim() || "";
  const local = localImageUrl?.trim() || "";

  if (isStableCdnUrl(primary)) add(primary);
  if (isStableCdnUrl(local)) add(local);
  if (primary && !isEphemeralFlyerApiUrl(primary)) add(primary);
  if (local && !isEphemeralFlyerApiUrl(local)) add(local);
  add(primary);
  add(local);

  return ordered;
}

export function cacheBustFlyerUrl(url: string, nonce = Date.now()): string {
  if (!url || url.startsWith("data:")) return url;
  const sep = url.includes("?") ? "&" : "?";
  return `${url}${sep}_flyer=${nonce}`;
}
