/**
 * Seed script: creates 60 anonymous voter votes for testing the public results display.
 * Roughly 70% Ja, 30% Nej.
 *
 * Run: npx tsx prisma/seed-test-voter-votes.ts
 * Undo: npx tsx prisma/seed-test-voter-votes.ts --clean
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

const TEST_VOTER_PREFIX = "test_voter_";
const TOTAL = 60;
const JA_COUNT = 42; // ~70% Ja

function fakeHash(index: number): string {
  return (
    TEST_VOTER_PREFIX +
    createHash("sha256")
      .update(`test_voter_salt_${index}`)
      .digest("hex")
      .slice(0, 32)
  );
}

async function clean() {
  console.log("Cleaning test voter votes...");
  const deleted = await prisma.vote.deleteMany({
    where: { phoneHash: { startsWith: TEST_VOTER_PREFIX } },
  });
  console.log(`Deleted ${deleted.count} test voter votes.`);
}

async function seed() {
  console.log(`Seeding ${TOTAL} test voter votes (${JA_COUNT} Ja, ${TOTAL - JA_COUNT} Nej)...\n`);

  let created = 0;
  for (let i = 0; i < TOTAL; i++) {
    const phoneHash = fakeHash(i);
    const voteValue = i < JA_COUNT; // first 42 = Ja, rest = Nej

    await prisma.vote.upsert({
      where: { phoneHash },
      create: { phoneHash, voteValue },
      update: { voteValue },
    });
    created++;
  }

  console.log(`Done! ${created} test voter votes seeded.`);
  console.log(`Clean up with: npx tsx prisma/seed-test-voter-votes.ts --clean`);
}

const isClean = process.argv.includes("--clean");
(isClean ? clean() : seed())
  .catch(console.error)
  .finally(() => prisma.$disconnect());
