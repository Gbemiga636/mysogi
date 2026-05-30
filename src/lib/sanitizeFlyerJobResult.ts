/** Drop huge base64 blobs from async job payloads — they break Vercel/KV response limits. */
export function sanitizeFlyerJobResult(
  result: Record<string, unknown>
): Record<string, unknown> {
  const out = { ...result };

  const stripVariant = (v: Record<string, unknown>) => {
    const next = { ...v };
    if (
      typeof next.exportImageUrl === "string" &&
      next.exportImageUrl.startsWith("data:")
    ) {
      delete next.exportImageUrl;
    }
    return next;
  };

  if (Array.isArray(out.variants)) {
    out.variants = (out.variants as Record<string, unknown>[]).map(stripVariant);
  }

  if (
    typeof out.exportImageUrl === "string" &&
    out.exportImageUrl.startsWith("data:")
  ) {
    delete out.exportImageUrl;
  }

  return out;
}
