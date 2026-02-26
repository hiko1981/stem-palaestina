import { SignJWT, jwtVerify } from "jose";
import { JWT_EXPIRY_MINUTES } from "./constants";

function getSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error("JWT_SECRET is not set");
  return new TextEncoder().encode(secret);
}

export async function signToken(tokenId: string): Promise<string> {
  return new SignJWT({ tid: tokenId })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${JWT_EXPIRY_MINUTES}m`)
    .sign(getSecret());
}

export async function verifyToken(
  token: string
): Promise<{ tid: string } | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret());
    return payload as { tid: string };
  } catch {
    return null;
  }
}
