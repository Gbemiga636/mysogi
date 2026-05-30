import { NextResponse } from "next/server";
import {
  getKling,
  getKlingCredentials,
  KLING_VIDEO_MODE,
  KLING_VIDEO_MODEL,
  parseKlingError,
} from "@/lib/kling";

/** Verify Kling access/secret keys */
export async function GET() {
  try {
    getKlingCredentials();
    const kling = getKling();
    const now = Date.now();
    await kling.getAccountInfo(now - 86400000, now);

    return NextResponse.json({
      ok: true,
      provider: "kling",
      videoModel: KLING_VIDEO_MODEL,
      videoMode: KLING_VIDEO_MODE,
      message: `Kling OK. Videos use ${KLING_VIDEO_MODEL} in ${KLING_VIDEO_MODE} mode (lowest cost tier).`,
    });
  } catch (e) {
    return NextResponse.json(
      {
        ok: false,
        provider: "kling",
        error: parseKlingError(e),
      },
      { status: 500 }
    );
  }
}
