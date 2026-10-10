/** PHI OS FCR-W19 governed range/unknown arithmetic. */
export const FCR_VALUE_KINDS = Object.freeze(['EXACT', 'APPROXIMATE', 'RANGE', 'UNKNOWN']);

const round = value => Math.round((Number(value) + Number.EPSILON) * 1e8) / 1e8;
const finite = value => typeof value === 'number' && Number.isFinite(value);

export function exact(value, meta = {}) {
  if (!finite(value)) return unknown('NON_FINITE_VALUE', meta);
  return Object.freeze({ kind: 'EXACT', value: round(value), ...meta });
}
export function approximate(value, meta = {}) {
  if (!finite(value)) return unknown('NON_FINITE_VALUE', meta);
  return Object.freeze({ kind: 'APPROXIMATE', value: round(value), ...meta });
}
export function range(min, max, meta = {}) {
  if (!finite(min) || !finite(max)) return unknown('NON_FINITE_RANGE', meta);
  const low = Math.min(min, max); const high = Math.max(min, max);
  return Object.freeze({ kind: 'RANGE', min: round(low), max: round(high), ...meta });
}
export function unknown(reason = 'UNKNOWN_INPUT', meta = {}) {
  return Object.freeze({ kind: 'UNKNOWN', reason: String(reason), ...meta });
}
export function isUnknown(value) { return !value || value.kind === 'UNKNOWN'; }
export function bounds(value) {
  if (isUnknown(value)) return null;
  if (value.kind === 'RANGE') return [value.min, value.max];
  return [value.value, value.value];
}
function dominantKind(values) {
  if (values.some(v => isUnknown(v))) return 'UNKNOWN';
  if (values.some(v => v.kind === 'RANGE')) return 'RANGE';
  if (values.some(v => v.kind === 'APPROXIMATE')) return 'APPROXIMATE';
  return 'EXACT';
}
function fromBounds(low, high, values, meta = {}) {
  const kind = dominantKind(values);
  if (kind === 'UNKNOWN') return unknown(values.find(isUnknown)?.reason || 'UNKNOWN_INPUT', meta);
  if (kind === 'RANGE') return range(low, high, meta);
  if (kind === 'APPROXIMATE') return approximate((low + high) / 2, meta);
  return exact(low, meta);
}
export function add(...values) {
  if (values.some(isUnknown)) return unknown(values.find(isUnknown)?.reason || 'UNKNOWN_INPUT');
  let low = 0, high = 0;
  for (const value of values) { const [a,b] = bounds(value); low += a; high += b; }
  return fromBounds(low, high, values);
}
export function subtract(a, b) {
  if (isUnknown(a) || isUnknown(b)) return unknown(isUnknown(a) ? a.reason : b.reason);
  const [a0,a1]=bounds(a), [b0,b1]=bounds(b);
  return fromBounds(a0-b1, a1-b0, [a,b]);
}
export function multiply(a, b) {
  if (isUnknown(a) || isUnknown(b)) return unknown(isUnknown(a) ? a.reason : b.reason);
  const [a0,a1]=bounds(a), [b0,b1]=bounds(b);
  const candidates=[a0*b0,a0*b1,a1*b0,a1*b1];
  return fromBounds(Math.min(...candidates), Math.max(...candidates), [a,b]);
}
export function divide(a, b) {
  if (isUnknown(a) || isUnknown(b)) return unknown(isUnknown(a) ? a.reason : b.reason);
  const [a0,a1]=bounds(a), [b0,b1]=bounds(b);
  if (b0 <= 0 && b1 >= 0) return unknown('ZERO_DENOMINATOR_RANGE');
  const candidates=[a0/b0,a0/b1,a1/b0,a1/b1];
  return fromBounds(Math.min(...candidates), Math.max(...candidates), [a,b]);
}
export function scale(a, factor) { return multiply(a, exact(factor)); }
export function maxZero(a) {
  if (isUnknown(a)) return a;
  const [lo,hi]=bounds(a);
  if (hi <= 0) return exact(0);
  if (lo >= 0) return a;
  return range(0, hi);
}
export function sum(values = []) {
  if (!Array.isArray(values) || values.length === 0) return exact(0);
  return add(...values);
}
export function pow(a, exponent) {
  if (isUnknown(a) || !finite(exponent)) return unknown('INVALID_POWER');
  const [lo,hi]=bounds(a);
  if (lo < 0 && !Number.isInteger(exponent)) return unknown('INVALID_POWER_DOMAIN');
  const candidates=[Math.pow(lo, exponent), Math.pow(hi, exponent)];
  return fromBounds(Math.min(...candidates), Math.max(...candidates), [a]);
}
export function withCurrency(value, currency) {
  return Object.freeze({ ...value, currency: currency || null });
}
export function fromFact(fact, fallbackCurrency = null) {
  if (!fact || typeof fact !== 'object') return unknown('MISSING_FACT', { currency: fallbackCurrency });
  const state = String(fact.disclosureState || 'UNKNOWN');
  if (['NOT_YET_PROVIDED','DECLINED_TO_PROVIDE','UNKNOWN'].includes(state) || fact.value == null) {
    return unknown(state, { factId: fact.factId || null, currency: fallbackCurrency });
  }
  const representation = String(fact.valueRepresentation || 'EXACT');
  const raw = fact.value;
  const currency = raw && typeof raw === 'object' && raw.currency ? raw.currency : fallbackCurrency;
  if (representation === 'RANGE') {
    if (raw && finite(raw.min) && finite(raw.max)) return range(raw.min, raw.max, { factId: fact.factId || null, currency });
    return unknown('INVALID_RANGE_FACT', { factId: fact.factId || null, currency });
  }
  const numeric = raw && typeof raw === 'object' && finite(raw.amount) ? raw.amount : raw;
  if (!finite(numeric)) return unknown('NON_NUMERIC_FACT', { factId: fact.factId || null, currency });
  if (representation === 'APPROXIMATE') return approximate(numeric, { factId: fact.factId || null, currency });
  return exact(numeric, { factId: fact.factId || null, currency });
}
