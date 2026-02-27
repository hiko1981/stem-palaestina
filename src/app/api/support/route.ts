import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { notifyAdminNewSupport } from "@/lib/admin-notify";
import { z } from "zod";

const supportSchema = z.object({
  category: z.string().min(1).max(100),
  message: z.string().min(1).max(2000),
  deviceId: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
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
