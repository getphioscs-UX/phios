import assert from 'node:assert/strict';
import {stableDigest,buildReadoutInput,extractObservableRuntime,buildRuntimeSignature,buildPatternRuntime} from '../reality-readout-engine/rre-readout-foundation-v1.mjs';
import {buildConstraintReading,buildLoadReading,buildStabilityReading,buildDriftReading,buildRecoveryReading,buildUnknownResolutionLimit} from '../reality-readout-engine/rre-readout-reading-v1.mjs';
import {buildConfidenceRuntime,buildReadoutLineage,buildCanonicalRuntimeReadout} from '../reality-readout-engine/rre-canonical-readout-v1.mjs';
export function consumeHistoricalRre({admission,registries,contract}){
 assert.equal(contract.contractCode,'PHI-OS-W8D-HISTORICAL-RRE-ADAPTER-v1');
 assert.equal(contract.currentDataAllowed,false);assert.equal(contract.productionExecutionAllowed,false);
 assert.equal(admission.status,'HISTORICAL_EVIDENCE_ADMISSION_COMPLETE_CURRENT_RRE_BLOCKED');
 const evidence=admission.w8cHistorical.evidence;
 const evidenceMap=new Map(evidence.map(e=>[e.claimId,e]));assert.equal(evidenceMap.size,evidence.length,'DUPLICATE_EVIDENCE');
 const issuerRecords=admission.w8dHistorical.consumption;
 assert.equal(new Set(issuerRecords.map(r=>r.issuer)).size,issuerRecords.length,'DUPLICATE_ISSUER');
 const sourceMap=new Map(admission.w8a.intake.sources.map(s=>[s.sourceId,s]));
 for(const e of evidence){assert.equal(e.knowledgeState,'HISTORICAL','CURRENT_EVIDENCE_FORBIDDEN');assert.equal(e.scope,'SUBSYSTEM','SCOPE_PROMOTION_FORBIDDEN');assert.equal(e.evidenceState,'HISTORICAL_PRIMARY_EVIDENCE_ADMITTED');assert.equal(e.supportLevel,'DIRECT');assert.equal(e.boundaries.isCurrentData,false);assert.equal(e.sourceLineage.sourceVersionOrDigest,sourceMap.get(e.sourceId)?.sourceVersionOrDigest,'SOURCE_VERSION_MISMATCH');}
 return issuerRecords.map(row=>{
  const issuer=row.issuer,id='HIST-'+issuer;
  assert.equal(row.scope,'SUBSYSTEM');assert.equal(row.knowledgeState,'HISTORICAL');assert.equal(row.currentDataAdmitted,false);assert.equal(row.g14Pair,null);assert.equal(row.runtimePosition,null);
  assert.equal(new Set(row.evidenceReferences).size,row.evidenceReferences.length,'DUPLICATE_SUPPORT');
  const refs=row.evidenceReferences.map(ref=>{const e=evidenceMap.get(ref);assert(e,'ORPHAN_EVIDENCE');assert.equal(e.dossierId,'HISTORICAL-ISSUER-'+issuer,'CROSS_ISSUER_SUPPORT');return e;});
  const revenue=refs.filter(e=>e.claimType==='HISTORICAL_SEGMENT_REVENUE').sort((a,b)=>a.structuredPayload.fiscalYear-b.structuredPayload.fiscalYear);
  assert.equal(revenue.length,3);assert.deepEqual(revenue.map(e=>e.structuredPayload.fiscalYear),[2023,2024,2025]);
  assert.equal(new Set(revenue.map(e=>e.structuredPayload.reportingBasisSourceId)).size,1,'MIXED_REPORTING_BASIS');
  const periods=revenue.map(e=>{const p=row.periodEnds.find(p=>p.fiscalYear===e.structuredPayload.fiscalYear);assert(p&&/^\d{4}-\d{2}-\d{2}$/.test(p.periodEnd),'REPORTING_PERIOD_REQUIRED');assert(Date.parse(p.periodEnd+'T23:59:59Z')<Date.parse(admission.producedAt),'REPORTING_PERIOD_FROM_FUTURE');return {fiscalYear:p.fiscalYear,periodEnd:p.periodEnd,claimId:e.claimId,reportingBasisSourceId:e.sourceId};});
  const observedAt=periods.at(-1).periodEnd+'T23:59:59.000Z';
  const observations=periods.map(p=>({observationCode:`OBS-${id}-FY${p.fiscalYear}`,kind:'HISTORICAL_REPORTED_SEGMENT_REVENUE',periodEnd:p.periodEnd,supportReferences:[p.claimId],structuredEvidenceDigest:stableDigest(evidenceMap.get(p.claimId).structuredPayload)}));
  const events=refs.filter(e=>e.claimType==='HISTORICAL_SEGMENT_REPORTING_EVENT');
  // Event statements retain source wording/anchors; annual period end is not an event date.
  const realityViewBasis={issuer,knowledgeState:'HISTORICAL',scope:'SUBSYSTEM',periods,observations,eventEvidenceReferences:events.map(e=>e.claimId),admissionDigest:stableDigest(admission)};
  const realityReference={code:'HISTORICAL-ISSUER-'+issuer,version:'1.0.0',digest:stableDigest(realityViewBasis)};
  const input=buildReadoutInput({inputCode:'RRE-INPUT-'+id,realityReference,observationReferences:[...observations.map(o=>o.observationCode),...events.map(e=>'OBS-'+e.claimId)],evidenceReferences:row.evidenceReferences,methodProjectionReferences:[],meaningReferences:[],knowledgeReferences:[],previousRealityReference:null,timeReference:{observedAt,timezone:'UTC'},dataQuality:'PARTIAL',governanceReferences:[contract.contractCode,'PHI-OS-RDG-RRE-READOUT-DATA-CONTRACT-SUCCESSOR-v1']},registries.inputContract);
  const observables=observations.map(o=>({observableCode:o.observationCode,dimension:'STATE',valueClass:'HISTORICAL_REPORTED_SEGMENT_REVENUE',supportState:'SUPPORTED',supportReferences:o.supportReferences,timeReference:{observedAt:o.periodEnd+'T23:59:59.000Z',timezone:'UTC'},sourceComponentReferences:[]}));
  for(const e of events)observables.push({observableCode:'OBS-'+e.claimId,dimension:'TRANSITION',valueClass:'HISTORICAL_REPORTED_SEGMENT_COMPOSITION_EVENT',supportState:'SUPPORTED',supportReferences:[e.claimId],timeReference:null,sourceComponentReferences:[]});
  const observationSummary=extractObservableRuntime(input,{realityReference,observables},registries.dimensionRegistry);
  const runtimeSignature=buildRuntimeSignature(observationSummary,{signatureCode:'RRE-SIGNATURE-'+id,fragments:[]},registries.signatureRegistry);
  const patterns=buildPatternRuntime(observationSummary,{patternRuntimeCode:'RRE-PATTERN-'+id,patterns:[]},registries.patternRegistry);
  const constraints=buildConstraintReading(observationSummary,{readingCode:'RRE-CONSTRAINT-'+id,constraints:[]},registries.constraintRegistry,registries.rmoConstraintRegistry);
  const facet=()=>({state:'UNKNOWN',observableReferences:[],patternReferences:[]});
  const load=buildLoadReading(observationSummary,patterns,{loadReadingCode:'RRE-LOAD-'+id,currentLoad:facet(),concentration:facet(),transfer:facet(),accumulation:facet(),sources:[]},registries.loadRegistry);
  const stability=buildStabilityReading(observationSummary,runtimeSignature,patterns,{stabilityReadingCode:'RRE-STABILITY-'+id,stabilityState:'UNKNOWN',descriptorCode:'HISTORICAL_REVENUE_NOT_STABILITY_EVIDENCE',observableReferences:[],signatureReferences:[],patternReferences:[]},registries.stabilityRegistry);
  const drift=buildDriftReading(input,null,{driftReadingCode:'RRE-DRIFT-'+id,priorDiffReferences:[]},registries.driftRegistry);
  const recoveryFacet=()=>({...facet(),constraintReferences:[]});
  const recovery=buildRecoveryReading(observationSummary,patterns,constraints,{recoveryReadingCode:'RRE-RECOVERY-'+id,availableRecoveryCapacity:recoveryFacet(),recentRecoverySignal:recoveryFacet(),recoveryWindow:recoveryFacet(),uncertainty:recoveryFacet(),recoveryConstraints:[]},registries.recoveryRegistry);
  const unknowns=['CURRENT_CONDITIONS','NATIONAL_REPRESENTATIVENESS','COMMON_CROSS_ISSUER_MECHANISM','RMO_PRIOR_DIFF'].map(k=>({unknownReference:'UNKNOWN-'+id+'-'+k,unknownKind:'OPEN_QUESTION',unknownState:'UNRESOLVED',evidenceBindingReferences:[],componentReferences:[],requiredEvidenceCount:1,professionalAuthorityRequired:false}));
  const unknownResolution=buildUnknownResolutionLimit(input,{unknowns},registries.rmoUnknownRegistry,{unknownReadingCode:'RRE-UNKNOWN-'+id},registries.resolutionRegistry);
  const confidence=buildConfidenceRuntime(input,unknownResolution,{confidenceCode:'RRE-CONFIDENCE-'+id,assessmentTime:admission.producedAt},registries.confidenceRegistry);
  const components={observationSummary,runtimeSignature,patterns,constraints,load,stability,drift,recovery,unknownResolution,confidence};
  const lineage=buildReadoutLineage(input,components,{lineageCode:'RRE-LINEAGE-'+id,priorReadoutReferences:[]});
  const readout=buildCanonicalRuntimeReadout(input,components,confidence,lineage,{readoutCode:'RRE-READOUT-'+id,readoutVersion:'1.0.0',authorityReference:'content/runtime/reality-readout-engine/contracts/canonical-runtime-readout-contract-v1.json',persistenceDecision:'DENY'},registries.successorRegistry);
  return {issuer,knowledgeState:'HISTORICAL',scope:'SUBSYSTEM',state:'HISTORICAL_RRE_VALIDATION_READOUT_CREATED',currentDataAdmitted:false,productionExecutionAllowed:false,contractReference:contract.contractCode,observedAt,assessmentTime:admission.producedAt,periods,observations,realityViewBasis,input,components,readout,candidate:row.candidate,candidateState:'RETAINED_NOT_SEMANTICALLY_ADMITTED',g14Pair:null,runtimePosition:null,nationalPromotion:false};
 });
}
