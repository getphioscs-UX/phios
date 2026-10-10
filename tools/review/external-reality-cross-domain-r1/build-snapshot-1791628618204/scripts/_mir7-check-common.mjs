import fs from 'node:fs';import assert from 'node:assert/strict';import crypto from 'node:crypto';
export const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
export const text=p=>fs.readFileSync(p,'utf8');
export const hash=p=>crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
export const stable=v=>{if(v===null||typeof v!=='object')return JSON.stringify(v);if(Array.isArray(v))return `[${v.map(stable).join(',')}]`;return `{${Object.keys(v).sort().map(k=>`${JSON.stringify(k)}:${stable(v[k])}`).join(',')}}`;};
export function fixture(name){return read(`content/interpretation/integration/fixtures/${name}`).fixture;}
export {assert};
