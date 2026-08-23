import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { spawnSync } from 'node:child_process';
import assert from 'node:assert/strict';

export const ROOT=process.cwd();
export const BASELINE_COMMIT='c42784848b3d9e5495d34e5a0d827460a7108a89';
export const MRM='content/runtime-maturity';
export const EM_CODES=Array.from({length:10},(_,i)=>`EM-${i}`);
export const RM_CODES=Array.from({length:10},(_,i)=>`RM-${i}`);
export const abs=p=>path.join(ROOT,p);
export const exists=p=>fs.existsSync(abs(p));
export const json=p=>JSON.parse(fs.readFileSync(abs(p),'utf8'));
export const sha=p=>crypto.createHash('sha256').update(fs.readFileSync(abs(p))).digest('hex');
export const stable=v=>Array.isArray(v)?`[${v.map(stable).join(',')}]`:(v&&typeof v==='object'?`{${Object.keys(v).sort().map(k=>`${JSON.stringify(k)}:${stable(v[k])}`).join(',')}}`:JSON.stringify(v));
export const digest=v=>crypto.createHash('sha256').update(stable(v),'utf8').digest('hex');
export function assertRef(ref,label='REF'){assert.ok(ref&&typeof ref.path==='string',`${label}_MISSING`);assert.ok(exists(ref.path),`${label}_PATH_MISSING:${ref.path}`);assert.equal(sha(ref.path),ref.sha256,`${label}_DIGEST_DRIFT:${ref.path}`);}
export function assertCurrent(doc,label){assert.equal(doc.phase,'MRM-S',`${label}_PHASE`);assert.equal(doc.baselineCommit,BASELINE_COMMIT,`${label}_BASELINE`);}
export function runNode(script){const r=spawnSync(process.execPath,[script],{cwd:ROOT,encoding:'utf8'});assert.equal(r.status,0,`${script}\n${r.stdout}\n${r.stderr}`);return r.stdout.trim();}
export function capabilityKey(x){return `${x.runtimeCode}::${x.capabilityCode}`;}
export function byCapability(records){return new Map(records.map(x=>[capabilityKey(x),x]));}
export function ordinal(code){return Number(String(code).split('-')[1]);}
