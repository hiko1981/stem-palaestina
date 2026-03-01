/**
 * Fetch candidate photos from DR.dk / Altinget (FV26 data).
 *
 * Scrapes all 92 electoral districts from DR.dk's "Din stemmeseddel" pages,
 * extracts candidate photo filenames, downloads them to public/candidates/,
 * and updates the database with photoUrl.
 *
 * Run: npx tsx prisma/seed-candidate-photos.ts
 */

import { config } from "dotenv";
config({ path: ".env.local" });
config({ path: ".env" });

import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import * as fs from "fs";
import * as path from "path";
import * as https from "https";

const DR_BASE = "https://www.dr.dk/nyheder/politik/folketingsvalg/din-stemmeseddel";
const IMG_BASE = "https://asset.dr.dk/drdk/altinget/ft26";
const IMG_SIZE = 400; // px, good quality for cards
const OUT_DIR = path.join(__dirname, "..", "public", "candidates");

interface DrCandidate {
  name: string;
  partyCode: string;
  partyName: string;
  candidateId: string;
  picture: string;
}

// ── Helpers ──

function normalize(name: string): string {
  return name
    .toLowerCase()
    .replace(/[- ]+/g, " ")
    .replace(/ø/g, "oe")
    .replace(/æ/g, "ae")
    .replace(/å/g, "aa")
    .replace(/ü/g, "u")
    .replace(/é/g, "e")
    .trim();
}

function fetchText(url: string): Promise<string> {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { "User-Agent": "stem-palaestina/1.0" } }, (res) => {
      if (res.statusCode === 301 || res.statusCode === 302) {
        fetchText(res.headers.location!).then(resolve).catch(reject);
        return;
      }
      if (res.statusCode !== 200) {
        reject(new Error(`HTTP ${res.statusCode} for ${url}`));
        res.resume();
        return;
      }
      const chunks: Buffer[] = [];
      res.on("data", (c) => chunks.push(c));
      res.on("end", () => resolve(Buffer.concat(chunks).toString("utf-8")));
      res.on("error", reject);
    }).on("error", reject);
  });
}

function downloadFile(url: string, dest: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);
    https.get(url, { headers: { "User-Agent": "stem-palaestina/1.0" } }, (res) => {
      if (res.statusCode === 301 || res.statusCode === 302) {
        file.close();
        fs.unlinkSync(dest);
        downloadFile(res.headers.location!, dest).then(resolve).catch(reject);
        return;
      }
      if (res.statusCode !== 200) {
        file.close();
        fs.unlinkSync(dest);
        reject(new Error(`HTTP ${res.statusCode} for ${url}`));
        res.resume();
        return;
      }
      res.pipe(file);
      file.on("finish", () => { file.close(); resolve(); });
      file.on("error", (err) => { fs.unlinkSync(dest); reject(err); });
    }).on("error", (err) => { fs.unlinkSync(dest); reject(err); });
  });
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

// ── Parse DR.dk page ──

function parseCandidates(html: string): DrCandidate[] {
  const pattern = /\{\\?"partyId\\?":\\?"(\d+)\\?"[,\s]*\\?"partyCode\\?":\\?"([^"\\]+)\\?"[,\s]*\\?"partyName\\?":\\?"([^"\\]+)\\?"[,\s]*\\?"candidateId\\?":\\?"(\d+)\\?"[,\s]*\\?"name\\?":\\?"([^"\\]+)\\?"[,\s]*\\?"picture\\?":\\?"([^"\\]*)\\?"/g;
  const candidates: DrCandidate[] = [];
  let m;
  while ((m = pattern.exec(html)) !== null) {
    candidates.push({
      name: m[5],
      partyCode: m[2],
      partyName: m[3],
      candidateId: m[4],
      picture: m[6],
    });
  }
  return candidates;
}

// ── Main ──

async function main() {
  // Ensure output dir
  if (!fs.existsSync(OUT_DIR)) {
    fs.mkdirSync(OUT_DIR, { recursive: true });
  }

  // 1. Fetch all DR.dk candidates with photos from all districts
  //    Cache results to JSON so we don't re-scrape on retry
  const cacheFile = path.join(OUT_DIR, "_dr_cache.json");
  const allDrNames = new Map<string, DrCandidate>();

  if (fs.existsSync(cacheFile)) {
    console.log("📦 Loading cached DR.dk data...\n");
    const cached: DrCandidate[] = JSON.parse(fs.readFileSync(cacheFile, "utf-8"));
    for (const c of cached) allDrNames.set(normalize(c.name), c);
    console.log(`  ${cached.length} candidates with photos loaded from cache\n`);
  } else {
    console.log("🔍 Scraping DR.dk districts for candidate photos...\n");
    const photoMap = new Map<string, DrCandidate>();

    for (let districtId = 1; districtId <= 103; districtId++) {
      try {
        const html = await fetchText(`${DR_BASE}/${districtId}`);
        const candidates = parseCandidates(html);
        if (candidates.length === 0) continue;

        let photos = 0;
        for (const c of candidates) {
          if (c.picture && !photoMap.has(c.candidateId)) {
            photoMap.set(c.candidateId, c);
            photos++;
          }
          if (c.picture) allDrNames.set(normalize(c.name), c);
        }
        process.stdout.write(`  District ${districtId}: ${candidates.length} candidates, ${photos} new photos\n`);
      } catch {
        // District doesn't exist (404) — skip silently
      }
      if (districtId % 10 === 0) await sleep(500);
    }

    // Save cache
    const cached = Array.from(photoMap.values());
    fs.writeFileSync(cacheFile, JSON.stringify(cached, null, 2));
    console.log(`\n📊 DR.dk totals: ${photoMap.size} unique candidates with photos (cached)\n`);
  }

  // 2. Connect to DB (fresh connection after scraping)
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
  const prisma = new PrismaClient({ adapter });

  const dbCandidates = await prisma.candidate.findMany();
  console.log(`📋 Database has ${dbCandidates.length} candidates\n`);

  // 3. Match DB candidates to DR.dk photos
  let matched = 0;
  let downloaded = 0;
  let alreadyHad = 0;
  let noMatch = 0;

  for (const dbCandidate of dbCandidates) {
    const normName = normalize(dbCandidate.name);
    const drCandidate = allDrNames.get(normName);

    if (!drCandidate || !drCandidate.picture) {
      // Try partial matching: last name + first name initial
      const parts = normName.split(" ");
      let found: DrCandidate | undefined;
      if (parts.length >= 2) {
        const lastName = parts[parts.length - 1];
        for (const [drNorm, drC] of allDrNames) {
          if (drC.picture && drNorm.endsWith(lastName) && drNorm.startsWith(parts[0])) {
            found = drC;
            break;
          }
        }
      }
      if (!found) {
        noMatch++;
        continue;
      }
      // Use the fuzzy match
      const ext = path.extname(found.picture) || ".jpg";
      const filename = `${dbCandidate.id}${ext}`;
      const filePath = path.join(OUT_DIR, filename);

      if (fs.existsSync(filePath)) {
        alreadyHad++;
        await prisma.candidate.update({
          where: { id: dbCandidate.id },
          data: { photoUrl: `/candidates/${filename}` },
        });
        matched++;
        continue;
      }

      const imgUrl = `${IMG_BASE}/${found.picture}?im=Resize=(${IMG_SIZE},${IMG_SIZE})`;
      try {
        await downloadFile(imgUrl, filePath);
        await prisma.candidate.update({
          where: { id: dbCandidate.id },
          data: { photoUrl: `/candidates/${filename}` },
        });
        downloaded++;
        matched++;
        console.log(`  ✅ ${dbCandidate.name} (fuzzy) -> ${filename}`);
      } catch (err) {
        console.log(`  ❌ ${dbCandidate.name} (fuzzy) download failed: ${err}`);
      }
      continue;
    }

    // Exact name match
    const ext = path.extname(drCandidate.picture) || ".jpg";
    const filename = `${dbCandidate.id}${ext}`;
    const filePath = path.join(OUT_DIR, filename);

    if (fs.existsSync(filePath)) {
      alreadyHad++;
      await prisma.candidate.update({
        where: { id: dbCandidate.id },
        data: { photoUrl: `/candidates/${filename}` },
      });
      matched++;
      continue;
    }

    const imgUrl = `${IMG_BASE}/${drCandidate.picture}?im=Resize=(${IMG_SIZE},${IMG_SIZE})`;
    try {
      await downloadFile(imgUrl, filePath);
      await prisma.candidate.update({
        where: { id: dbCandidate.id },
        data: { photoUrl: `/candidates/${filename}` },
      });
      downloaded++;
      matched++;
      console.log(`  ✅ ${dbCandidate.name} -> ${filename}`);
    } catch (err) {
      console.log(`  ❌ ${dbCandidate.name} download failed: ${err}`);
    }

    // Rate limit downloads
    if (downloaded % 20 === 0) await sleep(300);
  }

  console.log(`
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📸 Results:
  Matched:    ${matched} / ${dbCandidates.length}
  Downloaded: ${downloaded} new photos
  Cached:     ${alreadyHad} already existed
  No match:   ${noMatch} candidates without DR.dk photo
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`);

  await prisma.$disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
