import { createHash } from 'node:crypto';

export const EARTHLY_BRANCHES = ['ZI','CHOU','YIN','MAO','CHEN','SI','WU','WEI','SHEN','YOU','XU','HAI'];
export const YIN_WHEEL = ['YIN','MAO','CHEN','SI','WU','WEI','SHEN','YOU','XU','HAI','ZI','CHOU'];
export const HEAVENLY_STEMS = ['JIA','YI','BING','DING','WU','JI','GENG','XIN','REN','GUI'];

export function mod(n, m = 12) { return ((n % m) + m) % m; }
export function branchIndex(code) {
  const i = EARTHLY_BRANCHES.indexOf(code);
  if (i < 0) throw Object.assign(new Error(`Unknown earthly branch: ${code}`), { code: 'ZWR_UNKNOWN_BRANCH' });
  return i;
}
export function yinWheelIndex(code) {
  const i = YIN_WHEEL.indexOf(code);
  if (i < 0) throw Object.assign(new Error(`Unknown Yin-wheel branch: ${code}`), { code: 'ZWR_UNKNOWN_BRANCH' });
  return i;
}
export function stableStringify(v) {
  if (v === null || typeof v !== 'object') return JSON.stringify(v);
  if (Array.isArray(v)) return `[${v.map(stableStringify).join(',')}]`;
  return `{${Object.keys(v).sort().map(k => `${JSON.stringify(k)}:${stableStringify(v[k])}`).join(',')}}`;
}
export function sha256Stable(v) { return createHash('sha256').update(stableStringify(v)).digest('hex'); }
export function clone(v) { return JSON.parse(JSON.stringify(v)); }
export function assertIsoDate(s) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(s || ''))) throw Object.assign(new Error('birthDate must be YYYY-MM-DD'), { code: 'ZWR_INVALID_BIRTH_DATE' });
  const [y,m,d] = s.split('-').map(Number);
  const dt = new Date(Date.UTC(y,m-1,d));
  if (dt.getUTCFullYear()!==y || dt.getUTCMonth()+1!==m || dt.getUTCDate()!==d) throw Object.assign(new Error('Invalid Gregorian date'), { code: 'ZWR_INVALID_BIRTH_DATE' });
  return {y,m,d};
}
export function assertTime(s) {
  if (!/^\d{2}:\d{2}:\d{2}$/.test(String(s || ''))) throw Object.assign(new Error('birthTime must be HH:mm:ss'), { code: 'ZWR_INVALID_BIRTH_TIME' });
  const [h,m,sec]=s.split(':').map(Number);
  if(h>23||m>59||sec>59) throw Object.assign(new Error('Invalid birth time'), { code: 'ZWR_INVALID_BIRTH_TIME' });
  return {h,m,sec};
}
export function addCivilDays(dateStr, days) {
  const {y,m,d}=assertIsoDate(dateStr);
  const dt=new Date(Date.UTC(y,m-1,d+days));
  return `${dt.getUTCFullYear().toString().padStart(4,'0')}-${String(dt.getUTCMonth()+1).padStart(2,'0')}-${String(dt.getUTCDate()).padStart(2,'0')}`;
}
