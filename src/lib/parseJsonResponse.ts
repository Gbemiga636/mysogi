/** Parse fetch Response as JSON; surface empty/truncated bodies clearly. */
export async function parseJsonResponse<T = Record<string, unknown>>(
  res: Response
): Promise<T> {
  const text = await res.text();
  if (!text.trim()) {
    throw new Error(
      res.ok
        ? "Server returned an empty response. Try again in a moment."
        : `Server error (${res.status}) with no response body — often a timeout or payload too large on Vercel.`
    );
  }

  try {
    return JSON.parse(text) as T;
  } catch {
    const preview = text.slice(0, 120).replace(/\s+/g, " ");
    throw new Error(
      `Invalid server response (${res.status}). ${preview.startsWith("<") ? "Got HTML instead of JSON — likely a gateway timeout." : `Body: ${preview}…`}`
    );
  }
}
