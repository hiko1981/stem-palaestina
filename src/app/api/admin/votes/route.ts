import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendVerificationEmail } from "@/lib/candidate-email";
import { requireAdmin, isAuthError } from "@/lib/admin-auth";

async function logAudit(
  adminId: number,
  action: string,
  targetType: string,
  targetId: number,
  meta?: Record<string, unknown>
) {
  await prisma.adminAuditLog.create({
    data: {
      adminId,
      action,
      targetType,
      targetId,
      meta: meta ? JSON.stringify(meta) : null,
    },
  });
}

export async function GET(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (isAuthError(auth)) return auth;

  try {
    const adminId = Number(auth.sub);
    const [votes, tokens, candidates, supportMessages, suppressions, adminUser, auditLog] = await Promise.all([
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
      prisma.phoneSuppression.findMany({
        orderBy: { createdAt: "desc" },
      }),
      prisma.adminUser.findUnique({
        where: { id: adminId },
        select: { name: true, email: true, role: true },
      }),
      prisma.adminAuditLog.findMany({
        orderBy: { createdAt: "desc" },
        take: 100,
      }),
    ]);

    // Resolve admin names for audit log
    const adminIds = [...new Set(auditLog.flatMap((e) => [e.adminId, e.reversedBy].filter(Boolean) as number[]))];
    const admins = adminIds.length > 0
      ? await prisma.adminUser.findMany({
          where: { id: { in: adminIds } },
          select: { id: true, name: true, email: true },
        })
      : [];
    const adminMap = Object.fromEntries(admins.map((a) => [a.id, a.name || a.email]));

    const auditLogWithNames = auditLog.map((e) => ({
      ...e,
      adminName: adminMap[e.adminId] || `Admin #${e.adminId}`,
      reversedByName: e.reversedBy ? adminMap[e.reversedBy] || `Admin #${e.reversedBy}` : null,
      meta: e.meta ? JSON.parse(e.meta) : null,
    }));

    return NextResponse.json({
      adminName: adminUser?.name || adminUser?.email || auth.email,
      adminRole: adminUser?.role || "admin",
      votes,
      tokens,
      candidates,
      supportMessages,
      suppressions,
      auditLog: auditLogWithNames,
    });
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
    const adminId = Number(auth.sub);

    if (body.all === true) {
      const voteCount = await prisma.vote.count();
      await Promise.all([
        prisma.vote.deleteMany(),
        prisma.ballotToken.updateMany({
          data: { used: false },
        }),
      ]);
      await logAudit(adminId, "delete_all_votes", "vote", 0, { count: voteCount });
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
      await logAudit(adminId, "delete_vote", "vote", 0, { phoneHash: body.phoneHash });
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
    const adminId = Number(auth.sub);

    // ── Reverse an audit log entry (master only) ──
    if (body.reverseAudit) {
      const admin = await prisma.adminUser.findUnique({
        where: { id: adminId },
        select: { role: true },
      });
      if (admin?.role !== "master") {
        return NextResponse.json({ error: "Kun superadmin kan fortryde" }, { status: 403 });
      }

      const entry = await prisma.adminAuditLog.findUnique({
        where: { id: body.reverseAudit },
      });
      if (!entry) {
        return NextResponse.json({ error: "Audit-entry ikke fundet" }, { status: 404 });
      }
      if (entry.reversed) {
        return NextResponse.json({ error: "Allerede fortrudt" }, { status: 400 });
      }

      const meta = entry.meta ? JSON.parse(entry.meta) : {};

      switch (entry.action) {
        case "approve_photo": {
          await prisma.candidate.update({
            where: { id: entry.targetId },
            data: {
              photoUrl: meta.previousPhotoUrl || null,
              photoUpload: meta.photoUpload || null,
            },
          });
          break;
        }
        case "reject_photo": {
          await prisma.candidate.update({
            where: { id: entry.targetId },
            data: { photoUpload: meta.photoUpload || null },
          });
          break;
        }
        case "verify_candidate": {
          await prisma.candidate.update({
            where: { id: entry.targetId },
            data: { verified: false },
          });
          break;
        }
        case "unverify_candidate": {
          await prisma.candidate.update({
            where: { id: entry.targetId },
            data: { verified: true },
          });
          break;
        }
        case "handle_support": {
          await prisma.supportMessage.update({
            where: { id: entry.targetId },
            data: { handledBy: null, handledAt: null },
          });
          break;
        }
        default:
          return NextResponse.json(
            { error: `Handlingen "${entry.action}" kan ikke fortrydes` },
            { status: 400 }
          );
      }

      await prisma.adminAuditLog.update({
        where: { id: entry.id },
        data: { reversed: true, reversedAt: new Date(), reversedBy: adminId },
      });

      return NextResponse.json({ ok: true });
    }

    // ── Approve photo ──
    if (body.approvePhoto) {
      const candidate = await prisma.candidate.findUnique({
        where: { id: body.approvePhoto },
        select: { photoUpload: true, photoUrl: true, name: true },
      });
      if (!candidate?.photoUpload) {
        return NextResponse.json({ error: "Ingen foto at godkende" }, { status: 400 });
      }
      await prisma.candidate.update({
        where: { id: body.approvePhoto },
        data: { photoUrl: candidate.photoUpload, photoUpload: null },
      });
      await logAudit(adminId, "approve_photo", "candidate", body.approvePhoto, {
        candidateName: candidate.name,
        photoUpload: candidate.photoUpload,
        previousPhotoUrl: candidate.photoUrl,
      });
      return NextResponse.json({ ok: true });
    }

    // ── Reject photo ──
    if (body.rejectPhoto) {
      const candidate = await prisma.candidate.findUnique({
        where: { id: body.rejectPhoto },
        select: { photoUpload: true, name: true },
      });
      await prisma.candidate.update({
        where: { id: body.rejectPhoto },
        data: { photoUpload: null },
      });
      await logAudit(adminId, "reject_photo", "candidate", body.rejectPhoto, {
        candidateName: candidate?.name,
        photoUpload: candidate?.photoUpload,
      });
      return NextResponse.json({ ok: true });
    }

    // ── Handle support ──
    if (body.handleSupport) {
      const msg = await prisma.supportMessage.findUnique({
        where: { id: body.handleSupport },
        select: { category: true, message: true },
      });
      await prisma.supportMessage.update({
        where: { id: body.handleSupport },
        data: {
          handledBy: adminId,
          handledAt: new Date(),
        },
      });
      await logAudit(adminId, "handle_support", "support_message", body.handleSupport, {
        category: msg?.category,
        message: msg?.message,
      });
      return NextResponse.json({ ok: true });
    }

    // ── Verify / unverify candidate ──
    if (body.candidateId && typeof body.verified === "boolean") {
      const candidate = await prisma.candidate.update({
        where: { id: body.candidateId },
        data: { verified: body.verified },
      });

      const action = body.verified ? "verify_candidate" : "unverify_candidate";
      await logAudit(adminId, action, "candidate", body.candidateId, {
        candidateName: candidate.name,
      });

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

    // ── Delete candidate ──
    if (body.deleteCandidateId) {
      const candidate = await prisma.candidate.findUnique({
        where: { id: body.deleteCandidateId },
      });
      await prisma.candidate.delete({
        where: { id: body.deleteCandidateId },
      });
      await logAudit(adminId, "delete_candidate", "candidate", body.deleteCandidateId, {
        candidateName: candidate?.name,
        party: candidate?.party,
        constituency: candidate?.constituency,
      });
      return NextResponse.json({ ok: true });
    }

    // ── Delete support message ──
    if (body.deleteSupportId) {
      const msg = await prisma.supportMessage.findUnique({
        where: { id: body.deleteSupportId },
        select: { category: true, message: true },
      });
      await prisma.supportMessage.delete({
        where: { id: body.deleteSupportId },
      });
      await logAudit(adminId, "delete_support", "support_message", body.deleteSupportId, {
        category: msg?.category,
        message: msg?.message,
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
