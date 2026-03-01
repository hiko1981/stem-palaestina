import { randomBytes, randomUUID } from "crypto";

const KV_URL = process.env.KV_REST_API_URL;
const KV_TOKEN = process.env.KV_REST_API_TOKEN;

const SESSION_TTL = 300; // 5 minutes

export interface QrSession {
  id: string;
  step: 1 | 2 | 3 | "authenticated" | "failed";
  challenge1: string;
  challenge2: string | null;
  challenge3: string | null;
  deviceId: string | null;
  adminUserId: number | null;
  jwt: string | null;
  createdAt: number;
}

function kvConfigured(): boolean {
  return Boolean(KV_URL && KV_TOKEN);
}

function sessKey(id: string): string {
  return `qr:sess:${id}`;
}

function tokKey(tok: string): string {
  return `qr:tok:${tok}`;
}

function newChallenge(): string {
  return randomBytes(32).toString("hex");
}

// --- KV helpers ---

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

// --- In-memory fallback ---

const mem = new Map<string, { value: string; expiresAt: number }>();

function memSet(k: string, v: string, ttl: number): void {
  mem.set(k, { value: v, expiresAt: Date.now() + ttl * 1000 });
}

function memGet(k: string): string | null {
  const e = mem.get(k);
  if (!e) return null;
  if (Date.now() > e.expiresAt) {
    mem.delete(k);
    return null;
  }
  return e.value;
}

function memDel(k: string): void {
  mem.delete(k);
}

// --- Unified accessors ---

async function setVal(k: string, v: string, ttl: number): Promise<void> {
  kvConfigured() ? await kvSet(k, v, ttl) : memSet(k, v, ttl);
}

async function getVal(k: string): Promise<string | null> {
  return kvConfigured() ? kvGet(k) : memGet(k);
}

async function delVal(k: string): Promise<void> {
  kvConfigured() ? await kvDel(k) : memDel(k);
}

// --- Public API ---

export async function createSession(): Promise<QrSession> {
  const session: QrSession = {
    id: randomUUID(),
    step: 1,
    challenge1: newChallenge(),
    challenge2: null,
    challenge3: null,
    deviceId: null,
    adminUserId: null,
    jwt: null,
    createdAt: Date.now(),
  };
  await setVal(sessKey(session.id), JSON.stringify(session), SESSION_TTL);
  await setVal(tokKey(session.challenge1), session.id, SESSION_TTL);
  return session;
}

export async function getSession(id: string): Promise<QrSession | null> {
  const raw = await getVal(sessKey(id));
  return raw ? (JSON.parse(raw) as QrSession) : null;
}

async function saveSession(s: QrSession): Promise<void> {
  const elapsed = (Date.now() - s.createdAt) / 1000;
  const ttl = Math.max(1, Math.floor(SESSION_TTL - elapsed));
  await setVal(sessKey(s.id), JSON.stringify(s), ttl);
}

export async function resolveToken(tok: string): Promise<string | null> {
  return getVal(tokKey(tok));
}

export async function consumeToken(tok: string): Promise<void> {
  await delVal(tokKey(tok));
}

/** Step 1 → 2: phone scanned first QR, device verified */
export async function advanceToStep2(
  s: QrSession,
  deviceId: string,
  adminUserId: number
): Promise<string> {
  const c2 = newChallenge();
  s.step = 2;
  s.deviceId = deviceId;
  s.adminUserId = adminUserId;
  s.challenge2 = c2;
  await saveSession(s);
  await setVal(tokKey(c2), s.id, SESSION_TTL);
  return c2;
}

/** Step 2 → 3: phone scanned second QR */
export async function advanceToStep3(s: QrSession): Promise<string> {
  const c3 = newChallenge();
  s.step = 3;
  s.challenge3 = c3;
  await saveSession(s);
  await setVal(tokKey(c3), s.id, SESSION_TTL);
  return c3;
}

/** Step 3 → authenticated: phone scanned third QR, JWT issued */
export async function markAuthenticated(
  s: QrSession,
  jwt: string
): Promise<void> {
  s.step = "authenticated";
  s.jwt = jwt;
  await saveSession(s);
}

export async function markFailed(s: QrSession): Promise<void> {
  s.step = "failed";
  await saveSession(s);
}
