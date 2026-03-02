import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { checkRateLimit } from "@/lib/rate-limit";

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const rl = await checkRateLimit("hit", ip, 10, 60_000);
  if (!rl.ok) return NextResponse.json({ ok: true }); // silent drop
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    await prisma.$executeRawUnsafe(
      `INSERT INTO page_views (page, date, count)
       VALUES ('/', $1, 1)
       ON CONFLICT (page, date)
       DO UPDATE SET count = page_views.count + 1`,
      today
    );

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("hit error:", error);
    return NextResponse.json({ ok: true }); // fail silently
  }
}
