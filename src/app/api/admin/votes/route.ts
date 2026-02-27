import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;
if (!ADMIN_PASSWORD) throw new Error("ADMIN_PASSWORD not set");

function checkAuth(req: NextRequest): boolean {
  const auth = req.headers.get("authorization");
  return auth === `Bearer ${ADMIN_PASSWORD}`;
}

export async function GET(req: NextRequest) {
  if (!checkAuth(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const [votes, tokens, candidates, supportMessages] = await Promise.all([
      prisma.vote.findMany({
        orderBy: { votedAt: "desc" },
      }),
      prisma.ballotToken.findMany({
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          phoneHash: true,
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
    ]);

    return NextResponse.json({ votes, tokens, candidates, supportMessages });
  } catch (error) {
    console.error("admin/votes GET error:", error);
    return NextResponse.json(
      { error: "Intern serverfejl" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  if (!checkAuth(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

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
  if (!checkAuth(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();

    if (body.candidateId && typeof body.verified === "boolean") {
      await prisma.candidate.update({
        where: { id: body.candidateId },
        data: { verified: body.verified },
      });
      return NextResponse.json({ ok: true });
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
