import { NextRequest, NextResponse } from "next/server";
import { getTranslations } from "next-intl/server";
import { prisma } from "@/lib/prisma";
import { candidateRegisterSchema } from "@/lib/validation";
import { notifyAdminNewCandidate } from "@/lib/admin-notify";
import { checkRateLimit } from "@/lib/rate-limit";

export async function POST(req: NextRequest) {
  try {
    const te = await getTranslations("errors");
    const tv = await getTranslations("validation");

    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
    const rl = await checkRateLimit("candidate-register", ip, 10, 60_000);
    if (!rl.ok) {
      return NextResponse.json(
        { error: te("tooManyWait") },
        { status: 429 }
      );
    }
    const body = await req.json();
    const parsed = candidateRegisterSchema.safeParse(body);
    if (!parsed.success) {
      const key = parsed.error.issues[0].message;
      return NextResponse.json(
        { error: tv.has(key) ? tv(key) : key },
        { status: 400 }
      );
    }

    // Look up ballot token to get phoneHash
    const ballotToken = await prisma.ballotToken.findUnique({
      where: { token: parsed.data.token },
      select: { phoneHash: true },
    });
    if (!ballotToken) {
      return NextResponse.json(
        { error: te("invalidBallot") },
        { status: 400 }
      );
    }

    // Verify that this phone has actually voted
    const vote = await prisma.vote.findUnique({
      where: { phoneHash: ballotToken.phoneHash },
    });
    if (!vote) {
      return NextResponse.json(
        { error: te("mustVoteToRegister") },
        { status: 400 }
      );
    }

    // Check if already registered
    const existing = await prisma.candidate.findFirst({
      where: { phoneHash: ballotToken.phoneHash },
    });
    if (existing) {
      return NextResponse.json(
        { error: te("alreadyRegistered") },
        { status: 409 }
      );
    }

    await prisma.candidate.create({
      data: {
        name: parsed.data.name,
        party: parsed.data.party,
        constituency: parsed.data.constituency,
        contactEmail: parsed.data.email,
        phoneHash: ballotToken.phoneHash,
      },
    });

    // Fire-and-forget admin notification
    notifyAdminNewCandidate(parsed.data.name, parsed.data.party, parsed.data.constituency);

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("candidate/register error:", error);
    const te = await getTranslations("errors");
    return NextResponse.json(
      { error: te("serverError") },
      { status: 500 }
    );
  }
}
