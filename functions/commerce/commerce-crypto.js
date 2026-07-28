const encoder = new TextEncoder();
const decoder = new TextDecoder();

function cryptoApi() {
  if (!globalThis.crypto?.subtle || !globalThis.crypto?.getRandomValues) {
    throw new Error('Web Crypto is required.');
  }
  return globalThis.crypto;
}

function bytesToHex(bytes) {
  return [...bytes]
    .map(byte => byte.toString(16).padStart(2, '0'))
    .join('');
}

function bytesToBase64Url(bytes) {
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary)
    .replaceAll('+', '-')
    .replaceAll('/', '_')
    .replace(/=+$/g, '');
}

function base64UrlToBytes(value) {
  const normalized = String(value || '')
    .replaceAll('-', '+')
    .replaceAll('_', '/');
  const padded = normalized + '='.repeat((4 - normalized.length % 4) % 4);
  const binary = atob(padded);
  return Uint8Array.from(binary, character => character.charCodeAt(0));
}

async function deriveKey(secret, usage, algorithm) {
  const material = await cryptoApi().subtle.digest(
    'SHA-256',
    encoder.encode(`phi-os:${usage}:v1:${String(secret || '')}`)
  );
  return cryptoApi().subtle.importKey(
    'raw',
    material,
    algorithm,
    false,
    algorithm.name === 'HMAC' ? ['sign', 'verify'] : ['encrypt', 'decrypt']
  );
}

export async function sha256Hex(value) {
  const digest = await cryptoApi().subtle.digest(
    'SHA-256',
    typeof value === 'string' ? encoder.encode(value) : value
  );
  return bytesToHex(new Uint8Array(digest));
}

export async function hmacHex(secret, value, usage = 'hmac') {
  const key = await deriveKey(secret, usage, {
    name: 'HMAC',
    hash: 'SHA-256'
  });
  const signature = await cryptoApi().subtle.sign(
    'HMAC',
    key,
    encoder.encode(String(value))
  );
  return bytesToHex(new Uint8Array(signature));
}

export async function rawHmacHex(secret, value) {
  const key = await cryptoApi().subtle.importKey(
    'raw',
    encoder.encode(String(secret || '')),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify']
  );
  const signature = await cryptoApi().subtle.sign(
    'HMAC',
    key,
    encoder.encode(String(value))
  );
  return bytesToHex(new Uint8Array(signature));
}

export async function verifyRawHmacHex(secret, value, signature) {
  if (!/^[0-9a-f]{64}$/i.test(String(signature || ''))) return false;
  const key = await cryptoApi().subtle.importKey(
    'raw',
    encoder.encode(String(secret || '')),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['verify']
  );
  const bytes = Uint8Array.from(
    String(signature).match(/.{2}/g),
    pair => Number.parseInt(pair, 16)
  );
  return cryptoApi().subtle.verify(
    'HMAC',
    key,
    bytes,
    encoder.encode(String(value))
  );
}

export async function verifyHmacHex(secret, value, signature, usage = 'hmac') {
  if (!/^[0-9a-f]{64}$/i.test(String(signature || ''))) return false;
  const key = await deriveKey(secret, usage, {
    name: 'HMAC',
    hash: 'SHA-256'
  });
  const bytes = Uint8Array.from(
    String(signature).match(/.{2}/g),
    pair => Number.parseInt(pair, 16)
  );
  return cryptoApi().subtle.verify(
    'HMAC',
    key,
    bytes,
    encoder.encode(String(value))
  );
}

export async function encryptSensitive(value, secret) {
  if (!String(secret || '').trim()) {
    throw new Error('BOOK_ACCESS_TOKEN_SECRET is required.');
  }
  const iv = cryptoApi().getRandomValues(new Uint8Array(12));
  const key = await deriveKey(secret, 'sensitive-data', {
    name: 'AES-GCM',
    length: 256
  });
  const ciphertext = await cryptoApi().subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    encoder.encode(String(value || ''))
  );
  return `v1.${bytesToBase64Url(iv)}.${bytesToBase64Url(new Uint8Array(ciphertext))}`;
}

export async function decryptSensitive(value, secret) {
  const [version, encodedIv, encodedCiphertext] = String(value || '').split('.');
  if (version !== 'v1' || !encodedIv || !encodedCiphertext) {
    throw new Error('Encrypted value is invalid.');
  }
  const key = await deriveKey(secret, 'sensitive-data', {
    name: 'AES-GCM',
    length: 256
  });
  const plaintext = await cryptoApi().subtle.decrypt(
    { name: 'AES-GCM', iv: base64UrlToBytes(encodedIv) },
    key,
    base64UrlToBytes(encodedCiphertext)
  );
  return decoder.decode(plaintext);
}

export function randomId(prefix = '') {
  return `${prefix}${cryptoApi().randomUUID().replaceAll('-', '')}`;
}

export function randomToken(byteLength = 32) {
  return bytesToBase64Url(
    cryptoApi().getRandomValues(new Uint8Array(byteLength))
  );
}

export async function subjectHash(email, secret) {
  return hmacHex(
    secret,
    String(email || '').trim().toLowerCase(),
    'buyer-subject'
  );
}

export async function signAccessSession(claims, secret) {
  const encoded = bytesToBase64Url(encoder.encode(JSON.stringify(claims)));
  const signature = await hmacHex(secret, `v1.${encoded}`, 'access-session');
  return `v1.${encoded}.${signature}`;
}

export async function verifyAccessSession(token, secret, now = Date.now()) {
  const [version, encoded, signature] = String(token || '').split('.');
  if (version !== 'v1' || !encoded || !signature) return null;
  if (!await verifyHmacHex(
    secret,
    `v1.${encoded}`,
    signature,
    'access-session'
  )) return null;

  try {
    const claims = JSON.parse(decoder.decode(base64UrlToBytes(encoded)));
    if (
      !claims ||
      typeof claims !== 'object' ||
      !claims.entitlementId ||
      !claims.purchaseId ||
      !Number.isFinite(Number(claims.exp)) ||
      Number(claims.exp) * 1000 <= now
    ) return null;
    return claims;
  } catch {
    return null;
  }
}

export function accessCookie(token, maximumAgeSeconds = 2592000) {
  return [
    `phios_book_access=${token}`,
    'Path=/',
    `Max-Age=${maximumAgeSeconds}`,
    'HttpOnly',
    'Secure',
    'SameSite=Lax'
  ].join('; ');
}
