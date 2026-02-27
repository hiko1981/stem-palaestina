import { NextRequest, NextResponse } from "next/server";

const KV_URL = process.env.KV_REST_API_URL;
const KV_TOKEN = process.env.KV_REST_API_TOKEN;

export async function POST(req: NextRequest) {
  try {
    if (!KV_URL || !KV_TOKEN) {
      return NextResponse.json({ message: null });
    }

    const { deviceId } = await req.json();
    if (!deviceId || typeof deviceId !== "string") {
      return NextResponse.json({ message: null });
    }

    // Check KV for notification keyed by device ID prefix (first 8 chars)
    const prefix = deviceId.slice(0, 8);
    const key = `notify:${prefix}`;

    const res = await fetch(`${KV_URL}/get/${key}`, {
      headers: { Authorization: `Bearer ${KV_TOKEN}` },
      cache: "no-store",
    });
    const json = (await res.json()) as { result: string | null };

    if (!json.result) {
      return NextResponse.json({ message: null });
    }

    // Delete after reading (one-time notification)
    await fetch(`${KV_URL}/del/${key}`, {
      method: "POST",
      headers: { Authorization: `Bearer ${KV_TOKEN}` },
    });

    return NextResponse.json({ message: json.result });
  } catch {
    return NextResponse.json({ message: null });
  }
}
