function normalize(value, seen = new WeakSet()) {
  if (value === null || typeof value === 'string' || typeof value === 'boolean') return value;
  if (typeof value === 'number') {
    if (!Number.isFinite(value)) throw new TypeError('DAR_CANONICAL_JSON_NON_FINITE_NUMBER');
    return Object.is(value, -0) ? 0 : value;
  }
  if (typeof value !== 'object') throw new TypeError(`DAR_CANONICAL_JSON_UNSUPPORTED_TYPE:${typeof value}`);
  if (seen.has(value)) throw new TypeError('DAR_CANONICAL_JSON_CIRCULAR_REFERENCE');
  seen.add(value);
  let out;
  if (Array.isArray(value)) {
    out = value.map((entry) => normalize(entry, seen));
  } else {
    out = {};
    for (const key of Object.keys(value).sort()) {
      const entry = value[key];
      if (entry === undefined) throw new TypeError(`DAR_CANONICAL_JSON_UNDEFINED:${key}`);
      out[key] = normalize(entry, seen);
    }
  }
  seen.delete(value);
  return out;
}

export function canonicalJson(value) {
  return JSON.stringify(normalize(value));
}

export function canonicalClone(value) {
  return JSON.parse(canonicalJson(value));
}

export default Object.freeze({ canonicalJson, canonicalClone });
