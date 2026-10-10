import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { calculateFinancialProjection } from '../../../functions/financial/calculation-runtime/financial-calculation-runtime.js';
import { analyzeFinancialStructure } from '../../../functions/financial/analysis-runtime/financial-analysis-runtime.js';
import { sha256 } from '../../../functions/financial/calculation-runtime/stable-digest.js';
export const ROOT=process.cwd();
export const FAR='content/financial/analysis-runtime';
export function readJson(p){ return JSON.parse(fs.readFileSync(path.join(ROOT,p),'utf8')); }
export function read(p){ return fs.readFileSync(path.join(ROOT,p),'utf8'); }
export function sha256File(p){ return crypto.createHash('sha256').update(fs.readFileSync(path.join(ROOT,p))).digest('hex'); }
export function walk(dir){ const out=[]; for(const e of fs.readdirSync(path.join(ROOT,dir),{withFileTypes:true})){ const p=path.posix.join(dir,e.name); if(e.isDirectory()) out.push(...walk(p)); else out.push(p); } return out.sort(); }
export function strings(value,out=[]){ if(typeof value==='string') out.push(value); else if(Array.isArray(value)) value.forEach(v=>strings(v,out)); else if(value&&typeof value==='object') Object.values(value).forEach(v=>strings(v,out)); return out; }
export function policySet(){ return readJson(`${FAR}/policies/financial-analysis-policy-set-base-v1.json`); }
export function fcrFixture(name){ return readJson(`content/financial/calculation-runtime/fixtures/${name}`); }
export async function runSourceFixture(sourceFcrFixture, analysisId='FAR-CHECK'){
  const source=fcrFixture(sourceFcrFixture); const fcr=await calculateFinancialProjection(source.calculationInput);
  const far=await analyzeFinancialStructure({analysisId,fcrResult:fcr,fdrSnapshot:source.calculationInput.fdrSnapshot,analysisPolicySet:policySet()});
  return {source,fcr,far};
}
function mutateFact(node,target,change){
  if(!node||typeof node!=='object') return false;
  if(node.factId===target){ Object.assign(node,change); return true; }
  for(const v of Object.values(node)) if(mutateFact(v,target,change)) return true;
  return false;
}
export async function runContradictoryFixture(){
  const spec=readJson(`${FAR}/fixtures/contradictory.json`); const source=fcrFixture(spec.sourceFcrFixture); const input=structuredClone(source.calculationInput); const m=spec.mutationForFixture;
  if(!mutateFact(input.fdrSnapshot.snapshotPayload,m.targetFactId,{disclosureState:m.setDisclosureState,value:m.setValue,valueRepresentation:m.setValueRepresentation})) throw new Error('Contradiction fixture target fact missing.');
  const snap=structuredClone(input.fdrSnapshot); delete snap.digest; input.fdrSnapshot.digest=await sha256(snap); input.calculationId='CALC-FAR-CONTRADICTION';
  const fcr=await calculateFinancialProjection(input); const far=await analyzeFinancialStructure({analysisId:'FAR-CONTRADICTION',fcrResult:fcr,fdrSnapshot:input.fdrSnapshot,analysisPolicySet:policySet()}); return {source:{calculationInput:input},fcr,far};
}
export async function runScenarioFixture(){
  const spec=readJson(`${FAR}/fixtures/scenario-sensitivity.json`); const source=fcrFixture(spec.sourceFcrFixture); const base=await calculateFinancialProjection(source.calculationInput);
  const stressInput=structuredClone(source.calculationInput); stressInput.calculationId='CALC-FAR-STRESS'; stressInput.scenarioCode='STRESS'; stressInput.assumptionSet.assumptionSetId='FAR-AS-STRESS-v1'; stressInput.assumptionSet.scenarioCode='STRESS'; stressInput.assumptionSet.sourceLabel='FAR W15 synthetic comparison fixture';
  stressInput.assumptionSet.assumptions=stressInput.assumptionSet.assumptions.map(a=>({...a,assumptionId:`${a.assumptionId}-FAR-STRESS`,value:Object.hasOwn(spec.stressAssumptionOverrides,a.type)?spec.stressAssumptionOverrides[a.type]:a.value,sourceLabel:'FAR W15 synthetic comparison fixture'}));
  delete stressInput.assumptionSet.digest; stressInput.assumptionSet.digest=await sha256(stressInput.assumptionSet); const stress=await calculateFinancialProjection(stressInput);
  const far=await analyzeFinancialStructure({analysisId:'FAR-SCENARIO-SENSITIVITY',fcrResult:base,fdrSnapshot:source.calculationInput.fdrSnapshot,analysisPolicySet:policySet(),comparisonResults:[stress]}); return {source,fcr:base,stress,far};
}
export async function runFarFixture(specName){
  if(specName==='contradictory.json') return runContradictoryFixture(); if(specName==='scenario-sensitivity.json') return runScenarioFixture();
  const spec=readJson(`${FAR}/fixtures/${specName}`); return runSourceFixture(spec.sourceFcrFixture,`FAR-${spec.scenario}`);
}
