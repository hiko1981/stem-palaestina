import { NextRequest, NextResponse } from "next/server";
import { sendSms } from "@/lib/sms";

export async function POST(req: NextRequest) {
  const { phone, secret } = await req.json();
  if (secret !== process.env.ADMIN_SECRET) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  try {
    await sendSms(phone, "Test fra Stem Palæstina. Denne besked er kun en test.");
    return NextResponse.json({ ok: true });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
