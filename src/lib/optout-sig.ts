import { createHmac } from "crypto";

function getSecret(): string {
  const secret = process.env.OPTOUT_SECRET;
  if (!secret) throw new Error("OPTOUT_SECRET is not set");
  return secret;
}

export function signOptout(candidateId: number): string {
  return createHmac("sha256", getSecret())
    .update(String(candidateId))
    .digest("hex")
    .slice(0, 16);
}

export function verifyOptout(candidateId: number, sig: string): boolean {
  return signOptout(candidateId) === sig;
}
