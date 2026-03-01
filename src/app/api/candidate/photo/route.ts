import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyOptout } from "@/lib/optout-sig";
import { checkRateLimit } from "@/lib/rate-limit";

const MAX_SIZE = 2 * 1024 * 1024; // 2MB base64 (~1.5MB image)

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
    const limit = await checkRateLimit("photo-upload-ip", ip, 5, 60 * 60 * 1000);
    if (!limit.ok) {
      return NextResponse.json({ error: "For mange forsøg. Prøv igen senere." }, { status: 429 });
    }

    const { candidateId, sig, photo } = await req.json();

    if (!candidateId || !sig || !photo) {
      return NextResponse.json({ error: "Manglende data" }, { status: 400 });
    }

    if (typeof photo !== "string" || !photo.startsWith("data:image/")) {
      return NextResponse.json({ error: "Ugyldigt billedformat" }, { status: 400 });
    }

    if (photo.length > MAX_SIZE) {
      return NextResponse.json({ error: "Billedet er for stort (max 1.5 MB)" }, { status: 400 });
    }

    const cid = Number(candidateId);
    if (isNaN(cid) || !verifyOptout(cid, sig)) {
      return NextResponse.json({ error: "Ugyldigt link" }, { status: 403 });
    }

    const candidate = await prisma.candidate.findUnique({
      where: { id: cid },
      select: { id: true, name: true },
    });

    if (!candidate) {
      return NextResponse.json({ error: "Kandidat ikke fundet" }, { status: 404 });
    }

    await prisma.candidate.update({
      where: { id: cid },
      data: { photoUpload: photo },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("candidate/photo error:", error);
    return NextResponse.json({ error: "Intern serverfejl" }, { status: 500 });
  }
}
