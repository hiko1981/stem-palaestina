/**
 * Seed script: inserts the 12 party leaders (spidskandidater)
 * from Folketingsvalget 2026 as verified candidates.
 *
 * Run: npx tsx prisma/seed-candidates.ts
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const SPIDSKANDIDATER = [
  {
    name: "Mette Frederiksen",
    party: "Socialdemokratiet (A)",
    constituency: "Nordjyllands Storkreds",
  },
  {
    name: "Martin Lidegaard",
    party: "Radikale Venstre (B)",
    constituency: "Nordsjællands Storkreds",
  },
  {
    name: "Mona Juul",
    party: "Det Konservative Folkeparti (C)",
    constituency: "Østjyllands Storkreds",
  },
  {
    name: "Pia Olsen Dyhr",
    party: "SF – Socialistisk Folkeparti (F)",
    constituency: "Sjællands Storkreds",
  },
  {
    name: "Lars Boje Mathiesen",
    party: "Borgernes Parti (H)",
    constituency: "Østjyllands Storkreds",
  },
  {
    name: "Alex Vanopslagh",
    party: "Liberal Alliance (I)",
    constituency: "Østjyllands Storkreds",
  },
  {
    name: "Lars Løkke Rasmussen",
    party: "Moderaterne (M)",
    constituency: "Sjællands Storkreds",
  },
  {
    name: "Morten Messerschmidt",
    party: "Dansk Folkeparti (O)",
    constituency: "Sjællands Storkreds",
  },
  {
    name: "Troels Lund Poulsen",
    party: "Venstre (V)",
    constituency: "Østjyllands Storkreds",
  },
  {
    name: "Inger Støjberg",
    party: "Danmarksdemokraterne (Æ)",
    constituency: "Nordjyllands Storkreds",
  },
  {
    name: "Pelle Dragsted",
    party: "Enhedslisten (Ø)",
    constituency: "Københavns Storkreds",
  },
  {
    name: "Franciska Rosenkilde",
    party: "Alternativet (Å)",
    constituency: "Københavns Storkreds",
  },
];

async function main() {
  console.log("Seeding 12 spidskandidater from Folketingsvalget 2026...\n");

  let created = 0;
  let skipped = 0;

  for (const candidate of SPIDSKANDIDATER) {
    // Check if candidate already exists (by name + party)
    const existing = await prisma.candidate.findFirst({
      where: { name: candidate.name, party: candidate.party },
    });

    if (existing) {
      console.log(`  SKIP  ${candidate.name} (${candidate.party}) — already exists`);
      skipped++;
      continue;
    }

    await prisma.candidate.create({
      data: {
        name: candidate.name,
        party: candidate.party,
        constituency: candidate.constituency,
        verified: false,
        pledged: false,
        phoneHash: null,
        publicStatement: null,
      },
    });

    console.log(`  ADD   ${candidate.name} (${candidate.party}) → ${candidate.constituency}`);
    created++;
  }

  console.log(`\nDone: ${created} created, ${skipped} skipped.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
