import { NextRequest, NextResponse } from "next/server";
import { getDialCode, DIAL_CODES } from "@/lib/phone";

export async function GET(req: NextRequest) {
  // Vercel sets x-vercel-ip-country header automatically
  const country =
    req.headers.get("x-vercel-ip-country")?.toUpperCase() || "DK";
  const dialCode = getDialCode(country);

  return NextResponse.json(
    { country, dialCode, supported: country in DIAL_CODES },
    {
      headers: {
        "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=7200",
      },
    }
  );
}
