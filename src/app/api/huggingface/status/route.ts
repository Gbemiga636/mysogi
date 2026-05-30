import { NextResponse } from "next/server";
import {
  getHfToken,
  HF_VIDEO_MODELS,
  parseHfVideoError,
} from "@/lib/huggingfaceVideo";

export async function GET() {
  try {
    getHfToken();
    return NextResponse.json({
      ok: true,
      provider: "huggingface",
      defaultModel: HF_VIDEO_MODELS[0]!.model,
      defaultProvider: HF_VIDEO_MODELS[0]!.provider,
      models: HF_VIDEO_MODELS.map((m) => ({
        model: m.model,
        provider: m.provider,
        label: m.label,
      })),
      message:
        "HF token is set. Videos use Inference Providers (Wan 2.2 TI2V 5B by default).",
    });
  } catch (e) {
    return NextResponse.json(
      {
        ok: false,
        provider: "huggingface",
        error: parseHfVideoError(e),
      },
      { status: 500 }
    );
  }
}
