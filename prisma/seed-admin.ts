/**
 * Seed master admin user.
 * Usage: npx tsx prisma/seed-admin.ts
 */
import { config } from "dotenv";
config({ path: ".env.local" });
config({ path: ".env" });

import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
  const admin = await prisma.adminUser.upsert({
    where: { email: "hikmetaltunmail@gmail.com" },
    create: {
      email: "hikmetaltunmail@gmail.com",
      phone: "+4527141448",
      name: "Hikmet Altun",
      role: "master",
    },
    update: {
      role: "master",
      active: true,
    },
  });

  console.log("Master admin seeded:", admin);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
