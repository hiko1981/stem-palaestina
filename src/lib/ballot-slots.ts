/**
 * Ballot slot management — limits pending SMS ballots per device.
 * Ported from localislam invite-slots.ts, adapted for ballot tokens.
 * Uses Vercel KV for distributed state.
 */

import { MAX_DEVICE_SLOTS, BALLOT_EXPIRY_HOURS } from "./constants";

export interface BallotSlotRecord {
  id: string;
  phoneHash: string;
  expiresAt: number; // unix seconds
  status: "pending" | "used" | "expired";
}

const KV_URL = process.env.KV_REST_API_URL;
const KV_TOKEN = process.env.KV_REST_API_TOKEN;

function kvConfigured(): boolean {
  return Boolean(KV_URL && KV_TOKEN);
}

function kvKey(deviceId: string): string {
  return `bslots:${deviceId}`;
}

async function kvGetRecords(deviceId: string): Promise<BallotSlotRecord[]> {
  if (!kvConfigured()) return [];
  try {
    const res = await fetch(`${KV_URL}/get/${kvKey(deviceId)}`, {
      headers: { Authorization: `Bearer ${KV_TOKEN}` },
      cache: "no-store",
    });
    const json = (await res.json()) as { result: string | null };
    if (!json.result) return [];
    return JSON.parse(json.result) as BallotSlotRecord[];
  } catch {
    return [];
  }
}

async function kvSetRecords(
  deviceId: string,
  records: BallotSlotRecord[]
): Promise<void> {
  if (!kvConfigured()) return;
  const ttlSeconds = BALLOT_EXPIRY_HOURS * 3600 + 3600; // expiry + 1 hour buffer
  await fetch(`${KV_URL}/pipeline`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${KV_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify([
      ["SET", kvKey(deviceId), JSON.stringify(records), "EX", ttlSeconds],
    ]),
  });
}

function activePendingCount(records: BallotSlotRecord[]): number {
  const now = Math.floor(Date.now() / 1000);
  return records.filter((r) => r.status === "pending" && r.expiresAt > now)
    .length;
}

/** Reserve a ballot slot for a device. Returns ok or error. */
export async function checkAndReserveSlot(
  deviceId: string,
  slotId: string,
  phoneHash: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!kvConfigured()) {
    return { ok: true };
  }

  const records = await kvGetRecords(deviceId);
  const pending = activePendingCount(records);

  if (pending >= MAX_DEVICE_SLOTS) {
    return {
      ok: false,
      error: `Du har allerede ${MAX_DEVICE_SLOTS} ventende stemmesedler. Vent til de udløber eller brug dem.`,
    };
  }

  const now = Math.floor(Date.now() / 1000);
  const expiresAt = now + BALLOT_EXPIRY_HOURS * 3600;

  // Prune expired pending records
  const cleaned = records.filter(
    (r) => !(r.status === "pending" && r.expiresAt <= now)
  );
  cleaned.push({ id: slotId, phoneHash, expiresAt, status: "pending" });
  await kvSetRecords(deviceId, cleaned);
  return { ok: true };
}

/** Mark a slot as used, freeing it for future ballots. */
export async function freeSlot(
  deviceId: string,
  slotId: string
): Promise<void> {
  if (!kvConfigured()) return;
  const records = await kvGetRecords(deviceId);
  const updated = records.map((r) =>
    r.id === slotId ? { ...r, status: "used" as const } : r
  );
  await kvSetRecords(deviceId, updated);
}
