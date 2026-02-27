export const STORKREDSE = [
  { id: "copenhagen", name: "Københavns Storkreds" },
  { id: "copenhagen-suburbs", name: "Københavns Omegns Storkreds" },
  { id: "north-zealand", name: "Nordsjællands Storkreds" },
  { id: "zealand", name: "Sjællands Storkreds" },
  { id: "funen", name: "Fyns Storkreds" },
  { id: "south-jutland", name: "Sydjyllands Storkreds" },
  { id: "east-jutland", name: "Østjyllands Storkreds" },
  { id: "west-jutland", name: "Vestjyllands Storkreds" },
  { id: "north-jutland", name: "Nordjyllands Storkreds" },
  { id: "bornholm", name: "Bornholms Storkreds" },
] as const;

export type StorkredsId = (typeof STORKREDSE)[number]["id"];

// Simplified SVG paths for Denmark's 10 storkredse
// Viewbox: 0 0 300 400, Mercator-like projection centered on Denmark
export const STORKREDS_PATHS: Record<StorkredsId, string> = {
  copenhagen:
    "M205,225 L215,218 L225,222 L228,232 L222,240 L212,238 L205,230 Z",
  "copenhagen-suburbs":
    "M195,210 L205,205 L215,210 L220,218 L215,228 L205,232 L195,225 L190,218 Z",
  "north-zealand":
    "M175,190 L195,180 L215,185 L225,195 L220,210 L200,215 L185,210 L175,200 Z",
  zealand:
    "M160,230 L180,220 L200,225 L210,240 L215,260 L200,275 L180,280 L165,270 L155,255 L155,240 Z",
  funen:
    "M130,235 L145,228 L155,235 L158,250 L150,265 L138,268 L128,260 L125,248 Z",
  "south-jutland":
    "M80,270 L100,260 L120,265 L130,280 L125,300 L115,315 L95,320 L80,310 L72,295 L75,280 Z",
  "east-jutland":
    "M95,195 L115,185 L130,195 L135,215 L130,235 L115,245 L100,240 L90,225 L88,210 Z",
  "west-jutland":
    "M45,195 L65,185 L85,190 L95,205 L90,230 L80,245 L60,250 L45,240 L38,220 L40,205 Z",
  "north-jutland":
    "M55,110 L80,100 L105,105 L120,120 L125,145 L115,170 L95,180 L70,178 L50,165 L42,145 L45,125 Z",
  bornholm:
    "M268,210 L278,205 L288,210 L290,220 L285,228 L275,230 L268,222 Z",
};
