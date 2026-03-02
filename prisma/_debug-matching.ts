import { config } from "dotenv";
config({ path: ".env.local" });
import * as fs from "fs";
import * as path from "path";

interface DrCandidate {
  name: string;
  partyCode: string;
  partyName: string;
  candidateId: string;
  picture: string;
}

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

const cache: DrCandidate[] = JSON.parse(
  fs.readFileSync(path.join(__dirname, "..", "public", "candidates", "_dr_cache.json"), "utf-8")
);

// Known missing candidates to debug
const missing = [
  "Franciska Rosenkilde",
  "Mette Frederiksen",
  "Lars Løkke Rasmussen",
  "Troels Lund Poulsen",
  "Magnus Heunicke",
  "Sophie Løhde",
  "Kasper Roug",
  "Lea Wermelin",
  "Heidi Bank",
  "Jan E. Jørgensen",
  "Kim Valentin",
  "Christina Olumeko",
  "Peder Hvelplund",
  "Charlotte Broman Mølbæk",
  "Lisbeth Bech-Nielsen",
  "Christoffer Aagaard Melson",
  "Marcus Knuth",
  "Henrik Frandsen",
  "Karin Gaardsted",
  "Theis Kylling Hommeltoft",
];

console.log("DR.dk cache has", cache.length, "candidates with photos\n");

// Build DR name map
const drByNorm = new Map<string, DrCandidate>();
for (const c of cache) {
  drByNorm.set(normalize(c.name), c);
}

for (const name of missing) {
  const norm = normalize(name);
  const exact = drByNorm.get(norm);
  if (exact) {
    console.log(`✅ EXACT: "${name}" -> "${exact.name}" (${exact.picture})`);
    continue;
  }

  // Try partial matches
  const lastName = name.split(" ").pop()!.toLowerCase();
  const firstName = name.split(" ")[0].toLowerCase();
  const partials: string[] = [];
  for (const [drNorm, drC] of drByNorm) {
    if (drNorm.includes(normalize(lastName)) && drNorm.includes(normalize(firstName))) {
      partials.push(`${drC.name} (norm: ${drNorm})`);
    }
  }

  if (partials.length > 0) {
    console.log(`🔍 PARTIAL for "${name}" (norm: ${norm}):`);
    for (const p of partials) console.log(`    -> ${p}`);
  } else {
    // Even looser: just last name
    const looseMatches: string[] = [];
    for (const [drNorm, drC] of drByNorm) {
      if (drNorm.includes(normalize(lastName))) {
        looseMatches.push(`${drC.name} (${drNorm})`);
      }
    }
    if (looseMatches.length > 0) {
      console.log(`⚠️  LOOSE for "${name}" (norm: ${norm}, last: ${normalize(lastName)}):`);
      for (const l of looseMatches.slice(0, 5)) console.log(`    -> ${l}`);
    } else {
      console.log(`❌ NONE: "${name}" (norm: ${norm})`);
    }
  }
}
