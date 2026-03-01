import { randomBytes, randomUUID } from "crypto";

const KV_URL = process.env.KV_REST_API_URL;
const KV_TOKEN = process.env.KV_REST_API_TOKEN;

const SESSION_TTL = 300; // 5 minutes

export interface QrSession {
  id: string;
  status: "pending" | "authenticated" | "failed";
  challenge: string;
  deviceId: string | null;
  adminUserId: number | null;
  jwt: string | null;
  createdAt: number;
}

function kvConfigured(): boolean {
  return Boolean(KV_URL && KV_TOKEN);
}

function sessKey(sessionId: string): string {
  return `qr:sess:${sessionId}`;
}

function tokKey(token: string): string {
  return `qr:tok:${token}`;
}

async function kvSet(key: string, value: string, ttl: number): Promise<void> {
  await fetch(`${KV_URL}/pipeline`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${KV_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify([["SET", key, value, "EX", ttl]]),
  });
}

async function kvGet(key: string): Promise<string | null> {
  const res = await fetch(`${KV_URL}/get/${key}`, {
    headers: { Authorization: `Bearer ${KV_TOKEN}` },
    cache: "no-store",
  });
  const json = (await res.json()) as { result: string | null };
  return json.result;
}

async function kvDel(key: string): Promise<void> {
  await fetch(`${KV_URL}/pipeline`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${KV_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify([["DEL", key]]),
  });
}

// In-memory fallback for development
const memStore = new Map<string, { value: string; expiresAt: number }>();

function memSet(key: string, value: string, ttl: number): void {
  memStore.set(key, { value, expiresAt: Date.now() + ttl * 1000 });
}

function memGet(key: string): string | null {
  const entry = memStore.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    memStore.delete(key);
    return null;
  }
  return entry.value;
}

function memDel(key: string): void {
  memStore.delete(key);
}

async function setVal(key: string, value: string, ttl: number): Promise<void> {
  if (kvConfigured()) {
    await kvSet(key, value, ttl);
  } else {
    memSet(key, value, ttl);
  }
}

async function getVal(key: string): Promise<string | null> {
  if (kvConfigured()) {
    return kvGet(key);
  }
  return memGet(key);
}

async function delVal(key: string): Promise<void> {
  if (kvConfigured()) {
    await kvDel(key);
  } else {
    memDel(key);
  }
}

/** Create a new QR login session */
export async function createSession(): Promise<QrSession> {
  const session: QrSession = {
    id: randomUUID(),
    status: "pending",
    challenge: randomBytes(32).toString("hex"),
    deviceId: null,
    adminUserId: null,
    jwt: null,
    createdAt: Date.now(),
  };

  await setVal(sessKey(session.id), JSON.stringify(session), SESSION_TTL);
  await setVal(tokKey(session.challenge), session.id, SESSION_TTL);

  return session;
}

/** Get session by ID */
export async function getSession(sessionId: string): Promise<QrSession | null> {
  const raw = await getVal(sessKey(sessionId));
  if (!raw) return null;
  return JSON.parse(raw) as QrSession;
}

/** Update session */
async function updateSession(session: QrSession): Promise<void> {
  const elapsed = (Date.now() - session.createdAt) / 1000;
  const remainingTtl = Math.max(1, Math.floor(SESSION_TTL - elapsed));
  await setVal(sessKey(session.id), JSON.stringify(session), remainingTtl);
}

/** Resolve challenge token to sessionId */
export async function resolveToken(token: string): Promise<string | null> {
  return getVal(tokKey(token));
}

/** Delete a challenge token (single-use) */
export async function consumeToken(token: string): Promise<void> {
  await delVal(tokKey(token));
}

/** Mark session as authenticated with JWT */
export async function markAuthenticated(
  session: QrSession,
  jwt: string,
  deviceId: string,
  adminUserId: number
): Promise<void> {
  session.status = "authenticated";
  session.jwt = jwt;
  session.deviceId = deviceId;
  session.adminUserId = adminUserId;
  await updateSession(session);
}

/** Mark session as failed */
export async function markFailed(session: QrSession): Promise<void> {
  session.status = "failed";
  await updateSession(session);
}
