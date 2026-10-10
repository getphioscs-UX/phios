import { createHash } from 'node:crypto';
import { canonicalJson } from './canonical-json.js';

export function sha256Hex(value) {
  const hash = createHash('sha256');
  if (Buffer.isBuffer(value) || value instanceof Uint8Array) hash.update(value);
  else if (typeof value === 'string') hash.update(value, 'utf8');
  else hash.update(canonicalJson(value), 'utf8');
  return hash.digest('hex');
}

export default Object.freeze({ sha256Hex });
