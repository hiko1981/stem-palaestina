import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const ADMIN_PASSWORD = "sp2026";

// POST: log a language miss (public, no auth needed)
export async function POST(req: NextRequest) {
  try {
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
  const auth = req.headers.get("authorization");
  if (auth !== `Bearer ${ADMIN_PASSWORD}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const misses = await prisma.languageMiss.findMany({
    orderBy: { count: "desc" },
  });

  return NextResponse.json({ misses });
}
