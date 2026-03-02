import { NextRequest, NextResponse } from "next/server";
import { getTranslations } from "next-intl/server";
import { prisma } from "@/lib/prisma";
import { verifyOptout } from "@/lib/optout-sig";
import { checkRateLimit } from "@/lib/rate-limit";

const MAX_SIZE = 2 * 1024 * 1024; // 2MB base64 (~1.5MB image)

export async function POST(req: NextRequest) {
  try {
    const te = await getTranslations("errors");

    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
    const limit = await checkRateLimit("photo-upload-ip", ip, 5, 60 * 60 * 1000);
    if (!limit.ok) {
      return NextResponse.json({ error: te("tooManyRetry") }, { status: 429 });
    }

    const { candidateId, sig, photo } = await req.json();

    if (!candidateId || !sig || !photo) {
      return NextResponse.json({ error: te("missingData") }, { status: 400 });
    }

    if (typeof photo !== "string" || !photo.startsWith("data:image/")) {
      return NextResponse.json({ error: te("invalidImageFormat") }, { status: 400 });
    }

    // Block SVG (XSS risk via embedded scripts)
    if (photo.startsWith("data:image/svg")) {
      return NextResponse.json({ error: te("svgNotAllowed") }, { status: 400 });
    }

    if (photo.length > MAX_SIZE) {
      return NextResponse.json({ error: te("imageTooLarge") }, { status: 400 });
    }

    const cid = Number(candidateId);
    if (isNaN(cid) || !verifyOptout(cid, sig)) {
      return NextResponse.json({ error: te("invalidLink") }, { status: 403 });
    }

    const candidate = await prisma.candidate.findUnique({
      where: { id: cid },
      select: { id: true, name: true },
    });

    if (!candidate) {
      return NextResponse.json({ error: te("candidateNotFound") }, { status: 404 });
    }

    await prisma.candidate.update({
      where: { id: cid },
      data: { photoUpload: photo },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("candidate/photo error:", error);
    const te = await getTranslations("errors");
    return NextResponse.json({ error: te("serverError") }, { status: 500 });
  }
}
