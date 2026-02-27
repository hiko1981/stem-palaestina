export const BALLOT_EXPIRY_HOURS = 24;
export const MAX_DEVICE_SLOTS = 3;
export const VOTE_BUNDLE_THRESHOLD = 50;

export const RATE_LIMITS = {
  ballotPerPhone: { max: 3, windowMs: 60 * 60 * 1000 },     // 3/time per telefon
  ballotGlobal: { max: 100, windowMs: 60 * 60 * 1000 },     // 100/time globalt
  votePerIp: { max: 10, windowMs: 60 * 60 * 1000 },         // 10/time per IP
} as const;

export const DEMANDS = [
  {
    title: "Anerkend Palæstina",
    description: "Danmark skal officielt anerkende staten Palæstina.",
  },
  {
    title: "Stop våbensalg til Israel",
    description:
      "Danmark skal stoppe alt salg og eksport af våben og militærudstyr til Israel.",
  },
  {
    title: "Stop ulovlige investeringer",
    description:
      "Danske pensionskasser og offentlige fonde skal trække investeringer ud af virksomheder, der profiterer på den ulovlige besættelse.",
  },
] as const;
