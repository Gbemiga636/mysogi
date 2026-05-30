import { NextResponse } from "next/server";
import type { BusinessProfile } from "@/lib/types";

export const API_V1 = "1.0.0";

export const CORS_HEADERS: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-API-Key",
};

export function jsonResponse(
  body: unknown,
  status = 200
): NextResponse {
  return NextResponse.json(body, { status, headers: CORS_HEADERS });
}

export function optionsResponse(): NextResponse {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}

export function errorResponse(
  message: string,
  status = 400,
  extra?: Record<string, unknown>
): NextResponse {
  return jsonResponse({ ok: false, error: message, ...extra }, status);
}

/** Required Step 1 business profile for both v1 endpoints. */
export function validateBusinessProfile(
  business: unknown
): { ok: true; business: BusinessProfile } | { ok: false; error: string } {
  if (!business || typeof business !== "object") {
    return { ok: false, error: "body.business is required (object)" };
  }
  const b = business as BusinessProfile;
  if (!b.businessName?.trim()) {
    return { ok: false, error: "business.businessName is required" };
  }
  return { ok: true, business: b };
}

export const BUSINESS_PROFILE_FIELDS = [
  "businessName",
  "tagline",
  "phone",
  "email",
  "website",
  "location",
  "industry",
  "targetAudience",
  "campaignType",
  "brandPrimary",
  "brandSecondary",
  "brandColors",
  "callToAction",
  "imageProps",
  "adStylePreset",
] as const;
