/**
 * Client-side device key management using Web Crypto API.
 * Generates ECDSA P-256 keypair with non-extractable private key,
 * stored in IndexedDB. The private key cannot be read by JavaScript —
 * only used for signing operations.
 */

const DB_NAME = "admin_keys";
const STORE_NAME = "device";
const KEY_ID = "admin_device_key";
const DEVICE_ID_KEY = "admin_device_id";

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => {
      req.result.createObjectStore(STORE_NAME);
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function idbGet<T>(key: string): Promise<T | undefined> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readonly");
    const req = tx.objectStore(STORE_NAME).get(key);
    req.onsuccess = () => resolve(req.result as T | undefined);
    req.onerror = () => reject(req.error);
  });
}

async function idbSet(key: string, value: unknown): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    tx.objectStore(STORE_NAME).put(value, key);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

/** Get or create a persistent device ID */
export function getDeviceId(): string {
  let id = localStorage.getItem(DEVICE_ID_KEY);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(DEVICE_ID_KEY, id);
  }
  return id;
}

/** Generate a new ECDSA P-256 keypair and store in IndexedDB */
export async function generateKeyPair(): Promise<string> {
  const keyPair = await crypto.subtle.generateKey(
    { name: "ECDSA", namedCurve: "P-256" },
    false, // non-extractable private key
    ["sign", "verify"]
  );

  // Store the CryptoKey objects (not the raw key data)
  await idbSet(KEY_ID, keyPair);

  // Export public key as base64 for sending to server
  const publicKeyBuffer = await crypto.subtle.exportKey(
    "spki",
    keyPair.publicKey
  );
  return bufferToBase64(publicKeyBuffer);
}

/** Check if device has a stored keypair */
export async function hasKeyPair(): Promise<boolean> {
  const kp = await idbGet<CryptoKeyPair>(KEY_ID);
  return Boolean(kp?.privateKey);
}

/** Sign a challenge string with the stored private key */
export async function signChallenge(challenge: string): Promise<string> {
  const kp = await idbGet<CryptoKeyPair>(KEY_ID);
  if (!kp?.privateKey) {
    throw new Error("No device key found");
  }

  const data = new TextEncoder().encode(challenge);
  const signature = await crypto.subtle.sign(
    { name: "ECDSA", hash: "SHA-256" },
    kp.privateKey,
    data
  );

  return bufferToBase64(signature);
}

/** Get the stored public key as base64 */
export async function getPublicKey(): Promise<string | null> {
  const kp = await idbGet<CryptoKeyPair>(KEY_ID);
  if (!kp?.publicKey) return null;

  const publicKeyBuffer = await crypto.subtle.exportKey("spki", kp.publicKey);
  return bufferToBase64(publicKeyBuffer);
}

function bufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}
