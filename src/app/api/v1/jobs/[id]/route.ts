import { NextRequest } from "next/server";
import { getFlyerJob } from "@/lib/flyerJobStore";
import {
  errorResponse,
  jsonResponse,
  optionsResponse,
} from "@/lib/api/v1/shared";

export const maxDuration = 15;

export function OPTIONS() {
  return optionsResponse();
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const job = await getFlyerJob(id);

  if (!job) {
    return errorResponse("Job not found", 404);
  }

  const payload: Record<string, unknown> = {
    ok: job.status !== "failed",
    jobId: job.id,
    status: job.status,
    progress: job.progress,
    action: job.action,
    createdAt: job.createdAt,
    updatedAt: job.updatedAt,
  };

  if (job.status === "succeeded" && job.result) {
    payload.result = job.result;
  }
  if (job.status === "failed" && job.error) {
    payload.error = job.error;
  }

  return jsonResponse(payload);
}
