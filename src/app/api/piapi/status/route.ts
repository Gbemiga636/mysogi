import { NextResponse } from "next/server";
import {
  VIDEO_COST_POINTS,
  estimateVideoCost,
  getPiApiAccountInfo,
  parsePiApiError,
  selectVideoProvider,
} from "@/lib/piapi";

export async function GET() {
  try {
    const info = await getPiApiAccountInfo();
    const { wallet } = info;
    const available = wallet.pointRemain - wallet.pointFrozen;
    const pref = process.env.PIAPI_VIDEO_MODEL?.trim() || "auto";
    const selected = selectVideoProvider(available);
    const cost = estimateVideoCost(selected);
    const videosAffordable = Math.floor(
      available / VIDEO_COST_POINTS["hailuo-fast"]
    );

    return NextResponse.json({
      ok: true,
      provider: "piapi",
      videoPreference: pref,
      selectedModel:
        selected === "hailuo"
          ? "Hailuo v2.3-fast (6s, 768p) — ~1.6M points"
          : `Kling ${process.env.PIAPI_KLING_VERSION?.trim() || "2.5"} — ~2M+ points`,
      estimatedCostPoints: cost,
      wallet: {
        pointRemain: wallet.pointRemain,
        pointFrozen: wallet.pointFrozen,
        pointAvailable: available,
        equivalentUsd: wallet.equivalentUsd,
        plan: wallet.plan,
      },
      videosAffordable,
      hasCredits: available >= VIDEO_COST_POINTS["hailuo-fast"],
      costGuide: {
        hailuoFast: VIDEO_COST_POINTS["hailuo-fast"],
        kling25Std: VIDEO_COST_POINTS["kling-2.5-std"],
      },
      creditsNote:
        available >= VIDEO_COST_POINTS["hailuo-fast"]
          ? `Auto mode uses ${selected} (~${cost.toLocaleString()} points per video). You can afford ~${videosAffordable} video(s) at the cheapest rate.`
          : `Need at least ${VIDEO_COST_POINTS["hailuo-fast"].toLocaleString()} points for one Hailuo video. Top up at app.piapi.ai`,
    });
  } catch (e) {
    const message = parsePiApiError(e);
    return NextResponse.json(
      {
        ok: false,
        provider: "piapi",
        error: message,
        creditsLow: /credit|balance|point/i.test(message),
      },
      { status: /credit|balance|point/i.test(message) ? 402 : 500 }
    );
  }
}
