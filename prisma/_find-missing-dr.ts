/**
 * Check if missing candidates exist on DR.dk (even without photo),
 * and try to find them via the Folketingets ODA API as fallback.
 */
import { config } from "dotenv";
config({ path: ".env.local" });
import * as https from "https";
import * as fs from "fs";
import * as path from "path";

function fetchText(url: string): Promise<string> {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { "User-Agent": "stem-palaestina/1.0" } }, (res) => {
      if (res.statusCode === 301 || res.statusCode === 302) {
        fetchText(res.headers.location!).then(resolve).catch(reject);
        return;
      }
      if (res.statusCode !== 200) { reject(new Error(`HTTP ${res.statusCode}`)); res.resume(); return; }
      const chunks: Buffer[] = [];
      res.on("data", (c) => chunks.push(c));
      res.on("end", () => resolve(Buffer.concat(chunks).toString("utf-8")));
      res.on("error", reject);
    }).on("error", reject);
  });
}

function normalize(name: string): string {
  return name.toLowerCase().replace(/[-.]+/g, " ").replace(/\s+/g, " ")
    .replace(/ø/g, "oe").replace(/æ/g, "ae").replace(/å/g, "aa")
    .replace(/ü/g, "u").replace(/é/g, "e").trim();
}

// ALL DR.dk candidates (with AND without photos), built from full scraping
async function getAllDrCandidates() {
  const allMap = new Map<string, { name: string; picture: string; partyCode: string }>();
  const pattern = /\{\\?"partyId\\?":\\?"(\d+)\\?"[,\s]*\\?"partyCode\\?":\\?"([^"\\]+)\\?"[,\s]*\\?"partyName\\?":\\?"([^"\\]+)\\?"[,\s]*\\?"candidateId\\?":\\?"(\d+)\\?"[,\s]*\\?"name\\?":\\?"([^"\\]+)\\?"[,\s]*\\?"picture\\?":\\?"([^"\\]*)\\?"/g;

  // Just check a few key districts to find known politicians
  const keyDistricts = [1, 2, 3, 6, 7, 18, 40, 48, 61, 66, 73, 89];
  for (const d of keyDistricts) {
    try {
      const html = await fetchText(`https://www.dr.dk/nyheder/politik/folketingsvalg/din-stemmeseddel/${d}`);
      let m;
      while ((m = pattern.exec(html)) !== null) {
        const norm = normalize(m[5]);
        if (!allMap.has(norm) || m[6]) {
          allMap.set(norm, { name: m[5], picture: m[6], partyCode: m[2] });
        }
      }
    } catch {}
  }
  return allMap;
}

// ODA API: get all active Folketingsmedlemmer with their photo URLs
async function getOdaPhotos() {
  const odaMap = new Map<string, string>(); // normalized name -> pictureMiRes URL
  let skip = 0;
  const pageSize = 100;

  while (true) {
    const url = `https://oda.ft.dk/api/Akt%C3%B8r?$format=json&$filter=typeid%20eq%205&$top=${pageSize}&$skip=${skip}&$orderby=opdateringsdato%20desc`;
    const text = await fetchText(url);
    const data = JSON.parse(text);
    const actors = data.value;
    if (!actors || actors.length === 0) break;

    for (const actor of actors) {
      const bio = actor.biografi || "";
      const picMatch = bio.match(/<pictureMiRes>([^<]+)<\/pictureMiRes>/);
      if (picMatch) {
        const fullName = `${actor.fornavn} ${actor.efternavn}`.trim();
        odaMap.set(normalize(fullName), picMatch[1]);
        // Also store by the "navn" field
        odaMap.set(normalize(actor.navn), picMatch[1]);
      }
    }

    skip += pageSize;
    // Only fetch recent/active members (first 500 should cover all current)
    if (skip >= 500) break;
  }

  return odaMap;
}

const missing = [
  "Franciska Rosenkilde", "Mette Frederiksen", "Lars Løkke Rasmussen",
  "Troels Lund Poulsen", "Magnus Heunicke", "Sophie Løhde", "Kasper Roug",
  "Lea Wermelin", "Heidi Bank", "Jan E. Jørgensen", "Kim Valentin",
  "Christina Olumeko", "Peder Hvelplund", "Charlotte Broman Mølbæk",
  "Lisbeth Bech-Nielsen", "Christoffer Aagaard Melson", "Marcus Knuth",
  "Henrik Frandsen", "Karin Gaardsted", "Theis Kylling Hommeltoft",
  "Louise Schack Elholm", "Thomas Danielsen", "Louise Brown",
  "Sólbjørg Jakobsen", "Charlotte Bagge Hansen", "Karin Liltorp",
];

async function main() {
  console.log("1. Checking DR.dk key districts...\n");
  const drAll = await getAllDrCandidates();
  console.log(`   Found ${drAll.size} unique candidates in key districts\n`);

  console.log("2. Fetching ODA API photos...\n");
  const odaPhotos = await getOdaPhotos();
  console.log(`   Found ${odaPhotos.size} ODA photo URLs\n`);

  console.log("3. Matching missing candidates:\n");
  let drFound = 0, odaFound = 0, neither = 0;

  for (const name of missing) {
    const norm = normalize(name);
    // Also try without middle initials/dots
    const normClean = norm.replace(/\./g, "").replace(/\s+/g, " ");

    const dr = drAll.get(norm) || drAll.get(normClean);
    const oda = odaPhotos.get(norm) || odaPhotos.get(normClean);

    if (dr?.picture) {
      console.log(`  ✅ DR.dk: ${name} -> ${dr.picture}`);
      drFound++;
    } else if (oda) {
      console.log(`  🏛️  ODA:  ${name} -> ${oda}`);
      odaFound++;
    } else if (dr) {
      console.log(`  ⚠️  DR.dk (no photo): ${name} -> ${dr.name} (${dr.partyCode})`);
    } else {
      // Try fuzzy on ODA
      const lastName = name.split(" ").pop()!;
      let odaFuzzy = "";
      for (const [k, v] of odaPhotos) {
        if (k.includes(normalize(lastName)) && k.startsWith(normalize(name.split(" ")[0]))) {
          odaFuzzy = `${k} -> ${v}`;
          break;
        }
      }
      if (odaFuzzy) {
        console.log(`  🏛️  ODA (fuzzy): ${name} -> ${odaFuzzy}`);
        odaFound++;
      } else {
        console.log(`  ❌ NONE: ${name}`);
        neither++;
      }
    }
  }

  console.log(`\nSummary: DR.dk=${drFound}, ODA=${odaFound}, None=${neither}`);
}

main().catch(console.error);
