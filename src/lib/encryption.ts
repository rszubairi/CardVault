/**
 * Client-side AES-256-GCM encryption for contact data.
 * Key is derived from the user's 6-digit PIN via PBKDF2.
 * The key never leaves the device; only encrypted ciphertext is stored on the server.
 */

function getSubtle(): SubtleCrypto {
  if (typeof crypto !== 'undefined' && crypto.subtle) return crypto.subtle;
  throw new Error('SubtleCrypto not available in this environment');
}

function hexToBytes(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.slice(i, i + 2), 16);
  }
  return bytes;
}

function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

function bytesToBase64(bytes: Uint8Array): string {
  let binary = '';
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary);
}

function base64ToBytes(b64: string): Uint8Array {
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

/** Generate a random hex-encoded salt. */
export function generateSalt(byteLength = 32): string {
  const bytes = new Uint8Array(byteLength);
  crypto.getRandomValues(bytes);
  return bytesToHex(bytes);
}

/**
 * Hash a PIN for server-side verification.
 * Uses SHA-256(pin + salt) — the salt makes rainbow tables infeasible.
 */
export async function hashPIN(pin: string, salt: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(pin + salt);
  const hashBuffer = await getSubtle().digest('SHA-256', data);
  return bytesToHex(new Uint8Array(hashBuffer));
}

/**
 * Derive an AES-256-GCM key from a 6-digit PIN using PBKDF2.
 * The encryptionSalt is stored on the server (not secret); the PIN is not.
 */
export async function deriveKey(pin: string, encryptionSalt: string): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  const keyMaterial = await getSubtle().importKey(
    'raw',
    encoder.encode(pin),
    { name: 'PBKDF2' },
    false,
    ['deriveKey'],
  );
  return getSubtle().deriveKey(
    {
      name: 'PBKDF2',
      salt: hexToBytes(encryptionSalt),
      iterations: 100_000,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt'],
  );
}

/** Fields encrypted before storing on the server. Names stay plaintext for search. */
export interface EncryptableFields {
  email?: string;
  phone?: string;
  mobile?: string;
  company?: string;
  designation?: string;
  companyDomain?: string;
  industry?: string;
  country?: string;
  website?: string;
  address?: string;
  linkedinUrl?: string;
  meetingNotes?: string;
  metLocation?: string;
}

/**
 * Encrypt sensitive contact fields.
 * Returns a string in the format `base64(IV):base64(ciphertext)`.
 */
export async function encryptPayload(
  data: EncryptableFields,
  key: CryptoKey,
): Promise<string> {
  const encoder = new TextEncoder();
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const plaintext = encoder.encode(JSON.stringify(data));
  const ciphertext = await getSubtle().encrypt({ name: 'AES-GCM', iv }, key, plaintext);
  return bytesToBase64(iv) + ':' + bytesToBase64(new Uint8Array(ciphertext));
}

/**
 * Decrypt an encrypted payload string back into sensitive contact fields.
 * Throws if the key is wrong or the data is corrupt.
 */
export async function decryptPayload(
  payload: string,
  key: CryptoKey,
): Promise<EncryptableFields> {
  const colonIdx = payload.indexOf(':');
  const iv = base64ToBytes(payload.slice(0, colonIdx));
  const ciphertext = base64ToBytes(payload.slice(colonIdx + 1));
  const plaintext = await getSubtle().decrypt({ name: 'AES-GCM', iv }, key, ciphertext);
  return JSON.parse(new TextDecoder().decode(plaintext)) as EncryptableFields;
}
