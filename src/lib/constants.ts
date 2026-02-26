export const SMS_CODE_LENGTH = 6;
export const SMS_CODE_EXPIRY_MINUTES = 5;
export const SMS_MAX_ATTEMPTS = 3;
export const JWT_EXPIRY_MINUTES = 15;
export const VOTE_BUNDLE_THRESHOLD = 50;

export const RATE_LIMITS = {
  smsPerPhone: { max: 3, windowMs: 60 * 60 * 1000 },       // 3/time per telefon
  smsGlobal: { max: 100, windowMs: 60 * 60 * 1000 },       // 100/time globalt
  verifyPerPhone: { max: 5, windowMs: 15 * 60 * 1000 },     // 5/15min per telefon
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
