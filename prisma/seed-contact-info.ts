/**
 * Idempotent script: updates candidates with contact email + phone.
 *
 * Sources (scraped Feb 28 2026):
 *  - SF:   sf.dk/dine-politikere/folketingskandidater-2026/  (86 candidates, email)
 *  - DF:   danskfolkeparti.dk/kandidater/                    (68 candidates, email+phone)
 *  - DD:   danmarksdemokraterne.dk/forside/folketingskandidater/ (53 candidates, email+phone)
 *  - LA:   liberalalliance.dk/folketingskandidater/           (24 candidates, email+phone)
 *  - M:    moderaterne.dk/politikere/fv-kandidater/           (24 candidates, email+phone partial)
 *  - V:    venstre.dk/personer/folketingskandidater           (12 candidates, email+phone - page 1)
 *  - B:    radikale.dk/mennesker/                             (6 MF'ere, email+phone)
 *
 * SAFETY:
 *  - Only updates contactEmail and contactPhone
 *  - NEVER touches phoneHash, verified, pledged, publicStatement
 *  - Fuzzy name matching with party-letter check
 *  - Idempotent: safe to run multiple times
 *
 * Run: npx tsx prisma/seed-contact-info.ts
 * Dry run: npx tsx prisma/seed-contact-info.ts --dry-run
 */

import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

const DRY_RUN = process.argv.includes("--dry-run");

// ── Contact data by party ──

interface ContactEntry {
  name: string;
  email?: string;
  phone?: string;
  partyLetter: string;  // A, B, C, F, H, I, M, O, V, Æ, Ø, Å
}

const CONTACTS: ContactEntry[] = [
  // ===================================================================
  // SF – SOCIALISTISK FOLKEPARTI (F) — 86 candidates, email only
  // ===================================================================
  // Københavns Storkreds
  { name: "Lisbeth Bech-Nielsen", email: "lisbeth.bech-nielsen@ft.dk", partyLetter: "F" },
  { name: "Carl Valentin", email: "Carl.Valentin@ft.dk", partyLetter: "F" },
  { name: "Nanna Bonde", email: "nanna.bonde@gmail.com", partyLetter: "F" },
  { name: "Sadek Al-Amood", email: "sadek.al-amood@regionh.dk", partyLetter: "F" },
  { name: "Halime Oguz", email: "halime.oguz@ft.dk", partyLetter: "F" },
  { name: "Kasper Nordborg Kiær", email: "Kaspernordborg@hotmail.com", partyLetter: "F" },
  { name: "Rune Palm", email: "sf@runepalm.dk", partyLetter: "F" },
  { name: "Line Petersen", email: "line.petersensf@gmail.com", partyLetter: "F" },
  { name: "Cecilie Holdt", email: "cecilieholdt@hotmail.com", partyLetter: "F" },
  { name: "Mikkel Sammy Christensen", email: "MikkelRay@gmail.com", partyLetter: "F" },
  { name: "Morten Bering", email: "mortenbering91@gmail.com", partyLetter: "F" },
  { name: "Bjarke Bisgaard Yolal", email: "Bjarkebisgaard@hotmail.com", partyLetter: "F" },
  // Københavns Omegns Storkreds
  { name: "Sigurd Agersnap", email: "sigurd.agersnap@ft.dk", partyLetter: "F" },
  { name: "Sofie F. Villadsen", email: "sofievilladsen@hotmail.com", partyLetter: "F" },
  { name: "Vivi Nør Jacobsen", email: "vivispost@gmail.com", partyLetter: "F" },
  { name: "Helene Brochmann", email: "HeleneBrochmann_SF@pm.me", partyLetter: "F" },
  { name: "Niels Haxthausen", email: "nielshaxthausen@gmail.com", partyLetter: "F" },
  { name: "Troels Stru Schmidt", email: "troels@stru.dk", partyLetter: "F" },
  { name: "Alexander Bruhn Skjøth", email: "alexander@einhorn.dk", partyLetter: "F" },
  { name: "Taner Genc", email: "tanergenc21@gmail.com", partyLetter: "F" },
  // Nordsjællands Storkreds
  { name: "Marianne Bigum", email: "marianne.bigum@ft.dk", partyLetter: "F" },
  { name: "Anja Rosengreen", email: "anjarosengreen@live.dk", partyLetter: "F" },
  { name: "Emil Nielsen", email: "emilifolketinget@gmail.com", partyLetter: "F" },
  { name: "Anna Poulsen", email: "annapoulsen77@gmail.com", partyLetter: "F" },
  { name: "Stina Egedius Miller", email: "stinaegedius@hotmail.com", partyLetter: "F" },
  { name: "Elias Julius Binggeli", email: "eb@sfu.dk", partyLetter: "F" },
  { name: "Jens Skov", email: "jenskskov@gmail.com", partyLetter: "F" },
  // Sjællands Storkreds
  { name: "Pia Olsen Dyhr", email: "sfsekr@ft.dk", partyLetter: "F" },
  { name: "Astrid Carøe", email: "astrid.caroe@ft.dk", partyLetter: "F" },
  { name: "Anne Valentina Berthelsen", email: "anne.berthelsen@ft.dk", partyLetter: "F" },
  { name: "Mads Olsen", email: "mads.olsen@ft.dk", partyLetter: "F" },
  { name: "Kristine Amalie Rostgård", email: "kristineamalie.sf@gmail.com", partyLetter: "F" },
  { name: "Claus Jørgensen", email: "claus@sflejre.dk", partyLetter: "F" },
  { name: "Ali Yahya", email: "aliyahya@sfkoege.dk", partyLetter: "F" },
  { name: "Michael Graakjær", email: "graakjaer.aagaard@hotmail.com", partyLetter: "F" },
  { name: "Jeanne Bergmansen", email: "jeanneb@roskilde.dk", partyLetter: "F" },
  { name: "Joan Kragh", email: "lydognaervaer@gmail.com", partyLetter: "F" },
  { name: "Jesper Hartøft", email: "jesper@sfholbaek.dk", partyLetter: "F" },
  // Fyns Storkreds
  { name: "Lise Müller", email: "lise.muller@ft.dk", partyLetter: "F" },
  { name: "Karsten Hønge", email: "karsten.honge@ft.dk", partyLetter: "F" },
  { name: "Suzette Frovin", email: "suzettefrovin@mail.dk", partyLetter: "F" },
  { name: "Simon Meyer Off", email: "off.simon.m@gmail.com", partyLetter: "F" },
  { name: "Nynne Printz", email: "nckp@hotmail.dk", partyLetter: "F" },
  { name: "Lars Nissen", email: "u2nissen@gmail.com", partyLetter: "F" },
  { name: "Laura Elise Andersen-Mühl", email: "lauraz35@hotmail.com", partyLetter: "F" },
  { name: "Linda Bollerup", email: "lindabolleruph@gmail.com", partyLetter: "F" },
  { name: "Johannes Skov Pedersen", email: "johannesskovpedersen@gmail.com", partyLetter: "F" },
  { name: "Anna Katrine Rehn Leth", email: "Annalethrehn@live.dk", partyLetter: "F" },
  { name: "Charlotte Ellenberger", email: "charlotte.ellenberger@hotmail.com", partyLetter: "F" },
  // Sydjyllands Storkreds
  { name: "Karina Lorentzen Dehnhardt", email: "karina.dehnhardt@ft.dk", partyLetter: "F" },
  { name: "Jørgen Kvist", email: "kvist@hotmail.com", partyLetter: "F" },
  { name: "Timm Bøttger", email: "timm1203@gmail.com", partyLetter: "F" },
  { name: "Christian Mutwa Christensen", email: "cpmc1982@gmail.com", partyLetter: "F" },
  { name: "Magnus Flensborg", email: "muf@sfu.dk", partyLetter: "F" },
  { name: "Milo Gaarde", email: "milogaarde@gmail.com", partyLetter: "F" },
  { name: "Ina Juul Jensen", email: "Ina_juul_jensen@hotmail.com", partyLetter: "F" },
  { name: "Yazmin Victoria Madsen", email: "yazminvictoria@gmail.com", partyLetter: "F" },
  { name: "Susanne Blegvad Posselt", email: "susanne.posselt88@gmail.com", partyLetter: "F" },
  { name: "Sofus Teislev", email: "sofus@teislev.dk", partyLetter: "F" },
  // Østjyllands Storkreds
  { name: "Kirsten Normann Andersen", email: "kirsten.normann.andersen@ft.dk", partyLetter: "F" },
  { name: "Sofie Lippert", email: "sofie.lippert@ft.dk", partyLetter: "F" },
  { name: "Charlotte Broman Mølbæk", email: "charlotte.broman@ft.dk", partyLetter: "F" },
  { name: "Anna Brændemose", email: "annabraendemose@hotmail.com", partyLetter: "F" },
  { name: "Charlotte Vindeløv", email: "charlotte.vindelov@mail.com", partyLetter: "F" },
  { name: "Søren Lahn Sloth", email: "kontakt@stemforsøren.dk", partyLetter: "F" },
  { name: "Morten Siig Henriksen", email: "morten.siig.henriksen@gmail.com", partyLetter: "F" },
  { name: "Paw Hedegaard Amdisen", email: "pawamdisen@yahoo.dk", partyLetter: "F" },
  { name: "Rasmus T. Mortensen", email: "kontakt@rasmustmortensen.dk", partyLetter: "F" },
  { name: "Carina Sarkkinen Jacobsen", email: "casj@live.dk", partyLetter: "F" },
  // Vestjyllands Storkreds
  { name: "Signe Munk", email: "signe.munk@ft.dk", partyLetter: "F" },
  { name: "Nils Brøgger", email: "Nils.Broegger@ft.dk", partyLetter: "F" },
  { name: "Emma Thorup Jacobsen", email: "Emmathorupjacobsen@hotmail.com", partyLetter: "F" },
  { name: "Bente Refslund", email: "bente@benterefslund.dk", partyLetter: "F" },
  { name: "Anders Bøge", email: "boge@skivekommune.dk", partyLetter: "F" },
  { name: "Niels Kristian Larsen", email: "niel5064@gmail.com", partyLetter: "F" },
  // Nordjyllands Storkreds
  { name: "Theresa Berg Andersen", email: "theresa.berg.andersen@ft.dk", partyLetter: "F" },
  { name: "Melina Andersen", email: "melina.andersen@outlook.com", partyLetter: "F" },
  { name: "Dorte M. Nielsen", email: "d.m.nielsen@hotmail.com", partyLetter: "F" },
  { name: "Benjamin Christensen", email: "benjaminrfj@gmail.com", partyLetter: "F" },
  { name: "Morten Bo Bertelsen", email: "mbb@thisted.dk", partyLetter: "F" },
  { name: "Henning Jørgensen", email: "hj@aof-vendsyssel.dk", partyLetter: "F" },
  { name: "Thomas Kjeldsen", email: "fjellerad@hotmail.com", partyLetter: "F" },
  // Bornholms Storkreds
  { name: "Sofie Christiansen", email: "sofie15062005@gmail.com", partyLetter: "F" },
  { name: "Sebastian Bloch Jensen", email: "sebastianblochjensen@gmail.com", partyLetter: "F" },

  // ===================================================================
  // DANSK FOLKEPARTI (O) — 68 candidates, email + phone
  // ===================================================================
  { name: "Alex Ahrendtsen", email: "alex.ahrendtsen@ft.dk", phone: "61625154", partyLetter: "O" },
  { name: "Allan Feldt", email: "allanfeldt@hotmail.com", phone: "40500306", partyLetter: "O" },
  { name: "Allan Svendsen", email: "asv@telepost.dk", phone: "21274101", partyLetter: "O" },
  { name: "Anders Bork", email: "andersbork@hotmail.com", phone: "29470755", partyLetter: "O" },
  { name: "Anders Vistisen", email: "anders@danskfolkeparti.dk", phone: "53860080", partyLetter: "O" },
  { name: "Anne Møllegaard Mortensen", email: "amm@telepost.dk", phone: "72531690", partyLetter: "O" },
  { name: "Bo Vibe Ancher Jensen", email: "boancher@gmail.com", phone: "20216109", partyLetter: "O" },
  { name: "Brian Lyck Jørgensen", email: "brian@lyck.cc", phone: "40927601", partyLetter: "O" },
  { name: "Christian Kirk Nielsen", email: "christiankirknielsen@gmail.com", phone: "22694249", partyLetter: "O" },
  { name: "Danny Rosenkilde Nielsen", email: "dannyrosenkildenielsen@gmail.com", phone: "30543586", partyLetter: "O" },
  { name: "Denise Rostgaard", email: "deniserostgaard@gmail.com", phone: "53690585", partyLetter: "O" },
  { name: "Emma Mølgaard", email: "emma_moelgaard@hotmail.com", phone: "22515044", partyLetter: "O" },
  { name: "Gert Løfgren", email: "lansen@telepost.dk", phone: "25120203", partyLetter: "O" },
  { name: "Hans Blaaberg", email: "blaaberg@telepost.dk", phone: "20105752", partyLetter: "O" },
  { name: "Henrik Brodersen", email: "hb@telepost.dk", phone: "20324560", partyLetter: "O" },
  { name: "Jacob Bentsen", email: "jacobbentsen@outlook.dk", phone: "26201277", partyLetter: "O" },
  { name: "Jan Herskov", email: "janherskov@gmail.com", phone: "20424546", partyLetter: "O" },
  { name: "Jens Kannegaard Lundager", email: "jenskl@gmail.com", phone: "22271604", partyLetter: "O" },
  { name: "Jette Juul", email: "jettejuul@telepost.dk", phone: "28761121", partyLetter: "O" },
  { name: "Jim Zakaria Gindesgaard", email: "jimzakaria@gmail.com", phone: "20741104", partyLetter: "O" },
  { name: "Josephine Alstrup Kofod", email: "josephine.kofod@gmail.com", phone: "21165621", partyLetter: "O" },
  { name: "Julie Jacobsen", email: "juliejacobsen@outlook.dk", phone: "93577723", partyLetter: "O" },
  { name: "Kim Doberck", email: "kimdoberck@gmail.com", phone: "91549791", partyLetter: "O" },
  { name: "Kim Hammer", email: "kimhammer@telepost.dk", phone: "25585839", partyLetter: "O" },
  { name: "Knud Nielsen", email: "knudnielsen@mail.dk", phone: "51145602", partyLetter: "O" },
  { name: "Lone Langballe", email: "lonelangballe@gmail.com", phone: "29346662", partyLetter: "O" },
  { name: "Mads-Magnus Damm", email: "madsmagnusdamm@gmail.com", phone: "60856511", partyLetter: "O" },
  { name: "Malte Larsen", email: "maltelarsen@outlook.dk", phone: "60543245", partyLetter: "O" },
  { name: "Mercedes Czank", email: "mercedesczank@gmail.com", phone: "21276447", partyLetter: "O" },
  { name: "Merete Dea Larsen", email: "meretedea@hotmail.com", phone: "40358723", partyLetter: "O" },
  { name: "Mette Thiesen", email: "mette.thiesen@ft.dk", phone: "61625096", partyLetter: "O" },
  { name: "Michael Jensen", email: "michaeljensen@telepost.dk", phone: "61283931", partyLetter: "O" },
  { name: "Michael Nedersøe", email: "michaelnedersoe@gmail.com", phone: "25388281", partyLetter: "O" },
  { name: "Michael Pihl", email: "michaelpihl@outlook.dk", phone: "61281966", partyLetter: "O" },
  { name: "Michelle Sundahl", email: "michellesundahl@gmail.com", phone: "23808215", partyLetter: "O" },
  { name: "Mikael Würtz", email: "mikaelwuertz@gmail.com", phone: "21628819", partyLetter: "O" },
  { name: "Mikkel Bjørn", email: "mikkel.bjorn@ft.dk", phone: "22823316", partyLetter: "O" },
  { name: "Mikkel Dencker", email: "mikkeldencker@telepost.dk", phone: "40766133", partyLetter: "O" },
  { name: "Mikkel Hartwich", email: "mikkelhartwich@gmail.com", phone: "52887610", partyLetter: "O" },
  { name: "Morten Messerschmidt", email: "morten.messerschmidt@ft.dk", phone: "61624232", partyLetter: "O" },
  { name: "Nana Harring", email: "nanaharring@gmail.com", phone: "40119789", partyLetter: "O" },
  { name: "Nick Zimmermann", email: "nick.zimmermann@ft.dk", phone: "27830876", partyLetter: "O" },
  { name: "Niels Nybro Bolding", email: "nielsnybro@gmail.com", phone: "40171720", partyLetter: "O" },
  { name: "Paw Karslund", email: "pawkarslund@gmail.com", phone: "20892442", partyLetter: "O" },
  { name: "Per Knudsen", email: "perknudsen@telepost.dk", phone: "22243812", partyLetter: "O" },
  { name: "Peter Kofod", email: "peter.kofod@ft.dk", phone: "61624513", partyLetter: "O" },
  { name: "Pia Adelsteen", email: "piaadelsteen@gmail.com", phone: "21518120", partyLetter: "O" },
  { name: "Rune Bønnelykke", email: "runebl@gmail.com", phone: "20486452", partyLetter: "O" },
  { name: "Rune Højer", email: "runehojer@gmail.com", phone: "25112925", partyLetter: "O" },
  { name: "Simon Hampe", email: "simonhampe@hotmail.com", phone: "61866894", partyLetter: "O" },
  { name: "Søren Boel Olesen", email: "sorenboelolesen@gmail.com", phone: "25339354", partyLetter: "O" },
  { name: "Søren Lund Hansen", email: "slh@telepost.dk", phone: "28123630", partyLetter: "O" },
  { name: "Sune Nørgaard Jacobsen", email: "sunenj@gmail.com", phone: "42642939", partyLetter: "O" },
  { name: "Tanja Glückstadt", email: "tanjagluckstadt@gmail.com", phone: "60831020", partyLetter: "O" },
  { name: "Tenna Røberg", email: "tennaroberg@gmail.com", phone: "25555408", partyLetter: "O" },
  { name: "Thomas Hjort", email: "thomashjort@telepost.dk", phone: "60708043", partyLetter: "O" },
  { name: "Tobias Brus Mikkelsen", email: "tobiasbrus@gmail.com", phone: "21361215", partyLetter: "O" },
  { name: "Tobias Weische", email: "tobiasweische@gmail.com", phone: "60767734", partyLetter: "O" },
  { name: "Ulla Kokfelt", email: "ullakokfelt@gmail.com", phone: "26282434", partyLetter: "O" },
  { name: "Zandra Thulstrup Pihl", email: "zandrathulstrup@gmail.com", phone: "22472056", partyLetter: "O" },
  { name: "Jørgen Hammer Sørensen", email: "jhs@telepost.dk", phone: "60708043", partyLetter: "O" },
  { name: "Pia Kjærsgaard", email: "pia.kjaersgaard@ft.dk", partyLetter: "O" },

  // ===================================================================
  // DANMARKSDEMOKRATERNE (Æ) — 53 candidates, email + phone
  // ===================================================================
  { name: "Inger Støjberg", phone: "33375730", partyLetter: "Æ" },
  { name: "Kristian Bøgsted", email: "kristian.boegsted@ft.dk", phone: "61624912", partyLetter: "Æ" },
  { name: "Kim Edberg Andersen", email: "kim.edberg.andersen@ft.dk", phone: "61624924", partyLetter: "Æ" },
  { name: "Liselotte Lynge", email: "liselottelynge@gmail.com", phone: "27792130", partyLetter: "Æ" },
  { name: "Frederik Hjort Storm", email: "frederikhjortstorm@gmail.com", phone: "61336370", partyLetter: "Æ" },
  { name: "Claus Bisgaard Skovmose", email: "clausbisgaard@gmail.com", phone: "28716689", partyLetter: "Æ" },
  { name: "Dennis Flydtkjær", email: "dennis.flydtkjaer@ft.dk", phone: "61625156", partyLetter: "Æ" },
  { name: "Betina Kastbjerg", email: "betina.kastbjerg@ft.dk", phone: "61624971", partyLetter: "Æ" },
  { name: "Mads Fuglede", email: "mads.fuglede@ft.dk", phone: "61625274", partyLetter: "Æ" },
  { name: "Morten Vehl Revsbech", email: "mortenrevsbech@gmail.com", phone: "21265950", partyLetter: "Æ" },
  { name: "Marcus Juul Grønbæk", email: "marcusjuulg@gmail.com", phone: "29281297", partyLetter: "Æ" },
  { name: "Vivi Altenburg", email: "vivialtenburg@gmail.com", phone: "22481507", partyLetter: "Æ" },
  { name: "Hans Kristian Skibby", email: "hans.kristian.skibby@ft.dk", phone: "61624231", partyLetter: "Æ" },
  { name: "Erik Poulsen", email: "erikpoulsen@mail.dk", phone: "22179143", partyLetter: "Æ" },
  { name: "Lone Glarbo", email: "loneglarbo@gmail.com", phone: "61695287", partyLetter: "Æ" },
  { name: "Rune Mikkelsen", email: "runemikkelsen@mail.dk", phone: "60528236", partyLetter: "Æ" },
  { name: "Magnus Bigum", email: "magnusbigum@gmail.com", phone: "51199201", partyLetter: "Æ" },
  { name: "Kenneth Fredslund Petersen", email: "kenneth.fredslund.petersen@ft.dk", phone: "61624896", partyLetter: "Æ" },
  { name: "Karina Adsbøl", email: "karina.adsbol@ft.dk", phone: "61625190", partyLetter: "Æ" },
  { name: "Ulrik Knudsen", email: "ulrikknudsen@mail.dk", phone: "29299752", partyLetter: "Æ" },
  { name: "Patrick Culmsee Bryhl", email: "patrickbryhl@gmail.com", phone: "42312687", partyLetter: "Æ" },
  { name: "Thomas Byrsing", email: "thomasbyrsing@gmail.com", phone: "53587371", partyLetter: "Æ" },
  { name: "Jakob Venø Heiwald", email: "jakobballe@gmail.com", phone: "31260609", partyLetter: "Æ" },
  { name: "Jens Henrik Thulesen Dahl", email: "jens.henrik.thulesen.dahl@ft.dk", phone: "61625159", partyLetter: "Æ" },
  { name: "Nikolaj Vang", email: "nikolajvang@gmail.com", phone: "27137937", partyLetter: "Æ" },
  { name: "Vivian Lindberg Larsen", email: "vivianlindberg@gmail.com", phone: "40741377", partyLetter: "Æ" },
  { name: "Peter Skaarup", phone: "61625421", partyLetter: "Æ" },
  { name: "Susie Jessen", email: "susie.jessen@ft.dk", phone: "61624944", partyLetter: "Æ" },
  { name: "Christian Wibholm", email: "christianwibholm@gmail.com", phone: "40440267", partyLetter: "Æ" },
  { name: "Michael Rosenmark", email: "michaelrosenmark@gmail.com", phone: "20919999", partyLetter: "Æ" },
  { name: "Dina Person", email: "dinaperson@gmail.com", phone: "60148774", partyLetter: "Æ" },
  { name: "Brian Mørch", email: "brianmoerch@gmail.com", phone: "27140045", partyLetter: "Æ" },
  { name: "John Brill Engkebølle", email: "johnbrill@gmail.com", phone: "29477151", partyLetter: "Æ" },
  { name: "Martin Rahn Johansen", email: "martinrahn@gmail.com", phone: "29430217", partyLetter: "Æ" },
  { name: "Benny Damgaard", email: "bennydamgaard@gmail.com", phone: "40816696", partyLetter: "Æ" },
  { name: "Bob Richard Nielsen", email: "bobnielsen@gmail.com", phone: "42252061", partyLetter: "Æ" },
  { name: "Marlene Harpsøe", email: "marlene.harpsoe@ft.dk", phone: "33375714", partyLetter: "Æ" },
  { name: "Lars Bregnbak", email: "larsbregnbak@gmail.com", phone: "31634090", partyLetter: "Æ" },
  { name: "Maibritt Nielsen", email: "maibrittnielsen@gmail.com", phone: "40782062", partyLetter: "Æ" },
  { name: "Katrine Schiller", email: "katrineschiller@gmail.com", phone: "42433324", partyLetter: "Æ" },
  { name: "Charlotte Munch", email: "charlotte.munch@ft.dk", phone: "61624974", partyLetter: "Æ" },
  { name: "Sebastian Mylsted", email: "sebastianmylsted@gmail.com", phone: "53372148", partyLetter: "Æ" },
  { name: "Susanne Damsgaard", email: "susannedamsgaard@gmail.com", phone: "61682861", partyLetter: "Æ" },
  { name: "Benny Bindslev", email: "bennybindslev@gmail.com", phone: "22890200", partyLetter: "Æ" },
  { name: "Eva Bechmann", email: "evabechmann@gmail.com", phone: "21400022", partyLetter: "Æ" },
  { name: "Martin Sibast", email: "martinsibast@gmail.com", phone: "26168809", partyLetter: "Æ" },
  { name: "Michael Hendriksen", email: "michaelhendriksen@gmail.com", phone: "20136803", partyLetter: "Æ" },
  { name: "Søren Espersen", email: "soeren.espersen@ft.dk", partyLetter: "Æ" },

  // ===================================================================
  // LIBERAL ALLIANCE (I) — 24 candidates, email + phone
  // ===================================================================
  { name: "Alex Vanopslagh", email: "alex.vanopslagh@ft.dk", partyLetter: "I" },
  { name: "Sólbjørg Jakobsen", email: "solbjoerg.jakobsen@ft.dk", phone: "61624922", partyLetter: "I" },
  { name: "Ole Birk Olesen", email: "ole.birk@ft.dk", phone: "61625176", partyLetter: "I" },
  { name: "Katrine Daugaard", email: "katrine.daugaard@ft.dk", partyLetter: "I" },
  { name: "Steffen Frølund", email: "steffen.froelund@ft.dk", phone: "61624887", partyLetter: "I" },
  { name: "Pernille Vermund", email: "pernille.vermund@ft.dk", phone: "61624864", partyLetter: "I" },
  { name: "Steffen Larsen", email: "steffen.larsen@ft.dk", phone: "61624975", partyLetter: "I" },
  { name: "Carsten Bach", email: "carsten.bach@ft.dk", phone: "61624585", partyLetter: "I" },
  { name: "Freja Brandhøj", email: "frejabrandhoej@gmail.com", phone: "60536225", partyLetter: "I" },
  { name: "Eik Dahl Bidstrup", email: "eik@specialistdanmark.dk", phone: "40330777", partyLetter: "I" },
  { name: "Jens Meilvang", email: "jens.meilvang@ft.dk", phone: "61624964", partyLetter: "I" },
  { name: "Louise Brown", email: "louise.brown@ft.dk", phone: "61624965", partyLetter: "I" },
  { name: "Kim Alexander Jensen", email: "kontakt@kimaj.dk", phone: "22804080", partyLetter: "I" },
  { name: "Helena Artmann Andresen", email: "helena.andresen@ft.dk", phone: "61624901", partyLetter: "I" },
  { name: "Joachim Riis", email: "joachim_riis@hotmail.com", phone: "23364070", partyLetter: "I" },
  { name: "Lars-Christian Brask", email: "lars-christian.brask@ft.dk", phone: "61624888", partyLetter: "I" },
  { name: "Sandra Elisabeth Skalvig", email: "sandra.skalvig@ft.dk", partyLetter: "I" },
  { name: "Helle Jensen", email: "Viborghellejensen@gmail.com", phone: "26143946", partyLetter: "I" },
  { name: "Thorbjørn Jacobsen", email: "thorbjornfuttrupjacobsen@gmail.com", phone: "23656105", partyLetter: "I" },
  { name: "Jonas Juhl", email: "jonas.juhl.dk@gmail.com", phone: "50557141", partyLetter: "I" },
  { name: "Mads Strange", email: "mvaarby@gmail.com", phone: "22113534", partyLetter: "I" },
  { name: "Christopher Arzrouni", email: "charzrouni@gmail.com", phone: "61979055", partyLetter: "I" },
  { name: "HP Beck", email: "hpabeck@gmail.com", phone: "22981107", partyLetter: "I" },
  { name: "Kenneth Skatka Hammer", email: "kenneth.s.hammer@la-njl.dk", phone: "22999000", partyLetter: "I" },
  { name: "Malte Jäger", email: "maltejager@gmail.com", phone: "42318293", partyLetter: "I" },
  { name: "Carl Andersen", email: "carl.andersen@ft.dk", partyLetter: "I" },

  // ===================================================================
  // MODERATERNE (M) — 24 candidates (page 1), email + phone partial
  // ===================================================================
  { name: "Caroline Stage Olsen", email: "minister@digmin.dk", partyLetter: "M" },
  { name: "Charlotte Bagge Hansen", email: "charlotte.bagge@ft.dk", phone: "33375826", partyLetter: "M" },
  { name: "Christina Egelund", email: "min@ufm.dk", partyLetter: "M" },
  { name: "Frida Bruun", email: "Fridab1988@gmail.com", phone: "26178868", partyLetter: "M" },
  { name: "Henrik Frandsen", email: "henrik.frandsen@ft.dk", partyLetter: "M" },
  { name: "Jakob Engel-Schmidt", email: "jakob.engel-schmidt@ft.dk", partyLetter: "M" },
  { name: "Lars Aagaard", email: "kefm@kefm.dk", partyLetter: "M" },
  { name: "Lars Løkke Rasmussen", email: "lars.loekke@ft.dk", partyLetter: "M" },
  { name: "Line Randa", email: "lineranda@gmail.com", phone: "31605494", partyLetter: "M" },
  { name: "Mohammad Rona", email: "mohammad.rona@ft.dk", phone: "33375866", partyLetter: "M" },
  { name: "Monika Rubin", email: "monika.rubin@ft.dk", partyLetter: "M" },
  { name: "Morten E.G. Brautsch", email: "morten@megj.dk", phone: "29821840", partyLetter: "M" },
  { name: "Nanna W. Gotfredsen", email: "nanna.gotfredsen@ft.dk", phone: "61624982", partyLetter: "M" },
  { name: "Özkan Kocak", email: "ok@ozkankocak.com", phone: "26366488", partyLetter: "M" },
  { name: "Rasmus Lund-Nielsen", email: "rasmus.lund-nielsen@ft.dk", phone: "26743659", partyLetter: "M" },
  { name: "Rosa Eriksen", email: "rosa.eriksen@ft.dk", partyLetter: "M" },
  { name: "Andreas Raben", email: "andreas@raben.dk", phone: "23239408", partyLetter: "M" },
  { name: "Brian Perri", email: "brian@perri.dk", phone: "24432254", partyLetter: "M" },
  { name: "Camilla Schuster Nygaard", email: "camillaschusternygaard@gmail.com", phone: "40764212", partyLetter: "M" },
  { name: "Mette Kierkgaard", email: "mette.kierkgaard@ft.dk", partyLetter: "M" },
  { name: "Tobias Grotkjær Elmstrøm", email: "tobias.grotkjaer.elmstroem@ft.dk", partyLetter: "M" },
  { name: "Peter Have", email: "peter.have@ft.dk", partyLetter: "M" },

  // ===================================================================
  // VENSTRE (V) — 12 from page 1, email + phone
  // ===================================================================
  { name: "Amanda Heitmann", email: "amanda.heitmann123@gmail.com", phone: "30132694", partyLetter: "V" },
  { name: "Anders Fausbøll", email: "anders@fausboll.net", phone: "51150897", partyLetter: "V" },
  { name: "Anders Bo Larsen", email: "andersbolarsen@hotmail.com", phone: "50504311", partyLetter: "V" },
  { name: "Anita Vivi Lilholt", email: "anita_holt@hotmail.com", phone: "28406255", partyLetter: "V" },
  { name: "Anja Lund", email: "Anjalundvenstre@gmail.com", phone: "21598416", partyLetter: "V" },
  { name: "Anne Honoré Østergaard", email: "annehonore@live.dk", phone: "61685233", partyLetter: "V" },
  { name: "Annette Rieva", email: "ANVR@kp.dk", phone: "40632716", partyLetter: "V" },
  { name: "Anni Matthiesen", email: "anni.matthiesen@ft.dk", phone: "61625172", partyLetter: "V" },
  { name: "Astrid Søborg", email: "astsob@gladsaxe.dk", phone: "28146544", partyLetter: "V" },
  { name: "Birthe Tindbæk Bredo", email: "bt.bredo@gmail.com", phone: "21229113", partyLetter: "V" },
  { name: "Christian Friis Bach", email: "christian.bach@ft.dk", phone: "61624890", partyLetter: "V" },
  { name: "Christoffer Aagaard Melson", email: "christoffer.melson@ft.dk", phone: "61623303", partyLetter: "V" },
  // Existing MF'ere with known emails
  { name: "Jacob Jensen", email: "jacob.jensen@ft.dk", partyLetter: "V" },
  { name: "Morten Dahlin", email: "morten.dahlin@ft.dk", partyLetter: "V" },
  { name: "Louise Schack Elholm", email: "louise.schack.elholm@ft.dk", partyLetter: "V" },
  { name: "Sophie Løhde", email: "sophie.loehde@ft.dk", partyLetter: "V" },
  { name: "Hans Andersen", email: "hans.andersen@ft.dk", partyLetter: "V" },
  { name: "Troels Lund Poulsen", email: "troels.lund.poulsen@ft.dk", partyLetter: "V" },
  { name: "Heidi Bank", email: "heidi.bank@ft.dk", partyLetter: "V" },
  { name: "Erik Veje Rasmussen", email: "erik.veje.rasmussen@ft.dk", partyLetter: "V" },
  { name: "Thomas Danielsen", email: "thomas.danielsen@ft.dk", partyLetter: "V" },
  { name: "Torsten Schack Pedersen", email: "torsten.schack.pedersen@ft.dk", partyLetter: "V" },
  { name: "Preben Bang Henriksen", email: "preben.bang.henriksen@ft.dk", partyLetter: "V" },
  { name: "Marie Bjerre", email: "marie.bjerre@ft.dk", partyLetter: "V" },

  // ===================================================================
  // RADIKALE VENSTRE (B) — 6 MF'ere, email + phone
  // ===================================================================
  { name: "Martin Lidegaard", email: "martin.lidegaard@ft.dk", phone: "33374770", partyLetter: "B" },
  { name: "Samira Nawa", email: "samira.nawa@ft.dk", phone: "33374729", partyLetter: "B" },
  { name: "Stinus Lindgreen", email: "stinus.lindgreen@ft.dk", phone: "33374714", partyLetter: "B" },
  { name: "Katrine Robsøe", email: "katrine.robsoe@ft.dk", phone: "33374734", partyLetter: "B" },
  { name: "Lotte Rod", email: "lotte.rod@ft.dk", phone: "33374757", partyLetter: "B" },
  { name: "Zenia Stampe", email: "rvzest@ft.dk", phone: "33374709", partyLetter: "B" },

  // ===================================================================
  // SOCIALDEMOKRATIET (A) — existing MF'ere with ft.dk emails
  // ===================================================================
  { name: "Magnus Heunicke", email: "magnus.heunicke@ft.dk", partyLetter: "A" },
  { name: "Kaare Dybvad", email: "kaare.dybvad@ft.dk", partyLetter: "A" },
  { name: "Kasper Roug", email: "kasper.roug@ft.dk", partyLetter: "A" },
  { name: "Frederik Vad", email: "frederik.vad@ft.dk", partyLetter: "A" },
  { name: "Rasmus Horn Langhoff", email: "rasmus.horn.langhoff@ft.dk", partyLetter: "A" },
  { name: "Astrid Krag", email: "astrid.krag@ft.dk", partyLetter: "A" },
  { name: "Mette Gjerskov", email: "mette.gjerskov@ft.dk", partyLetter: "A" },
  { name: "Ida Auken", email: "ida.auken@ft.dk", partyLetter: "A" },
  { name: "Peter Hummelgaard", email: "peter.hummelgaard@ft.dk", partyLetter: "A" },
  { name: "Pernille Rosenkrantz-Theil", email: "pernille.rosenkrantz-theil@ft.dk", partyLetter: "A" },
  { name: "Mattias Tesfaye", email: "mattias.tesfaye@ft.dk", partyLetter: "A" },
  { name: "Morten Bødskov", email: "morten.boedskov@ft.dk", partyLetter: "A" },
  { name: "Jeppe Bruus", email: "jeppe.bruus@ft.dk", partyLetter: "A" },
  { name: "Maria Durhuus", email: "maria.durhuus@ft.dk", partyLetter: "A" },
  { name: "Fie Hækkerup", email: "fie.haekkerup@ft.dk", partyLetter: "A" },
  { name: "Rasmus Stoklund", email: "rasmus.stoklund@ft.dk", partyLetter: "A" },
  { name: "Matilde Powers", email: "matilde.powers@ft.dk", partyLetter: "A" },
  { name: "Mette Frederiksen", email: "mette.frederiksen@ft.dk", partyLetter: "A" },
  { name: "Simon Kollerup", email: "simon.kollerup@ft.dk", partyLetter: "A" },

  // ===================================================================
  // ENHEDSLISTEN (Ø) — existing MF'ere with ft.dk emails
  // ===================================================================
  { name: "Pelle Dragsted", email: "pelle.dragsted@ft.dk", partyLetter: "Ø" },
  { name: "Rosa Lund", email: "rosa.lund@ft.dk", partyLetter: "Ø" },
  { name: "Trine Pertou Mach", email: "trine.pertou.mach@ft.dk", partyLetter: "Ø" },
  { name: "Mai Villadsen", email: "mai.villadsen@ft.dk", partyLetter: "Ø" },
  { name: "Peder Hvelplund", email: "peder.hvelplund@ft.dk", partyLetter: "Ø" },

  // ===================================================================
  // KONSERVATIVE (C) — existing MF'ere with ft.dk emails
  // ===================================================================
  { name: "Brigitte Klintskov Jerkel", email: "brigitte.klintskov.jerkel@ft.dk", partyLetter: "C" },
  { name: "Mona Juul", email: "mona.juul@ft.dk", partyLetter: "C" },
  { name: "Mette Abildgaard", email: "mette.abildgaard@ft.dk", partyLetter: "C" },
  { name: "Rasmus Jarlov", email: "rasmus.jarlov@ft.dk", partyLetter: "C" },

  // ===================================================================
  // ALTERNATIVET (Å) — existing MF'ere with ft.dk emails
  // ===================================================================
  { name: "Sascha Faxe", email: "sascha.faxe@ft.dk", partyLetter: "Å" },
  { name: "Franciska Rosenkilde", email: "franciska.rosenkilde@ft.dk", partyLetter: "Å" },
];

// ── Name matching (reuse from seed-sjaelland-2026.ts) ──

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
  if (lower.startsWith("løsgænger")) return null;
  return null;
}

// ── Main ──

async function main() {
  console.log(DRY_RUN ? "=== DRY RUN ===\n" : "");
  console.log(`Updating contact info for ${CONTACTS.length} entries...\n`);

  const candidates = await prisma.candidate.findMany({
    select: { id: true, name: true, party: true, contactEmail: true, contactPhone: true },
  });

  console.log(`Found ${candidates.length} candidates in database.\n`);

  let updatedEmail = 0;
  let updatedPhone = 0;
  let matched = 0;
  let notFound = 0;

  for (const contact of CONTACTS) {
    // Find matching candidate
    const match = candidates.find(c => {
      const dbLetter = extractPartyLetter(c.party);
      if (dbLetter && dbLetter !== contact.partyLetter) return false;
      return isNameMatch(c.name, contact.name);
    });

    if (!match) {
      // Not in our DB — expected for candidates from other storkredse we haven't seeded
      continue;
    }

    matched++;

    const updates: { contactEmail?: string; contactPhone?: string } = {};

    // Only set email if we have one and candidate doesn't already have one
    if (contact.email && !match.contactEmail) {
      updates.contactEmail = contact.email;
    }

    // Only set phone if we have one and candidate doesn't already have one
    if (contact.phone) {
      const cleanPhone = contact.phone.replace(/\s+/g, "").replace(/^\+45/, "");
      if (!match.contactPhone) {
        updates.contactPhone = cleanPhone;
      }
    }

    if (Object.keys(updates).length === 0) {
      continue; // Already up to date
    }

    if (updates.contactEmail) updatedEmail++;
    if (updates.contactPhone) updatedPhone++;

    const parts = [];
    if (updates.contactEmail) parts.push(`email=${updates.contactEmail}`);
    if (updates.contactPhone) parts.push(`phone=${updates.contactPhone}`);
    console.log(`  UPDATE  ID ${match.id} ${match.name.trim()} → ${parts.join(", ")}`);

    if (!DRY_RUN) {
      await prisma.candidate.update({
        where: { id: match.id },
        data: updates,
      });
    }
  }

  console.log(`\n${"=".repeat(50)}`);
  console.log(`Done${DRY_RUN ? " (DRY RUN)" : ""}:`);
  console.log(`  ${matched} candidates matched in DB`);
  console.log(`  ${updatedEmail} emails updated`);
  console.log(`  ${updatedPhone} phones updated`);
  console.log(`  ${CONTACTS.length - matched} entries not in DB (other storkredse/not seeded)`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
