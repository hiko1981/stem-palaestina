import { NextRequest, NextResponse } from "next/server";
import { SignJWT, jwtVerify } from "jose";

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
