import { z } from "zod/v4";

export const ballotRequestSchema = z.object({
  phone: z.string().min(1, "Telefonnummer mangler"),
  dialCode: z.string().min(1, "Landekode mangler"),
  deviceId: z.string().optional(),
});

export const ballotVoteSchema = z.object({
  token: z.string().uuid("Ugyldig stemmeseddel-token"),
  voteValue: z.boolean({ message: "Stemmeværdi mangler (ja/nej)" }),
});

export const candidateClaimSchema = z.object({
  candidateId: z.number().int().positive(),
  token: z.string().uuid("Ugyldig stemmeseddel-token"),
});

export const candidateRegisterSchema = z.object({
  name: z.string().min(2, "Navn skal være mindst 2 tegn").max(100),
  party: z.string().min(1, "Parti mangler").max(100),
  constituency: z.string().min(1, "Valgkreds mangler").max(100),
  token: z.string().uuid("Ugyldig stemmeseddel-token"),
});
