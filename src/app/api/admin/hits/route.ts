import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin, isAuthError } from "@/lib/admin-auth";

export async function GET(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (isAuthError(auth)) return auth;

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
