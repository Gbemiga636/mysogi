import { parseJsonResponse } from "./parseJsonResponse";

export type FlyerJobPollResult = {
  ok: boolean;
  jobId: string;
  status: "queued" | "running" | "succeeded" | "failed";
  progress?: string;
  error?: string;
  result?: Record<string, unknown>;
};

export async function pollFlyerJobUntilDone(
  jobId: string,
  options: {
    pollUrl?: string;
    intervalMs?: number;
    maxWaitMs?: number;
    onUpdate?: (job: FlyerJobPollResult) => void;
  } = {}
): Promise<FlyerJobPollResult> {
  const pollUrl = options.pollUrl ?? `/api/v1/jobs/${jobId}`;
  const intervalMs = options.intervalMs ?? 3000;
  const maxWaitMs = options.maxWaitMs ?? 600_000;
  const started = Date.now();

  while (Date.now() - started < maxWaitMs) {
    const res = await fetch(pollUrl, { cache: "no-store" });
    const job = await parseJsonResponse<FlyerJobPollResult>(res);
    options.onUpdate?.(job);

    if (job.status === "succeeded") return job;
    if (job.status === "failed") {
      throw new Error(job.error ?? "Flyer generation failed");
    }

    await new Promise((r) => setTimeout(r, intervalMs));
  }

  throw new Error("Generation timed out — try again or poll the job URL later.");
}
