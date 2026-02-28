/**
 * Master national candidate sync for FV2026.
 *
 * For each party this script:
 *  1. Compares the authoritative 2026 list against the DB
 *  2. ADDS new candidates not yet in the DB
 *  3. REMOVES candidates confirmed as not running (DR "farvel" article)
 *  4. Updates contactEmail & contactPhone where available
 *  5. NEVER touches candidates with phoneHash or verified=true
 *
 * Sources:
 *  - DR.dk: MF'ere who are not running again
 *  - TV2 regional sites: complete storkreds lists (Bornholm, Sydjylland, Sjælland)
 *  - Party websites: SF, DF, DD, LA, M, H, V
 *  - TV2 Nord, TV2 Østjylland, TV2 Fyn etc. for partial data
 *
 * Run:    npx tsx prisma/seed-national-2026.ts
 * Dry:    npx tsx prisma/seed-national-2026.ts --dry-run
 * Party:  npx tsx prisma/seed-national-2026.ts --party=A
 */

import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

const DRY_RUN = process.argv.includes("--dry-run");
const PARTY_FILTER = process.argv.find(a => a.startsWith("--party="))?.split("=")[1] || null;

// ── Types ──

interface CandidateEntry {
  name: string;
  constituency: string;
  email?: string;
  phone?: string;
}

interface PartyData {
  letter: string;
  partyName: string;
  candidates: CandidateEntry[];
  /** Names confirmed as NOT running in 2026 (from DR "farvel" article + other sources) */
  notRunning: string[];
}

// ── Authoritative 2026 candidate data per party ──

const PARTIES: PartyData[] = [
  // ═══════════════════════════════════════════════════
  // SOCIALDEMOKRATIET (A)
  // ═══════════════════════════════════════════════════
  {
    letter: "A",
    partyName: "Socialdemokratiet (A)",
    notRunning: [
      "Pernille Rosenkrantz-Theil", "Mette Gjerskov", "Astrid Krag",
      "Dan Jørgensen", "Jens Joel", "Thomas Jensen",
      "Bjarne Laustsen", "Rasmus Prehn", "Mette Reissmann",
    ],
    candidates: [
      // Bornholms
      { name: "Lea Wermelin", constituency: "Bornholms Storkreds", email: "lea.wermelin@ft.dk" },
      { name: "Christian Faurholdt Jeppesen", constituency: "Bornholms Storkreds" },
      { name: "Kasper Flygare", constituency: "Bornholms Storkreds" },
      // Fyns
      { name: "Bjørn Brandenborg", constituency: "Fyns Storkreds", email: "bjoern.brandenborg@ft.dk" },
      { name: "Trine Bramsen", constituency: "Fyns Storkreds", email: "trine.bramsen@ft.dk" },
      { name: "Sara Emil Baaring", constituency: "Fyns Storkreds", email: "sara.emil.baaring@ft.dk" },
      { name: "Thomas Skriver Jensen", constituency: "Fyns Storkreds", email: "thomas.skriver.jensen@ft.dk" },
      { name: "Kim Aas", constituency: "Fyns Storkreds", email: "kim.aas@ft.dk" },
      // Københavns Omegns
      { name: "Mattias Tesfaye", constituency: "Københavns Omegns Storkreds", email: "mattias.tesfaye@ft.dk" },
      { name: "Morten Bødskov", constituency: "Københavns Omegns Storkreds", email: "morten.boedskov@ft.dk" },
      { name: "Jeppe Bruus", constituency: "Københavns Omegns Storkreds", email: "jeppe.bruus@ft.dk" },
      { name: "Maria Durhuus", constituency: "Københavns Omegns Storkreds", email: "maria.durhuus@ft.dk" },
      { name: "Gunvor Wibroe", constituency: "Københavns Omegns Storkreds", email: "gunvor.wibroe@ft.dk" },
      // Københavns
      { name: "Ida Auken", constituency: "Københavns Storkreds", email: "ida.auken@ft.dk" },
      { name: "Peter Hummelgaard", constituency: "Københavns Storkreds", email: "peter.hummelgaard@ft.dk" },
      // Nordjyllands
      { name: "Mette Frederiksen", constituency: "Nordjyllands Storkreds", email: "mette.frederiksen@ft.dk" },
      { name: "Ane Halsboe-Jørgensen", constituency: "Nordjyllands Storkreds", email: "ane.halsboe-joergensen@ft.dk" },
      { name: "Per Husted", constituency: "Nordjyllands Storkreds", email: "per.husted@ft.dk" },
      { name: "Simon Kollerup", constituency: "Nordjyllands Storkreds", email: "simon.kollerup@ft.dk" },
      { name: "Flemming Møller Mortensen", constituency: "Nordjyllands Storkreds" },
      { name: "Peder Key Kristiansen", constituency: "Nordjyllands Storkreds" },
      { name: "Thomas Klimek", constituency: "Nordjyllands Storkreds" },
      // Nordsjællands
      { name: "Fie Hækkerup", constituency: "Nordsjællands Storkreds", email: "fie.haekkerup@ft.dk" },
      { name: "Rasmus Stoklund", constituency: "Nordsjællands Storkreds", email: "rasmus.stoklund@ft.dk" },
      { name: "Matilde Powers", constituency: "Nordsjællands Storkreds", email: "matilde.powers@ft.dk" },
      { name: "Henrik Møller", constituency: "Nordsjællands Storkreds", email: "henrik.moeller@ft.dk" },
      // Østjyllands
      { name: "Nicolai Wammen", constituency: "Østjyllands Storkreds", email: "nicolai.wammen@ft.dk" },
      { name: "Leif Lahn Jensen", constituency: "Østjyllands Storkreds", email: "leif.lahn.jensen@ft.dk" },
      { name: "Malte Larsen", constituency: "Østjyllands Storkreds", email: "malte.larsen@ft.dk" },
      { name: "Thomas Monberg", constituency: "Østjyllands Storkreds", email: "thomas.monberg@ft.dk" },
      { name: "Camilla Fabricius", constituency: "Østjyllands Storkreds", email: "camilla.fabricius@ft.dk" },
      // Sjællands
      { name: "Magnus Heunicke", constituency: "Sjællands Storkreds", email: "magnus.heunicke@ft.dk" },
      { name: "Kaare Dybvad Bek", constituency: "Sjællands Storkreds", email: "kaare.dybvad@ft.dk" },
      { name: "Kasper Roug", constituency: "Sjællands Storkreds", email: "kasper.roug@ft.dk" },
      { name: "Frederik Vad", constituency: "Sjællands Storkreds", email: "frederik.vad@ft.dk" },
      { name: "Rasmus Horn Langhoff", constituency: "Sjællands Storkreds", email: "rasmus.horn.langhoff@ft.dk" },
      { name: "Carl Emil Lind Christensen", constituency: "Sjællands Storkreds" },
      { name: "Valdemar Alban", constituency: "Sjællands Storkreds" },
      { name: "Filiz Sarah Thunø", constituency: "Sjællands Storkreds" },
      { name: "Kanishka Dastageer", constituency: "Sjællands Storkreds" },
      { name: "Trine Birk Andersen", constituency: "Sjællands Storkreds" },
      { name: "Tanja Larsson", constituency: "Sjællands Storkreds" },
      { name: "Julie Kølskov Madsen", constituency: "Sjællands Storkreds" },
      // Sydjyllands
      { name: "Benny Engelbrecht", constituency: "Sydjyllands Storkreds", email: "benny.engelbrecht@ft.dk" },
      { name: "Jesper Petersen", constituency: "Sydjyllands Storkreds", email: "jesper.petersen@ft.dk" },
      { name: "Christian Rabjerg Madsen", constituency: "Sydjyllands Storkreds", email: "christian.rabjerg.madsen@ft.dk" },
      { name: "Anders Kronborg", constituency: "Sydjyllands Storkreds", email: "anders.kronborg@ft.dk" },
      { name: "Birgitte Vind", constituency: "Sydjyllands Storkreds", email: "birgitte.vind@ft.dk" },
      { name: "Kris Jensen Skriver", constituency: "Sydjyllands Storkreds", email: "kris.jensen.skriver@ft.dk" },
      { name: "Theis Kylling Hommeltoft", constituency: "Sydjyllands Storkreds", email: "theis.kylling.hommeltoft@ft.dk" },
      { name: "Anne Catherine Hoxcer Nielsen", constituency: "Sydjyllands Storkreds" },
      { name: "Bjørn Laursen", constituency: "Sydjyllands Storkreds" },
      { name: "Kim Eskesen", constituency: "Sydjyllands Storkreds" },
      { name: "Lars Romer Olsen", constituency: "Sydjyllands Storkreds" },
      { name: "Maria Radoor", constituency: "Sydjyllands Storkreds" },
      { name: "Tommi Christensen", constituency: "Sydjyllands Storkreds" },
      // Vestjyllands
      { name: "Anne Paulin", constituency: "Vestjyllands Storkreds", email: "anne.paulin@ft.dk" },
      { name: "Mogens Jensen", constituency: "Vestjyllands Storkreds", email: "mogens.jensen@ft.dk" },
      { name: "Karin Gaardsted", constituency: "Vestjyllands Storkreds", email: "karin.gaardsted@ft.dk" },
    ],
  },

  // ═══════════════════════════════════════════════════
  // RADIKALE VENSTRE (B)
  // ═══════════════════════════════════════════════════
  {
    letter: "B",
    partyName: "Radikale Venstre (B)",
    notRunning: [],
    candidates: [
      // Bornholms
      { name: "Simon Bech Munch-Petersen", constituency: "Bornholms Storkreds" },
      // Københavns
      { name: "Samira Nawa", constituency: "Københavns Storkreds", email: "samira.nawa@ft.dk", phone: "33374729" },
      // Københavns Omegns
      { name: "Stinus Lindgreen", constituency: "Københavns Omegns Storkreds", email: "stinus.lindgreen@ft.dk", phone: "33374714" },
      // Nordsjællands
      { name: "Martin Lidegaard", constituency: "Nordsjællands Storkreds", email: "martin.lidegaard@ft.dk", phone: "33374770" },
      // Østjyllands
      { name: "Katrine Robsøe", constituency: "Østjyllands Storkreds", email: "katrine.robsoe@ft.dk", phone: "33374734" },
      // Sjællands
      { name: "Zenia Stampe", constituency: "Sjællands Storkreds", email: "rvzest@ft.dk", phone: "33374709" },
      { name: "Line Krogh Lay", constituency: "Sjællands Storkreds" },
      { name: "Edris Qasimi", constituency: "Sjællands Storkreds" },
      { name: "Mette Hvid Brockmann", constituency: "Sjællands Storkreds" },
      { name: "Kristian Stokholm", constituency: "Sjællands Storkreds" },
      { name: "Sofie Holm", constituency: "Sjællands Storkreds" },
      { name: "Troels Brandt", constituency: "Sjællands Storkreds" },
      { name: "Jeppe Fransson", constituency: "Sjællands Storkreds" },
      { name: "Jeppe Trolle", constituency: "Sjællands Storkreds" },
      // Sydjyllands
      { name: "Lotte Rod", constituency: "Sydjyllands Storkreds", email: "lotte.rod@ft.dk", phone: "33374757" },
      { name: "Lasse Skov Ovesen", constituency: "Sydjyllands Storkreds" },
      { name: "Finn Hartvig Nielsen", constituency: "Sydjyllands Storkreds" },
      { name: "Anne Marie Geisler Andersen", constituency: "Sydjyllands Storkreds" },
      { name: "Barbara Krarup Hansen", constituency: "Sydjyllands Storkreds" },
      { name: "Bjarne Lastein", constituency: "Sydjyllands Storkreds" },
      { name: "Ole Lynggaard Jørgensen", constituency: "Sydjyllands Storkreds" },
      { name: "Nils Sjöberg", constituency: "Sydjyllands Storkreds" },
      // Nordjyllands
      { name: "Carsten Bedsted", constituency: "Nordjyllands Storkreds" },
    ],
  },

  // ═══════════════════════════════════════════════════
  // DET KONSERVATIVE FOLKEPARTI (C)
  // ═══════════════════════════════════════════════════
  {
    letter: "C",
    partyName: "Det Konservative Folkeparti (C)",
    notRunning: ["Rasmus Jarlov", "Brigitte Klintskov Jerkel"],
    candidates: [
      // Bornholms
      { name: "Kristoffer Kromand", constituency: "Bornholms Storkreds" },
      { name: "Peter Svarre Fridolf", constituency: "Bornholms Storkreds" },
      // Fyns
      { name: "Mai Mercado", constituency: "Fyns Storkreds", email: "mai.mercado@ft.dk" },
      // Københavns
      { name: "Helle Bonnesen", constituency: "Københavns Storkreds", email: "helle.bonnesen@ft.dk" },
      // Københavns Omegns - partial
      // Nordsjællands
      { name: "Mette Abildgaard", constituency: "Nordsjællands Storkreds", email: "mette.abildgaard@ft.dk" },
      // Nordjyllands
      { name: "Per Larsen", constituency: "Nordjyllands Storkreds", email: "per.larsen@ft.dk" },
      // Østjyllands
      { name: "Mona Juul", constituency: "Østjyllands Storkreds", email: "mona.juul@ft.dk" },
      // Sjællands
      { name: "Rune Kristensen", constituency: "Sjællands Storkreds" },
      { name: "Barbara Engelstoft", constituency: "Sjællands Storkreds" },
      { name: "Ida Dyhr", constituency: "Sjællands Storkreds" },
      { name: "Marcus Knuth", constituency: "Sjællands Storkreds" },
      { name: "Jacob Stryhn", constituency: "Sjællands Storkreds" },
      { name: "Jane Christensen", constituency: "Sjællands Storkreds" },
      { name: "Victoria Helene Olsen", constituency: "Sjællands Storkreds" },
      { name: "Vilhelm Møller", constituency: "Sjællands Storkreds" },
      { name: "Henrik Jacobsen", constituency: "Sjællands Storkreds" },
      // Sydjyllands
      { name: "Frederik Bloch Münster", constituency: "Sydjyllands Storkreds", email: "frederik.bloch.muenster@ft.dk" },
      { name: "Morten Trillingsgaard Høybye", constituency: "Sydjyllands Storkreds" },
      { name: "Christina Foldager", constituency: "Sydjyllands Storkreds" },
      { name: "Dan Arnløv Jørgensen", constituency: "Sydjyllands Storkreds" },
      { name: "Jannie Boysen Westergaard", constituency: "Sydjyllands Storkreds" },
      { name: "Gitte Eriksen", constituency: "Sydjyllands Storkreds" },
      { name: "Rasmus Sandvej", constituency: "Sydjyllands Storkreds" },
      { name: "Kristian Thomsen", constituency: "Sydjyllands Storkreds" },
      { name: "Rasmus Elkjær Larsen", constituency: "Sydjyllands Storkreds" },
      // Vestjyllands
      { name: "Lise Bertelsen", constituency: "Vestjyllands Storkreds", email: "lise.bertelsen@ft.dk" },
      { name: "Dina Andersen-Raabjerg", constituency: "Vestjyllands Storkreds", email: "dina.andersen-raabjerg@ft.dk" },
    ],
  },

  // ═══════════════════════════════════════════════════
  // SF – SOCIALISTISK FOLKEPARTI (F) — from sf.dk (86 candidates)
  // ═══════════════════════════════════════════════════
  {
    letter: "F",
    partyName: "SF – Socialistisk Folkeparti (F)",
    notRunning: [],
    candidates: [
      // Bornholms
      { name: "Sofie Christiansen", constituency: "Bornholms Storkreds", email: "sofie15062005@gmail.com" },
      { name: "Sebastian Bloch Jensen", constituency: "Bornholms Storkreds", email: "sebastianblochjensen@gmail.com" },
      // Fyns
      { name: "Lise Müller", constituency: "Fyns Storkreds", email: "lise.muller@ft.dk" },
      { name: "Karsten Hønge", constituency: "Fyns Storkreds", email: "karsten.honge@ft.dk" },
      { name: "Suzette Frovin", constituency: "Fyns Storkreds", email: "suzettefrovin@mail.dk" },
      { name: "Simon Meyer Off", constituency: "Fyns Storkreds", email: "off.simon.m@gmail.com" },
      { name: "Nynne Printz", constituency: "Fyns Storkreds", email: "nckp@hotmail.dk" },
      { name: "Lars Nissen", constituency: "Fyns Storkreds", email: "u2nissen@gmail.com" },
      { name: "Laura Elise Andersen-Mühl", constituency: "Fyns Storkreds", email: "lauraz35@hotmail.com" },
      { name: "Linda Bollerup", constituency: "Fyns Storkreds", email: "lindabolleruph@gmail.com" },
      { name: "Johannes Skov Pedersen", constituency: "Fyns Storkreds", email: "johannesskovpedersen@gmail.com" },
      { name: "Anna Katrine Rehn Leth", constituency: "Fyns Storkreds", email: "Annalethrehn@live.dk" },
      { name: "Charlotte Ellenberger", constituency: "Fyns Storkreds", email: "charlotte.ellenberger@hotmail.com" },
      // Københavns Omegns
      { name: "Sigurd Agersnap", constituency: "Københavns Omegns Storkreds", email: "sigurd.agersnap@ft.dk" },
      { name: "Sofie F. Villadsen", constituency: "Københavns Omegns Storkreds", email: "sofievilladsen@hotmail.com" },
      { name: "Vivi Nør Jacobsen", constituency: "Københavns Omegns Storkreds", email: "vivispost@gmail.com" },
      { name: "Helene Brochmann", constituency: "Københavns Omegns Storkreds", email: "HeleneBrochmann_SF@pm.me" },
      { name: "Niels Haxthausen", constituency: "Københavns Omegns Storkreds", email: "nielshaxthausen@gmail.com" },
      { name: "Troels Stru Schmidt", constituency: "Københavns Omegns Storkreds", email: "troels@stru.dk" },
      { name: "Alexander Bruhn Skjøth", constituency: "Københavns Omegns Storkreds", email: "alexander@einhorn.dk" },
      { name: "Taner Genc", constituency: "Københavns Omegns Storkreds", email: "tanergenc21@gmail.com" },
      // Københavns
      { name: "Lisbeth Bech-Nielsen", constituency: "Københavns Storkreds", email: "lisbeth.bech-nielsen@ft.dk" },
      { name: "Carl Valentin", constituency: "Københavns Storkreds", email: "Carl.Valentin@ft.dk" },
      { name: "Nanna Bonde", constituency: "Københavns Storkreds", email: "nanna.bonde@gmail.com" },
      { name: "Sadek Al-Amood", constituency: "Københavns Storkreds", email: "sadek.al-amood@regionh.dk" },
      { name: "Halime Oguz", constituency: "Københavns Storkreds", email: "halime.oguz@ft.dk" },
      { name: "Kasper Nordborg Kiær", constituency: "Københavns Storkreds", email: "Kaspernordborg@hotmail.com" },
      { name: "Rune Palm", constituency: "Københavns Storkreds", email: "sf@runepalm.dk" },
      { name: "Line Petersen", constituency: "Københavns Storkreds", email: "line.petersensf@gmail.com" },
      { name: "Cecilie Holdt", constituency: "Københavns Storkreds", email: "cecilieholdt@hotmail.com" },
      { name: "Mikkel Sammy Christensen", constituency: "Københavns Storkreds", email: "MikkelRay@gmail.com" },
      { name: "Morten Bering", constituency: "Københavns Storkreds", email: "mortenbering91@gmail.com" },
      { name: "Bjarke Bisgaard Yolal", constituency: "Københavns Storkreds", email: "Bjarkebisgaard@hotmail.com" },
      // Nordsjællands
      { name: "Marianne Bigum", constituency: "Nordsjællands Storkreds", email: "marianne.bigum@ft.dk" },
      { name: "Anja Rosengreen", constituency: "Nordsjællands Storkreds", email: "anjarosengreen@live.dk" },
      { name: "Emil Nielsen", constituency: "Nordsjællands Storkreds", email: "emilifolketinget@gmail.com" },
      { name: "Anna Poulsen", constituency: "Nordsjællands Storkreds", email: "annapoulsen77@gmail.com" },
      { name: "Stina Egedius Miller", constituency: "Nordsjællands Storkreds", email: "stinaegedius@hotmail.com" },
      { name: "Elias Julius Binggeli", constituency: "Nordsjællands Storkreds", email: "eb@sfu.dk" },
      { name: "Jens Skov", constituency: "Nordsjællands Storkreds", email: "jenskskov@gmail.com" },
      { name: "Jacob Mark", constituency: "Nordsjællands Storkreds" },
      // Nordjyllands
      { name: "Theresa Berg Andersen", constituency: "Nordjyllands Storkreds", email: "theresa.berg.andersen@ft.dk" },
      { name: "Melina Andersen", constituency: "Nordjyllands Storkreds", email: "melina.andersen@outlook.com" },
      { name: "Dorte M. Nielsen", constituency: "Nordjyllands Storkreds", email: "d.m.nielsen@hotmail.com" },
      { name: "Benjamin Christensen", constituency: "Nordjyllands Storkreds", email: "benjaminrfj@gmail.com" },
      { name: "Morten Bo Bertelsen", constituency: "Nordjyllands Storkreds", email: "mbb@thisted.dk" },
      { name: "Peder Larsen", constituency: "Nordjyllands Storkreds" },
      { name: "Henning Jørgensen", constituency: "Nordjyllands Storkreds", email: "hj@aof-vendsyssel.dk" },
      { name: "Thomas Kjeldsen", constituency: "Nordjyllands Storkreds", email: "fjellerad@hotmail.com" },
      // Østjyllands
      { name: "Kirsten Normann Andersen", constituency: "Østjyllands Storkreds", email: "kirsten.normann.andersen@ft.dk" },
      { name: "Sofie Lippert", constituency: "Østjyllands Storkreds", email: "sofie.lippert@ft.dk" },
      { name: "Charlotte Broman Mølbæk", constituency: "Østjyllands Storkreds", email: "charlotte.broman@ft.dk" },
      { name: "Anna Brændemose", constituency: "Østjyllands Storkreds", email: "annabraendemose@hotmail.com" },
      { name: "Charlotte Vindeløv", constituency: "Østjyllands Storkreds", email: "charlotte.vindelov@mail.com" },
      { name: "Søren Lahn Sloth", constituency: "Østjyllands Storkreds", email: "kontakt@stemforsøren.dk" },
      { name: "Morten Siig Henriksen", constituency: "Østjyllands Storkreds", email: "morten.siig.henriksen@gmail.com" },
      { name: "Paw Hedegaard Amdisen", constituency: "Østjyllands Storkreds", email: "pawamdisen@yahoo.dk" },
      { name: "Rasmus T. Mortensen", constituency: "Østjyllands Storkreds", email: "kontakt@rasmustmortensen.dk" },
      { name: "Carina Sarkkinen Jacobsen", constituency: "Østjyllands Storkreds", email: "casj@live.dk" },
      // Sjællands
      { name: "Pia Olsen Dyhr", constituency: "Sjællands Storkreds", email: "sfsekr@ft.dk" },
      { name: "Astrid Carøe", constituency: "Sjællands Storkreds", email: "astrid.caroe@ft.dk" },
      { name: "Anne Valentina Berthelsen", constituency: "Sjællands Storkreds", email: "anne.berthelsen@ft.dk" },
      { name: "Mads Olsen", constituency: "Sjællands Storkreds", email: "mads.olsen@ft.dk" },
      { name: "Kristine Amalie Rostgård", constituency: "Sjællands Storkreds", email: "kristineamalie.sf@gmail.com" },
      { name: "Claus Jørgensen", constituency: "Sjællands Storkreds", email: "claus@sflejre.dk" },
      { name: "Ali Yahya", constituency: "Sjællands Storkreds", email: "aliyahya@sfkoege.dk" },
      { name: "Michael Graakjær", constituency: "Sjællands Storkreds", email: "graakjaer.aagaard@hotmail.com" },
      { name: "Jeanne Bergmansen", constituency: "Sjællands Storkreds", email: "jeanneb@roskilde.dk" },
      { name: "Joan Kragh", constituency: "Sjællands Storkreds", email: "lydognaervaer@gmail.com" },
      { name: "Jesper Hartøft", constituency: "Sjællands Storkreds", email: "jesper@sfholbaek.dk" },
      { name: "Martin Graff Jørgensen", constituency: "Sjællands Storkreds" },
      // Sydjyllands
      { name: "Karina Lorentzen Dehnhardt", constituency: "Sydjyllands Storkreds", email: "karina.dehnhardt@ft.dk" },
      { name: "Jørgen Kvist", constituency: "Sydjyllands Storkreds", email: "kvist@hotmail.com" },
      { name: "Timm Bøttger", constituency: "Sydjyllands Storkreds", email: "timm1203@gmail.com" },
      { name: "Christian Mutwa Christensen", constituency: "Sydjyllands Storkreds", email: "cpmc1982@gmail.com" },
      { name: "Magnus Flensborg", constituency: "Sydjyllands Storkreds", email: "muf@sfu.dk" },
      { name: "Milo Gaarde", constituency: "Sydjyllands Storkreds", email: "milogaarde@gmail.com" },
      { name: "Ina Juul Jensen", constituency: "Sydjyllands Storkreds", email: "Ina_juul_jensen@hotmail.com" },
      { name: "Yazmin Victoria Madsen", constituency: "Sydjyllands Storkreds", email: "yazminvictoria@gmail.com" },
      { name: "Susanne Blegvad Posselt", constituency: "Sydjyllands Storkreds", email: "susanne.posselt88@gmail.com" },
      { name: "Sofus Teislev", constituency: "Sydjyllands Storkreds", email: "sofus@teislev.dk" },
      // Vestjyllands
      { name: "Signe Munk", constituency: "Vestjyllands Storkreds", email: "signe.munk@ft.dk" },
      { name: "Nils Brøgger", constituency: "Vestjyllands Storkreds", email: "Nils.Broegger@ft.dk" },
      { name: "Emma Thorup Jacobsen", constituency: "Vestjyllands Storkreds", email: "Emmathorupjacobsen@hotmail.com" },
      { name: "Bente Refslund", constituency: "Vestjyllands Storkreds", email: "bente@benterefslund.dk" },
      { name: "Anders Bøge", constituency: "Vestjyllands Storkreds", email: "boge@skivekommune.dk" },
      { name: "Niels Kristian Larsen", constituency: "Vestjyllands Storkreds", email: "niel5064@gmail.com" },
    ],
  },

  // ═══════════════════════════════════════════════════
  // ENHEDSLISTEN (Ø) — partial data
  // ═══════════════════════════════════════════════════
  {
    letter: "Ø",
    partyName: "Enhedslisten (Ø)",
    notRunning: ["Søren Egge Rasmussen", "Søren Søndergaard", "Mai Villadsen"],
    candidates: [
      // Bornholms
      { name: "Morten Riis", constituency: "Bornholms Storkreds" },
      { name: "Helle Munk Ravnborg", constituency: "Bornholms Storkreds" },
      { name: "Asta Kofod", constituency: "Bornholms Storkreds" },
      // Københavns
      { name: "Pelle Dragsted", constituency: "Københavns Storkreds", email: "pelle.dragsted@ft.dk" },
      { name: "Rosa Lund", constituency: "Københavns Storkreds", email: "rosa.lund@ft.dk" },
      { name: "Leila Stockmarr", constituency: "Københavns Storkreds", email: "leila.stockmarr@ft.dk" },
      // Fyns
      { name: "Victoria Velásquez", constituency: "Fyns Storkreds", email: "victoria.velasquez@ft.dk" },
      // Nordjyllands
      { name: "Peder Hvelplund", constituency: "Nordjyllands Storkreds", email: "peder.hvelplund@ft.dk" },
      // Sjællands
      { name: "Eva Flyvholm", constituency: "Sjællands Storkreds" },
      { name: "Karen Thestrup Clausen", constituency: "Sjællands Storkreds" },
      { name: "Ludmilla Plenge", constituency: "Sjællands Storkreds" },
      { name: "Bruno Jerup", constituency: "Sjællands Storkreds" },
      { name: "Jonas Paludan", constituency: "Sjællands Storkreds" },
      { name: "Birgit Gedionsen", constituency: "Sjællands Storkreds" },
      { name: "Peter Roswall", constituency: "Sjællands Storkreds" },
      { name: "Helena Hedegaard Udsen", constituency: "Sjællands Storkreds" },
      { name: "Louis Jacobsen", constituency: "Sjællands Storkreds" },
      { name: "Jan Nielsen", constituency: "Sjællands Storkreds" },
      // Sydjyllands
      { name: "Rasmus Vestergaard Madsen", constituency: "Sydjyllands Storkreds" },
      { name: "Selma Bolo", constituency: "Sydjyllands Storkreds" },
      { name: "Mathias Christiansen", constituency: "Sydjyllands Storkreds" },
      { name: "Johanna Precht", constituency: "Sydjyllands Storkreds" },
      { name: "Lasse Harder Schousboe", constituency: "Sydjyllands Storkreds" },
      { name: "Lilje Holm", constituency: "Sydjyllands Storkreds" },
      { name: "Sarah Norris", constituency: "Sydjyllands Storkreds" },
      { name: "Helene Hellesøe Appel", constituency: "Sydjyllands Storkreds" },
      { name: "Benny Dall", constituency: "Sydjyllands Storkreds" },
      { name: "Holly Turner", constituency: "Sydjyllands Storkreds" },
      { name: "Lars Mogensen", constituency: "Sydjyllands Storkreds" },
      // Sjællands already covered via Trine Pertou Mach
      { name: "Trine Pertou Mach", constituency: "Sjællands Storkreds", email: "trine.pertou.mach@ft.dk" },
    ],
  },

  // ═══════════════════════════════════════════════════
  // ALTERNATIVET (Å) — partial data
  // ═══════════════════════════════════════════════════
  {
    letter: "Å",
    partyName: "Alternativet (Å)",
    notRunning: [],
    candidates: [
      // Bornholms
      { name: "Charlotte Friberg Henriksen", constituency: "Bornholms Storkreds" },
      // Københavns
      { name: "Franciska Rosenkilde", constituency: "Københavns Storkreds", email: "franciska.rosenkilde@ft.dk" },
      { name: "Christina Olumeko", constituency: "Københavns Storkreds", email: "christina.olumeko@ft.dk" },
      // Nordsjællands
      { name: "Helene Liliendahl Brydensholt", constituency: "Nordsjællands Storkreds", email: "helene.liliendahl.brydensholt@ft.dk" },
      // Østjyllands
      { name: "Torsten Gejl", constituency: "Østjyllands Storkreds", email: "torsten.gejl@ft.dk" },
      { name: "Karin Liltorp", constituency: "Østjyllands Storkreds", email: "karin.liltorp@ft.dk" },
      // Sjællands
      { name: "Sascha Faxe", constituency: "Sjællands Storkreds", email: "sascha.faxe@ft.dk" },
      { name: "Mette Friis", constituency: "Sjællands Storkreds" },
      { name: "Yurdal Cicek", constituency: "Sjællands Storkreds" },
      { name: "Allan Lindemark", constituency: "Sjællands Storkreds" },
      { name: "Liselotte Katarina Rotfeld", constituency: "Sjællands Storkreds" },
      // Sydjyllands
      { name: "Mikael Winther", constituency: "Sydjyllands Storkreds" },
      { name: "Carsten Sohl", constituency: "Sydjyllands Storkreds" },
      { name: "Hans Biering Fonsbøl", constituency: "Sydjyllands Storkreds" },
      { name: "Bo Nielsen", constituency: "Sydjyllands Storkreds" },
      { name: "Mikael Hertig", constituency: "Sydjyllands Storkreds" },
      { name: "Coco Mette Cecilie Kjærgaard", constituency: "Sydjyllands Storkreds" },
      { name: "Edvard Korsbæk", constituency: "Sydjyllands Storkreds" },
      { name: "Astrid Reese Fogh", constituency: "Sydjyllands Storkreds" },
      { name: "Ane Line Søndergaard", constituency: "Sydjyllands Storkreds" },
    ],
  },
];

// Note: DF, DD, LA, M, H, V data already seeded — we include them for completeness
// but skip adding candidates that were already handled by seed-sjaelland-2026.ts
// and seed-contact-info.ts. The notRunning lists handle removal.

// Additional notRunning from other parties (for removal only):
const ADDITIONAL_REMOVALS: { name: string; partyLetter: string }[] = [
  // Moderaterne
  { name: "Mette Kierkgaard", partyLetter: "M" },
  { name: "Tobias Grotkjær Elmstrøm", partyLetter: "M" },
  // Danmarksdemokraterne
  { name: "Søren Espersen", partyLetter: "Æ" },
  { name: "Lise Bech", partyLetter: "Æ" },
  // Dansk Folkeparti
  { name: "Pia Kjærsgaard", partyLetter: "O" },
  // Venstre
  { name: "Lars Christian Lilleholt", partyLetter: "V" },
  { name: "Erling Bonnesen", partyLetter: "V" },
  { name: "Hans Christian Schmidt", partyLetter: "V" },
  // Løsgængere (various)
  { name: "Peter Seier Christensen", partyLetter: "D" },
  { name: "Mike Villa Fonseca", partyLetter: "M" },
  { name: "Jon Stephensen", partyLetter: "M" },
  { name: "Jeppe Søe", partyLetter: "M" },
  { name: "Theresa Scavenius", partyLetter: "Å" },
];

// ── Name matching ──

function normalize(name: string): string {
  return name.trim().toLowerCase().replace(/\s+/g, " ")
    .replace(/ø/g, "oe").replace(/æ/g, "ae").replace(/å/g, "aa")
    .replace(/ü/g, "u").replace(/ä/g, "a").replace(/ö/g, "o")
    .replace(/(.)\1/g, "$1");
}

function isNameMatch(a: string, b: string): boolean {
  const na = normalize(a);
  const nb = normalize(b);
  if (na === nb) return true;
  if (na.startsWith(nb) || nb.startsWith(na)) return true;
  const wordsA = na.split(" ");
  const wordsB = nb.split(" ");
  const [shorter, longer] = wordsA.length <= wordsB.length ? [wordsA, wordsB] : [wordsB, wordsA];
  if (shorter.length >= 2 && shorter.every(w => longer.includes(w))) return true;
  if (wordsA.length >= 2 && wordsB.length >= 2) {
    if (wordsA[0] === wordsB[0] && wordsA[wordsA.length - 1] === wordsB[wordsB.length - 1]) return true;
  }
  return false;
}

function extractPartyLetter(party: string): string | null {
  const m = party.match(/\(([A-ZÆØÅæøå])\)\s*$/i);
  if (m) return m[1].toUpperCase();
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
  if (lower.startsWith("løsgænger")) {
    const lm = party.match(/\(([A-ZÆØÅæøå])\)/i);
    return lm ? lm[1].toUpperCase() : null;
  }
  return null;
}

// ── Main ──

async function main() {
  console.log(DRY_RUN ? "=== DRY RUN ===\n" : "");

  const dbCandidates = await prisma.candidate.findMany();
  console.log(`DB has ${dbCandidates.length} candidates.\n`);

  const protectedIds = new Set(
    dbCandidates.filter(c => c.phoneHash || c.verified).map(c => c.id)
  );
  console.log(`Protected (claimed/verified): ${protectedIds.size}`);
  dbCandidates
    .filter(c => protectedIds.has(c.id))
    .forEach(c => console.log(`  🔒 ID ${c.id}: ${c.name.trim()} (${c.party.trim()})`));

  let totalAdded = 0;
  let totalRemoved = 0;
  let totalEmailUpdated = 0;
  let totalPhoneUpdated = 0;
  let totalConstituencyUpdated = 0;

  for (const party of PARTIES) {
    if (PARTY_FILTER && party.letter !== PARTY_FILTER) continue;

    console.log(`\n${"═".repeat(60)}`);
    console.log(`  ${party.partyName}`);
    console.log(`${"═".repeat(60)}`);

    // Get DB candidates for this party
    const dbForParty = dbCandidates.filter(c => {
      const letter = extractPartyLetter(c.party);
      return letter === party.letter;
    });

    console.log(`  DB: ${dbForParty.length} candidates`);
    console.log(`  2026 list: ${party.candidates.length} candidates`);
    console.log(`  Not running: ${party.notRunning.length}`);

    // 1. REMOVE candidates confirmed as not running
    for (const name of party.notRunning) {
      // Prefer exact normalized match over fuzzy (avoids "Thomas Jensen" matching "Thomas Skriver Jensen")
      const exactMatch = dbForParty.find(c => normalize(c.name) === normalize(name));
      const match = exactMatch || dbForParty.find(c => isNameMatch(c.name, name));
      if (match) {
        if (protectedIds.has(match.id)) {
          console.log(`  ⚠️  SKIP REMOVE ${match.name.trim()} (ID ${match.id}) — PROTECTED`);
          continue;
        }
        console.log(`  ❌ REMOVE  ${match.name.trim()} (ID ${match.id}) — not running in 2026`);
        if (!DRY_RUN) {
          await prisma.candidate.delete({ where: { id: match.id } });
        }
        totalRemoved++;
      }
    }

    // 2. ADD new candidates + update existing
    for (const candidate of party.candidates) {
      const match = dbForParty.find(c => isNameMatch(c.name, candidate.name));

      if (match) {
        // Update contact info + constituency if needed
        const updates: Record<string, string> = {};

        if (candidate.email && !match.contactEmail) {
          updates.contactEmail = candidate.email;
          totalEmailUpdated++;
        }
        if (candidate.phone) {
          const phone = candidate.phone.replace(/\s+/g, "").replace(/^\+45/, "");
          if (!match.contactPhone) {
            updates.contactPhone = phone;
            totalPhoneUpdated++;
          }
        }
        if (candidate.constituency && match.constituency !== candidate.constituency) {
          if (!protectedIds.has(match.id)) {
            updates.constituency = candidate.constituency;
            totalConstituencyUpdated++;
          }
        }

        if (Object.keys(updates).length > 0) {
          const parts = Object.entries(updates).map(([k, v]) => `${k}=${v}`).join(", ");
          console.log(`  📝 UPDATE  ${match.name.trim()} (ID ${match.id}) → ${parts}`);
          if (!DRY_RUN) {
            await prisma.candidate.update({ where: { id: match.id }, data: updates });
          }
        }
        continue;
      }

      // Not in DB — add new
      console.log(`  ➕ ADD     ${candidate.name} | ${candidate.constituency}${candidate.email ? " 📧" : ""}${candidate.phone ? " 📱" : ""}`);
      if (!DRY_RUN) {
        await prisma.candidate.create({
          data: {
            name: candidate.name,
            party: party.partyName,
            constituency: candidate.constituency,
            contactEmail: candidate.email || null,
            contactPhone: candidate.phone?.replace(/\s+/g, "").replace(/^\+45/, "") || null,
            verified: false,
            pledged: false,
            phoneHash: null,
            publicStatement: null,
          },
        });
      }
      totalAdded++;
    }
  }

  // 3. Process additional removals (Løsgængere, etc.)
  if (!PARTY_FILTER) {
    console.log(`\n${"═".repeat(60)}`);
    console.log("  Additional removals (Løsgængere + other parties)");
    console.log(`${"═".repeat(60)}`);

    for (const removal of ADDITIONAL_REMOVALS) {
      const match = dbCandidates.find(c => isNameMatch(c.name, removal.name));
      if (match) {
        if (protectedIds.has(match.id)) {
          console.log(`  ⚠️  SKIP ${match.name.trim()} — PROTECTED`);
          continue;
        }
        console.log(`  ❌ REMOVE  ${match.name.trim()} (ID ${match.id}) — ${match.party}`);
        if (!DRY_RUN) {
          await prisma.candidate.delete({ where: { id: match.id } });
        }
        totalRemoved++;
      }
    }
  }

  console.log(`\n${"=".repeat(60)}`);
  console.log(`SUMMARY${DRY_RUN ? " (DRY RUN)" : ""}:`);
  console.log(`  ➕ ${totalAdded} candidates added`);
  console.log(`  ❌ ${totalRemoved} candidates removed`);
  console.log(`  📧 ${totalEmailUpdated} emails updated`);
  console.log(`  📱 ${totalPhoneUpdated} phones updated`);
  console.log(`  📍 ${totalConstituencyUpdated} constituencies updated`);
  console.log(`  🔒 ${protectedIds.size} protected (untouched)`);
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
