/**
 * Fill in missing candidate photos from Folketingets ODA API.
 *
 * For candidates without DR.dk photos, fetches photo URLs from ODA API,
 * then tries downloading via ft.dk (with browser-like headers) or
 * constructs predictable URLs from the ODA naming pattern.
 *
 * Run: npx tsx prisma/seed-candidate-photos-oda.ts
 */
import { config } from "dotenv";
config({ path: ".env.local" });
config({ path: ".env" });

import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import * as fs from "fs";
import * as path from "path";
import * as https from "https";
import * as http from "http";

const OUT_DIR = path.join(__dirname, "..", "public", "candidates");

function normalize(name: string): string {
  return name.toLowerCase().replace(/[-.]+/g, " ").replace(/\s+/g, " ")
    .replace(/ø/g, "oe").replace(/æ/g, "ae").replace(/å/g, "aa")
    .replace(/ü/g, "u").replace(/é/g, "e").replace(/ö/g, "o").trim();
}

function fetchText(url: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const mod = url.startsWith("https") ? https : http;
    mod.get(url, { headers: { "User-Agent": "stem-palaestina/1.0" } }, (res) => {
      if (res.statusCode === 301 || res.statusCode === 302) {
        return fetchText(res.headers.location!).then(resolve).catch(reject);
      }
      if (res.statusCode !== 200) { reject(new Error(`HTTP ${res.statusCode}`)); res.resume(); return; }
      const chunks: Buffer[] = [];
      res.on("data", (c) => chunks.push(c));
      res.on("end", () => resolve(Buffer.concat(chunks).toString("utf-8")));
      res.on("error", reject);
    }).on("error", reject);
  });
}

function downloadFile(url: string, dest: string): Promise<boolean> {
  return new Promise((resolve) => {
    const mod = url.startsWith("https") ? https : http;
    const req = mod.get(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36",
        "Accept": "image/avif,image/webp,image/apng,image/*,*/*;q=0.8",
        "Accept-Language": "da,en;q=0.9",
        "Referer": "https://www.ft.dk/",
      },
    }, (res) => {
      if (res.statusCode === 301 || res.statusCode === 302) {
        downloadFile(res.headers.location!, dest).then(resolve);
        return;
      }
      if (res.statusCode !== 200 || !res.headers["content-type"]?.startsWith("image")) {
        res.resume();
        resolve(false);
        return;
      }
      const file = fs.createWriteStream(dest);
      res.pipe(file);
      file.on("finish", () => { file.close(); resolve(true); });
      file.on("error", () => { try { fs.unlinkSync(dest); } catch {} resolve(false); });
    });
    req.on("error", () => resolve(false));
    req.setTimeout(10000, () => { req.destroy(); resolve(false); });
  });
}

function sleep(ms: number) { return new Promise((r) => setTimeout(r, ms)); }

async function main() {
  // 1. Fetch ODA API — all actors of type 5 (Folketingsmedlemmer)
  console.log("🏛️  Fetching ODA API for Folketingsmedlemmer photos...\n");
  const odaMap = new Map<string, string>(); // normalized name -> pictureMiRes URL

  let skip = 0;
  while (true) {
    const url = `https://oda.ft.dk/api/Akt%C3%B8r?$format=json&$filter=typeid%20eq%205&$top=100&$skip=${skip}&$orderby=opdateringsdato%20desc`;
    const text = await fetchText(url);
    const data = JSON.parse(text);
    if (!data.value?.length) break;

    for (const actor of data.value) {
      const bio = actor.biografi || "";
      const picMatch = bio.match(/<pictureMiRes>([^<]+)<\/pictureMiRes>/);
      if (picMatch) {
        const fullName = `${actor.fornavn} ${actor.efternavn}`.trim();
        odaMap.set(normalize(fullName), picMatch[1]);
        odaMap.set(normalize(actor.navn), picMatch[1]);
      }
    }
    skip += 100;
    if (skip >= 600) break;
  }
  console.log(`  Found ${odaMap.size} ODA photo URLs\n`);

  // 2. Get DB candidates without photos
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
  const prisma = new PrismaClient({ adapter });
  const missing = await prisma.candidate.findMany({
    where: { photoUrl: null },
    select: { id: true, name: true },
  });
  console.log(`📋 ${missing.length} candidates without photos\n`);

  // 3. Match and download
  let matched = 0;
  let downloaded = 0;
  let ftBlocked = 0;
  let noOda = 0;

  for (const c of missing) {
    const norm = normalize(c.name);
    const normClean = norm.replace(/\./g, "").replace(/\s+/g, " ");
    let odaUrl = odaMap.get(norm) || odaMap.get(normClean);

    // Fuzzy: try first+last name
    if (!odaUrl) {
      const parts = c.name.split(" ");
      const first = normalize(parts[0]);
      const last = normalize(parts[parts.length - 1]);
      for (const [k, v] of odaMap) {
        if (k.startsWith(first) && k.endsWith(last)) {
          odaUrl = v;
          break;
        }
      }
    }

    if (!odaUrl) {
      noOda++;
      continue;
    }

    matched++;
    const filename = `${c.id}.jpg`;
    const filePath = path.join(OUT_DIR, filename);

    if (fs.existsSync(filePath)) {
      await prisma.candidate.update({ where: { id: c.id }, data: { photoUrl: `/candidates/${filename}` } });
      downloaded++;
      console.log(`  ✅ ${c.name} (cached)`);
      continue;
    }

    // Try downloading from ft.dk
    const ok = await downloadFile(odaUrl, filePath);
    if (ok) {
      const stats = fs.statSync(filePath);
      if (stats.size > 1000) { // Real image
        await prisma.candidate.update({ where: { id: c.id }, data: { photoUrl: `/candidates/${filename}` } });
        downloaded++;
        console.log(`  ✅ ${c.name} -> ${filename} (${Math.round(stats.size / 1024)}KB)`);
      } else {
        fs.unlinkSync(filePath);
        ftBlocked++;
        console.log(`  🔒 ${c.name} (Cloudflare blocked, ${stats.size}B)`);
      }
    } else {
      ftBlocked++;
      console.log(`  🔒 ${c.name} (download failed)`);
    }

    await sleep(200);
  }

  console.log(`
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📸 ODA Results:
  ODA matched:  ${matched} / ${missing.length}
  Downloaded:   ${downloaded}
  FT.dk blocked: ${ftBlocked}
  No ODA match: ${noOda}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`);

  // If ft.dk is blocked, try Google Cache or Wikimedia as alternative
  if (ftBlocked > 0) {
    console.log("⚠️  ft.dk images blocked by Cloudflare.");
    console.log("   Trying Wikimedia Commons as fallback...\n");

    // Get Wikidata photos for Danish politicians
    const sparql = encodeURIComponent(`
      SELECT ?personLabel ?image WHERE {
        ?person wdt:P39 wd:Q12311817 .
        ?person wdt:P18 ?image .
        SERVICE wikibase:label { bd:serviceParam wikibase:language "da,en" }
      }
    `);
    try {
      const wdUrl = `https://query.wikidata.org/sparql?format=json&query=${sparql}`;
      const wdText = await fetchText(wdUrl);
      const wdData = JSON.parse(wdText);
      const wikiMap = new Map<string, string>();
      for (const r of wdData.results.bindings) {
        const name = r.personLabel.value;
        const imgUrl = r.image.value.replace("http://", "https://");
        // Convert to 400px thumbnail
        const filename = imgUrl.split("/").pop()!;
        const thumbUrl = `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(filename)}?width=400`;
        wikiMap.set(normalize(name), thumbUrl);
      }
      console.log(`  Wikimedia: ${wikiMap.size} politician photos found\n`);

      // Re-check blocked candidates
      const stillMissing = await prisma.candidate.findMany({
        where: { photoUrl: null },
        select: { id: true, name: true },
      });

      let wikiDownloaded = 0;
      for (const c of stillMissing) {
        const norm = normalize(c.name);
        const normClean = norm.replace(/\./g, "").replace(/\s+/g, " ");
        const wikiUrl = wikiMap.get(norm) || wikiMap.get(normClean);

        if (!wikiUrl) {
          // Fuzzy
          const parts = c.name.split(" ");
          const first = normalize(parts[0]);
          const last = normalize(parts[parts.length - 1]);
          let fuzzyUrl = "";
          for (const [k, v] of wikiMap) {
            if (k.startsWith(first) && k.endsWith(last)) {
              fuzzyUrl = v;
              break;
            }
          }
          if (!fuzzyUrl) continue;
          const filename = `${c.id}.jpg`;
          const filePath = path.join(OUT_DIR, filename);
          const ok = await downloadFile(fuzzyUrl, filePath);
          if (ok && fs.statSync(filePath).size > 1000) {
            await prisma.candidate.update({ where: { id: c.id }, data: { photoUrl: `/candidates/${filename}` } });
            wikiDownloaded++;
            console.log(`  ✅ ${c.name} (Wikimedia, fuzzy)`);
          } else {
            try { fs.unlinkSync(filePath); } catch {}
          }
          continue;
        }

        const filename = `${c.id}.jpg`;
        const filePath = path.join(OUT_DIR, filename);
        const ok = await downloadFile(wikiUrl, filePath);
        if (ok && fs.statSync(filePath).size > 1000) {
          await prisma.candidate.update({ where: { id: c.id }, data: { photoUrl: `/candidates/${filename}` } });
          wikiDownloaded++;
          console.log(`  ✅ ${c.name} (Wikimedia)`);
        } else {
          try { fs.unlinkSync(filePath); } catch {}
        }
        await sleep(100);
      }

      console.log(`\n  Wikimedia downloaded: ${wikiDownloaded} additional photos`);
    } catch (e) {
      console.error("  Wikimedia fallback failed:", e);
    }
  }

  // Final count
  const finalMissing = await prisma.candidate.count({ where: { photoUrl: null } });
  const total = await prisma.candidate.count();
  console.log(`\n📊 Final: ${total - finalMissing} / ${total} candidates have photos (${finalMissing} remaining)\n`);

  await prisma.$disconnect();
}

main().catch(console.error);
