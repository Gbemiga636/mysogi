/** Walk Error.cause chain for codes like EAI_AGAIN */
export function flattenErrorMessage(error: unknown): string {
  const parts: string[] = [];
  let current: unknown = error;
  const seen = new Set<unknown>();

  while (current && !seen.has(current)) {
    seen.add(current);
    if (current instanceof Error) {
      parts.push(current.message);
      const err = current as Error & { code?: string; cause?: unknown };
      if (err.code) parts.push(String(err.code));
      current = err.cause;
    } else if (typeof current === "object" && current !== null) {
      const o = current as { message?: string; code?: string };
      if (o.message) parts.push(o.message);
      if (o.code) parts.push(String(o.code));
      break;
    } else {
      parts.push(String(current));
      break;
    }
  }

  return parts.join(" | ");
}

export function isTransientNetworkError(error: unknown): boolean {
  const text = flattenErrorMessage(error);
  return /EAI_AGAIN|ENOTFOUND|ETIMEDOUT|ECONNRESET|ECONNREFUSED|ECONNABORTED|fetch failed|getaddrinfo|network unreachable|socket hang up|ERR_NETWORK/i.test(
    text
  );
}

export function isReplicateHostError(error: unknown): boolean {
  const text = flattenErrorMessage(error).toLowerCase();
  return (
    text.includes("replicate.com") ||
    text.includes("replicate") ||
    /EAI_AGAIN|ENOTFOUND|getaddrinfo/i.test(text)
  );
}

/**
 * Retry on DNS blips / flaky Wi‑Fi (common cause of EAI_AGAIN).
 */
export async function withNetworkRetry<T>(
  fn: () => Promise<T>,
  options?: { retries?: number; label?: string }
): Promise<T> {
  const maxRetries = options?.retries ?? 4;
  let lastError: unknown;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      const canRetry =
        isTransientNetworkError(error) && attempt < maxRetries;
      if (!canRetry) break;

      const delayMs = Math.min(1500 * Math.pow(1.6, attempt), 12_000);
      console.warn(
        `[networkRetry] ${options?.label ?? "request"} attempt ${attempt + 1} failed (${flattenErrorMessage(error).slice(0, 80)}…), retry in ${delayMs}ms`
      );
      await new Promise((r) => setTimeout(r, delayMs));
    }
  }

  throw lastError;
}
