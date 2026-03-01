import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST() {
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
