import { NextResponse } from "next/server";
import {
  getPixverseAccountBalance,
  listPixverseTtsSpeakers,
  parsePixverseError,
  resolveTtsSpeakerId,
} from "@/lib/pixverse";

export async function GET() {
  try {
    const [balance, speakers] = await Promise.all([
      getPixverseAccountBalance(),
      listPixverseTtsSpeakers(),
    ]);
    const ttsSpeakerId = await resolveTtsSpeakerId();
    const model = process.env.PIXVERSE_VIDEO_MODEL?.trim() || "v5.6";
    const hasApiCredits = balance.creditTotal > 0;

    return NextResponse.json({
      ok: true,
      provider: "pixverse",
      videoModel: model,
      ttsSpeakerId,
      balance: {
        accountId: balance.accountId,
        creditMonthly: balance.creditMonthly,
        creditPackage: balance.creditPackage,
        creditTotal: balance.creditTotal,
      },
      hasApiCredits,
      creditsNote: hasApiCredits
        ? "API credits available for video generation."
        : "API credit balance is 0. Website/app free credits are separate — add API credits at platform.pixverse.ai → Billing.",
      ttsNote:
        "Pixverse built-in TTS (not Kokoro on API). Use PIXVERSE_TTS_SPEAKER=Auto or a name from speakers list.",
      speakers: speakers.map((s) => ({ id: s.speaker_id, name: s.name })),
    });
  } catch (e) {
    const message = parsePixverseError(e);
    return NextResponse.json(
      {
        ok: false,
        provider: "pixverse",
        error: message,
        creditsLow: /balance|500090/i.test(message),
      },
      { status: /balance|500090/i.test(message) ? 402 : 500 }
    );
  }
}
