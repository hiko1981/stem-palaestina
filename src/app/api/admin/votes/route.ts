import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendVerificationEmail } from "@/lib/candidate-email";
import { requireAdmin, isAuthError } from "@/lib/admin-auth";

export async function GET(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (isAuthError(auth)) return auth;

  try {
    const [votes, tokens, candidates, supportMessages, suppressions] = await Promise.all([
      prisma.vote.findMany({
        orderBy: { votedAt: "desc" },
      }),
      prisma.ballotToken.findMany({
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          phoneHash: true,
          phone: true,
          used: true,
          expiresAt: true,
          createdAt: true,
        },
      }),
      prisma.candidate.findMany({
        orderBy: { createdAt: "desc" },
      }),
      prisma.supportMessage.findMany({
        orderBy: { createdAt: "desc" },
      }),
      prisma.phoneSuppression.findMany({
        orderBy: { createdAt: "desc" },
      }),
    ]);

    return NextResponse.json({ votes, tokens, candidates, supportMessages, suppressions });
  } catch (error) {
    console.error("admin/votes GET error:", error);
    return NextResponse.json(
      { error: "Intern serverfejl" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (isAuthError(auth)) return auth;

  try {
    const body = await req.json();

    if (body.all === true) {
      await Promise.all([
        prisma.vote.deleteMany(),
        prisma.ballotToken.updateMany({
          data: { used: false },
        }),
      ]);
      return NextResponse.json({ ok: true, deleted: "all" });
    }

    if (body.phoneHash) {
      await Promise.all([
        prisma.vote.deleteMany({
          where: { phoneHash: body.phoneHash },
        }),
        prisma.ballotToken.updateMany({
          where: { phoneHash: body.phoneHash },
          data: { used: false },
        }),
      ]);
      return NextResponse.json({ ok: true, deleted: body.phoneHash });
    }

    return NextResponse.json(
      { error: "Angiv phoneHash eller all: true" },
      { status: 400 }
    );
  } catch (error) {
    console.error("admin/votes DELETE error:", error);
    return NextResponse.json(
      { error: "Intern serverfejl" },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (isAuthError(auth)) return auth;

  try {
    const body = await req.json();

    if (body.candidateId && typeof body.verified === "boolean") {
      const candidate = await prisma.candidate.update({
        where: { id: body.candidateId },
        data: { verified: body.verified },
      });

      // Send welcome email when verifying (not when un-verifying)
      let emailSent = false;
      if (body.verified && candidate.contactEmail) {
        try {
          await sendVerificationEmail(candidate);
          emailSent = true;
        } catch (e) {
          console.error("Failed to send verification email:", e);
        }
      }

      return NextResponse.json({ ok: true, emailSent });
    }

    if (body.deleteCandidateId) {
      await prisma.candidate.delete({
        where: { id: body.deleteCandidateId },
      });
      return NextResponse.json({ ok: true });
    }

    if (body.deleteSupportId) {
      await prisma.supportMessage.delete({
        where: { id: body.deleteSupportId },
      });
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json(
      { error: "Ugyldige parametre" },
      { status: 400 }
    );
  } catch (error) {
    console.error("admin/votes PATCH error:", error);
    return NextResponse.json(
      { error: "Intern serverfejl" },
      { status: 500 }
    );
  }
}
