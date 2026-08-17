const MAX_DEPTHS=new Set(['SHORT','STANDARD','DETAILED','PROFESSIONAL']);
export function stableStringify(v){if(v===null||typeof v!=='object')return JSON.stringify(v);if(Array.isArray(v))return `[${v.map(stableStringify).join(',')}]`;return `{${Object.keys(v).sort().map(k=>`${JSON.stringify(k)}:${stableStringify(v[k])}`).join(',')}}`;}
export function clone(v){return v===undefined?undefined:structuredClone(v);}
export function deepFreeze(v){if(v&&typeof v==='object'&&!Object.isFrozen(v)){Object.freeze(v);for(const x of Object.values(v))deepFreeze(x);}return v;}
export function uniq(xs){return [...new Set((xs||[]).filter(x=>x!==null&&x!==undefined&&x!==''))];}
export function assertDepth(d){if(!MAX_DEPTHS.has(d))throw new TypeError(`INVALID_INTERPRETATION_DEPTH:${d}`);return d;}
export function assertLocale(l){if(!['zh-Hans','en'].includes(l))throw new TypeError(`INVALID_INTERPRETATION_LOCALE:${l}`);return l;}
export async function sha256Stable(v){const text=typeof v==='string'?v:stableStringify(v);const bytes=new TextEncoder().encode(text);if(globalThis.crypto?.subtle){const b=await globalThis.crypto.subtle.digest('SHA-256',bytes);return [...new Uint8Array(b)].map(x=>x.toString(16).padStart(2,'0')).join('');}const {createHash}=await import('node:crypto');return createHash('sha256').update(bytes).digest('hex');}
