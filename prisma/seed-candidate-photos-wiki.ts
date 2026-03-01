/**
 * Fill in missing candidate photos from Wikimedia Commons via Wikidata SPARQL.
 *
 * For candidates without photos, queries Wikidata for Folketinget members
 * with images, resolves Wikimedia thumbnail URLs, and downloads.
 *
 * Run: npx tsx prisma/seed-candidate-photos-wiki.ts
 */
import { config } from "dotenv";
config({ path: ".env.local" });
config({ path: ".env" });

import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import * as fs from "fs";
import * as path from "path";

const OUT_DIR = path.join(__dirname, "..", "public", "candidates");
const THUMB_WIDTH = 400;

function normalize(name: string): string {
  return name.toLowerCase().replace(/[-.]+/g, " ").replace(/\s+/g, " ")
    .replace(/ø/g, "oe").replace(/æ/g, "ae").replace(/å/g, "aa")
    .replace(/ü/g, "u").replace(/é/g, "e").replace(/ö/g, "o").trim();
}

const UA = "vote-palestine/1.0 (https://vote-palestine.com; contact via GitHub)";

async function fetchText(url: string, postData?: string): Promise<string> {
  const res = await fetch(url, {
    method: postData ? "POST" : "GET",
    headers: {
      "User-Agent": UA,
      ...(postData ? { "Content-Type": "application/x-www-form-urlencoded" } : {}),
    },
    body: postData || undefined,
    redirect: "follow",
  });
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  return res.text();
}

/** Follow redirects to get the final URL without downloading body */
async function resolveUrl(url: string): Promise<string> {
  for (let attempt = 0; attempt < 3; attempt++) {
    const res = await fetch(url, {
      headers: { "User-Agent": UA },
      redirect: "follow",
    });
    if (res.status === 429) {
      res.body?.cancel();
      await sleep(Math.pow(2, attempt + 1) * 1000);
      continue;
    }
    res.body?.cancel();
    return res.url;
  }
  throw new Error("Rate limited after 3 retries");
}

async function downloadFile(url: string, dest: string, retries = 3): Promise<boolean> {
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      const res = await fetch(url, {
        headers: { "User-Agent": UA },
        redirect: "follow",
      });
      if (res.status === 429) {
        const wait = Math.pow(2, attempt + 1) * 1000; // 2s, 4s, 8s
        console.log(`    ⏳ Rate limited, waiting ${wait / 1000}s...`);
        await sleep(wait);
        continue;
      }
      if (!res.ok) return false;
      const buf = Buffer.from(await res.arrayBuffer());
      fs.writeFileSync(dest, buf);
      return true;
    } catch {
      if (attempt < retries - 1) await sleep(2000);
    }
  }
  return false;
}

function sleep(ms: number) { return new Promise((r) => setTimeout(r, ms)); }

async function main() {
  // 1. Query Wikidata for all Folketingsmedlemmer with images
  console.log("🌐 Querying Wikidata for Folketingsmedlemmer photos...\n");
  const sparql = `SELECT ?personLabel ?image WHERE {
    ?person wdt:P39 wd:Q12311817 .
    ?person wdt:P18 ?image .
    SERVICE wikibase:label { bd:serviceParam wikibase:language "da,en" }
  }`;
  const wdUrl = "https://query.wikidata.org/sparql?format=json";
  const wdText = await fetchText(wdUrl, `query=${encodeURIComponent(sparql)}`);
  const wdData = JSON.parse(wdText);

  // Build map: normalized name -> commons image URL
  const wikiMap = new Map<string, string>();
  for (const r of wdData.results.bindings) {
    const name = r.personLabel.value;
    const imgUrl = r.image.value.replace("http://", "https://");
    wikiMap.set(normalize(name), imgUrl);
  }
  console.log(`  Found ${wikiMap.size} politician photos on Wikimedia\n`);

  // 2. Get DB candidates without photos
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
  const prisma = new PrismaClient({ adapter });
  const missing = await prisma.candidate.findMany({
    where: { photoUrl: null },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });
  console.log(`📋 ${missing.length} candidates without photos\n`);

  // 3. Match, resolve thumbnail URLs, download
  let matched = 0;
  let downloaded = 0;
  let failed = 0;

  for (const c of missing) {
    const norm = normalize(c.name);
    const normClean = norm.replace(/\./g, "").replace(/\s+/g, " ");
    let wikiUrl = wikiMap.get(norm) || wikiMap.get(normClean);

    // Fuzzy: first + last name
    if (!wikiUrl) {
      const parts = c.name.split(" ");
      const first = normalize(parts[0]);
      const last = normalize(parts[parts.length - 1]);
      for (const [k, v] of wikiMap) {
        if (k.startsWith(first) && k.endsWith(last)) {
          wikiUrl = v;
          break;
        }
      }
    }

    if (!wikiUrl) continue;
    matched++;

    const filename = `${c.id}.jpg`;
    const filePath = path.join(OUT_DIR, filename);
    if (fs.existsSync(filePath) && fs.statSync(filePath).size > 1000) {
      await prisma.candidate.update({ where: { id: c.id }, data: { photoUrl: `/candidates/${filename}` } });
      downloaded++;
      console.log(`  ✅ ${c.name} (cached)`);
      continue;
    }

    try {
      // Resolve Special:FilePath -> upload.wikimedia.org/wikipedia/commons/{hash}/{filename}
      const baseImgUrl = await resolveUrl(wikiUrl);

      // Construct thumbnail URL
      // From: .../commons/a/a7/File.jpg
      // To:   .../commons/thumb/a/a7/File.jpg/400px-File.jpg
      const commonsBase = "upload.wikimedia.org/wikipedia/commons/";
      const idx = baseImgUrl.indexOf(commonsBase);
      if (idx === -1) {
        console.log(`  ⚠️  ${c.name}: unexpected URL format: ${baseImgUrl}`);
        failed++;
        continue;
      }
      // pathAfterCommons is already properly encoded from the redirect
      const pathAfterCommons = baseImgUrl.substring(idx + commonsBase.length);
      const encodedFilename = pathAfterCommons.split("/").pop()!;
      const thumbUrl = `https://${commonsBase}thumb/${pathAfterCommons}/${THUMB_WIDTH}px-${encodedFilename}`;

      const ok = await downloadFile(thumbUrl, filePath);
      if (ok && fs.statSync(filePath).size > 1000) {
        await prisma.candidate.update({ where: { id: c.id }, data: { photoUrl: `/candidates/${filename}` } });
        downloaded++;
        console.log(`  ✅ ${c.name} -> ${Math.round(fs.statSync(filePath).size / 1024)}KB`);
      } else {
        // Try full-size image as fallback
        try { fs.unlinkSync(filePath); } catch {}
        const ok2 = await downloadFile(baseImgUrl, filePath);
        if (ok2 && fs.statSync(filePath).size > 1000) {
          await prisma.candidate.update({ where: { id: c.id }, data: { photoUrl: `/candidates/${filename}` } });
          downloaded++;
          console.log(`  ✅ ${c.name} (full-size) -> ${Math.round(fs.statSync(filePath).size / 1024)}KB`);
        } else {
          try { fs.unlinkSync(filePath); } catch {}
          failed++;
          console.log(`  ❌ ${c.name}: download failed`);
        }
      }
    } catch (e) {
      failed++;
      console.log(`  ❌ ${c.name}: ${e}`);
    }

    await sleep(1000);
  }

  const finalMissing = await prisma.candidate.count({ where: { photoUrl: null } });
  const total = await prisma.candidate.count();

  console.log(`
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📸 Wikimedia Results:
  Wiki matched: ${matched} / ${missing.length}
  Downloaded:   ${downloaded}
  Failed:       ${failed}

  Total coverage: ${total - finalMissing} / ${total} (${Math.round((total - finalMissing) / total * 100)}%)
  Still missing:  ${finalMissing}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`);

  await prisma.$disconnect();
}

main().catch(console.error);
