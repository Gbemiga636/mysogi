import { NextRequest, NextResponse } from "next/server";
import { getFlyerImage } from "@/lib/flyerImageStore";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const entry = await getFlyerImage(id);
  if (!entry) {
    return NextResponse.json({ error: "Image not found or expired" }, { status: 404 });
  }

  return new NextResponse(new Uint8Array(entry.buffer), {
    headers: {
      "Content-Type": entry.mime,
      "Cache-Control": "private, max-age=86400",
    },
  });
}
