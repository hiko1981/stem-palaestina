import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { notifyAdminNewSupport } from "@/lib/admin-notify";
import { checkRateLimit } from "@/lib/rate-limit";
import { RATE_LIMITS } from "@/lib/constants";
import { z } from "zod";

const supportSchema = z.object({
  category: z.string().min(1).max(100),
  message: z.string().min(1).max(2000),
  deviceId: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
    const limit = checkRateLimit("support-ip", ip, RATE_LIMITS.supportPerIp.max, RATE_LIMITS.supportPerIp.windowMs);
    if (!limit.ok) {
      return NextResponse.json({ error: "For mange beskeder. Prøv igen senere." }, { status: 429 });
    }

    const body = await req.json();
    const parsed = supportSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Ugyldige data" },
        { status: 400 }
      );
    }

    await prisma.supportMessage.create({
      data: {
        category: parsed.data.category,
        message: parsed.data.message,
        deviceId: parsed.data.deviceId || null,
      },
    });

    notifyAdminNewSupport(parsed.data.category, parsed.data.message);

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("support POST error:", error);
    return NextResponse.json(
      { error: "Intern serverfejl" },
      { status: 500 }
    );
  }
}
