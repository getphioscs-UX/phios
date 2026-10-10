import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { calculateFinancialProjection } from '../../../functions/financial/calculation-runtime/financial-calculation-runtime.js';
import { analyzeFinancialStructure } from '../../../functions/financial/analysis-runtime/financial-analysis-runtime.js';
import { sha256 } from '../../../functions/financial/calculation-runtime/stable-digest.js';
import { composeHolisticFinancialPlan, createHfpRrSubmission, createHfpJourneyHandoff } from '../../../functions/financial/holistic-planning-product/holistic-financial-planning-runtime.js';

export const ROOT=process.cwd();
export const HFP='content/financial/holistic-planning-product';
export function readJson(p){ return JSON.parse(fs.readFileSync(path.join(ROOT,p),'utf8')); }
export function read(p){ return fs.readFileSync(path.join(ROOT,p),'utf8'); }
export function sha256File(p){ return crypto.createHash('sha256').update(fs.readFileSync(path.join(ROOT,p))).digest('hex'); }
export function walk(dir){ const out=[]; for(const e of fs.readdirSync(path.join(ROOT,dir),{withFileTypes:true})){ const p=path.posix.join(dir,e.name); if(e.isDirectory()) out.push(...walk(p)); else out.push(p); } return out.sort(); }
export function allStrings(value,out=[]){ if(typeof value==='string') out.push(value); else if(Array.isArray(value)) value.forEach(v=>allStrings(v,out)); else if(value&&typeof value==='object') Object.values(value).forEach(v=>allStrings(v,out)); return out; }
export function farPolicySet(){ return readJson('content/financial/analysis-runtime/policies/financial-analysis-policy-set-base-v1.json'); }
export function fcrFixture(name){ return readJson(`content/financial/calculation-runtime/fixtures/${name}`); }
export function hfpFixture(name){ return readJson(`${HFP}/fixtures/${name}`); }

async function sourceOutputs(spec){
  const source=fcrFixture(spec.sourceFcrFixture);
  if(spec.scenarioComparison){
    const base=await calculateFinancialProjection(source.calculationInput);
    const stressInput=structuredClone(source.calculationInput);
    stressInput.calculationId=`${source.calculationInput.calculationId}-HFP-STRESS`;
    stressInput.scenarioCode='STRESS';
    stressInput.assumptionSet.assumptionSetId=`${source.calculationInput.assumptionSet.assumptionSetId}-HFP-STRESS`;
    stressInput.assumptionSet.scenarioCode='STRESS';
    stressInput.assumptionSet.sourceLabel='HFP W16 fixture-only upstream scenario';
    const overrides={INVESTMENT_RETURN:0.02,INFLATION:0.04,EPF_RETURN:0.03,SALARY_GROWTH:0.01};
    stressInput.assumptionSet.assumptions=stressInput.assumptionSet.assumptions.map(a=>({...a,assumptionId:`${a.assumptionId}-HFP-STRESS`,value:Object.hasOwn(overrides,a.type)?overrides[a.type]:a.value,sourceLabel:'HFP W16 fixture-only upstream scenario'}));
    delete stressInput.assumptionSet.digest;
    stressInput.assumptionSet.digest=await sha256(stressInput.assumptionSet);
    const stress=await calculateFinancialProjection(stressInput);
    const far=await analyzeFinancialStructure({analysisId:`FAR-HFP-${spec.scenario}`,fcrResult:base,fdrSnapshot:source.calculationInput.fdrSnapshot,analysisPolicySet:farPolicySet(),comparisonResults:[stress]});
    return {source,fcr:base,far,scenarioResults:[stress]};
  }
  if(spec.includeFcr===false) return {source,fcr:null,far:null,scenarioResults:[]};
  const fcr=await calculateFinancialProjection(source.calculationInput);
  const far=spec.includeFar===false?null:await analyzeFinancialStructure({analysisId:`FAR-HFP-${spec.scenario}`,fcrResult:fcr,fdrSnapshot:source.calculationInput.fdrSnapshot,analysisPolicySet:farPolicySet()});
  return {source,fcr,far,scenarioResults:[]};
}

function fixtureProfessionalBundle(spec,far){
  if(!spec.fixturePfr) return {pfrContributions:[],actions:[]};
  const digest='f'.repeat(64); const auth={authorReference:'PROFESSIONAL:FIXTURE:HFP',authoredAt:'2026-08-23T00:00:00.000Z'};
  const findingRef=far?.findings?.[0]?.findingId || 'FAR:FIXTURE:UNKNOWN';
  const items=[
    {contributionId:'PFR-FIX-REC-1',contributionType:'RECOMMENDATION',sourceAuthority:'FIXTURE_PFR',sourceReference:'FIXTURE_PFR:REC:1',sourceDigest:digest,...auth,content:{text:'Fixture-only professional recommendation; not production authority.',objectiveReference:'GOAL:FIXTURE',findingReference:findingRef}},
    {contributionId:'PFR-FIX-SUIT-1',contributionType:'SUITABILITY',sourceAuthority:'FIXTURE_PFR',sourceReference:'FIXTURE_PFR:SUIT:1',sourceDigest:digest,...auth,content:{objectiveReference:'GOAL:FIXTURE',findingReference:findingRef,recommendationReference:'FIXTURE_PFR:REC:1',impactReference:'FIXTURE_PFR:IMPACT:1',experienceReference:'FIXTURE_PFR:EXPERIENCE:1',capacityReference:'FIXTURE_PFR:CAPACITY:1',alternativeReferences:['FIXTURE_PFR:ALT:1'],disadvantageReferences:['FIXTURE_PFR:DIS:1']}},
    {contributionId:'PFR-FIX-ALT-1',contributionType:'ALTERNATIVE',sourceAuthority:'FIXTURE_PFR',sourceReference:'FIXTURE_PFR:ALT:1',sourceDigest:digest,...auth,content:{text:'Fixture-only alternative.'}},
    {contributionId:'PFR-FIX-DIS-1',contributionType:'DISADVANTAGE',sourceAuthority:'FIXTURE_PFR',sourceReference:'FIXTURE_PFR:DIS:1',sourceDigest:digest,...auth,content:{text:'Fixture-only disadvantage.'}},
    {contributionId:'PFR-FIX-WARN-1',contributionType:'WARNING',sourceAuthority:'FIXTURE_PFR',sourceReference:'FIXTURE_PFR:WARN:1',sourceDigest:digest,...auth,content:{text:'Fixture-only professional warning.'}}
  ];
  const actions=[{actionId:'ACTION-FIX-1',owner:'CUSTOMER:FIXTURE',due:'2027-01-31',dependency:'PFR-FIX-REC-1',status:'PROPOSED',relatedGoal:'GOAL:FIXTURE',sourceAuthority:'FIXTURE_PFR',sourceReference:'FIXTURE_PFR:ACTION:1',sourceDigest:digest,professionalSource:{authorReference:auth.authorReference,contributionReference:'PFR-FIX-REC-1'}}];
  return {pfrContributions:items,actions};
}

export async function buildFixtureInput(specName){
  const spec=hfpFixture(specName); const {source,fcr,far,scenarioResults}=await sourceOutputs(spec); const professional=fixtureProfessionalBundle(spec,far);
  return {spec,input:{planCandidateId:`HFP-CANDIDATE-${spec.scenario.toUpperCase().replaceAll('-','_')}`,mode:spec.mode,caseReference:`CASE-${spec.scenario}`,customerReference:`CUSTOMER-${spec.scenario}`,accountReference:`ACCOUNT-${spec.scenario}`,verificationState:spec.verificationState,fixtureMode:spec.fixtureMode===true,fdrSnapshot:source.calculationInput.fdrSnapshot,fcrResult:fcr,farResult:far,scenarioResults,fcrAssumptionSet:fcr?source.calculationInput.assumptionSet:null,farPolicySet:far?farPolicySet():null,pfrContributions:professional.pfrContributions,actions:professional.actions,darEstateState:spec.darEstateState||null,continuity:spec.continuity||null,limitations:[]}};
}
export async function runHfpFixture(specName){ const {spec,input}=await buildFixtureInput(specName); const candidate=await composeHolisticFinancialPlan(input); return {spec,input,candidate}; }
export {composeHolisticFinancialPlan,createHfpRrSubmission,createHfpJourneyHandoff};
