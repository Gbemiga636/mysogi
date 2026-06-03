import { NextResponse } from "next/server";
import { isCloudinaryConfigured } from "@/lib/cloudinaryEnv";
import { getAppFeatureConfig } from "@/lib/featureFlags";

export async function GET() {
  return NextResponse.json({
    ...getAppFeatureConfig(),
    cloudinaryConfigured: isCloudinaryConfigured(),
  });
}
