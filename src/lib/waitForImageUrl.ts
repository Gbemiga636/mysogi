/**
 * Cloudinary on-the-fly transforms often return 404/423 until processing finishes.
 * Poll until the delivery URL returns a real image (server + browser).
 */
export async function waitForImageUrl(
  url: string,
  options: { maxWaitMs?: number } = {}
): Promise<void> {
  const maxWait = options.maxWaitMs ?? 90_000;
  const started = Date.now();
  let delayMs = 1200;

  const cacheBust = () =>
    url.includes("?") ? `${url}&_cb=${Date.now()}` : `${url}?_cb=${Date.now()}`;

  const tryFetch = async (): Promise<boolean> => {
    try {
      const res = await fetch(cacheBust(), {
        method: "GET",
        headers: { Range: "bytes=0-2047" },
        cache: "no-store",
        signal: AbortSignal.timeout(25_000),
      });
      if (res.status === 423 || res.status === 404 || res.status === 503) {
        return false;
      }
      const ct = (res.headers.get("content-type") || "").toLowerCase();
      if (res.ok && (ct.includes("image") || ct.includes("octet-stream"))) {
        return true;
      }
      return res.ok && res.status === 200;
    } catch {
      return false;
    }
  };

  const tryImage = (): Promise<boolean> =>
    new Promise((resolve) => {
      const img = new Image();
      img.onload = () => resolve(true);
      img.onerror = () => resolve(false);
      img.src = cacheBust();
    });

  while (Date.now() - started < maxWait) {
    const ok =
      typeof window !== "undefined"
        ? (await tryImage()) || (await tryFetch())
        : await tryFetch();
    if (ok) return;
    await new Promise((r) => setTimeout(r, delayMs));
    delayMs = Math.min(Math.round(delayMs * 1.3), 7000);
  }

  throw new Error(
    "Flyer is still processing on Cloudinary. Wait a few seconds and generate again."
  );
}
