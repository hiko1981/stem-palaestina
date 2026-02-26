import { z } from "zod/v4";

// Dansk mobilnummer: +45 efterfulgt af 8 cifre
const phoneRegex = /^\+45\d{8}$/;

export const phoneSchema = z.object({
  phone: z
    .string()
    .regex(phoneRegex, "Ugyldigt dansk telefonnummer (format: +45XXXXXXXX)"),
  turnstileToken: z.string().min(1, "Captcha-verifikation mangler"),
});

export const verifyCodeSchema = z.object({
  phone: z
    .string()
    .regex(phoneRegex, "Ugyldigt dansk telefonnummer"),
  code: z
    .string()
    .length(6, "Koden skal være 6 cifre")
    .regex(/^\d{6}$/, "Koden skal kun indeholde cifre"),
});

export const voteSchema = z.object({
  token: z.string().min(1, "Token mangler"),
});

export function normalizePhone(phone: string): string {
  // Fjern mellemrum og sikr +45 prefix
  const cleaned = phone.replace(/\s/g, "");
  if (cleaned.startsWith("+45")) return cleaned;
  if (cleaned.startsWith("45") && cleaned.length === 10) return `+${cleaned}`;
  if (cleaned.length === 8 && /^\d{8}$/.test(cleaned)) return `+45${cleaned}`;
  return cleaned; // Lad validering fange det
}
