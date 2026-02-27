import { NextRequest, NextResponse } from "next/server";
import { getDialCode, DIAL_CODES } from "@/lib/phone";

// Vercel x-vercel-ip-region uses ISO 3166-2:DK region codes
const REGION_TO_STORKREDS: Record<string, string> = {
  "84": "copenhagen", // Hovedstaden
  "85": "zealand", // Sjælland
  "83": "south-jutland", // Syddanmark
  "82": "east-jutland", // Midtjylland
  "81": "north-jutland", // Nordjylland
};

export async function GET(req: NextRequest) {
  // Vercel sets x-vercel-ip-country header automatically
  const country =
    req.headers.get("x-vercel-ip-country")?.toUpperCase() || "DK";
  const dialCode = getDialCode(country);

  // Guess storkreds from Vercel region header (DK only)
  let storkreds: string | null = null;
  if (country === "DK") {
    const region = req.headers.get("x-vercel-ip-region") || "";
    storkreds = REGION_TO_STORKREDS[region] ?? null;
  }

  return NextResponse.json(
    { country, dialCode, supported: country in DIAL_CODES, storkreds },
    {
      headers: {
        "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=7200",
      },
    }
  );
}
