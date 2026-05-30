import {
  createFlyerJob,
  patchFlyerJob,
} from "@/lib/flyerJobStore";
import { parseComposeError } from "@/lib/composeEngine";
import { parseImageGenError } from "@/lib/imageProvider";
import { sanitizeFlyerJobResult } from "@/lib/sanitizeFlyerJobResult";
import { scheduleBackgroundWork } from "@/lib/scheduleBackgroundWork";
import type { GenerateRequest } from "./generateHandler";
import { runFlyerPipeline, runFullFlyerPipeline } from "./runFlyerPipeline";

export async function startAsyncFlyerJob(
  body: GenerateRequest,
  origin: string
): Promise<{ jobId: string }> {
  const action = body.action === "full" ? "full" : "flyer";
  const job = await createFlyerJob(action);

  const jobId = job.id;

  scheduleBackgroundWork(async () => {
    await patchFlyerJob(jobId, { status: "running", progress: "copy" });

    try {
      let result: Record<string, unknown>;

      if (action === "full") {
        await patchFlyerJob(jobId, { progress: "messages" });
        result = await runFullFlyerPipeline(
          body.business,
          {
            format: body.format,
            userPrompt: body.userPrompt,
            logoDataUrl: body.logoDataUrl,
            messageIndex: body.messageIndex,
          },
          origin,
          (p) => {
            void patchFlyerJob(jobId, { progress: p === "variants" ? "variants" : p });
          }
        );
      } else {
        const campaignMessage = String(body.campaignMessage ?? "").trim();
        if (!campaignMessage) {
          throw new Error("campaignMessage is required for async flyer job");
        }
        await patchFlyerJob(jobId, { progress: "variants" });
        result = await runFlyerPipeline(
          {
            business: body.business,
            campaignMessage,
            format: body.format,
            userPrompt: body.userPrompt,
            logoDataUrl: body.logoDataUrl,
          },
          origin
        );
        result.action = "flyer";
      }

      await patchFlyerJob(jobId, {
        status: "succeeded",
        progress: "done",
        result: sanitizeFlyerJobResult(result),
      });
    } catch (e) {
      const msg =
        parseImageGenError(e) ||
        parseComposeError(e) ||
        (e instanceof Error ? e.message : "Flyer generation failed");
      await patchFlyerJob(jobId, {
        status: "failed",
        progress: "done",
        error: msg,
      });
    }
  });

  return { jobId };
}
