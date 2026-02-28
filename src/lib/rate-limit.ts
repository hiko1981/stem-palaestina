interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const stores = new Map<string, Map<string, RateLimitEntry>>();

function getStore(name: string): Map<string, RateLimitEntry> {
  let store = stores.get(name);
  if (!store) {
    store = new Map();
    stores.set(name, store);
  }
  return store;
}

const KV_URL = process.env.KV_REST_API_URL;
const KV_TOKEN = process.env.KV_REST_API_TOKEN;

function kvConfigured(): boolean {
  return Boolean(KV_URL && KV_TOKEN);
}

function kvKey(name: string, key: string): string {
  return `rl:${name}:${key}`;
}

async function kvPipeline(commands: unknown[][]): Promise<unknown> {
  const res = await fetch(`${KV_URL}/pipeline`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${KV_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(commands),
    cache: "no-store",
  });
  return res.json();
}

async function checkRateLimitKv(
  name: string,
  key: string,
  max: number,
  windowMs: number
): Promise<{ ok: boolean; remaining: number }> {
  const redisKey = kvKey(name, key);
  const payload = (await kvPipeline([
    ["INCR", redisKey],
    ["PTTL", redisKey],
  ])) as {
    result?: Array<{ result?: unknown; error?: string }>;
  };

  const incr = payload.result?.[0]?.result;
  const ttl = payload.result?.[1]?.result;

  if (typeof incr !== "number") {
    // Unexpected shape — fall back to in-memory
    return checkRateLimitMemory(name, key, max, windowMs);
  }

  // If key has no TTL yet, set one (best-effort).
  if (ttl === -1 || ttl === null || ttl === undefined) {
    kvPipeline([["PEXPIRE", redisKey, windowMs]]).catch(() => {});
  }

  const remaining = Math.max(0, max - incr);
  return { ok: incr <= max, remaining };
}

function checkRateLimitMemory(
  name: string,
  key: string,
  max: number,
  windowMs: number
): { ok: boolean; remaining: number } {
  const store = getStore(name);
  const now = Date.now();
  const entry = store.get(key);

  if (!entry || now > entry.resetAt) {
    store.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true, remaining: max - 1 };
  }

  if (entry.count >= max) {
    return { ok: false, remaining: 0 };
  }

  entry.count++;
  return { ok: true, remaining: max - entry.count };
}

export async function checkRateLimit(
  name: string,
  key: string,
  max: number,
  windowMs: number
): Promise<{ ok: boolean; remaining: number }> {
  if (kvConfigured()) {
    try {
      return await checkRateLimitKv(name, key, max, windowMs);
    } catch {
      return checkRateLimitMemory(name, key, max, windowMs);
    }
  }
  return checkRateLimitMemory(name, key, max, windowMs);
}
