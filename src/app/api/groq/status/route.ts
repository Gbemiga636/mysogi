import { NextResponse } from "next/server";
import { GROQ_MODELS, parseGroqError, testGroqConnection } from "@/lib/groq";

export async function GET() {
  const configured = Boolean(process.env.GROQ_API_KEY?.trim());

  if (!configured) {
    return NextResponse.json(
      {
        ok: false,
        configured: false,
        error: "GROQ_API_KEY is not set in .env.local",
      },
      { status: 503 }
    );
  }

  const result = await testGroqConnection();

  return NextResponse.json({
    configured: true,
    ok: result.ok,
    models: GROQ_MODELS,
    error: result.error,
    message: result.ok
      ? "Groq is reachable — prompts, captions, and copy will work."
      : result.error,
  }, result.ok ? undefined : { status: 503 });
}
