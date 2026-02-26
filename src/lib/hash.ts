import { createHash } from "crypto";

export function hashPhone(phone: string): string {
  const salt = process.env.PHONE_HASH_SALT;
  if (!salt) throw new Error("PHONE_HASH_SALT is not set");
  return createHash("sha256").update(`${phone}:${salt}`).digest("hex");
}
