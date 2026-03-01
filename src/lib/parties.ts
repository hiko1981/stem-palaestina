export const PARTIES = [
  { letter: "A", name: "Socialdemokratiet" },
  { letter: "B", name: "Radikale Venstre" },
  { letter: "C", name: "Det Konservative Folkeparti" },
  { letter: "F", name: "SF – Socialistisk Folkeparti" },
  { letter: "H", name: "Borgernes Parti" },
  { letter: "I", name: "Liberal Alliance" },
  { letter: "M", name: "Moderaterne" },
  { letter: "O", name: "Dansk Folkeparti" },
  { letter: "V", name: "Venstre" },
  { letter: "Æ", name: "Danmarksdemokraterne" },
  { letter: "Ø", name: "Enhedslisten" },
  { letter: "Å", name: "Alternativet" },
] as const;

/** Format party for display and storage: "Enhedslisten (Ø)" */
export function formatParty(letter: string, name: string): string {
  return `${name} (${letter})`;
}

/** All parties formatted for dropdowns */
export const PARTY_OPTIONS = PARTIES.map((p) => ({
  value: formatParty(p.letter, p.name),
  label: formatParty(p.letter, p.name),
  letter: p.letter,
}));
