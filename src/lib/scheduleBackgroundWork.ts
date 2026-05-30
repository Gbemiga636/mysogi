import { waitUntil } from "@vercel/functions";

/**
 * Keep work running after the HTTP response on Vercel; fire-and-forget locally.
 */
export function scheduleBackgroundWork(work: () => Promise<void>): void {
  const run = () =>
    work().catch((err) => {
      console.error("[background-work]", err);
    });

  if (process.env.VERCEL) {
    waitUntil(run());
    return;
  }

  void run();
}
