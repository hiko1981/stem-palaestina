import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { candidateRegisterSchema } from "@/lib/validation";
import { notifyAdminNewCandidate } from "@/lib/admin-notify";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = candidateRegisterSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    // Look up ballot token to get phoneHash + phone
    const ballotToken = await prisma.ballotToken.findUnique({
      where: { token: parsed.data.token },
      select: { phoneHash: true, phone: true },
    });
    if (!ballotToken) {
      return NextResponse.json(
        { error: "Ugyldig stemmeseddel" },
        { status: 400 }
      );
    }

    // Verify that this phone has actually voted
    const vote = await prisma.vote.findUnique({
      where: { phoneHash: ballotToken.phoneHash },
    });
    if (!vote) {
      return NextResponse.json(
        { error: "Du skal stemme før du kan registrere dig som kandidat" },
        { status: 400 }
      );
    }

    // Check if already registered
    const existing = await prisma.candidate.findFirst({
      where: { phoneHash: ballotToken.phoneHash },
    });
    if (existing) {
      return NextResponse.json(
        { error: "Du er allerede registreret som kandidat" },
        { status: 409 }
      );
    }

    await prisma.candidate.create({
      data: {
        name: parsed.data.name,
        party: parsed.data.party,
        constituency: parsed.data.constituency,
        phoneHash: ballotToken.phoneHash,
        ...(ballotToken.phone ? { contactPhone: ballotToken.phone } : {}),
      },
    });

    // Fire-and-forget admin notification
    notifyAdminNewCandidate(parsed.data.name, parsed.data.party, parsed.data.constituency);

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("candidate/register error:", error);
    return NextResponse.json(
      { error: "Intern serverfejl" },
      { status: 500 }
    );
  }
}
