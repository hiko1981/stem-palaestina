/**
 * Seed script: inserts all current Folketingsmedlemmer (175 Danish seats)
 * from the 2022 election (updated through Feb 2026).
 *
 * Upserts on name — updates existing records, adds new ones.
 *
 * Run: npx tsx prisma/seed-candidates.ts
 */

import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

const CANDIDATES = [
  // ===== SOCIALDEMOKRATIET (A) — 50 mandater =====
  { name: "Ida Auken", party: "Socialdemokratiet (A)", constituency: "Københavns Storkreds", contactEmail: "ida.auken@ft.dk" },
  { name: "Peter Hummelgaard", party: "Socialdemokratiet (A)", constituency: "Københavns Storkreds", contactEmail: "peter.hummelgaard@ft.dk" },
  { name: "Pernille Rosenkrantz-Theil", party: "Socialdemokratiet (A)", constituency: "Københavns Storkreds", contactEmail: "pernille.rosenkrantz-theil@ft.dk" },
  { name: "Mette Reissmann", party: "Socialdemokratiet (A)", constituency: "Københavns Storkreds", contactEmail: "mette.reissmann@ft.dk" },
  { name: "Mattias Tesfaye", party: "Socialdemokratiet (A)", constituency: "Københavns Omegns Storkreds", contactEmail: "mattias.tesfaye@ft.dk" },
  { name: "Morten Bødskov", party: "Socialdemokratiet (A)", constituency: "Københavns Omegns Storkreds", contactEmail: "morten.boedskov@ft.dk" },
  { name: "Jeppe Bruus", party: "Socialdemokratiet (A)", constituency: "Københavns Omegns Storkreds", contactEmail: "jeppe.bruus@ft.dk" },
  { name: "Maria Durhuus", party: "Socialdemokratiet (A)", constituency: "Københavns Omegns Storkreds", contactEmail: "maria.durhuus@ft.dk" },
  { name: "Gunvor Wibroe", party: "Socialdemokratiet (A)", constituency: "Københavns Omegns Storkreds", contactEmail: "gunvor.wibroe@ft.dk" },
  { name: "Fie Hækkerup", party: "Socialdemokratiet (A)", constituency: "Nordsjællands Storkreds", contactEmail: "fie.haekkerup@ft.dk" },
  { name: "Rasmus Stoklund", party: "Socialdemokratiet (A)", constituency: "Nordsjællands Storkreds", contactEmail: "rasmus.stoklund@ft.dk" },
  { name: "Matilde Powers", party: "Socialdemokratiet (A)", constituency: "Nordsjællands Storkreds", contactEmail: "matilde.powers@ft.dk" },
  { name: "Henrik Møller", party: "Socialdemokratiet (A)", constituency: "Nordsjællands Storkreds", contactEmail: "henrik.moeller@ft.dk" },
  { name: "Magnus Heunicke", party: "Socialdemokratiet (A)", constituency: "Sjællands Storkreds", contactEmail: "magnus.heunicke@ft.dk" },
  { name: "Kaare Dybvad", party: "Socialdemokratiet (A)", constituency: "Sjællands Storkreds", contactEmail: "kaare.dybvad@ft.dk" },
  { name: "Astrid Krag", party: "Socialdemokratiet (A)", constituency: "Sjællands Storkreds", contactEmail: "astrid.krag@ft.dk" },
  { name: "Kasper Roug", party: "Socialdemokratiet (A)", constituency: "Sjællands Storkreds", contactEmail: "kasper.roug@ft.dk" },
  { name: "Mette Gjerskov", party: "Socialdemokratiet (A)", constituency: "Sjællands Storkreds", contactEmail: "mette.gjerskov@ft.dk" },
  { name: "Frederik Vad", party: "Socialdemokratiet (A)", constituency: "Sjællands Storkreds", contactEmail: "frederik.vad@ft.dk" },
  { name: "Rasmus Horn Langhoff", party: "Socialdemokratiet (A)", constituency: "Sjællands Storkreds", contactEmail: "rasmus.horn.langhoff@ft.dk" },
  { name: "Lea Wermelin", party: "Socialdemokratiet (A)", constituency: "Bornholms Storkreds", contactEmail: "lea.wermelin@ft.dk" },
  { name: "Bjørn Brandenborg", party: "Socialdemokratiet (A)", constituency: "Fyns Storkreds", contactEmail: "bjoern.brandenborg@ft.dk" },
  { name: "Trine Bramsen", party: "Socialdemokratiet (A)", constituency: "Fyns Storkreds", contactEmail: "trine.bramsen@ft.dk" },
  { name: "Sara Emil Baaring", party: "Socialdemokratiet (A)", constituency: "Fyns Storkreds", contactEmail: "sara.emil.baaring@ft.dk" },
  { name: "Thomas Skriver Jensen", party: "Socialdemokratiet (A)", constituency: "Fyns Storkreds", contactEmail: "thomas.skriver.jensen@ft.dk" },
  { name: "Kim Aas", party: "Socialdemokratiet (A)", constituency: "Fyns Storkreds", contactEmail: "kim.aas@ft.dk" },
  { name: "Dan Jørgensen", party: "Socialdemokratiet (A)", constituency: "Fyns Storkreds", contactEmail: "dan.joergensen@ft.dk" },
  { name: "Benny Engelbrecht", party: "Socialdemokratiet (A)", constituency: "Sydjyllands Storkreds", contactEmail: "benny.engelbrecht@ft.dk" },
  { name: "Jesper Petersen", party: "Socialdemokratiet (A)", constituency: "Sydjyllands Storkreds", contactEmail: "jesper.petersen@ft.dk" },
  { name: "Christian Rabjerg Madsen", party: "Socialdemokratiet (A)", constituency: "Sydjyllands Storkreds", contactEmail: "christian.rabjerg.madsen@ft.dk" },
  { name: "Anders Kronborg", party: "Socialdemokratiet (A)", constituency: "Sydjyllands Storkreds", contactEmail: "anders.kronborg@ft.dk" },
  { name: "Birgitte Vind", party: "Socialdemokratiet (A)", constituency: "Sydjyllands Storkreds", contactEmail: "birgitte.vind@ft.dk" },
  { name: "Kris Jensen Skriver", party: "Socialdemokratiet (A)", constituency: "Sydjyllands Storkreds", contactEmail: "kris.jensen.skriver@ft.dk" },
  { name: "Theis Kylling Hommeltoft", party: "Socialdemokratiet (A)", constituency: "Sydjyllands Storkreds", contactEmail: "theis.kylling.hommeltoft@ft.dk" },
  { name: "Nicolai Wammen", party: "Socialdemokratiet (A)", constituency: "Østjyllands Storkreds", contactEmail: "nicolai.wammen@ft.dk" },
  { name: "Leif Lahn Jensen", party: "Socialdemokratiet (A)", constituency: "Østjyllands Storkreds", contactEmail: "leif.lahn.jensen@ft.dk" },
  { name: "Jens Joel", party: "Socialdemokratiet (A)", constituency: "Østjyllands Storkreds", contactEmail: "jens.joel@ft.dk" },
  { name: "Malte Larsen", party: "Socialdemokratiet (A)", constituency: "Østjyllands Storkreds", contactEmail: "malte.larsen@ft.dk" },
  { name: "Thomas Monberg", party: "Socialdemokratiet (A)", constituency: "Østjyllands Storkreds", contactEmail: "thomas.monberg@ft.dk" },
  { name: "Camilla Fabricius", party: "Socialdemokratiet (A)", constituency: "Østjyllands Storkreds", contactEmail: "camilla.fabricius@ft.dk" },
  { name: "Anne Paulin", party: "Socialdemokratiet (A)", constituency: "Vestjyllands Storkreds", contactEmail: "anne.paulin@ft.dk" },
  { name: "Mogens Jensen", party: "Socialdemokratiet (A)", constituency: "Vestjyllands Storkreds", contactEmail: "mogens.jensen@ft.dk" },
  { name: "Thomas Jensen", party: "Socialdemokratiet (A)", constituency: "Vestjyllands Storkreds", contactEmail: "thomas.jensen@ft.dk" },
  { name: "Karin Gaardsted", party: "Socialdemokratiet (A)", constituency: "Vestjyllands Storkreds", contactEmail: "karin.gaardsted@ft.dk" },
  { name: "Mette Frederiksen", party: "Socialdemokratiet (A)", constituency: "Nordjyllands Storkreds", contactEmail: "mette.frederiksen@ft.dk" },
  { name: "Simon Kollerup", party: "Socialdemokratiet (A)", constituency: "Nordjyllands Storkreds", contactEmail: "simon.kollerup@ft.dk" },
  { name: "Bjarne Laustsen", party: "Socialdemokratiet (A)", constituency: "Nordjyllands Storkreds", contactEmail: "bjarne.laustsen@ft.dk" },
  { name: "Ane Halsboe-Jørgensen", party: "Socialdemokratiet (A)", constituency: "Nordjyllands Storkreds", contactEmail: "ane.halsboe-joergensen@ft.dk" },
  { name: "Per Husted", party: "Socialdemokratiet (A)", constituency: "Nordjyllands Storkreds", contactEmail: "per.husted@ft.dk" },
  { name: "Rasmus Prehn", party: "Socialdemokratiet (A)", constituency: "Nordjyllands Storkreds", contactEmail: "rasmus.prehn@ft.dk" },

  // ===== VENSTRE (V) — 23 mandater =====
  { name: "Jan E. Jørgensen", party: "Venstre (V)", constituency: "Københavns Storkreds", contactEmail: "jan.e.joergensen@ft.dk" },
  { name: "Linea Søgaard-Lidell", party: "Venstre (V)", constituency: "Københavns Storkreds", contactEmail: "linea.soegaard-lidell@ft.dk" },
  { name: "Kim Valentin", party: "Venstre (V)", constituency: "Københavns Omegns Storkreds", contactEmail: "kim.valentin@ft.dk" },
  { name: "Sophie Løhde", party: "Venstre (V)", constituency: "Nordsjællands Storkreds", contactEmail: "sophie.loehde@ft.dk" },
  { name: "Hans Andersen", party: "Venstre (V)", constituency: "Nordsjællands Storkreds", contactEmail: "hans.andersen@ft.dk" },
  { name: "Peter Juel-Jensen", party: "Venstre (V)", constituency: "Bornholms Storkreds", contactEmail: "peter.juel-jensen@ft.dk" },
  { name: "Jacob Jensen", party: "Venstre (V)", constituency: "Sjællands Storkreds", contactEmail: "jacob.jensen@ft.dk" },
  { name: "Morten Dahlin", party: "Venstre (V)", constituency: "Sjællands Storkreds", contactEmail: "morten.dahlin@ft.dk" },
  { name: "Louise Schack Elholm", party: "Venstre (V)", constituency: "Sjællands Storkreds", contactEmail: "louise.schack.elholm@ft.dk" },
  { name: "Erling Bonnesen", party: "Venstre (V)", constituency: "Fyns Storkreds", contactEmail: "erling.bonnesen@ft.dk" },
  { name: "Lars Christian Lilleholt", party: "Venstre (V)", constituency: "Fyns Storkreds", contactEmail: "lars.christian.lilleholt@ft.dk" },
  { name: "Anni Matthiesen", party: "Venstre (V)", constituency: "Sydjyllands Storkreds", contactEmail: "anni.matthiesen@ft.dk" },
  { name: "Christoffer Aagaard Melson", party: "Venstre (V)", constituency: "Sydjyllands Storkreds", contactEmail: "christoffer.aagaard.melson@ft.dk" },
  { name: "Hans Christian Schmidt", party: "Venstre (V)", constituency: "Sydjyllands Storkreds", contactEmail: "hans.christian.schmidt@ft.dk" },
  { name: "Troels Lund Poulsen", party: "Venstre (V)", constituency: "Østjyllands Storkreds", contactEmail: "troels.lund.poulsen@ft.dk" },
  { name: "Heidi Bank", party: "Venstre (V)", constituency: "Østjyllands Storkreds", contactEmail: "heidi.bank@ft.dk" },
  { name: "Erik Veje Rasmussen", party: "Venstre (V)", constituency: "Østjyllands Storkreds", contactEmail: "erik.veje.rasmussen@ft.dk" },
  { name: "Thomas Danielsen", party: "Venstre (V)", constituency: "Vestjyllands Storkreds", contactEmail: "thomas.danielsen@ft.dk" },
  { name: "Torsten Schack Pedersen", party: "Venstre (V)", constituency: "Vestjyllands Storkreds", contactEmail: "torsten.schack.pedersen@ft.dk" },
  { name: "Preben Bang Henriksen", party: "Venstre (V)", constituency: "Nordjyllands Storkreds", contactEmail: "preben.bang.henriksen@ft.dk" },
  { name: "Marie Bjerre", party: "Venstre (V)", constituency: "Nordjyllands Storkreds", contactEmail: "marie.bjerre@ft.dk" },
  { name: "Christian Friis Bach", party: "Venstre (V)", constituency: "Nordjyllands Storkreds", contactEmail: "christian.friis.bach@ft.dk" },

  // ===== SF – SOCIALISTISK FOLKEPARTI (F) — 15 mandater =====
  { name: "Pia Olsen Dyhr", party: "SF – Socialistisk Folkeparti (F)", constituency: "Københavns Storkreds", contactEmail: "pia.olsen.dyhr@ft.dk" },
  { name: "Carl Valentin", party: "SF – Socialistisk Folkeparti (F)", constituency: "Københavns Storkreds", contactEmail: "carl.valentin@ft.dk" },
  { name: "Lisbeth Bech-Nielsen", party: "SF – Socialistisk Folkeparti (F)", constituency: "Københavns Storkreds", contactEmail: "lisbeth.bech-nielsen@ft.dk" },
  { name: "Sigurd Agersnap", party: "SF – Socialistisk Folkeparti (F)", constituency: "Københavns Omegns Storkreds", contactEmail: "sigurd.agersnap@ft.dk" },
  { name: "Marianne Bigum", party: "SF – Socialistisk Folkeparti (F)", constituency: "Nordsjællands Storkreds", contactEmail: "marianne.bigum@ft.dk" },
  { name: "Astrid Carøe", party: "SF – Socialistisk Folkeparti (F)", constituency: "Sjællands Storkreds", contactEmail: "astrid.caroe@ft.dk" },
  { name: "Anne Valentina Berthelsen", party: "SF – Socialistisk Folkeparti (F)", constituency: "Sjællands Storkreds", contactEmail: "anne.valentina.berthelsen@ft.dk" },
  { name: "Mads Olsen", party: "SF – Socialistisk Folkeparti (F)", constituency: "Sjællands Storkreds", contactEmail: "mads.olsen@ft.dk" },
  { name: "Karsten Hønge", party: "SF – Socialistisk Folkeparti (F)", constituency: "Fyns Storkreds", contactEmail: "karsten.hoenge@ft.dk" },
  { name: "Karina Lorentzen Dehnhardt", party: "SF – Socialistisk Folkeparti (F)", constituency: "Sydjyllands Storkreds", contactEmail: "karina.lorentzen.dehnhardt@ft.dk" },
  { name: "Kirsten Normann Andersen", party: "SF – Socialistisk Folkeparti (F)", constituency: "Østjyllands Storkreds", contactEmail: "kirsten.normann.andersen@ft.dk" },
  { name: "Charlotte Broman Mølbæk", party: "SF – Socialistisk Folkeparti (F)", constituency: "Østjyllands Storkreds", contactEmail: "charlotte.broman.moelbaek@ft.dk" },
  { name: "Sofie Lippert", party: "SF – Socialistisk Folkeparti (F)", constituency: "Østjyllands Storkreds", contactEmail: "sofie.lippert@ft.dk" },
  { name: "Signe Munk", party: "SF – Socialistisk Folkeparti (F)", constituency: "Vestjyllands Storkreds", contactEmail: "signe.munk@ft.dk" },
  { name: "Theresa Berg Andersen", party: "SF – Socialistisk Folkeparti (F)", constituency: "Nordjyllands Storkreds", contactEmail: "theresa.berg.andersen@ft.dk" },

  // ===== LIBERAL ALLIANCE (I) — 15 mandater =====
  { name: "Alex Vanopslagh", party: "Liberal Alliance (I)", constituency: "Østjyllands Storkreds", contactEmail: "alex.vanopslagh@ft.dk" },
  { name: "Ole Birk Olesen", party: "Liberal Alliance (I)", constituency: "Københavns Storkreds", contactEmail: "ole.birk.olesen@ft.dk" },
  { name: "Alexander Ryle", party: "Liberal Alliance (I)", constituency: "Københavns Storkreds", contactEmail: "alexander.ryle@ft.dk" },
  { name: "Steffen Larsen", party: "Liberal Alliance (I)", constituency: "Københavns Omegns Storkreds", contactEmail: "steffen.larsen@ft.dk" },
  { name: "Steffen Frølund", party: "Liberal Alliance (I)", constituency: "Nordsjællands Storkreds", contactEmail: "steffen.froelund@ft.dk" },
  { name: "Lars-Christian Brask", party: "Liberal Alliance (I)", constituency: "Sjællands Storkreds", contactEmail: "lars-christian.brask@ft.dk" },
  { name: "Sandra Elisabeth Skalvig", party: "Liberal Alliance (I)", constituency: "Sjællands Storkreds", contactEmail: "sandra.elisabeth.skalvig@ft.dk" },
  { name: "Katrine Daugaard", party: "Liberal Alliance (I)", constituency: "Fyns Storkreds", contactEmail: "katrine.daugaard@ft.dk" },
  { name: "Helena Artmann Andresen", party: "Liberal Alliance (I)", constituency: "Sydjyllands Storkreds", contactEmail: "helena.artmann.andresen@ft.dk" },
  { name: "Pernille Vermund", party: "Liberal Alliance (I)", constituency: "Sydjyllands Storkreds", contactEmail: "pernille.vermund@ft.dk" },
  { name: "Carl Andersen", party: "Liberal Alliance (I)", constituency: "Sydjyllands Storkreds", contactEmail: "carl.andersen@ft.dk" },
  { name: "Jens Meilvang", party: "Liberal Alliance (I)", constituency: "Østjyllands Storkreds", contactEmail: "jens.meilvang@ft.dk" },
  { name: "Louise Brown", party: "Liberal Alliance (I)", constituency: "Østjyllands Storkreds", contactEmail: "louise.brown@ft.dk" },
  { name: "Carsten Bach", party: "Liberal Alliance (I)", constituency: "Vestjyllands Storkreds", contactEmail: "carsten.bach@ft.dk" },
  { name: "Sólbjørg Jakobsen", party: "Liberal Alliance (I)", constituency: "Nordjyllands Storkreds", contactEmail: "solbjoerg.jakobsen@ft.dk" },

  // ===== MODERATERNE (M) — 12 mandater =====
  { name: "Lars Løkke Rasmussen", party: "Moderaterne (M)", constituency: "Sjællands Storkreds", contactEmail: "lars.loekke.rasmussen@ft.dk" },
  { name: "Jakob Engel-Schmidt", party: "Moderaterne (M)", constituency: "Nordsjællands Storkreds", contactEmail: "jakob.engel-schmidt@ft.dk" },
  { name: "Monika Rubin", party: "Moderaterne (M)", constituency: "Københavns Omegns Storkreds", contactEmail: "monika.rubin@ft.dk" },
  { name: "Rasmus Lund-Nielsen", party: "Moderaterne (M)", constituency: "Københavns Omegns Storkreds", contactEmail: "rasmus.lund-nielsen@ft.dk" },
  { name: "Nanna W. Gotfredsen", party: "Moderaterne (M)", constituency: "Københavns Storkreds", contactEmail: "nanna.w.gotfredsen@ft.dk" },
  { name: "Charlotte Bagge Hansen", party: "Moderaterne (M)", constituency: "Sjællands Storkreds", contactEmail: "charlotte.bagge.hansen@ft.dk" },
  { name: "Rosa Eriksen", party: "Moderaterne (M)", constituency: "Fyns Storkreds", contactEmail: "rosa.eriksen@ft.dk" },
  { name: "Henrik Frandsen", party: "Moderaterne (M)", constituency: "Sydjyllands Storkreds", contactEmail: "henrik.frandsen@ft.dk" },
  { name: "Mette Kierkgaard", party: "Moderaterne (M)", constituency: "Sydjyllands Storkreds", contactEmail: "mette.kierkgaard@ft.dk" },
  { name: "Tobias Grotkjær Elmstrøm", party: "Moderaterne (M)", constituency: "Østjyllands Storkreds", contactEmail: "tobias.grotkjaer.elmstroem@ft.dk" },
  { name: "Peter Have", party: "Moderaterne (M)", constituency: "Østjyllands Storkreds", contactEmail: "peter.have@ft.dk" },
  { name: "Mohammad Rona", party: "Moderaterne (M)", constituency: "Nordjyllands Storkreds", contactEmail: "mohammad.rona@ft.dk" },

  // ===== DANMARKSDEMOKRATERNE (Æ) — 16 mandater =====
  { name: "Inger Støjberg", party: "Danmarksdemokraterne (Æ)", constituency: "Nordjyllands Storkreds", contactEmail: "inger.stoejberg@ft.dk" },
  { name: "Peter Skaarup", party: "Danmarksdemokraterne (Æ)", constituency: "Sjællands Storkreds", contactEmail: "peter.skaarup@ft.dk" },
  { name: "Susie Jessen", party: "Danmarksdemokraterne (Æ)", constituency: "Sjællands Storkreds", contactEmail: "susie.jessen@ft.dk" },
  { name: "Dennis Flydtkjær", party: "Danmarksdemokraterne (Æ)", constituency: "Vestjyllands Storkreds", contactEmail: "dennis.flydtkjaer@ft.dk" },
  { name: "Betina Kastbjerg", party: "Danmarksdemokraterne (Æ)", constituency: "Vestjyllands Storkreds", contactEmail: "betina.kastbjerg@ft.dk" },
  { name: "Kristian Bøgsted", party: "Danmarksdemokraterne (Æ)", constituency: "Nordjyllands Storkreds", contactEmail: "kristian.boegsted@ft.dk" },
  { name: "Lise Bech", party: "Danmarksdemokraterne (Æ)", constituency: "Nordjyllands Storkreds", contactEmail: "lise.bech@ft.dk" },
  { name: "Søren Espersen", party: "Danmarksdemokraterne (Æ)", constituency: "Sydjyllands Storkreds", contactEmail: "soeren.espersen@ft.dk" },
  { name: "Karina Adsbøl", party: "Danmarksdemokraterne (Æ)", constituency: "Sydjyllands Storkreds", contactEmail: "karina.adsbol@ft.dk" },
  { name: "Kenneth Fredslund Petersen", party: "Danmarksdemokraterne (Æ)", constituency: "Sydjyllands Storkreds", contactEmail: "kenneth.fredslund.petersen@ft.dk" },
  { name: "Jens Henrik Thulesen Dahl", party: "Danmarksdemokraterne (Æ)", constituency: "Fyns Storkreds", contactEmail: "jens.henrik.thulesen.dahl@ft.dk" },
  { name: "Hans Kristian Skibby", party: "Danmarksdemokraterne (Æ)", constituency: "Østjyllands Storkreds", contactEmail: "hans.kristian.skibby@ft.dk" },
  { name: "Marlene Harpsøe", party: "Danmarksdemokraterne (Æ)", constituency: "Nordsjællands Storkreds", contactEmail: "marlene.harpsoe@ft.dk" },
  { name: "Charlotte Munch", party: "Danmarksdemokraterne (Æ)", constituency: "Københavns Omegns Storkreds", contactEmail: "charlotte.munch@ft.dk" },
  { name: "Kim Edberg Andersen", party: "Danmarksdemokraterne (Æ)", constituency: "Nordjyllands Storkreds", contactEmail: "kim.edberg.andersen@ft.dk" },
  { name: "Mads Fuglede", party: "Danmarksdemokraterne (Æ)", constituency: "Vestjyllands Storkreds", contactEmail: "mads.fuglede@ft.dk" },

  // ===== DET KONSERVATIVE FOLKEPARTI (C) — 10 mandater =====
  { name: "Mona Juul", party: "Det Konservative Folkeparti (C)", constituency: "Østjyllands Storkreds", contactEmail: "mona.juul@ft.dk" },
  { name: "Mette Abildgaard", party: "Det Konservative Folkeparti (C)", constituency: "Nordsjællands Storkreds", contactEmail: "mette.abildgaard@ft.dk" },
  { name: "Rasmus Jarlov", party: "Det Konservative Folkeparti (C)", constituency: "Københavns Omegns Storkreds", contactEmail: "rasmus.jarlov@ft.dk" },
  { name: "Helle Bonnesen", party: "Det Konservative Folkeparti (C)", constituency: "Københavns Storkreds", contactEmail: "helle.bonnesen@ft.dk" },
  { name: "Brigitte Klintskov Jerkel", party: "Det Konservative Folkeparti (C)", constituency: "Sjællands Storkreds", contactEmail: "brigitte.klintskov.jerkel@ft.dk" },
  { name: "Mai Mercado", party: "Det Konservative Folkeparti (C)", constituency: "Fyns Storkreds", contactEmail: "mai.mercado@ft.dk" },
  { name: "Per Larsen", party: "Det Konservative Folkeparti (C)", constituency: "Nordjyllands Storkreds", contactEmail: "per.larsen@ft.dk" },
  { name: "Lise Bertelsen", party: "Det Konservative Folkeparti (C)", constituency: "Vestjyllands Storkreds", contactEmail: "lise.bertelsen@ft.dk" },
  { name: "Dina Andersen-Raabjerg", party: "Det Konservative Folkeparti (C)", constituency: "Vestjyllands Storkreds", contactEmail: "dina.andersen-raabjerg@ft.dk" },
  { name: "Frederik Bloch Münster", party: "Det Konservative Folkeparti (C)", constituency: "Sydjyllands Storkreds", contactEmail: "frederik.bloch.muenster@ft.dk" },

  // ===== DANSK FOLKEPARTI (O) — 7 mandater =====
  { name: "Morten Messerschmidt", party: "Dansk Folkeparti (O)", constituency: "Københavns Omegns Storkreds", contactEmail: "morten.messerschmidt@ft.dk" },
  { name: "Pia Kjærsgaard", party: "Dansk Folkeparti (O)", constituency: "Sjællands Storkreds", contactEmail: "pia.kjaersgaard@ft.dk" },
  { name: "Alex Ahrendtsen", party: "Dansk Folkeparti (O)", constituency: "Fyns Storkreds", contactEmail: "alex.ahrendtsen@ft.dk" },
  { name: "Peter Kofod", party: "Dansk Folkeparti (O)", constituency: "Sydjyllands Storkreds", contactEmail: "peter.kofod@ft.dk" },
  { name: "Nick Zimmermann", party: "Dansk Folkeparti (O)", constituency: "Østjyllands Storkreds", contactEmail: "nick.zimmermann@ft.dk" },
  { name: "Mikkel Bjørn", party: "Dansk Folkeparti (O)", constituency: "Fyns Storkreds", contactEmail: "mikkel.bjoern@ft.dk" },
  { name: "Mette Thiesen", party: "Dansk Folkeparti (O)", constituency: "Nordsjællands Storkreds", contactEmail: "mette.thiesen@ft.dk" },

  // ===== ENHEDSLISTEN (Ø) — 9 mandater =====
  { name: "Pelle Dragsted", party: "Enhedslisten (Ø)", constituency: "Københavns Storkreds", contactEmail: "pelle.dragsted@ft.dk" },
  { name: "Rosa Lund", party: "Enhedslisten (Ø)", constituency: "Københavns Storkreds", contactEmail: "rosa.lund@ft.dk" },
  { name: "Leila Stockmarr", party: "Enhedslisten (Ø)", constituency: "Københavns Storkreds", contactEmail: "leila.stockmarr@ft.dk" },
  { name: "Søren Søndergaard", party: "Enhedslisten (Ø)", constituency: "Københavns Omegns Storkreds", contactEmail: "soeren.soendergaard@ft.dk" },
  { name: "Mai Villadsen", party: "Enhedslisten (Ø)", constituency: "Østjyllands Storkreds", contactEmail: "mai.villadsen@ft.dk" },
  { name: "Trine Pertou Mach", party: "Enhedslisten (Ø)", constituency: "Sjællands Storkreds", contactEmail: "trine.pertou.mach@ft.dk" },
  { name: "Victoria Velásquez", party: "Enhedslisten (Ø)", constituency: "Fyns Storkreds", contactEmail: "victoria.velasquez@ft.dk" },
  { name: "Søren Egge Rasmussen", party: "Enhedslisten (Ø)", constituency: "Østjyllands Storkreds", contactEmail: "soeren.egge.rasmussen@ft.dk" },
  { name: "Peder Hvelplund", party: "Enhedslisten (Ø)", constituency: "Nordjyllands Storkreds", contactEmail: "peder.hvelplund@ft.dk" },

  // ===== RADIKALE VENSTRE (B) — 6 mandater =====
  { name: "Martin Lidegaard", party: "Radikale Venstre (B)", constituency: "Nordsjællands Storkreds", contactEmail: "martin.lidegaard@ft.dk" },
  { name: "Samira Nawa", party: "Radikale Venstre (B)", constituency: "Københavns Storkreds", contactEmail: "samira.nawa@ft.dk" },
  { name: "Stinus Lindgreen", party: "Radikale Venstre (B)", constituency: "Københavns Omegns Storkreds", contactEmail: "stinus.lindgreen@ft.dk" },
  { name: "Katrine Robsøe", party: "Radikale Venstre (B)", constituency: "Østjyllands Storkreds", contactEmail: "katrine.robsoe@ft.dk" },
  { name: "Lotte Rod", party: "Radikale Venstre (B)", constituency: "Sydjyllands Storkreds", contactEmail: "lotte.rod@ft.dk" },
  { name: "Zenia Stampe", party: "Radikale Venstre (B)", constituency: "Sjællands Storkreds", contactEmail: "zenia.stampe@ft.dk" },

  // ===== ALTERNATIVET (Å) — 6 mandater =====
  { name: "Franciska Rosenkilde", party: "Alternativet (Å)", constituency: "Københavns Storkreds", contactEmail: "franciska.rosenkilde@ft.dk" },
  { name: "Christina Olumeko", party: "Alternativet (Å)", constituency: "Københavns Storkreds", contactEmail: "christina.olumeko@ft.dk" },
  { name: "Helene Liliendahl Brydensholt", party: "Alternativet (Å)", constituency: "Nordsjællands Storkreds", contactEmail: "helene.liliendahl.brydensholt@ft.dk" },
  { name: "Sascha Faxe", party: "Alternativet (Å)", constituency: "Sjællands Storkreds", contactEmail: "sascha.faxe@ft.dk" },
  { name: "Torsten Gejl", party: "Alternativet (Å)", constituency: "Østjyllands Storkreds", contactEmail: "torsten.gejl@ft.dk" },
  { name: "Karin Liltorp", party: "Alternativet (Å)", constituency: "Østjyllands Storkreds", contactEmail: "karin.liltorp@ft.dk" },

  // ===== BORGERNES PARTI (H) =====
  { name: "Lars Boje Mathiesen", party: "Borgernes Parti (H)", constituency: "Østjyllands Storkreds", contactEmail: "lars.boje.mathiesen@ft.dk" },

  // ===== LØSGÆNGERE =====
  { name: "Theresa Scavenius", party: "Løsgænger (Å)", constituency: "Nordjyllands Storkreds", contactEmail: "theresa.scavenius@ft.dk" },
  { name: "Jon Stephensen", party: "Løsgænger (M)", constituency: "Københavns Storkreds", contactEmail: "jon.stephensen@ft.dk" },
  { name: "Jeppe Søe", party: "Løsgænger (M)", constituency: "Vestjyllands Storkreds", contactEmail: "jeppe.soe@ft.dk" },
  { name: "Peter Seier Christensen", party: "Løsgænger (D)", constituency: "Sjællands Storkreds", contactEmail: "peter.seier.christensen@ft.dk" },
  { name: "Mike Villa Fonseca", party: "Løsgænger (M)", constituency: "Sjællands Storkreds", contactEmail: "mike.villa.fonseca@ft.dk" },
];

async function main() {
  console.log(`Seeding ${CANDIDATES.length} Folketingsmedlemmer...\n`);

  let created = 0;
  let updated = 0;
  let skipped = 0;

  for (const candidate of CANDIDATES) {
    // Match on name (upsert existing records)
    const existing = await prisma.candidate.findFirst({
      where: { name: candidate.name },
    });

    if (existing) {
      // Update party, constituency, contactEmail if changed
      const needsUpdate =
        existing.party !== candidate.party ||
        existing.constituency !== candidate.constituency ||
        existing.contactEmail !== candidate.contactEmail;

      if (needsUpdate) {
        await prisma.candidate.update({
          where: { id: existing.id },
          data: {
            party: candidate.party,
            constituency: candidate.constituency,
            contactEmail: candidate.contactEmail,
          },
        });
        console.log(`  UPD  ${candidate.name} (${candidate.party}) → ${candidate.constituency}`);
        updated++;
      } else {
        console.log(`  SKIP ${candidate.name} — no changes`);
        skipped++;
      }
      continue;
    }

    await prisma.candidate.create({
      data: {
        name: candidate.name,
        party: candidate.party,
        constituency: candidate.constituency,
        contactEmail: candidate.contactEmail,
        verified: false,
        pledged: false,
        phoneHash: null,
        publicStatement: null,
      },
    });

    console.log(`  ADD  ${candidate.name} (${candidate.party}) → ${candidate.constituency}`);
    created++;
  }

  console.log(`\nDone: ${created} created, ${updated} updated, ${skipped} unchanged.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
