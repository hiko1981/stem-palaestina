import { NextRequest, NextResponse } from "next/server";
import { SignJWT, jwtVerify } from "jose";
import { createPublicKey, createVerify } from "crypto";

const JWT_SECRET = process.env.JWT_SECRET;

function getSecret(): Uint8Array {
  if (!JWT_SECRET) throw new Error("JWT_SECRET not set");
  return new TextEncoder().encode(JWT_SECRET);
}

export interface AdminJwtPayload {
  sub: string;
  email: string;
  role: string;
  deviceId: string;
}

export async function generateJwt(payload: AdminJwtPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("24h")
    .sign(getSecret());
}

export async function verifyJwt(
  token: string
): Promise<AdminJwtPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret());
    return payload as unknown as AdminJwtPayload;
  } catch {
    return null;
  }
}

/**
 * JWT-only auth: accepts JWT from cookie or Authorization header.
 * Returns admin payload on success, or NextResponse 401 on failure.
 */
export async function requireAdmin(
  req: NextRequest
): Promise<AdminJwtPayload | NextResponse> {
  // Try JWT from cookie first
  const cookie = req.cookies.get("admin_token");
  if (cookie?.value) {
    const payload = await verifyJwt(cookie.value);
    if (payload) return payload;
  }

  // Try JWT from Authorization: Bearer header
  const auth = req.headers.get("authorization") || "";
  if (auth.startsWith("Bearer ")) {
    const token = auth.slice(7);
    const payload = await verifyJwt(token);
    if (payload) return payload;
  }

  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

/** Type guard: true if auth result is an error response */
export function isAuthError(
  result: AdminJwtPayload | NextResponse
): result is NextResponse {
  return result instanceof NextResponse;
}

/**
 * Verify an ECDSA P-256 signature from a device's Web Crypto keypair.
 * publicKeyBase64: SPKI-encoded public key in base64
 * challenge: the original challenge string
 * signatureBase64: the signature in base64
 */
export function verifyDeviceSignature(
  publicKeyBase64: string,
  challenge: string,
  signatureBase64: string
): boolean {
  try {
    const publicKeyDer = Buffer.from(publicKeyBase64, "base64");
    const key = createPublicKey({
      key: publicKeyDer,
      format: "der",
      type: "spki",
    });

    // Web Crypto ECDSA uses IEEE P1363 format (r || s), Node uses DER
    const ieeeSignature = Buffer.from(signatureBase64, "base64");
    const derSignature = ieeeP1363ToDer(ieeeSignature);

    const verifier = createVerify("SHA256");
    verifier.update(challenge);
    return verifier.verify(key, derSignature);
  } catch {
    return false;
  }
}

/** Convert IEEE P1363 (r || s) ECDSA signature to DER format */
function ieeeP1363ToDer(sig: Buffer): Buffer {
  const half = sig.length / 2;
  const r = sig.subarray(0, half);
  const s = sig.subarray(half);

  function encodeInteger(int: Buffer): Buffer {
    // Strip leading zeros but keep one if high bit is set
    let i = 0;
    while (i < int.length - 1 && int[i] === 0) i++;
    let trimmed = int.subarray(i);
    // Add leading zero if high bit set (negative in ASN.1)
    if (trimmed[0] & 0x80) {
      trimmed = Buffer.concat([Buffer.from([0]), trimmed]);
    }
    return Buffer.concat([Buffer.from([0x02, trimmed.length]), trimmed]);
  }

  const rDer = encodeInteger(r);
  const sDer = encodeInteger(s);
  const body = Buffer.concat([rDer, sDer]);
  return Buffer.concat([Buffer.from([0x30, body.length]), body]);
}
