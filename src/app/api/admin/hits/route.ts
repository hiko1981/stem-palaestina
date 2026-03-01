import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { timingSafeEqual } from "crypto";

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;
if (!ADMIN_PASSWORD) throw new Error("ADMIN_PASSWORD not set");

function checkAuth(req: NextRequest): boolean {
  const auth = req.headers.get("authorization") || "";
  const expected = `Bearer ${ADMIN_PASSWORD}`;
  if (auth.length !== expected.length) return false;
  return timingSafeEqual(Buffer.from(auth), Buffer.from(expected));
}

export async function GET(req: NextRequest) {
  if (!checkAuth(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    thirtyDaysAgo.setHours(0, 0, 0, 0);

    const rows = await prisma.pageView.findMany({
      where: { date: { gte: thirtyDaysAgo } },
      orderBy: { date: "asc" },
    });

    const total = rows.reduce((sum, r) => sum + r.count, 0);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayRow = rows.find((r) => r.date.getTime() === today.getTime());

    return NextResponse.json({
      days: rows.map((r) => ({
        date: r.date.toISOString().slice(0, 10),
        count: r.count,
      })),
      total,
      today: todayRow?.count ?? 0,
    });
  } catch (error) {
    console.error("admin/hits error:", error);
    return NextResponse.json({ error: "Intern serverfejl" }, { status: 500 });
  }
}
