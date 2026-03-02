import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin, isAuthError } from "@/lib/admin-auth";
import { checkRateLimit } from "@/lib/rate-limit";

// POST: log a language miss (public, no auth needed)
export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
    const rl = await checkRateLimit("lang-miss", ip, 5, 60_000);
    if (!rl.ok) return NextResponse.json({ ok: true });

    const { language } = await req.json();
    if (!language || typeof language !== "string" || language.length > 10) {
      return NextResponse.json({ error: "invalid" }, { status: 400 });
    }

    const lang = language.toLowerCase().trim();

    await prisma.languageMiss.upsert({
      where: { language: lang },
      create: { language: lang, count: 1 },
      update: { count: { increment: 1 }, lastSeen: new Date() },
    });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "server error" }, { status: 500 });
  }
}

// GET: read all misses (admin auth required)
export async function GET(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (isAuthError(auth)) return auth;

  const misses = await prisma.languageMiss.findMany({
    orderBy: { count: "desc" },
  });

  return NextResponse.json({ misses });
}
