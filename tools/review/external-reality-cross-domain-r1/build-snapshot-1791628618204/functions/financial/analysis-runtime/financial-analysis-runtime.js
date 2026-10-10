/** PHI OS FAR v1 — canonical financial analysis runtime.
 * Consumes canonical FCR results and linked FDR evidence metadata only.
 * It does not create new financial projections or action direction.
 */
import { sha256 } from '../calculation-runtime/stable-digest.js';

export const FAR_RUNTIME_CODE = 'FINANCIAL_ANALYSIS_RUNTIME';
export const FAR_RUNTIME_VERSION = '1.0.0';
const FCR_RUNTIME_CODE = 'FINANCIAL_CALCULATION_RUNTIME';
const FINDING_TYPES = new Set(['STRENGTH','GAP','CONCENTRATION','EXPOSURE','DEPENDENCY','MISMATCH','SHORTFALL','SURPLUS','TREND','SCENARIO_SENSITIVITY','MISSING_EVIDENCE','CONTRADICTION','UNKNOWN']);
const UNKNOWN_DISCLOSURE = new Set(['NOT_YET_PROVIDED','DECLINED_TO_PROVIDE','UNKNOWN']);
const BLOCKED_TEXT = [
  /\brecommend\b/i,
  /\bshould\s+buy\b/i,
  /\bmust\s+invest\b/i,
  /\bchoose\s+(?:an?\s+)?provider\b/i,
  /\bestablish\s+(?:an?\s+)?trust\b/i,
  /\btransfer\s+property\b/i,
  /\bpurchase\s+insurance\b/i
];

function text(v){ return typeof v === 'string' ? v.trim() : ''; }
function required(v,name){ const x=text(v); if(!x) throw new TypeError(`${name} is required.`); return x; }
function arr(v){ return Array.isArray(v)?v:[]; }
function uniq(v){ return [...new Set(arr(v).flat(Infinity).filter(Boolean).map(String))]; }
function finite(v){ return typeof v === 'number' && Number.isFinite(v); }
function isUnknown(v){ return !v || v.kind === 'UNKNOWN'; }
function bounds(v){ if(isUnknown(v)) return null; if(v.kind==='RANGE') return [v.min,v.max]; return [v.value,v.value]; }
function ref(calc,engine,metric){ return `${calc.calculationId}:${engine}:${metric}`; }
function metric(calc,engine,code){ return calc?.engines?.[engine]?.metrics?.[code] || null; }
function policyIndex(set){ const m=new Map(); for(const p of arr(set?.thresholds)){ if(!p.policyId||!p.code||!finite(p.value)||!p.unit) throw new TypeError('Invalid FAR policy threshold.'); m.set(p.code,Object.freeze({...p})); } return m; }
function policy(idx,code){ const p=idx.get(code); if(!p) throw new TypeError(`Missing FAR policy threshold: ${code}`); return p; }
function above(v,t){ const b=bounds(v); if(!b) return 'UNKNOWN'; if(b[0]>t) return 'YES'; if(b[1]<=t) return 'NO'; return 'INDETERMINATE'; }
function below(v,t){ const b=bounds(v); if(!b) return 'UNKNOWN'; if(b[1]<t) return 'YES'; if(b[0]>=t) return 'NO'; return 'INDETERMINATE'; }
function positive(v,t=0){ return above(v,t); }
function zeroOrBelow(v,t=0){ const b=bounds(v); if(!b) return 'UNKNOWN'; if(b[1]<=t) return 'YES'; if(b[0]>t) return 'NO'; return 'INDETERMINATE'; }
function collectFacts(node,map=new Map()){
  if(!node || typeof node!=='object') return map;
  if(typeof node.factId==='string') map.set(node.factId,node);
  if(Array.isArray(node)) node.forEach(x=>collectFacts(x,map)); else Object.values(node).forEach(x=>collectFacts(x,map));
  return map;
}
function findContradictions(node,out=[]){
  if(!node || typeof node!=='object') return out;
  if(typeof node.factId==='string'){
    const state=String(node.disclosureState||'UNKNOWN'); const hasValue=node.value!==null && node.value!==undefined;
    if((UNKNOWN_DISCLOSURE.has(state)&&hasValue) || (!UNKNOWN_DISCLOSURE.has(state)&&state!=='NOT_APPLICABLE'&&!hasValue)) out.push(node.factId);
  }
  if(Array.isArray(node)) node.forEach(x=>findContradictions(x,out)); else Object.values(node).forEach(x=>findContradictions(x,out));
  return out;
}
function metricFacts(m,factIndex){ return uniq(m?.trace?.inputReferences||[]).filter(id=>factIndex.has(id)); }
function metricAssumptions(m){ return uniq(m?.trace?.assumptionReferences||[]); }
function evidenceState(facts){
  if(!facts.length) return 'NO_DIRECT_FACT_EVIDENCE';
  if(facts.some(f=>UNKNOWN_DISCLOSURE.has(String(f?.disclosureState||'UNKNOWN')))) return 'INCOMPLETE';
  const docs=facts.filter(f=>f?.disclosureState==='DOCUMENT_VERIFIED' || f?.evidence?.documentReference).length;
  if(docs===facts.length) return 'DOCUMENT_VERIFIED';
  if(docs>0) return 'MIXED';
  return 'SELF_REPORTED_OR_UNVERIFIED';
}
function confidenceFor(metrics,factIndex,explicitFactReferences=[]){
  const ms=arr(metrics).filter(Boolean); const kinds=ms.map(m=>m.value?.kind||'UNKNOWN');
  let score=0.9;
  if(kinds.includes('UNKNOWN')) score=0.2; else if(kinds.includes('RANGE')) score=Math.min(score,0.6); else if(kinds.includes('APPROXIMATE')) score=Math.min(score,0.75);
  const facts=uniq([...ms.flatMap(m=>metricFacts(m,factIndex)),...arr(explicitFactReferences)]).map(id=>factIndex.get(id)).filter(Boolean);
  if(facts.length){
    const ev=facts.map(f=>finite(f?.evidence?.confidence)?f.evidence.confidence:0.4);
    score=Math.min(score,Math.min(...ev));
    if(facts.every(f=>f?.disclosureState==='DOCUMENT_VERIFIED'||f?.evidence?.documentReference) && !kinds.includes('UNKNOWN') && !kinds.includes('RANGE')) score=Math.min(1,score+0.05);
  }
  score=Math.round(score*1000)/1000;
  return {state:score>=0.8?'HIGH':score>=0.55?'MEDIUM':'LOW',score,basis:{valueKinds:uniq(kinds),factCount:facts.length,evidenceState:evidenceState(facts)}};
}
function assertNoActionText(value){ for(const r of BLOCKED_TEXT) if(r.test(String(value||''))) throw new TypeError('FAR_ACTION_DIRECTION_BLOCKED'); }
function makeFinding(ctx,spec){
  if(!FINDING_TYPES.has(spec.findingType)) throw new TypeError(`Unknown FAR finding type: ${spec.findingType}`);
  const ms=arr(spec.metrics).filter(Boolean); const factRefs=uniq(spec.factReferences||ms.flatMap(m=>metricFacts(m,ctx.factIndex)));
  const assumptionRefs=uniq(spec.assumptionReferences||ms.flatMap(metricAssumptions));
  const calcRefs=uniq(spec.sourceCalculationReferences||ms.map(m=>ref(ctx.primary,spec.engineCode||m.trace?.engineCode||'UNKNOWN',m.resultCode)));
  const traces=uniq(ms.map(m=>m.traceId)); const limitations=uniq(spec.limitations||[]); const summary=required(spec.summary,'finding.summary');
  assertNoActionText(summary); limitations.forEach(assertNoActionText);
  const confidence=confidenceFor(ms,ctx.factIndex,factRefs);
  return Object.freeze({
    findingId:`FAR-${String(++ctx.sequence).padStart(4,'0')}-${spec.findingCode}`,
    findingCode:spec.findingCode,findingType:spec.findingType,domain:spec.domain,
    sourceCalculationReferences:calcRefs,factReferences:factRefs,assumptionReferences:assumptionRefs,
    severityState:spec.severityState||'UNSPECIFIED',confidence,evidenceState:confidence.basis.evidenceState,
    limitations,policyReferences:uniq(spec.policyReferences||[]),summary,
    provenance:{fcrResultDigest:ctx.primary.resultDigest,calculationReferences:calcRefs,fcrTraceReferences:traces,fdrSnapshotId:ctx.snapshot.snapshotId,fdrDigest:ctx.snapshot.digest,comparisonResultDigests:ctx.comparisons.map(x=>x.resultDigest).sort(),factReferences:factRefs,assumptionReferences:assumptionRefs}
  });
}
function add(ctx,findings,spec){ findings.push(makeFinding(ctx,spec)); }
function addUnknownByEngine(ctx,findings){
  for(const [engineCode,engine] of Object.entries(ctx.primary.engines||{})){
    const unknowns=Object.values(engine.metrics||{}).filter(m=>isUnknown(m.value));
    if(!unknowns.length) continue;
    add(ctx,findings,{findingCode:'MISSING_CALCULATION_EVIDENCE',findingType:'MISSING_EVIDENCE',domain:'DISCLOSURE_EVIDENCE',engineCode,metrics:unknowns,
      summary:`${engineCode} contains unavailable calculation output because required facts or assumptions are incomplete.`,
      limitations:uniq(unknowns.map(m=>m.value?.reason||'UNKNOWN_INPUT'))});
  }
}
function scenarioSensitivity(ctx,findings){
  if(!ctx.comparisons.length) return;
  const base=[ctx.primary,...ctx.comparisons].find(x=>x.scenarioCode==='BASE');
  if(!base) return;
  for(const other of [ctx.primary,...ctx.comparisons].filter(x=>x!==base)){
    const threshold=policy(ctx.policies,'SCENARIO_SENSITIVITY_RELATIVE_CHANGE');
    for(const [engineCode,metricCode,findingCode,domain] of [['RETIREMENT','shortfall','RETIREMENT_SCENARIO_SENSITIVITY','RETIREMENT'],['EDUCATION_FUNDING','fundingGap','SCENARIO_OUTCOME_SENSITIVITY','SCENARIO'],['ESTATE_LIQUIDITY','estimatedLiquidityGap','SCENARIO_OUTCOME_SENSITIVITY','SCENARIO']]){
      const a=metric(base,engineCode,metricCode), b=metric(other,engineCode,metricCode); if(!a||!b||isUnknown(a.value)||isUnknown(b.value)) continue;
      const ab=bounds(a.value), bb=bounds(b.value); if(!ab||!bb) continue;
      const baseMag=Math.max(Math.abs(ab[0]),Math.abs(ab[1])); const delta=Math.max(Math.abs(bb[0]-ab[0]),Math.abs(bb[1]-ab[1]));
      if(baseMag===0 ? delta>0 : delta/baseMag>threshold.value){
        const ms=[a,b]; const calcRefs=[ref(base,engineCode,metricCode),ref(other,engineCode,metricCode)];
        add(ctx,findings,{findingCode,findingType:'SCENARIO_SENSITIVITY',domain,metrics:ms,engineCode,sourceCalculationReferences:calcRefs,policyReferences:[threshold.policyId],
          summary:`${metricCode} changes materially across the compared ${base.scenarioCode} and ${other.scenarioCode} calculation scenarios.`,
          limitations:['Sensitivity classification compares existing FCR outcomes only; no new financial projection is created.']});
      }
    }
  }
}

export async function validateAnalysisPolicySet(set){
  required(set?.policySetId,'analysisPolicySet.policySetId'); required(set?.version,'analysisPolicySet.version'); required(set?.effectiveDate,'analysisPolicySet.effectiveDate'); required(set?.sourceLabel,'analysisPolicySet.sourceLabel'); policyIndex(set);
  if(!/^[a-f0-9]{64}$/.test(String(set.digest||''))) throw new TypeError('FAR_POLICY_DIGEST_REQUIRED');
  const clone=structuredClone(set); delete clone.digest; const digest=await sha256(clone); if(digest!==set.digest) throw new TypeError('FAR_POLICY_DIGEST_MISMATCH');
  return Object.freeze({...set});
}
function validateFcrResult(r){
  if(r?.runtimeCode!==FCR_RUNTIME_CODE || !/^[a-f0-9]{64}$/.test(String(r?.resultDigest||'')) || !/^[a-f0-9]{64}$/.test(String(r?.fdrDigest||''))) throw new TypeError('FAR_REQUIRES_CANONICAL_FCR_RESULT');
  if(r.analysisCreated||r.adviceCreated||r.professionalJudgmentCreated||r.recommendationCreated) throw new TypeError('FCR_RESULT_BOUNDARY_VIOLATION');
  return r;
}

export async function analyzeFinancialStructure(input={}){
  const analysisId=required(input.analysisId,'analysisId'); const primary=validateFcrResult(input.fcrResult);
  const snapshot=input.fdrSnapshot; if(!snapshot?.snapshotId||!snapshot?.digest||!snapshot?.snapshotPayload) throw new TypeError('FAR requires linked immutable FDR snapshot.');
  if(snapshot.digest!==primary.fdrDigest || snapshot.snapshotId!==primary.fdrSnapshotId) throw new TypeError('FAR_FDR_FCR_LINEAGE_MISMATCH');
  const policySet=await validateAnalysisPolicySet(input.analysisPolicySet); const snapshotDate=Date.parse(`${snapshot.snapshotPayload.asOfDate}T23:59:59Z`); if(Date.parse(`${policySet.effectiveDate}T00:00:00Z`)>snapshotDate) throw new TypeError('FAR_POLICY_NOT_EFFECTIVE');
  const comparisons=arr(input.comparisonResults).map(validateFcrResult); for(const r of comparisons) if(r.fdrDigest!==primary.fdrDigest) throw new TypeError('FAR_SCENARIO_FDR_MISMATCH');
  const ctx={analysisId,primary,snapshot,policySet,policies:policyIndex(policySet),comparisons,factIndex:collectFacts(snapshot.snapshotPayload),sequence:0}; const findings=[];

  // W3 Liquidity
  { const m=metric(primary,'LIQUIDITY','monthsOfExpenses'); if(m){ const low=policy(ctx.policies,'LIQUIDITY_LOW_MONTHS'), strong=policy(ctx.policies,'LIQUIDITY_STRONG_MONTHS');
    if(below(m.value,low.value)==='YES') add(ctx,findings,{findingCode:'LOW_LIQUIDITY_RELATIVE_TO_EXPENSES',findingType:'GAP',domain:'LIQUIDITY',engineCode:'LIQUIDITY',metrics:[m],policyReferences:[low.policyId],summary:'Liquidity coverage is below the versioned analysis threshold relative to current expenses.'});
    else if(above(m.value,strong.value)==='YES') add(ctx,findings,{findingCode:'LIQUIDITY_STRENGTH',findingType:'STRENGTH',domain:'LIQUIDITY',engineCode:'LIQUIDITY',metrics:[m],policyReferences:[strong.policyId],summary:'Liquidity coverage exceeds the versioned strength threshold relative to current expenses.'}); }}
  // W4 Cash flow
  { const d=metric(primary,'CASH_FLOW','deficit'), s=metric(primary,'CASH_FLOW','surplus'); if(d&&positive(d.value,0)==='YES') add(ctx,findings,{findingCode:'CASH_FLOW_DEFICIT',findingType:'GAP',domain:'CASH_FLOW',engineCode:'CASH_FLOW',metrics:[d],summary:'Current calculated cash flow is in deficit.'}); else if(s&&positive(s.value,0)==='YES') add(ctx,findings,{findingCode:'CASH_FLOW_SURPLUS',findingType:'SURPLUS',domain:'CASH_FLOW',engineCode:'CASH_FLOW',metrics:[s],summary:'Current calculated cash flow is in surplus.'}); }
  // W5 Debt
  { const dsr=metric(primary,'DEBT','debtServiceRatio'), lev=metric(primary,'DEBT','debtToAsset'); const p1=policy(ctx.policies,'DEBT_SERVICE_HIGH_RATIO'),p2=policy(ctx.policies,'LEVERAGE_HIGH_RATIO');
    if(dsr&&above(dsr.value,p1.value)==='YES') add(ctx,findings,{findingCode:'HIGH_DEBT_SERVICE',findingType:'EXPOSURE',domain:'DEBT',engineCode:'DEBT',metrics:[dsr],policyReferences:[p1.policyId],summary:'Debt service exceeds the versioned analysis threshold relative to calculated income.'});
    if(lev&&above(lev.value,p2.value)==='YES') add(ctx,findings,{findingCode:'HIGH_LEVERAGE',findingType:'EXPOSURE',domain:'DEBT',engineCode:'DEBT',metrics:[lev],policyReferences:[p2.policyId],summary:'Calculated leverage exceeds the versioned debt-to-asset analysis threshold.'}); }
  // W6 Guarantee
  { const g=metric(primary,'CONTINGENT_EXPOSURE','exposure'); if(g&&positive(g.value,0)==='YES') { add(ctx,findings,{findingCode:'GUARANTEE_EXPOSURE_PRESENT',findingType:'EXPOSURE',domain:'GUARANTEE',engineCode:'CONTINGENT_EXPOSURE',metrics:[g],summary:'Structured contingent guarantee exposure is present in the calculation result.'}); const dep=metric(primary,'BUSINESS_WEALTH','familyWealthDependency'), conc=metric(primary,'BUSINESS_WEALTH','businessConcentration'); const pd=policy(ctx.policies,'BUSINESS_DEPENDENCY_HIGH_RATIO'), pc=policy(ctx.policies,'BUSINESS_CONCENTRATION_HIGH_RATIO'); if((dep&&above(dep.value,pd.value)==='YES')||(conc&&above(conc.value,pc.value)==='YES')) add(ctx,findings,{findingCode:'BUSINESS_LIABILITY_DEPENDENCY',findingType:'DEPENDENCY',domain:'GUARANTEE',engineCode:'CONTINGENT_EXPOSURE',metrics:[g,dep,conc].filter(Boolean),policyReferences:[pd.policyId,pc.policyId],summary:'Contingent guarantee exposure coexists with material business-linked household dependency or concentration.'}); } }
  // W7 Concentration
  { const b=metric(primary,'BUSINESS_WEALTH','businessConcentration'), p=metric(primary,'ALLOCATION','propertyPercent'), c=metric(primary,'ALLOCATION','cashPercent'); const pb=policy(ctx.policies,'BUSINESS_CONCENTRATION_HIGH_RATIO'),pp=policy(ctx.policies,'PROPERTY_CONCENTRATION_HIGH_PERCENT'),pc=policy(ctx.policies,'LIQUIDITY_ALLOCATION_LOW_PERCENT');
    if(b&&above(b.value,pb.value)==='YES') add(ctx,findings,{findingCode:'BUSINESS_CONCENTRATION',findingType:'CONCENTRATION',domain:'ASSET_CONCENTRATION',engineCode:'BUSINESS_WEALTH',metrics:[b],policyReferences:[pb.policyId],summary:'Business wealth concentration exceeds the versioned analysis threshold.'});
    if(p&&above(p.value,pp.value)==='YES') add(ctx,findings,{findingCode:'PROPERTY_CONCENTRATION',findingType:'CONCENTRATION',domain:'ASSET_CONCENTRATION',engineCode:'ALLOCATION',metrics:[p],policyReferences:[pp.policyId],summary:'Property allocation exceeds the versioned concentration threshold.'});
    if(c&&below(c.value,pc.value)==='YES') add(ctx,findings,{findingCode:'LOW_LIQUIDITY_CONCENTRATION',findingType:'CONCENTRATION',domain:'ASSET_CONCENTRATION',engineCode:'ALLOCATION',metrics:[c],policyReferences:[pc.policyId],summary:'Cash allocation is below the versioned liquidity-allocation threshold.'}); }
  // W8 Currency / jurisdiction
  { const fx=Object.values(primary?.engines?.CURRENCY?.metrics||{}).filter(m=>!m.resultCode.includes(`${primary.baseCurrency}_${primary.baseCurrency}`)); if(fx.length) add(ctx,findings,{findingCode:'MULTI_CURRENCY_EXPOSURE',findingType:'EXPOSURE',domain:'CURRENCY_JURISDICTION',engineCode:'CURRENCY',metrics:fx,summary:'The financial calculation includes one or more non-base-currency exposures.'});
    const assets=arr(snapshot.snapshotPayload.assets); if(assets.some(a=>a.assetType==='FOREIGN_ASSET') || new Set(assets.map(a=>a.jurisdiction).filter(Boolean)).size>1) add(ctx,findings,{findingCode:'CROSS_BORDER_ASSET_COMPLEXITY',findingType:'MISMATCH',domain:'CURRENCY_JURISDICTION',metrics:fx.length?fx:[metric(primary,'NET_WORTH','grossAssets')].filter(Boolean),factReferences:uniq(assets.flatMap(a=>[a.valueFact?.factId])),summary:'The disclosed asset structure includes cross-border or foreign-asset characteristics.',limitations:['This is structural classification only; no legal or tax conclusion is created.']}); }
  // W9 Protection
  { const g=metric(primary,'PROTECTION_NEED','coverageGap'); if(g){ const p=policy(ctx.policies,'FUNDING_GAP_TOLERANCE'); const state=positive(g.value,p.value); if(state==='YES') add(ctx,findings,{findingCode:'PROTECTION_UNDERFUNDED',findingType:'SHORTFALL',domain:'PROTECTION',engineCode:'PROTECTION_NEED',metrics:[g],policyReferences:[p.policyId],summary:'Calculated protection coverage is below the need estimate under the current assumptions.'}); else if(zeroOrBelow(g.value,p.value)==='YES') add(ctx,findings,{findingCode:'PROTECTION_ADEQUATE_BY_CURRENT_ASSUMPTIONS',findingType:'STRENGTH',domain:'PROTECTION',engineCode:'PROTECTION_NEED',metrics:[g],policyReferences:[p.policyId],summary:'Calculated protection coverage meets the need estimate under the current assumptions.'}); else if(isUnknown(g.value)) add(ctx,findings,{findingCode:'PROTECTION_UNKNOWN',findingType:'UNKNOWN',domain:'PROTECTION',engineCode:'PROTECTION_NEED',metrics:[g],summary:'Protection sufficiency cannot be classified from the current calculation output.'}); }}
  // W10 Retirement
  { const g=metric(primary,'RETIREMENT','shortfall'); if(g){ const p=policy(ctx.policies,'FUNDING_GAP_TOLERANCE'); if(positive(g.value,p.value)==='YES') { add(ctx,findings,{findingCode:'RETIREMENT_FUNDING_GAP',findingType:'SHORTFALL',domain:'RETIREMENT',engineCode:'RETIREMENT',metrics:[g],policyReferences:[p.policyId],summary:'The retirement calculation contains a funding shortfall under the current assumptions.'}); const dep=metric(primary,'BUSINESS_WEALTH','familyWealthDependency'), pd=policy(ctx.policies,'BUSINESS_DEPENDENCY_HIGH_RATIO'); if(dep&&above(dep.value,pd.value)==='YES') add(ctx,findings,{findingCode:'RETIREMENT_BUSINESS_DEPENDENCY',findingType:'DEPENDENCY',domain:'RETIREMENT',engineCode:'RETIREMENT',metrics:[g,dep],policyReferences:[pd.policyId],summary:'The retirement funding shortfall coexists with material household dependence on business-derived income.'}); const retirementGoals=arr(snapshot.snapshotPayload.goals).filter(x=>x.goalType==='RETIREMENT'); if(retirementGoals.some(x=>String(x.fundingSource||'').toUpperCase()==='INHERITANCE')) add(ctx,findings,{findingCode:'RETIREMENT_INHERITANCE_DEPENDENCY',findingType:'DEPENDENCY',domain:'RETIREMENT',engineCode:'RETIREMENT',metrics:[g],factReferences:uniq(retirementGoals.flatMap(x=>[x.target?.factId,x.fundingSource?.factId])),summary:'The disclosed retirement funding structure explicitly identifies inheritance as a funding source.',limitations:['This finding reflects the disclosed funding source only; no inheritance availability is presumed.']}); } }}
  // W11 Education
  { const g=metric(primary,'EDUCATION_FUNDING','fundingGap'); if(g){ const p=policy(ctx.policies,'FUNDING_GAP_TOLERANCE'); if(positive(g.value,p.value)==='YES') add(ctx,findings,{findingCode:'EDUCATION_FUNDING_GAP',findingType:'SHORTFALL',domain:'EDUCATION',engineCode:'EDUCATION_FUNDING',metrics:[g],policyReferences:[p.policyId],summary:'The education funding calculation contains a shortfall under the current assumptions.'}); else if(zeroOrBelow(g.value,p.value)==='YES') add(ctx,findings,{findingCode:'EDUCATION_FUNDED_BY_CURRENT_ASSUMPTIONS',findingType:'STRENGTH',domain:'EDUCATION',engineCode:'EDUCATION_FUNDING',metrics:[g],policyReferences:[p.policyId],summary:'The education funding calculation is fully covered under the current assumptions.'}); }}
  // W12 Estate
  { const g=metric(primary,'ESTATE_LIQUIDITY','estimatedLiquidityGap'); if(g){ const p=policy(ctx.policies,'FUNDING_GAP_TOLERANCE'); if(positive(g.value,p.value)==='YES') add(ctx,findings,{findingCode:'ESTATE_LIQUIDITY_SHORTFALL',findingType:'SHORTFALL',domain:'ESTATE',engineCode:'ESTATE_LIQUIDITY',metrics:[g],policyReferences:[p.policyId],summary:'The estate liquidity calculation contains an estimated shortfall under the current assumptions.',limitations:['No conclusion about legal validity, transfer mechanism or distribution is created.']}); }
    const policies=arr(snapshot.snapshotPayload.policies); if(policies.some(p=>['UNKNOWN','NOT_YET_PROVIDED',null,undefined].includes(p.nominationStatus))) add(ctx,findings,{findingCode:'NOMINATION_UNKNOWN',findingType:'MISSING_EVIDENCE',domain:'ESTATE',metrics:[g].filter(Boolean),summary:'One or more disclosed policy nomination facts are unknown.',limitations:['Nomination status is treated as a fact only.']}); const assets=arr(snapshot.snapshotPayload.assets); const modes=new Set(assets.map(a=>a?.ownership?.ownershipMode).filter(Boolean)); if(assets.some(a=>a.assetType==='FOREIGN_ASSET')||new Set(assets.map(a=>a.jurisdiction).filter(Boolean)).size>1||[...modes].some(m=>['JOINT','JOINT_EITHER','JOINT_BOTH','TENANCY_SHARE','COMPANY_OWNED','TRUST_OWNED'].includes(m))) add(ctx,findings,{findingCode:'ASSET_TRANSFER_COMPLEXITY',findingType:'MISMATCH',domain:'ESTATE',metrics:[g].filter(Boolean),factReferences:uniq(assets.map(a=>a.valueFact?.factId)),summary:'The disclosed estate asset structure includes cross-border or non-sole ownership characteristics.',limitations:['This is structural classification only; no transfer or legal conclusion is created.']}); }
  // W13 Business continuity
  { const dep=metric(primary,'BUSINESS_WEALTH','familyWealthDependency'), div=metric(primary,'BUSINESS_WEALTH','dividendContribution'); const p=policy(ctx.policies,'BUSINESS_DEPENDENCY_HIGH_RATIO'); if(dep&&above(dep.value,p.value)==='YES') { add(ctx,findings,{findingCode:'OWNER_DEPENDENCE',findingType:'DEPENDENCY',domain:'BUSINESS_CONTINUITY',engineCode:'BUSINESS_WEALTH',metrics:[dep],policyReferences:[p.policyId],summary:'Household income shows material dependence on business-derived income under the versioned threshold.'}); if(div&&positive(div.value,0)==='YES') add(ctx,findings,{findingCode:'DIVIDEND_DEPENDENCE',findingType:'DEPENDENCY',domain:'BUSINESS_CONTINUITY',engineCode:'BUSINESS_WEALTH',metrics:[dep,div],policyReferences:[p.policyId],summary:'Material business-derived household income dependency includes disclosed dividend contribution.'}); } }
  { const goals=arr(snapshot.snapshotPayload.goals).filter(x=>x.goalType==='BUSINESS_SUCCESSION'); if(goals.some(x=>String(x.status||'').toUpperCase()==='UNDEFINED'||UNKNOWN_DISCLOSURE.has(String(x.disclosureState||'')))) add(ctx,findings,{findingCode:'SUCCESSION_UNDEFINED',findingType:'MISSING_EVIDENCE',domain:'BUSINESS_CONTINUITY',metrics:[metric(primary,'BUSINESS_WEALTH','shareValue')].filter(Boolean),summary:'A disclosed business-succession goal is explicitly undefined or incompletely disclosed.',limitations:['Absence of a succession goal alone is not treated as evidence of an undefined succession position.']}); }
  // W14 Goal feasibility (only uses FCR funding outputs)
  { const eduGap=metric(primary,'EDUCATION_FUNDING','fundingGap'), eduExisting=metric(primary,'EDUCATION_FUNDING','existingFunding'); if(eduGap){ if(isUnknown(eduGap.value)) add(ctx,findings,{findingCode:'GOAL_INSUFFICIENT_DATA',findingType:'UNKNOWN',domain:'GOAL_FEASIBILITY',engineCode:'EDUCATION_FUNDING',metrics:[eduGap],summary:'Education goal feasibility has insufficient calculated data.'}); else if(positive(eduGap.value,0)==='YES' && eduExisting && positive(eduExisting.value,0)==='YES') add(ctx,findings,{findingCode:'GOAL_PARTIALLY_FUNDED',findingType:'GAP',domain:'GOAL_FEASIBILITY',engineCode:'EDUCATION_FUNDING',metrics:[eduGap,eduExisting],summary:'The education goal is partially funded in the current calculation.'}); else if(positive(eduGap.value,0)==='YES') add(ctx,findings,{findingCode:'GOAL_UNDERFUNDED',findingType:'SHORTFALL',domain:'GOAL_FEASIBILITY',engineCode:'EDUCATION_FUNDING',metrics:[eduGap],summary:'The education goal is underfunded in the current calculation.'}); else add(ctx,findings,{findingCode:'GOAL_ON_TRACK',findingType:'STRENGTH',domain:'GOAL_FEASIBILITY',engineCode:'EDUCATION_FUNDING',metrics:[eduGap],summary:'The education goal is fully funded in the current calculation.'}); }
    const retGap=metric(primary,'RETIREMENT','shortfall'); if(retGap&&!isUnknown(retGap.value)&&positive(retGap.value,0)==='YES') add(ctx,findings,{findingCode:'GOAL_UNDERFUNDED',findingType:'SHORTFALL',domain:'GOAL_FEASIBILITY',engineCode:'RETIREMENT',metrics:[retGap],summary:'The retirement goal is underfunded in the current calculation.'}); }
  // W15 Scenario comparison
  scenarioSensitivity(ctx,findings);
  // W16 Cross-domain: combine existing traced findings, never create a new financial amount.
  { const codes=new Set(findings.map(f=>f.findingCode)); const sources=findings.filter(f=>['BUSINESS_CONCENTRATION','OWNER_DEPENDENCE','RETIREMENT_FUNDING_GAP','GUARANTEE_EXPOSURE_PRESENT','ESTATE_LIQUIDITY_SHORTFALL'].includes(f.findingCode)); if(new Set(sources.map(f=>f.domain)).size>=2 && (codes.has('BUSINESS_CONCENTRATION')||codes.has('OWNER_DEPENDENCE'))){
      add(ctx,findings,{findingCode:'MULTI_DOMAIN_DEPENDENCY',findingType:'DEPENDENCY',domain:'CROSS_DOMAIN',metrics:[],sourceCalculationReferences:sources.flatMap(f=>f.sourceCalculationReferences),factReferences:sources.flatMap(f=>f.factReferences),assumptionReferences:sources.flatMap(f=>f.assumptionReferences),summary:'Multiple financial domains depend on the same business-linked financial structure.',limitations:['This cross-domain finding combines existing findings only; it does not create action direction.']}); }}
  // W17 missing data / disclosure + contradiction
  addUnknownByEngine(ctx,findings);
  { const contradictions=findContradictions(snapshot.snapshotPayload); if(contradictions.length) add(ctx,findings,{findingCode:'DISCLOSURE_CONTRADICTION',findingType:'CONTRADICTION',domain:'DISCLOSURE_EVIDENCE',metrics:[],sourceCalculationReferences:[`${primary.calculationId}:FDR_METADATA_CONSISTENCY`],factReferences:contradictions,summary:'One or more FDR fact envelopes contain a disclosure-state/value contradiction.',limitations:['The contradiction is preserved rather than resolved by FAR.']}); }

  const deterministicCore={schemaVersion:'PHI-OS-FAR-ANALYSIS-RESULT-v1.0.0',runtimeCode:FAR_RUNTIME_CODE,runtimeVersion:FAR_RUNTIME_VERSION,analysisId,fcrResultDigest:primary.resultDigest,fcrCalculationId:primary.calculationId,fdrSnapshotId:snapshot.snapshotId,fdrDigest:snapshot.digest,analysisPolicySetId:policySet.policySetId,analysisPolicyDigest:policySet.digest,comparisonResultDigests:comparisons.map(x=>x.resultDigest).sort(),findings,independentRecalculationCreated:false,adviceCreated:false,professionalJudgmentCreated:false,recommendationCreated:false,fdrMutationCreated:false};
  const resultDigest=await sha256(deterministicCore); const determinismKey=await sha256({fcrResultDigest:primary.resultDigest,fdrDigest:snapshot.digest,analysisPolicyDigest:policySet.digest,comparisonResultDigests:deterministicCore.comparisonResultDigests,farVersion:FAR_RUNTIME_VERSION});
  return Object.freeze({...deterministicCore,resultDigest,determinismKey});
}

export function containsBlockedFinancialActionText(value){ return BLOCKED_TEXT.some(r=>r.test(String(value||''))); }
export default Object.freeze({analyzeFinancialStructure,validateAnalysisPolicySet,containsBlockedFinancialActionText});
