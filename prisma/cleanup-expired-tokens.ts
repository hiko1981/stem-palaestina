/**
 * One-time cleanup: deletes expired, unused ballot tokens.
 *
 * Run: npx tsx prisma/cleanup-expired-tokens.ts
 */

import { config } from "dotenv";
config({ path: ".env.local" });
config({ path: ".env" });

import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const url = process.env.DATABASE_URL!.replace(/\\n/g, "").trim();
const adapter = new PrismaPg({ connectionString: url });
const prisma = new PrismaClient({ adapter });

async function main() {
  const deleted = await prisma.ballotToken.deleteMany({
    where: { expiresAt: { lt: new Date() }, used: false },
  });
  console.log(`Deleted ${deleted.count} expired unused ballot tokens.`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
