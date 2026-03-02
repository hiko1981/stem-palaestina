import { z } from "zod/v4";

export const ballotRequestSchema = z.object({
  phone: z.string().min(1, "phoneMissing"),
  dialCode: z.string().min(1, "countryCodeMissing"),
  deviceId: z.string().optional(),
  role: z.enum(["voter", "candidate"]).optional(),
  candidateId: z.string().optional(),
  locale: z.string().max(5).optional(),
});

export const ballotVoteSchema = z.object({
  token: z.string().uuid("invalidBallotToken"),
  voteValue: z.boolean({ message: "voteValueMissing" }),
  deviceId: z.string().optional(),
});

export const candidateClaimSchema = z.object({
  candidateId: z.number().int().positive(),
  token: z.string().uuid("invalidBallotToken"),
});

export const candidateRegisterSchema = z.object({
  name: z.string().min(2, "nameMinLength").max(100),
  party: z.string().min(1, "partyMissing").max(100),
  constituency: z.string().min(1, "constituencyMissing").max(100),
  email: z.email("invalidEmail"),
  token: z.string().uuid("invalidBallotToken"),
});
