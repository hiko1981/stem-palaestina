import { prisma } from "@/lib/prisma";
import { verifyOptout } from "@/lib/optout-sig";
import Link from "next/link";
import OptoutConfirmButton from "./OptoutConfirmButton";

interface Props {
  searchParams: Promise<{ cid?: string; sig?: string; done?: string }>;
}

async function performOptout(candidateId: number) {
  "use server";

  const candidate = await prisma.candidate.findUnique({
    where: { id: candidateId },
    select: { id: true, optedOut: true, phoneHash: true },
  });

  if (!candidate || candidate.optedOut) return;

  await prisma.candidate.update({
    where: { id: candidateId },
    data: { optedOut: true, optedOutAt: new Date() },
  });

  // Suppress the candidate's own phone if they have one
  if (candidate.phoneHash) {
    await prisma.phoneSuppression.upsert({
      where: { phoneHash: candidate.phoneHash },
      create: {
        phoneHash: candidate.phoneHash,
        scope: "all",
        reason: "candidate_optout",
      },
      update: {},
    }).catch(() => {});
  }

  // Suppress all phones that were used to invite this candidate
  const invitePhones = await prisma.candidateInvitePhone.findMany({
    where: { candidateId },
    select: { phoneHash: true },
  });

  for (const ip of invitePhones) {
    await prisma.phoneSuppression.upsert({
      where: { phoneHash: ip.phoneHash },
      create: {
        phoneHash: ip.phoneHash,
        scope: "candidate_invite",
        reason: `candidate_optout:${candidateId}`,
      },
      update: {},
    }).catch(() => {});
  }
}

export default async function AfmeldKandidatPage({ searchParams }: Props) {
  const params = await searchParams;
  const cidStr = params.cid;
  const sig = params.sig;

  if (!cidStr || !sig) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center max-w-sm">
          <h1 className="text-xl font-bold mb-2">Ugyldigt link</h1>
          <p className="text-gray-600 text-sm">
            Dette afmeldingslink er ugyldigt. Kontakt{" "}
            <Link href="/" className="text-melon-green hover:underline">
              Stem Palæstina
            </Link>{" "}
            hvis du har brug for hjælp.
          </p>
        </div>
      </div>
    );
  }

  const candidateId = parseInt(cidStr, 10);
  if (isNaN(candidateId) || !verifyOptout(candidateId, sig)) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center max-w-sm">
          <h1 className="text-xl font-bold mb-2">Ugyldigt link</h1>
          <p className="text-gray-600 text-sm">
            Signaturen kunne ikke verificeres. Kontakt{" "}
            <Link href="/" className="text-melon-green hover:underline">
              Stem Palæstina
            </Link>{" "}
            hvis du har brug for hjælp.
          </p>
        </div>
      </div>
    );
  }

  // Look up candidate
  const candidate = await prisma.candidate.findUnique({
    where: { id: candidateId },
    select: { id: true, name: true, optedOut: true, phoneHash: true },
  });

  if (!candidate) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center max-w-sm">
          <h1 className="text-xl font-bold mb-2">Kandidat ikke fundet</h1>
          <p className="text-gray-600 text-sm">
            Denne kandidat findes ikke længere.
          </p>
        </div>
      </div>
    );
  }

  if (candidate.optedOut) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center max-w-sm">
          <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-gray-100 mb-4">
            <svg className="h-8 w-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-xl font-bold mb-2">Allerede afmeldt</h1>
          <p className="text-gray-600 text-sm">
            {candidate.name} er allerede afmeldt fra Stem Palæstina.
          </p>
        </div>
      </div>
    );
  }

  // Show confirmation page (no mutation on GET)
  const boundOptout = performOptout.bind(null, candidateId);

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="text-center max-w-sm">
        <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-amber-100 mb-4">
          <svg className="h-8 w-8 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
          </svg>
        </div>
        <h1 className="text-xl font-bold mb-2">Afmeld fra Stem Palæstina</h1>
        <p className="text-gray-600 text-sm mb-6">
          Er du sikker på, at du vil afmelde <strong>{candidate.name}</strong> fra Stem Palæstina? Du vil ikke modtage flere henvendelser.
        </p>
        <OptoutConfirmButton action={boundOptout} />
      </div>
    </div>
  );
}
