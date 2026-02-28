/**
 * Seed script: adds 2026 election candidates for Sjællands Storkreds
 * Source: https://www.tv2east.dk/sjaelland-og-oeerne/valg-her-er-kandidaterne-du-kan-stemme-pa-be542
 *
 * SAFETY:
 *  - NEVER overwrites candidates with phoneHash or verified=true
 *  - Fuzzy name matching to avoid duplicates (handles trailing spaces, double letters, etc.)
 *  - Only INSERTs new candidates; skips existing matches
 *
 * Run: npx tsx prisma/seed-sjaelland-2026.ts
 * Dry run: npx tsx prisma/seed-sjaelland-2026.ts --dry-run
 */

import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

const DRY_RUN = process.argv.includes("--dry-run");

// ── New candidates from TV2 East (Sjællands Storkreds, 2026 election) ──

const NEW_CANDIDATES = [
  // ===== SOCIALDEMOKRATIET (A) =====
  { name: "Carl Emil Lind Christensen", party: "Socialdemokratiet (A)", constituency: "Sjællands Storkreds" },
  { name: "Valdemar Alban", party: "Socialdemokratiet (A)", constituency: "Sjællands Storkreds" },
  { name: "Filiz Sarah Thunø", party: "Socialdemokratiet (A)", constituency: "Sjællands Storkreds" },
  { name: "Frederik Vad", party: "Socialdemokratiet (A)", constituency: "Sjællands Storkreds" },
  { name: "Kanishka Dastageer", party: "Socialdemokratiet (A)", constituency: "Sjællands Storkreds" },
  { name: "Trine Birk Andersen", party: "Socialdemokratiet (A)", constituency: "Sjællands Storkreds" },
  { name: "Kasper Roug", party: "Socialdemokratiet (A)", constituency: "Sjællands Storkreds" },
  { name: "Magnus Heunicke", party: "Socialdemokratiet (A)", constituency: "Sjællands Storkreds" },
  { name: "Kaare Dybvad Bek", party: "Socialdemokratiet (A)", constituency: "Sjællands Storkreds" },
  { name: "Rasmus Horn Langhoff", party: "Socialdemokratiet (A)", constituency: "Sjællands Storkreds" },
  { name: "Tanja Larsson", party: "Socialdemokratiet (A)", constituency: "Sjællands Storkreds" },
  { name: "Julie Kølskov Madsen", party: "Socialdemokratiet (A)", constituency: "Sjællands Storkreds" },

  // ===== RADIKALE VENSTRE (B) =====
  { name: "Line Krogh Lay", party: "Radikale Venstre (B)", constituency: "Sjællands Storkreds" },
  { name: "Zenia Stampe", party: "Radikale Venstre (B)", constituency: "Sjællands Storkreds" },
  { name: "Edris Qasimi", party: "Radikale Venstre (B)", constituency: "Sjællands Storkreds" },
  { name: "Mette Hvid Brockmann", party: "Radikale Venstre (B)", constituency: "Sjællands Storkreds" },
  { name: "Kristian Stokholm", party: "Radikale Venstre (B)", constituency: "Sjællands Storkreds" },
  { name: "Sofie Holm", party: "Radikale Venstre (B)", constituency: "Sjællands Storkreds" },
  { name: "Troels Brandt", party: "Radikale Venstre (B)", constituency: "Sjællands Storkreds" },
  { name: "Jeppe Fransson", party: "Radikale Venstre (B)", constituency: "Sjællands Storkreds" },
  { name: "Jeppe Trolle", party: "Radikale Venstre (B)", constituency: "Sjællands Storkreds" },

  // ===== DET KONSERVATIVE FOLKEPARTI (C) =====
  { name: "Rune Kristensen", party: "Det Konservative Folkeparti (C)", constituency: "Sjællands Storkreds" },
  { name: "Barbara Engelstoft", party: "Det Konservative Folkeparti (C)", constituency: "Sjællands Storkreds" },
  { name: "Ida Dyhr", party: "Det Konservative Folkeparti (C)", constituency: "Sjællands Storkreds" },
  { name: "Marcus Knuth", party: "Det Konservative Folkeparti (C)", constituency: "Sjællands Storkreds" },
  { name: "Jacob Stryhn", party: "Det Konservative Folkeparti (C)", constituency: "Sjællands Storkreds" },
  { name: "Jane Christensen", party: "Det Konservative Folkeparti (C)", constituency: "Sjællands Storkreds" },
  { name: "Victoria Helene Olsen", party: "Det Konservative Folkeparti (C)", constituency: "Sjællands Storkreds" },
  { name: "Vilhelm Møller", party: "Det Konservative Folkeparti (C)", constituency: "Sjællands Storkreds" },
  { name: "Henrik Jacobsen", party: "Det Konservative Folkeparti (C)", constituency: "Sjællands Storkreds" },

  // ===== SF – SOCIALISTISK FOLKEPARTI (F) =====
  { name: "Pia Olsen Dyhr", party: "SF – Socialistisk Folkeparti (F)", constituency: "Sjællands Storkreds" },
  { name: "Astrid Carøe", party: "SF – Socialistisk Folkeparti (F)", constituency: "Sjællands Storkreds" },
  { name: "Anne Valentina Berthelsen", party: "SF – Socialistisk Folkeparti (F)", constituency: "Sjællands Storkreds" },
  { name: "Claus Jørgensen", party: "SF – Socialistisk Folkeparti (F)", constituency: "Sjællands Storkreds" },
  { name: "Jeanne Bergmansen", party: "SF – Socialistisk Folkeparti (F)", constituency: "Sjællands Storkreds" },
  { name: "Joan Kragh", party: "SF – Socialistisk Folkeparti (F)", constituency: "Sjællands Storkreds" },
  { name: "Michael Graakjær", party: "SF – Socialistisk Folkeparti (F)", constituency: "Sjællands Storkreds" },
  { name: "Ali Yahya", party: "SF – Socialistisk Folkeparti (F)", constituency: "Sjællands Storkreds" },
  { name: "Mads Olsen", party: "SF – Socialistisk Folkeparti (F)", constituency: "Sjællands Storkreds" },
  { name: "Jesper Hartøft", party: "SF – Socialistisk Folkeparti (F)", constituency: "Sjællands Storkreds" },
  { name: "Kristine Amalie Rostgård", party: "SF – Socialistisk Folkeparti (F)", constituency: "Sjællands Storkreds" },
  { name: "Martin Graff Jørgensen", party: "SF – Socialistisk Folkeparti (F)", constituency: "Sjællands Storkreds" },

  // ===== BORGERNES PARTI (H) =====
  { name: "Jacob Harris", party: "Borgernes Parti (H)", constituency: "Sjællands Storkreds" },
  { name: "Sanne Pilgaard", party: "Borgernes Parti (H)", constituency: "Sjællands Storkreds" },
  { name: "Tim Larsen", party: "Borgernes Parti (H)", constituency: "Sjællands Storkreds" },

  // ===== LIBERAL ALLIANCE (I) =====
  { name: "Lars-Christian Brask", party: "Liberal Alliance (I)", constituency: "Sjællands Storkreds" },
  { name: "Pernille Vermund", party: "Liberal Alliance (I)", constituency: "Sjællands Storkreds" },
  { name: "Joachim Riis", party: "Liberal Alliance (I)", constituency: "Sjællands Storkreds" },
  { name: "Mads Brenøe", party: "Liberal Alliance (I)", constituency: "Sjællands Storkreds" },
  { name: "Martin Mickey", party: "Liberal Alliance (I)", constituency: "Sjællands Storkreds" },
  { name: "Frederik Grünfeld", party: "Liberal Alliance (I)", constituency: "Sjællands Storkreds" },
  { name: "Michael Rask", party: "Liberal Alliance (I)", constituency: "Sjællands Storkreds" },
  { name: "Sandra Skalvig", party: "Liberal Alliance (I)", constituency: "Sjællands Storkreds" },
  { name: "Nicolai Sandager", party: "Liberal Alliance (I)", constituency: "Sjællands Storkreds" },
  { name: "Henrik Brems Dynesen", party: "Liberal Alliance (I)", constituency: "Sjællands Storkreds" },
  { name: "Julie Memborg", party: "Liberal Alliance (I)", constituency: "Sjællands Storkreds" },
  { name: "Steffen Friis", party: "Liberal Alliance (I)", constituency: "Sjællands Storkreds" },
  { name: "Carsten Abildtrup Ranum", party: "Liberal Alliance (I)", constituency: "Sjællands Storkreds" },
  { name: "Malene Køppen", party: "Liberal Alliance (I)", constituency: "Sjællands Storkreds" },
  { name: "Frederik Max Krag", party: "Liberal Alliance (I)", constituency: "Sjællands Storkreds" },
  { name: "Elva Bille Klem", party: "Liberal Alliance (I)", constituency: "Sjællands Storkreds" },
  { name: "Susan Hovgaard Møller", party: "Liberal Alliance (I)", constituency: "Sjællands Storkreds" },
  { name: "Ulrik Lassen", party: "Liberal Alliance (I)", constituency: "Sjællands Storkreds" },
  { name: "Brian Prehn", party: "Liberal Alliance (I)", constituency: "Sjællands Storkreds" },
  { name: "Nikolaj Brink Olsen", party: "Liberal Alliance (I)", constituency: "Sjællands Storkreds" },
  { name: "Kasper Noer Schneider", party: "Liberal Alliance (I)", constituency: "Sjællands Storkreds" },

  // ===== MODERATERNE (M) =====
  { name: "Lars Løkke Rasmussen", party: "Moderaterne (M)", constituency: "Sjællands Storkreds" },
  { name: "Charlotte Bagge", party: "Moderaterne (M)", constituency: "Sjællands Storkreds" },
  { name: "Mogens Haugaard", party: "Moderaterne (M)", constituency: "Sjællands Storkreds" },
  { name: "Jan Carlsen", party: "Moderaterne (M)", constituency: "Sjællands Storkreds" },
  { name: "Frida Qvist Kristensen", party: "Moderaterne (M)", constituency: "Sjællands Storkreds" },
  { name: "Mia Linda Møller", party: "Moderaterne (M)", constituency: "Sjællands Storkreds" },
  { name: "Kasper Emde Nygaard", party: "Moderaterne (M)", constituency: "Sjællands Storkreds" },
  { name: "Brian Perri", party: "Moderaterne (M)", constituency: "Sjællands Storkreds" },

  // ===== DANSK FOLKEPARTI (O) =====
  { name: "Morten Messerschmidt", party: "Dansk Folkeparti (O)", constituency: "Sjællands Storkreds" },
  { name: "Søren Lund Hansen", party: "Dansk Folkeparti (O)", constituency: "Sjællands Storkreds" },
  { name: "Julie Jacobsen", party: "Dansk Folkeparti (O)", constituency: "Sjællands Storkreds" },
  { name: "Anders Bork", party: "Dansk Folkeparti (O)", constituency: "Sjællands Storkreds" },
  { name: "Jacob Bentsen", party: "Dansk Folkeparti (O)", constituency: "Sjællands Storkreds" },
  { name: "Henrik Brodersen", party: "Dansk Folkeparti (O)", constituency: "Sjællands Storkreds" },
  { name: "Jan Herskov", party: "Dansk Folkeparti (O)", constituency: "Sjællands Storkreds" },
  { name: "Malte Larsen", party: "Dansk Folkeparti (O)", constituency: "Sjællands Storkreds" },
  { name: "Tanja Glückstadt", party: "Dansk Folkeparti (O)", constituency: "Sjællands Storkreds" },
  { name: "Simon Hampe", party: "Dansk Folkeparti (O)", constituency: "Sjællands Storkreds" },
  { name: "Michael Pihl", party: "Dansk Folkeparti (O)", constituency: "Sjællands Storkreds" },

  // ===== VENSTRE (V) =====
  { name: "Thorbern Alexander Klingert", party: "Venstre (V)", constituency: "Sjællands Storkreds" },
  { name: "Michael Schjelde", party: "Venstre (V)", constituency: "Sjællands Storkreds" },
  { name: "Iben Krog", party: "Venstre (V)", constituency: "Sjællands Storkreds" },
  { name: "Jacob Jensen", party: "Venstre (V)", constituency: "Sjællands Storkreds" },
  { name: "Christian Friis Bach", party: "Venstre (V)", constituency: "Sjællands Storkreds" },
  { name: "Josefine Paaske", party: "Venstre (V)", constituency: "Sjællands Storkreds" },
  { name: "Louise Elholm", party: "Venstre (V)", constituency: "Sjællands Storkreds" },
  { name: "Tina Mandrup", party: "Venstre (V)", constituency: "Sjællands Storkreds" },
  { name: "Claus Bakke", party: "Venstre (V)", constituency: "Sjællands Storkreds" },
  { name: "Morten Dahlin", party: "Venstre (V)", constituency: "Sjællands Storkreds" },
  { name: "Rasmus Hylleberg", party: "Venstre (V)", constituency: "Sjællands Storkreds" },
  { name: "Marcus Danielsson", party: "Venstre (V)", constituency: "Sjællands Storkreds" },

  // ===== DANMARKSDEMOKRATERNE (Æ) =====
  { name: "Peter Skaarup", party: "Danmarksdemokraterne (Æ)", constituency: "Sjællands Storkreds" },
  { name: "Susie Jessen", party: "Danmarksdemokraterne (Æ)", constituency: "Sjællands Storkreds" },
  { name: "Michael Rosenmark", party: "Danmarksdemokraterne (Æ)", constituency: "Sjællands Storkreds" },
  { name: "Dina Person", party: "Danmarksdemokraterne (Æ)", constituency: "Sjællands Storkreds" },
  { name: "Christian Wibholm", party: "Danmarksdemokraterne (Æ)", constituency: "Sjællands Storkreds" },
  { name: "Brian Mørch", party: "Danmarksdemokraterne (Æ)", constituency: "Sjællands Storkreds" },
  { name: "John Brill Engkebølle", party: "Danmarksdemokraterne (Æ)", constituency: "Sjællands Storkreds" },
  { name: "Martin Rahn Johansen", party: "Danmarksdemokraterne (Æ)", constituency: "Sjællands Storkreds" },
  { name: "Bob Richard Nielsen", party: "Danmarksdemokraterne (Æ)", constituency: "Sjællands Storkreds" },
  { name: "Benny Damgaard", party: "Danmarksdemokraterne (Æ)", constituency: "Sjællands Storkreds" },

  // ===== ENHEDSLISTEN (Ø) =====
  { name: "Eva Flyvholm", party: "Enhedslisten (Ø)", constituency: "Sjællands Storkreds" },
  { name: "Karen Thestrup Clausen", party: "Enhedslisten (Ø)", constituency: "Sjællands Storkreds" },
  { name: "Ludmilla Plenge", party: "Enhedslisten (Ø)", constituency: "Sjællands Storkreds" },
  { name: "Bruno Jerup", party: "Enhedslisten (Ø)", constituency: "Sjællands Storkreds" },
  { name: "Jonas Paludan", party: "Enhedslisten (Ø)", constituency: "Sjællands Storkreds" },
  { name: "Birgit Gedionsen", party: "Enhedslisten (Ø)", constituency: "Sjællands Storkreds" },
  { name: "Peter Roswall", party: "Enhedslisten (Ø)", constituency: "Sjællands Storkreds" },
  { name: "Helena Hedegaard Udsen", party: "Enhedslisten (Ø)", constituency: "Sjællands Storkreds" },
  { name: "Louis Jacobsen", party: "Enhedslisten (Ø)", constituency: "Sjællands Storkreds" },
  { name: "Jan Nielsen", party: "Enhedslisten (Ø)", constituency: "Sjællands Storkreds" },

  // ===== ALTERNATIVET (Å) =====
  { name: "Sascha Faxe", party: "Alternativet (Å)", constituency: "Sjællands Storkreds" },
  { name: "Mette Friis", party: "Alternativet (Å)", constituency: "Sjællands Storkreds" },
  { name: "Yurdal Cicek", party: "Alternativet (Å)", constituency: "Sjællands Storkreds" },
  { name: "Allan Lindemark", party: "Alternativet (Å)", constituency: "Sjællands Storkreds" },
  { name: "Liselotte Katarina Rotfeld", party: "Alternativet (Å)", constituency: "Sjællands Storkreds" },
];

// ── Party-letter extraction for cross-party matching ──

function partyLetter(party: string): string | null {
  // Extract letter from "(X)" at end of party name, or known patterns
  const m = party.match(/\(([A-ZÆØÅæøå])\)\s*$/i);
  if (m) return m[1].toUpperCase();
  // Handle bare party names (from user-registered candidates)
  const lower = party.toLowerCase().trim();
  if (lower.startsWith("socialdemokratiet")) return "A";
  if (lower.startsWith("radikale")) return "B";
  if (lower.startsWith("konservativ") || lower.startsWith("det konservativ")) return "C";
  if (lower.startsWith("sf") || lower.startsWith("socialistisk")) return "F";
  if (lower.startsWith("borgernes")) return "H";
  if (lower.startsWith("liberal alliance")) return "I";
  if (lower.startsWith("moderaterne")) return "M";
  if (lower.startsWith("dansk folkeparti")) return "O";
  if (lower.startsWith("venstre")) return "V";
  if (lower.startsWith("danmarksdemokrat")) return "Æ";
  if (lower.startsWith("enhedslisten")) return "Ø";
  if (lower.startsWith("alternativet")) return "Å";
  return null;
}

// ── Fuzzy name matching ──

function normalize(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ")
    // Normalize common Danish character variants
    .replace(/ø/g, "oe")
    .replace(/æ/g, "ae")
    .replace(/å/g, "aa")
    .replace(/ü/g, "u")
    // Remove double letters for fuzzy matching
    .replace(/(.)\1/g, "$1");
}

function isNameMatch(a: string, b: string): boolean {
  const na = normalize(a);
  const nb = normalize(b);

  // Exact normalized match
  if (na === nb) return true;

  // One name is a prefix/substring of the other (handles "Kaare Dybvad" vs "Kaare Dybvad Bek")
  if (na.startsWith(nb) || nb.startsWith(na)) return true;

  // Check if all words of the shorter name appear in the longer name
  // Handles "Louise Elholm" vs "Louise Schack Elholm", "Charlotte Bagge" vs "Charlotte Bagge Hansen"
  const wordsA = na.split(" ");
  const wordsB = nb.split(" ");
  const [shorter, longer] = wordsA.length <= wordsB.length ? [wordsA, wordsB] : [wordsB, wordsA];
  if (shorter.length >= 2 && shorter.every(w => longer.includes(w))) return true;

  // "Sandra Skalvig" vs "Sandra Elisabeth Skalvig" — first + last name match
  if (wordsA.length >= 2 && wordsB.length >= 2) {
    if (wordsA[0] === wordsB[0] && wordsA[wordsA.length - 1] === wordsB[wordsB.length - 1]) return true;
  }

  return false;
}

function isSamePartyFamily(partyA: string, partyB: string): boolean {
  const la = partyLetter(partyA);
  const lb = partyLetter(partyB);
  if (la && lb) return la === lb;
  // Fallback: prefix match on normalized party name
  const pa = partyA.toLowerCase().trim().replace(/\s*\([^)]*\)\s*$/, "").trim();
  const pb = partyB.toLowerCase().trim().replace(/\s*\([^)]*\)\s*$/, "").trim();
  return pa.startsWith(pb) || pb.startsWith(pa);
}

// ── Main ──

async function main() {
  console.log(DRY_RUN ? "=== DRY RUN (no changes will be made) ===\n" : "");
  console.log(`Processing ${NEW_CANDIDATES.length} candidates from TV2 East (Sjællands Storkreds)...\n`);

  // Load ALL existing candidates
  const existing = await prisma.candidate.findMany({
    select: { id: true, name: true, party: true, constituency: true, phoneHash: true, verified: true },
  });

  console.log(`Found ${existing.length} existing candidates in database.\n`);

  // Identify protected candidates
  const protected_ids = existing.filter(c => c.phoneHash || c.verified).map(c => c.id);
  console.log(`Protected candidates (claimed/verified): ${protected_ids.length}`);
  existing
    .filter(c => c.phoneHash || c.verified)
    .forEach(c => console.log(`  PROTECTED ID ${c.id}: ${c.name.trim()} (${c.party.trim()}) verified=${c.verified}`));
  console.log();

  let created = 0;
  let skipped_existing = 0;
  let updated_constituency = 0;

  for (const candidate of NEW_CANDIDATES) {
    // Find matching existing candidate (same name + same party family)
    const match = existing.find(
      e => isNameMatch(e.name, candidate.name) && isSamePartyFamily(e.party, candidate.party)
    );

    if (match) {
      const isProtected = match.phoneHash || match.verified;

      if (isProtected) {
        // NEVER touch claimed/verified candidates
        console.log(`  PROTECTED  ${candidate.name} → matches ID ${match.id} "${match.name.trim()}" (CLAIMED, skipping entirely)`);
        skipped_existing++;
        continue;
      }

      // Check if constituency needs updating (politician moved storkreds for 2026)
      if (match.constituency !== candidate.constituency) {
        console.log(`  UPDATE     ${candidate.name} → ID ${match.id} constituency "${match.constituency}" → "${candidate.constituency}"`);
        if (!DRY_RUN) {
          await prisma.candidate.update({
            where: { id: match.id },
            data: { constituency: candidate.constituency },
          });
        }
        updated_constituency++;
      } else {
        console.log(`  SKIP       ${candidate.name} — already exists (ID ${match.id})`);
      }
      skipped_existing++;
      continue;
    }

    // Also check for same name but different party (different person) — still don't create duplicate names
    // unless they're truly different people (e.g. "Malte Larsen" in Socialdemokratiet vs Dansk Folkeparti)
    const nameOnlyMatch = existing.find(e => isNameMatch(e.name, candidate.name));
    if (nameOnlyMatch && !isSamePartyFamily(nameOnlyMatch.party, candidate.party)) {
      console.log(`  ADD (diff) ${candidate.name} (${candidate.party}) — name match "${nameOnlyMatch.name.trim()}" is different party "${nameOnlyMatch.party}"`);
    } else if (!nameOnlyMatch) {
      console.log(`  ADD        ${candidate.name} (${candidate.party})`);
    }

    if (!DRY_RUN) {
      const created_record = await prisma.candidate.create({
        data: {
          name: candidate.name,
          party: candidate.party,
          constituency: candidate.constituency,
          verified: false,
          pledged: false,
          phoneHash: null,
          publicStatement: null,
          contactEmail: null,
        },
      });
      // Add to existing list so subsequent iterations can match against it
      existing.push({
        id: created_record.id,
        name: created_record.name,
        party: created_record.party,
        constituency: created_record.constituency,
        phoneHash: null,
        verified: false,
      });
    }
    created++;
  }

  console.log(`\n${"=".repeat(50)}`);
  console.log(`Done${DRY_RUN ? " (DRY RUN)" : ""}:`);
  console.log(`  ${created} new candidates created`);
  console.log(`  ${skipped_existing} existing candidates matched (skipped)`);
  console.log(`  ${updated_constituency} constituency updates`);
  console.log(`  ${protected_ids.length} protected candidates untouched`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
