import { stableDigest } from './rre-readout-foundation-v1.mjs';

const clone = value => structuredClone(value);
const sortUnique = values => [...new Set((values ?? []).map(String).map(v => v.trim()).filter(Boolean))].sort();
const FORBIDDEN = new Set(['medicalDiagnosis','legalConclusion','financialRecommendation','identityTruth','professionalJudgment','navigationDecision','navigationCommand','treatmentAdvice','metricScore']);

function deepFreeze(value){ if(!value||typeof value!=='object'||Object.isFrozen(value)) return value; for(const child of Object.values(value)) deepFreeze(child); return Object.freeze(value); }
function assertSafe(value,path='$'){ if(!value||typeof value!=='object') return; for(const [k,v] of Object.entries(value)){ if(FORBIDDEN.has(k)) throw new Error(`RRE_READING_FORBIDDEN_FIELD:${path}.${k}`); assertSafe(v,`${path}.${k}`); } }
function required(value,code){ const v=String(value??'').trim(); if(!v) throw new Error(code); return v; }
function list(values,code){ if(!Array.isArray(values)) throw new Error(`${code}_ARRAY_REQUIRED`); const out=sortUnique(values); if(out.length!==values.length) throw new Error(`${code}_DUPLICATE_REFERENCE`); return out; }
function withDigest(object,field){ object[field]=stableDigest(object); return deepFreeze(object); }
function allObservables(extraction){ return [...extraction.observableStates,...extraction.observableTransitions,...extraction.observableDependencies,...extraction.observablePersistence,...extraction.observableLoad,...extraction.observableConstraints]; }
function obsIndex(extraction){ return new Map(allObservables(extraction).map(x=>[x.observableCode,x])); }
function patternIndex(patternRuntime){ return new Map((patternRuntime?.patterns??[]).map(x=>[x.patternCode,x])); }
function signatureIndex(signature){ return new Map([...(signature?.whatPersists??[]),...(signature?.whatRepeats??[]),...(signature?.whatActivates??[]),...(signature?.whatDeactivates??[]),...(signature?.whatRemainsUnstable??[])].map(x=>[x.signatureFragmentCode,x])); }
function constraintIndex(reading){ return new Map((reading?.constraints??[]).map(x=>[x.readoutConstraintCode,x])); }
function assertRefs(refs,index,code){ for(const ref of refs) if(!index.has(ref)) throw new Error(`${code}:${ref}`); }
function supportsFromObservables(refs,index){ return sortUnique(refs.flatMap(ref=>index.get(ref)?.supportReferences??[])); }
function supportsFromPatterns(refs,index){ return sortUnique(refs.flatMap(ref=>[ref,...(index.get(ref)?.supportReferences??[])])); }
function supportsFromSignatures(refs,index){ return sortUnique(refs.flatMap(ref=>[ref,...(index.get(ref)?.supportReferences??[])])); }
function supportsFromConstraints(refs,index){ return sortUnique(refs.flatMap(ref=>[ref,...(index.get(ref)?.supportReferences??[])])); }

export function buildConstraintReading(extraction,request,classRegistry,rmoConstraintRegistry){
  assertSafe(request); const obs=obsIndex(extraction); const domain=new Set(classRegistry.domainClasses); const rigidity=new Set(classRegistry.rigidityClasses);
  const rmoTypes=new Map(rmoConstraintRegistry.constraintTypes.map(x=>[x.constraintType,x]));
  const constraints=(request.constraints??[]).map(item=>{
    const observableReference=required(item.observableReference,'RRE_CONSTRAINT_OBSERVABLE_REQUIRED'); const observable=obs.get(observableReference);
    if(!observable||observable.dimension!=='CONSTRAINT') throw new Error(`RRE_CONSTRAINT_OBSERVABLE_INVALID:${observableReference}`);
    const authorityConstraintReference=required(item.authorityConstraintReference,'RRE_CONSTRAINT_AUTHORITY_REFERENCE_REQUIRED');
    if(!observable.supportReferences.includes(authorityConstraintReference)&&!observable.sourceComponentReferences.includes(authorityConstraintReference)) throw new Error('RRE_CONSTRAINT_AUTHORITY_NOT_SUPPORTED');
    const authorityConstraintType=required(item.authorityConstraintType,'RRE_CONSTRAINT_TYPE_REQUIRED').toUpperCase(); const typeDef=rmoTypes.get(authorityConstraintType);
    if(!typeDef) throw new Error(`RRE_CONSTRAINT_RMO_TYPE_UNKNOWN:${authorityConstraintType}`);
    const authorityConstraintScope=required(item.authorityConstraintScope,'RRE_CONSTRAINT_SCOPE_REQUIRED').toUpperCase(); if(!typeDef.allowedScopes.includes(authorityConstraintScope)) throw new Error('RRE_CONSTRAINT_RMO_SCOPE_INVALID');
    const domainClass=required(item.domainClass,'RRE_CONSTRAINT_DOMAIN_REQUIRED').toUpperCase(); const rigidityClass=required(item.rigidityClass,'RRE_CONSTRAINT_RIGIDITY_REQUIRED').toUpperCase();
    if(!domain.has(domainClass)) throw new Error(`RRE_CONSTRAINT_DOMAIN_UNKNOWN:${domainClass}`); if(!rigidity.has(rigidityClass)) throw new Error(`RRE_CONSTRAINT_RIGIDITY_UNKNOWN:${rigidityClass}`);
    const classificationSupportReferences=list(item.classificationSupportReferences??[],'RRE_CONSTRAINT_CLASSIFICATION_SUPPORT'); const rigiditySupportReferences=list(item.rigiditySupportReferences??[],'RRE_CONSTRAINT_RIGIDITY_SUPPORT');
    if(domainClass==='TIME'&&authorityConstraintType!=='TEMPORAL_WINDOW') throw new Error('RRE_CONSTRAINT_TIME_REQUIRES_TEMPORAL_WINDOW');
    if(domainClass==='CAPABILITY'&&authorityConstraintType!=='CAPACITY') throw new Error('RRE_CONSTRAINT_CAPABILITY_REQUIRES_CAPACITY');
    if(domainClass==='RELATIONSHIP'&&authorityConstraintScope!=='RELATIONSHIP'&&authorityConstraintType!=='DEPENDENCY') throw new Error('RRE_CONSTRAINT_RELATIONSHIP_BASIS_REQUIRED');
    if((domainClass==='RESOURCE'||domainClass==='ENVIRONMENT')&&!classificationSupportReferences.length) throw new Error('RRE_CONSTRAINT_DOMAIN_EXPLICIT_SUPPORT_REQUIRED');
    if((rigidityClass==='HARD'||rigidityClass==='SOFT')&&!rigiditySupportReferences.length) throw new Error('RRE_CONSTRAINT_RIGIDITY_EXPLICIT_SUPPORT_REQUIRED');
    return {readoutConstraintCode:required(item.readoutConstraintCode,'RRE_READOUT_CONSTRAINT_CODE_REQUIRED'),observableReference,authorityConstraintReference,authorityConstraintType,authorityConstraintScope,rigidityClass,domainClass,descriptorCode:required(item.descriptorCode,'RRE_CONSTRAINT_DESCRIPTOR_REQUIRED'),supportReferences:sortUnique([...observable.supportReferences,...classificationSupportReferences,...rigiditySupportReferences])};
  }).sort((a,b)=>a.readoutConstraintCode.localeCompare(b.readoutConstraintCode));
  return withDigest({schemaVersion:'PHI-OS-RRE-CONSTRAINT-READING-v1.0.0',readingCode:required(request.readingCode,'RRE_CONSTRAINT_READING_CODE_REQUIRED'),realityReference:extraction.realityReference,constraints,recommendationCreated:false,navigationRestrictionCreated:false,professionalJudgmentCreated:false,validationOnly:true,persistentStoreWriteAllowed:false},'readingDigest');
}

function facet(requestFacet,allowedStates,obs,patterns,code){
  const state=required(requestFacet?.state,`${code}_STATE_REQUIRED`).toUpperCase(); if(!allowedStates.includes(state)) throw new Error(`${code}_STATE_INVALID:${state}`);
  const observableReferences=list(requestFacet?.observableReferences??[],`${code}_OBSERVABLE`); const patternReferences=list(requestFacet?.patternReferences??[],`${code}_PATTERN`);
  assertRefs(observableReferences,obs,`${code}_OBSERVABLE_UNKNOWN`); assertRefs(patternReferences,patterns,`${code}_PATTERN_UNKNOWN`);
  const supportReferences=sortUnique([...supportsFromObservables(observableReferences,obs),...supportsFromPatterns(patternReferences,patterns)]);
  if(state!=='UNKNOWN'&&!supportReferences.length) throw new Error(`${code}_SUPPORT_REQUIRED`);
  return {state,observableReferences,patternReferences,supportReferences};
}

export function buildLoadReading(extraction,patternRuntime,request,registry){
  assertSafe(request); const obs=obsIndex(extraction); const patterns=patternIndex(patternRuntime);
  const currentLoad=facet(request.currentLoad,registry.currentLoadStates,obs,patterns,'RRE_LOAD_CURRENT');
  const concentration=facet(request.concentration,registry.concentrationStates,obs,patterns,'RRE_LOAD_CONCENTRATION');
  const transfer=facet(request.transfer,registry.transferStates,obs,patterns,'RRE_LOAD_TRANSFER'); const accumulation=facet(request.accumulation,registry.accumulationStates,obs,patterns,'RRE_LOAD_ACCUMULATION');
  const sources=(request.sources??[]).map(x=>{ const observableReferences=list(x.observableReferences??[],'RRE_LOAD_SOURCE_OBSERVABLE'); assertRefs(observableReferences,obs,'RRE_LOAD_SOURCE_OBSERVABLE_UNKNOWN'); const supportReferences=supportsFromObservables(observableReferences,obs); if(!supportReferences.length) throw new Error('RRE_LOAD_SOURCE_SUPPORT_REQUIRED'); return {sourceCode:required(x.sourceCode,'RRE_LOAD_SOURCE_CODE_REQUIRED'),sourceReference:required(x.sourceReference,'RRE_LOAD_SOURCE_REFERENCE_REQUIRED'),observableReferences,supportReferences}; }).sort((a,b)=>a.sourceCode.localeCompare(b.sourceCode));
  return withDigest({schemaVersion:'PHI-OS-RRE-LOAD-READING-v1.0.0',loadReadingCode:required(request.loadReadingCode,'RRE_LOAD_READING_CODE_REQUIRED'),realityReference:extraction.realityReference,currentLoad,sources,concentration,transfer,accumulation,metricCreated:false,medicalStressDiagnosisCreated:false,treatmentAdviceCreated:false,validationOnly:true,persistentStoreWriteAllowed:false},'loadReadingDigest');
}

export function buildStabilityReading(extraction,signature,patternRuntime,request,registry){
  assertSafe(request); const obs=obsIndex(extraction), sig=signatureIndex(signature), patterns=patternIndex(patternRuntime); const state=required(request.stabilityState,'RRE_STABILITY_STATE_REQUIRED').toUpperCase();
  if(!registry.stabilityStates.includes(state)) throw new Error(`RRE_STABILITY_STATE_INVALID:${state}`);
  const observableReferences=list(request.observableReferences??[],'RRE_STABILITY_OBSERVABLE'); const signatureReferences=list(request.signatureReferences??[],'RRE_STABILITY_SIGNATURE'); const patternReferences=list(request.patternReferences??[],'RRE_STABILITY_PATTERN');
  assertRefs(observableReferences,obs,'RRE_STABILITY_OBSERVABLE_UNKNOWN'); assertRefs(signatureReferences,sig,'RRE_STABILITY_SIGNATURE_UNKNOWN'); assertRefs(patternReferences,patterns,'RRE_STABILITY_PATTERN_UNKNOWN');
  const supportReferences=sortUnique([...supportsFromObservables(observableReferences,obs),...supportsFromSignatures(signatureReferences,sig),...supportsFromPatterns(patternReferences,patterns)]); if(state!=='UNKNOWN'&&!supportReferences.length) throw new Error('RRE_STABILITY_SUPPORT_REQUIRED');
  return withDigest({schemaVersion:'PHI-OS-RRE-STABILITY-READING-v1.0.0',stabilityReadingCode:required(request.stabilityReadingCode,'RRE_STABILITY_CODE_REQUIRED'),realityReference:extraction.realityReference,stabilityState:state,descriptorCode:required(request.descriptorCode,'RRE_STABILITY_DESCRIPTOR_REQUIRED'),observableReferences,signatureReferences,patternReferences,supportReferences,diagnosisCreated:false,professionalJudgmentCreated:false,navigationDecisionCreated:false,validationOnly:true,persistentStoreWriteAllowed:false},'stabilityReadingDigest');
}

function sameRef(a,b){ return !!a&&!!b&&a.code===b.code&&a.version===b.version&&a.digest===b.digest; }
function uncertaintyFromQuality(q){ return q==='VERIFIED'?'BOUNDED':q==='CONFLICTING'?'CONFLICTING':(q==='PARTIAL'||q==='LOW')?'ELEVATED':'UNKNOWN'; }
export function buildDriftReading(input,rmoDiffView,request,registry){
  assertSafe(request); const code=required(request.driftReadingCode,'RRE_DRIFT_CODE_REQUIRED');
  if(input.previousRealityReference==null){
    if(rmoDiffView!=null) throw new Error('RRE_DRIFT_DIFF_NOT_ALLOWED_WITHOUT_PREVIOUS_REALITY');
    return withDigest({schemaVersion:'PHI-OS-RRE-DRIFT-READING-v1.0.0',driftReadingCode:code,realityReference:input.realityReference,previousRealityReference:null,driftState:'NO_PREVIOUS_REALITY',rmoDiffReference:null,direction:'UNKNOWN',magnitudeClass:'UNKNOWN',domains:[],persistence:'UNKNOWN',uncertainty:'UNKNOWN',structuralDiffConsumed:false,recomputedRealityDiff:false,causalityClaimed:false,metricCreated:false,validationOnly:true,persistentStoreWriteAllowed:false},'driftReadingDigest');
  }
  if(!rmoDiffView) throw new Error('RRE_DRIFT_RMO_DIFF_REQUIRED');
  if(!sameRef(rmoDiffView.fromRealityReference,input.previousRealityReference)||!sameRef(rmoDiffView.toRealityReference,input.realityReference)) throw new Error('RRE_DRIFT_RMO_DIFF_LINEAGE_MISMATCH');
  if(rmoDiffView.authorityReference!=='content/runtime/reality-model-runtime/contracts/reality-diff-contract-v1.json') throw new Error('RRE_DRIFT_RMO_AUTHORITY_INVALID');
  if(rmoDiffView.interpretationPerformed!==false||rmoDiffView.diagnosisCreated!==false||rmoDiffView.causalityClaimed!==false) throw new Error('RRE_DRIFT_RMO_DIFF_NOT_STRUCTURAL_ONLY');
  const s=rmoDiffView.summary??{}; for(const k of ['addedCount','removedCount','replacedCount','unchangedCount']) if(!Number.isInteger(s[k])||s[k]<0) throw new Error(`RRE_DRIFT_SUMMARY_INVALID:${k}`);
  const domains=sortUnique(s.changedFamilies??[]).map(x=>x.toUpperCase()); const changed=s.addedCount+s.removedCount+s.replacedCount;
  const direction=changed===0?'NO_CHANGE':s.replacedCount>0||(s.addedCount>0&&s.removedCount>0)?'MIXED':s.addedCount>0?'INCREASE':'DECREASE';
  const magnitudeClass=changed===0?'NONE':domains.length<=1?'SINGLE_DOMAIN':'MULTI_DOMAIN'; const priorDiffReferences=list(request.priorDiffReferences??[],'RRE_DRIFT_PRIOR_DIFF'); const persistence=priorDiffReferences.length?'REPEATED_INTERVALS':'SINGLE_INTERVAL';
  if(!registry.directions.includes(direction)||!registry.magnitudeClasses.includes(magnitudeClass)||!registry.persistenceClasses.includes(persistence)) throw new Error('RRE_DRIFT_REGISTRY_MISMATCH');
  return withDigest({schemaVersion:'PHI-OS-RRE-DRIFT-READING-v1.0.0',driftReadingCode:code,realityReference:input.realityReference,previousRealityReference:input.previousRealityReference,driftState:'READABLE',rmoDiffReference:clone(rmoDiffView.diffReference),direction,magnitudeClass,domains,persistence,uncertainty:uncertaintyFromQuality(input.dataQuality),structuralDiffConsumed:true,recomputedRealityDiff:false,causalityClaimed:false,metricCreated:false,validationOnly:true,persistentStoreWriteAllowed:false},'driftReadingDigest');
}

function recoveryFacet(requestFacet,allowedStates,obs,patterns,constraints,code){
  const state=required(requestFacet?.state,`${code}_STATE_REQUIRED`).toUpperCase(); if(!allowedStates.includes(state)) throw new Error(`${code}_STATE_INVALID:${state}`);
  const observableReferences=list(requestFacet?.observableReferences??[],`${code}_OBSERVABLE`), patternReferences=list(requestFacet?.patternReferences??[],`${code}_PATTERN`), constraintReferences=list(requestFacet?.constraintReferences??[],`${code}_CONSTRAINT`);
  assertRefs(observableReferences,obs,`${code}_OBSERVABLE_UNKNOWN`); assertRefs(patternReferences,patterns,`${code}_PATTERN_UNKNOWN`); assertRefs(constraintReferences,constraints,`${code}_CONSTRAINT_UNKNOWN`);
  const supportReferences=sortUnique([...supportsFromObservables(observableReferences,obs),...supportsFromPatterns(patternReferences,patterns),...supportsFromConstraints(constraintReferences,constraints)]); if(state!=='UNKNOWN'&&!supportReferences.length) throw new Error(`${code}_SUPPORT_REQUIRED`);
  return {state,observableReferences,patternReferences,constraintReferences,supportReferences};
}
export function buildRecoveryReading(extraction,patternRuntime,constraintReading,request,registry){
  assertSafe(request); const obs=obsIndex(extraction), patterns=patternIndex(patternRuntime), constraints=constraintIndex(constraintReading);
  const availableRecoveryCapacity=recoveryFacet(request.availableRecoveryCapacity,registry.capacityStates,obs,patterns,constraints,'RRE_RECOVERY_CAPACITY'); const recentRecoverySignal=recoveryFacet(request.recentRecoverySignal,registry.signalStates,obs,patterns,constraints,'RRE_RECOVERY_SIGNAL'); const recoveryWindow=recoveryFacet(request.recoveryWindow,registry.windowStates,obs,patterns,constraints,'RRE_RECOVERY_WINDOW'); const uncertainty=recoveryFacet(request.uncertainty,registry.uncertaintyClasses,obs,patterns,constraints,'RRE_RECOVERY_UNCERTAINTY');
  const recoveryConstraints=list(request.recoveryConstraints??[],'RRE_RECOVERY_CONSTRAINT_LIST'); assertRefs(recoveryConstraints,constraints,'RRE_RECOVERY_CONSTRAINT_UNKNOWN');
  return withDigest({schemaVersion:'PHI-OS-RRE-RECOVERY-READING-v1.0.0',recoveryReadingCode:required(request.recoveryReadingCode,'RRE_RECOVERY_CODE_REQUIRED'),realityReference:extraction.realityReference,availableRecoveryCapacity,recentRecoverySignal,recoveryConstraints,recoveryWindow,uncertainty,treatmentAdviceCreated:false,medicalDiagnosisCreated:false,professionalJudgmentCreated:false,navigationActionCreated:false,validationOnly:true,persistentStoreWriteAllowed:false},'recoveryReadingDigest');
}

function limit(code,kind,source,descriptor){ return {limitCode:code,limitKind:kind,sourceReference:source,descriptorCode:descriptor}; }
export function buildUnknownResolutionLimit(input,unknownViews,unknownRegistry,request,resolutionRegistry){
  assertSafe(request); const kindDefs=new Map(unknownRegistry.unknownKinds.map(x=>[x.unknownKind,x]));
  const unknowns=(unknownViews?.unknowns??[]).map(view=>{ const kind=required(view.unknownKind,'RRE_UNKNOWN_KIND_REQUIRED').toUpperCase(), state=required(view.unknownState,'RRE_UNKNOWN_STATE_REQUIRED').toUpperCase(), def=kindDefs.get(kind); if(!def) throw new Error(`RRE_UNKNOWN_KIND_NOT_AUTHORISED:${kind}`); if(!def.allowedStates.includes(state)) throw new Error(`RRE_UNKNOWN_STATE_NOT_AUTHORISED:${kind}:${state}`); const evidenceBindingReferences=list(view.evidenceBindingReferences??[],'RRE_UNKNOWN_EVIDENCE_BINDING'); const requiredEvidenceCount=Number(view.requiredEvidenceCount); if(!Number.isInteger(requiredEvidenceCount)||requiredEvidenceCount<1) throw new Error('RRE_UNKNOWN_REQUIRED_EVIDENCE_INVALID'); const missingResolutionEvidenceCount=Math.max(0,requiredEvidenceCount-evidenceBindingReferences.length); const professionalAuthorityRequired=Boolean(view.professionalAuthorityRequired); const currentResolutionState=professionalAuthorityRequired?'CURRENTLY_BLOCKED_BY_AUTHORITY':state==='DISPUTED'?'CURRENTLY_DISPUTED':missingResolutionEvidenceCount>0?'CURRENTLY_BLOCKED_BY_MISSING_EVIDENCE':'CURRENTLY_UNRESOLVED'; return {unknownReference:required(view.unknownReference,'RRE_UNKNOWN_REFERENCE_REQUIRED'),unknownKind:kind,unknownState:state,currentResolutionState,componentReferences:list(view.componentReferences??[],'RRE_UNKNOWN_COMPONENT'),evidenceBindingReferences,requiredEvidenceCount,missingResolutionEvidenceCount,professionalAuthorityRequired,truthClaimed:false,resolutionTransitionPerformed:false}; }).sort((a,b)=>a.unknownReference.localeCompare(b.unknownReference));
  const inputGaps=[]; const addGap=(cond,kind,code,desc)=>{ if(cond) inputGaps.push(limit(code,kind,input.inputCode,desc)); };
  addGap(!input.observationReferences.length,'MISSING_OBSERVATION_REFERENCE','RRE-LIMIT-INPUT-OBSERVATION','OBSERVATION_REFERENCE_REQUIRED_FOR_RESOLUTION'); addGap(!input.evidenceReferences.length,'MISSING_EVIDENCE_REFERENCE','RRE-LIMIT-INPUT-EVIDENCE','EVIDENCE_REFERENCE_REQUIRED_FOR_RESOLUTION'); addGap(!input.methodProjectionReferences.length,'MISSING_METHOD_PROJECTION','RRE-LIMIT-INPUT-METHOD','METHOD_PROJECTION_UNAVAILABLE'); addGap(!input.meaningReferences.length,'MISSING_MEANING_REFERENCE','RRE-LIMIT-INPUT-MEANING','MEANING_REFERENCE_UNAVAILABLE'); addGap(!input.knowledgeReferences.length,'MISSING_KNOWLEDGE_REFERENCE','RRE-LIMIT-INPUT-KNOWLEDGE','KNOWLEDGE_REFERENCE_UNAVAILABLE'); addGap(input.previousRealityReference==null,'NO_PREVIOUS_REALITY_FOR_DRIFT','RRE-LIMIT-INPUT-PREVIOUS','PREVIOUS_REALITY_UNAVAILABLE_FOR_DRIFT');
  for(const x of inputGaps) if(!resolutionRegistry.inputGapKinds.includes(x.limitKind)) throw new Error(`RRE_INPUT_GAP_KIND_INVALID:${x.limitKind}`);
  const missingEvidence=unknowns.filter(x=>x.missingResolutionEvidenceCount>0).map((x,i)=>limit(`RRE-LIMIT-MISSING-EVIDENCE-${i+1}`,'INSUFFICIENT_RESOLUTION_EVIDENCE',x.unknownReference,'REQUIRED_RESOLUTION_EVIDENCE_NOT_YET_AVAILABLE'));
  const conflictingEvidence=unknowns.filter(x=>x.unknownKind==='CONFLICTING_EVIDENCE'||x.unknownState==='DISPUTED').map((x,i)=>limit(`RRE-LIMIT-CONFLICT-${i+1}`,'CONFLICTING_EVIDENCE',x.unknownReference,'CONFLICTING_EVIDENCE_REMAINS_VISIBLE'));
  const resolutionLimits=[...missingEvidence,...conflictingEvidence];
  for(const x of unknowns){ if(x.unknownKind==='UNBOUNDED_UNCERTAINTY') resolutionLimits.push(limit(`RRE-LIMIT-UNBOUNDED-${x.unknownReference}`,'UNBOUNDED_UNCERTAINTY',x.unknownReference,'UNCERTAINTY_REMAINS_UNBOUNDED')); if(x.professionalAuthorityRequired) resolutionLimits.push(limit(`RRE-LIMIT-PROFESSIONAL-${x.unknownReference}`,'PROFESSIONAL_AUTHORITY_REQUIRED',x.unknownReference,'PROFESSIONAL_AUTHORITY_REQUIRED_FOR_RESOLUTION')); }
  if(input.dataQuality==='LOW') resolutionLimits.push(limit('RRE-LIMIT-DATA-QUALITY-LOW','INPUT_DATA_QUALITY_LOW',input.inputCode,'LOW_DATA_QUALITY_LIMITS_RESOLUTION')); if(input.dataQuality==='CONFLICTING') resolutionLimits.push(limit('RRE-LIMIT-DATA-QUALITY-CONFLICT','INPUT_DATA_QUALITY_CONFLICTING',input.inputCode,'CONFLICTING_DATA_QUALITY_LIMITS_RESOLUTION')); if(input.dataQuality==='UNKNOWN') resolutionLimits.push(limit('RRE-LIMIT-DATA-QUALITY-UNKNOWN','INPUT_DATA_QUALITY_UNKNOWN',input.inputCode,'UNKNOWN_DATA_QUALITY_LIMITS_RESOLUTION'));
  for(const gap of inputGaps) if(gap.limitKind!=='NO_PREVIOUS_REALITY_FOR_DRIFT') resolutionLimits.push(limit(`RRE-LIMIT-AUTHORITY-${gap.limitCode}`,'MISSING_REQUIRED_INPUT_AUTHORITY',gap.sourceReference,gap.descriptorCode));
  const unresolvableStates=unknowns.filter(x=>x.currentResolutionState!=='CURRENTLY_UNRESOLVED'||x.missingResolutionEvidenceCount>0).map((x,i)=>limit(`RRE-LIMIT-CURRENTLY-UNRESOLVABLE-${i+1}`,x.currentResolutionState,x.unknownReference,'CURRENT_EVIDENCE_OR_AUTHORITY_DOES_NOT_SUPPORT_RESOLUTION'));
  return withDigest({schemaVersion:'PHI-OS-RRE-UNKNOWN-RESOLUTION-LIMIT-v1.0.0',unknownReadingCode:required(request.unknownReadingCode,'RRE_UNKNOWN_READING_CODE_REQUIRED'),realityReference:input.realityReference,unknowns,inputGaps:inputGaps.sort((a,b)=>a.limitCode.localeCompare(b.limitCode)),missingEvidence,conflictingEvidence,resolutionLimits:resolutionLimits.sort((a,b)=>a.limitCode.localeCompare(b.limitCode)),unresolvableStates,unknownsHidden:false,silentResolutionPerformed:false,defaultValueApplied:false,inferenceFilled:false,permanentUnresolvabilityClaimed:false,professionalJudgmentCreated:false,validationOnly:true,persistentStoreWriteAllowed:false},'unknownReadingDigest');
}
