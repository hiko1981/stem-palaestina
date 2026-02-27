/**
 * Seed script: creates test candidates with verified status and associated votes.
 * For testing the results display.
 *
 * Run: npx tsx prisma/seed-test-votes.ts
 * Undo: npx tsx prisma/seed-test-votes.ts --clean
 */

import { config } from "dotenv";
config({ path: ".env.local" });
config({ path: ".env" });

import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { createHash } from "crypto";

const url = process.env.DATABASE_URL!.replace(/\\n/g, "").trim();
const adapter = new PrismaPg({ connectionString: url });
const prisma = new PrismaClient({ adapter });

// Prefix so we can identify and clean up test data
const TEST_PHONE_PREFIX = "test_candidate_";

const TEST_CANDIDATES = [
  { name: "Mette Frederiksen", party: "Socialdemokratiet (A)", constituency: "Sjællands Storkreds", vote: true },
  { name: "Jakob Ellemann-Jensen", party: "Venstre (V)", constituency: "Østjyllands Storkreds", vote: false },
  { name: "Pia Olsen Dyhr", party: "SF (F)", constituency: "Københavns Storkreds", vote: true },
  { name: "Pernille Vermund", party: "Nye Borgerlige (D)", constituency: "Nordsjællands Storkreds", vote: false },
  { name: "Mai Villadsen", party: "Enhedslisten (Ø)", constituency: "Københavns Storkreds", vote: true },
  { name: "Alex Vanopslagh", party: "Liberal Alliance (I)", constituency: "Københavns Storkreds", vote: false },
  { name: "Søren Pape Poulsen", party: "Det Konservative Folkeparti (C)", constituency: "Østjyllands Storkreds", vote: true },
  { name: "Franciska Rosenkilde", party: "Alternativet (Å)", constituency: "Københavns Storkreds", vote: true },
  { name: "Lars Løkke Rasmussen", party: "Moderaterne (M)", constituency: "Nordjyllands Storkreds", vote: true },
  { name: "Morten Messerschmidt", party: "Dansk Folkeparti (O)", constituency: "Sydjyllands Storkreds", vote: false },
  { name: "Sofie Carsten Nielsen", party: "Radikale Venstre (B)", constituency: "Københavns Storkreds", vote: true },
  { name: "Pernille Skipper", party: "Enhedslisten (Ø)", constituency: "Københavns Omegns Storkreds", vote: true },
];

function fakeHash(identifier: string): string {
  return createHash("sha256").update(`test_salt_${identifier}`).digest("hex");
}

async function clean() {
  console.log("Cleaning test data...");

  // Find test candidates by phoneHash prefix pattern
  const testCandidates = await prisma.candidate.findMany({
    where: { phoneHash: { startsWith: TEST_PHONE_PREFIX } },
  });

  // Delete associated votes
  for (const c of testCandidates) {
    if (c.phoneHash) {
      await prisma.vote.deleteMany({ where: { phoneHash: c.phoneHash } });
    }
  }

  // Delete test candidates
  const deleted = await prisma.candidate.deleteMany({
    where: { phoneHash: { startsWith: TEST_PHONE_PREFIX } },
  });

  console.log(`Deleted ${deleted.count} test candidates and their votes.`);
}

async function seed() {
  console.log("Seeding test candidates with votes...\n");

  for (const tc of TEST_CANDIDATES) {
    const phoneHash = TEST_PHONE_PREFIX + fakeHash(tc.name).slice(0, 16);

    // Check if real candidate with this name already exists
    const existing = await prisma.candidate.findFirst({
      where: { name: tc.name },
    });

    if (existing) {
      // Update existing candidate to have phoneHash and verified
      await prisma.candidate.update({
        where: { id: existing.id },
        data: { phoneHash, verified: true },
      });
      console.log(`UPD  ${tc.name} (existing id=${existing.id})`);
    } else {
      // Create new test candidate
      await prisma.candidate.create({
        data: {
          name: tc.name,
          party: tc.party,
          constituency: tc.constituency,
          phoneHash,
          verified: true,
        },
      });
      console.log(`ADD  ${tc.name}`);
    }

    // Upsert vote
    await prisma.vote.upsert({
      where: { phoneHash },
      create: { phoneHash, voteValue: tc.vote },
      update: { voteValue: tc.vote },
    });
    console.log(`     → voted ${tc.vote ? "Ja" : "Nej"}`);
  }

  console.log(`\nDone! ${TEST_CANDIDATES.length} test candidates seeded.`);
}

const isClean = process.argv.includes("--clean");
(isClean ? clean() : seed())
  .catch(console.error)
  .finally(() => prisma.$disconnect());
