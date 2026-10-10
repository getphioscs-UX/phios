import assert from 'node:assert/strict';
import fs from 'node:fs';
export const BASELINE='402735ec373fba021235187312e4f526ba919807';
export const ROOT='content/professional/method-full-production-recovery';
export const readJson=p=>JSON.parse(fs.readFileSync(p,'utf8'));
export const filePart=ref=>String(ref||'').split('#')[0];
export const assertRefExists=(ref,label='reference')=>{const p=filePart(ref);if(!/^(?:content|functions|scripts)\//.test(p))return;assert.ok(fs.existsSync(p),`${label} missing: ${ref}`)};
export const list=v=>Array.isArray(v)?v:[];
export function benchmarkGapIndex(){
 const out=new Map();
 for(const [methodId,slug] of Object.entries({AST:'ast',BZR:'bzr',ZWR:'zwr',NUM:'num',ECR:'ecr'})){
  const path=`content/customer-experience-rebuild/r12r4b/smr/benchmark/smr-${slug}-benchmark-v1-evidence.json`;
  const j=readJson(path);
  for(const g of list(j.upstreamGapTickets))out.set(g.gapCode,{...g,methodId,path,caseId:j.caseId});
 }
 return out;
}
export function assertCoreRefSet(obj){
 const visit=x=>{if(Array.isArray(x)){x.forEach(visit);return}if(!x||typeof x!=='object')return;for(const [k,v] of Object.entries(x)){if(k.endsWith('Ref')&&typeof v==='string')assertRefExists(v,k);if(k.endsWith('Refs')&&Array.isArray(v))v.forEach(r=>typeof r==='string'&&assertRefExists(r,k));visit(v)}};visit(obj);
}
