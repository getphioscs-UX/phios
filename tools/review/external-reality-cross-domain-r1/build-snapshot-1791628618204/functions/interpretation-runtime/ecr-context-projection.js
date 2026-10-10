import {ECR_CONTEXT_MAPPING_RULES} from './ecr-context-mapping-rules.js';
import {deriveExperienceContext} from './domain-derivers-v1.js';
import {buildContextualCustomerClaimIR} from '../single-method-reading/customer-claim-ir.js';
import {REALITY_COMPARISON_STATES} from '../current-reality/personal-current-reality-runtime.js';
import {ecrFullReportLocale} from '../runtime/locales/ecr-full-report.js';
const list=v=>Array.isArray(v)?v:[];
const freeze=v=>{if(v&&typeof v==='object'&&!Object.isFrozen(v)){Object.values(v).forEach(freeze);Object.freeze(v)}return v};
export function projectEcrContext({coreReport,observationIr=null,comparisonIr=null,reviewMode=false}={}){
 if(coreReport?.edition!=='ECR_FULL_R1'||coreReport.depth!=='PAID')throw new Error('ECR_CONTEXT_CORE_REPORT_REQUIRED');
 const locale=coreReport.locale,copy=ecrFullReportLocale(locale),sections=[],claims=[];
 const observations=observationIr?.schemaVersion==='PHI-OS-CURRENT-REALITY-OBSERVATION-v1'?list(observationIr.observations).filter(x=>x.source==='CUSTOMER'&&x.confidence==='SELF_REPORTED'&&x.objectiveFact===false&&x.sensitive===false&&x.observationId&&x.statement?.trim()):[];
 const byPrompt=new Map();for(const o of observations){if(byPrompt.has(o.promptId))byPrompt.set(o.promptId,null);else byPrompt.set(o.promptId,o)}
 const counters=observations.filter(x=>x.promptId==='CONTEXT_COUNTER_EVIDENCE');
 for(const rule of ECR_CONTEXT_MAPPING_RULES){
  if(!reviewMode&&rule.status!=='HUMAN_ACCEPTED')continue;
  const required=rule.requiredContextEvidence.map(key=>byPrompt.get(key));if(required.some(x=>!x))continue;
  if(byPrompt.get('CARRIER_CONDITIONS')?.domain!=='BODY_CARRIER')continue;
  if(rule.number===12&&byPrompt.get('CARRIER_ENVIRONMENT')?.domain!=='ENVIRONMENT')continue;
  if(rule.number===13){
   if(required.slice(1).some(x=>x.domain!=='CURRENT_STATE'))continue;
   deriveExperienceContext({carrierRuntime:required[0],selection:required[1],stabilization:required[2],perspective:required[3],motivation:required[4]});
  }
  const baseline=coreReport.sections.find(x=>x.sectionId===rule.inputEcrDimensions[0])?.claims?.[0];if(!baseline)continue;
  const values={baseline:baseline.structuralMeaning,...Object.fromEntries(required.map(x=>[x.promptId,x.statement]))};
  const text=rule.customerClaimTemplate[locale].replace(/\{([A-Z_a-z]+)\}/g,(_,key)=>values[key]||'');
  const claim=buildContextualCustomerClaimIR({baselineClaim:baseline,derivedUnit:{owner:'CANONICAL_INTERPRETATION_KERNEL',ruleId:rule.ruleId,semanticDimension:rule.sectionId,sourceProjectionId:coreReport.sourceProjectionId,headline:copy.sections[rule.number-1],text,evidenceRefs:required.map(x=>x.observationId),counterEvidenceRefs:counters.map(x=>x.observationId),conditions:rule.conditions,boundary:rule.boundary[locale],meaningRefs:rule.meaningRefs,sourceRefs:rule.sourceRefs,admitted:rule.status==='HUMAN_ACCEPTED'}});
  claims.push(claim);sections.push({sectionId:rule.sectionId,number:rule.number,title:copy.sections[rule.number-1],claims:[claim],body:rule.boundary[locale],observations:counters.map(x=>({text:x.statement,interpretationUnitRef:x.observationId,sourceRefs:[x.observationId]}))});
 }
 // Shared four-state taxonomy and explicit customer response are preserved.
 const comparisons=[];
 if(reviewMode&&comparisonIr?.schemaVersion==='PHI-OS-REALITY-COMPARISON-v1')for(const x of list(comparisonIr.comparisons)){
  const baseline=coreReport.claims.find(c=>c.claimId===x.methodClaimRef||c.interpretationUnitRefs.includes(x.methodClaimRef));
  const evidence=list(x.observationRefs).map(id=>observations.find(o=>o.observationId===id));
  if(x.methodId!=='ECR'||x.source!=='CUSTOMER'||x.customerControlled!==true||!baseline||!evidence.length||evidence.some(x=>!x)||!REALITY_COMPARISON_STATES.includes(x.responseState))continue;
  comparisons.push({baselineClaimRef:baseline.claimId,baselineText:baseline.structuralMeaning,currentRealityEvidenceRefs:x.observationRefs,comparisonState:x.responseState,supportingObservations:x.responseState==='CURRENTLY_RESONANT'?evidence.map(o=>o.statement):[],counterObservations:evidence.filter(o=>x.responseState==='CURRENTLY_NOT_RESONANT'||o.promptId==='CONTEXT_COUNTER_EVIDENCE').map(o=>o.statement),currentObservations:evidence.map(o=>o.statement),conditions:['EXPLICIT_CUSTOMER_COMPARISON'],boundary:copy.boundary,lineage:{baselineClaimRef:baseline.claimId,comparisonRef:x.comparisonId,observationRefs:x.observationRefs,owner:'PERSONAL_CURRENT_REALITY'},customerExplanation:x.customerNote||copy.states[x.responseState],observationPrompt:coreReport.sections.find(s=>s.sectionId==='REALITY_NAVIGATION')?.observations?.[0]?.text||''});
 }
 if(comparisons.length)sections.push({sectionId:'CURRENT_REALITY_COMPARISON',number:14,title:copy.sections[13],comparisons,body:copy.boundary});
 return freeze({sourceProjectionId:coreReport.sourceProjectionId,locale,owner:'CANONICAL_INTERPRETATION_KERNEL',state:'REVIEW_CANDIDATE',claims,sections,boundaries:{birthCoordinatesFillContext:false,baselineMutated:false,comparisonIsTruthScore:false}});
}
