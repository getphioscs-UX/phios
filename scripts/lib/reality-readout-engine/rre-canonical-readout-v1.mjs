import { stableDigest } from './rre-readout-foundation-v1.mjs';

const clone=value=>structuredClone(value);
const sortUnique=values=>[...new Set((values??[]).map(String).map(v=>v.trim()).filter(Boolean))].sort();
const required=(value,code)=>{const v=String(value??'').trim(); if(!v) throw new Error(code); return v;};
const deepFreeze=value=>{if(!value||typeof value!=='object'||Object.isFrozen(value)) return value; for(const child of Object.values(value)) deepFreeze(child); return Object.freeze(value);};
const withDigest=(object,field)=>{object[field]=stableDigest(object); return deepFreeze(object);};
const refToken=ref=>`${ref.code}@${ref.version}#${ref.digest}`;
function normalizeRef(ref,code){if(!ref||typeof ref!=='object') throw new Error(`${code}_REFERENCE_REQUIRED`); const out={code:required(ref.code,`${code}_CODE_REQUIRED`),version:required(ref.version,`${code}_VERSION_REQUIRED`),digest:String(ref.digest??'').toLowerCase()}; if(!/^[a-f0-9]{64}$/.test(out.digest)) throw new Error(`${code}_DIGEST_INVALID`); return out;}
function collectSupport(value,out=new Set()){if(Array.isArray(value)){for(const item of value) collectSupport(item,out);return out;} if(!value||typeof value!=='object') return out; for(const [k,v] of Object.entries(value)){if(['supportReferences','evidenceBindingReferences','sourceComponentReferences','observableReferences','patternReferences','signatureReferences','constraintReferences'].includes(k)&&Array.isArray(v)) for(const x of v) if(typeof x==='string'&&x.trim()) out.add(x.trim()); else collectSupport(v,out); if(k==='sourceReference'&&typeof v==='string'&&v.trim()) out.add(v.trim()); if(k==='rmoDiffReference'&&v&&typeof v==='object'&&v.code) out.add(refToken(v));} return out;}
function digestOf(component){for(const key of ['extractionDigest','signatureDigest','patternRuntimeDigest','readingDigest','loadReadingDigest','stabilityReadingDigest','driftReadingDigest','recoveryReadingDigest','unknownReadingDigest','confidenceDigest']) if(component?.[key]) return component[key]; throw new Error('RRE_LINEAGE_COMPONENT_DIGEST_REQUIRED');}

export function buildConfidenceRuntime(input,unknownReading,request,registry){
  const confidenceCode=required(request?.confidenceCode,'RRE_CONFIDENCE_CODE_REQUIRED'); const assessmentTime=required(request?.assessmentTime,'RRE_CONFIDENCE_ASSESSMENT_TIME_REQUIRED');
  const assessed=Date.parse(assessmentTime), observed=Date.parse(input?.timeReference?.observedAt??''); if(!Number.isFinite(assessed)||!Number.isFinite(observed)||assessed<observed) throw new Error('RRE_CONFIDENCE_TIME_INVALID');
  const evidenceQuality=registry.dataQualityMap[input.dataQuality]; if(!evidenceQuality) throw new Error('RRE_CONFIDENCE_DATA_QUALITY_UNKNOWN');
  const core=[input.observationReferences.length>0,input.evidenceReferences.length>0].filter(Boolean).length; const aux=[input.methodProjectionReferences,input.meaningReferences,input.knowledgeReferences].filter(x=>x.length>0).length;
  const coverage=core===0?'UNKNOWN':core===1?'LIMITED':aux===3?'BROAD':'PARTIAL';
  const agreement=(unknownReading.conflictingEvidence.length>0||input.dataQuality==='CONFLICTING')?'CONFLICTING':input.evidenceReferences.length?'CONSISTENT':'UNKNOWN';
  const ageDays=(assessed-observed)/86400000; const recency=ageDays<=registry.recencyThresholdDays.currentMax?'CURRENT':ageDays<=registry.recencyThresholdDays.agingMax?'AGING':'STALE';
  const resolution=unknownReading.unknowns.length===0&&unknownReading.resolutionLimits.length===0?'RESOLVED':(unknownReading.conflictingEvidence.length>0||unknownReading.unresolvableStates.length>0)?'OPEN_LIMITS':'PARTIALLY_RESOLVED';
  const materialKinds=new Set(['MISSING_OBSERVATION_REFERENCE','MISSING_EVIDENCE_REFERENCE']); const relevantGaps=unknownReading.inputGaps.filter(x=>x.limitKind!=='NO_PREVIOUS_REALITY_FOR_DRIFT'); const missingness=relevantGaps.some(x=>materialKinds.has(x.limitKind))?'MATERIAL':relevantGaps.length?'PRESENT':'NONE';
  let confidenceClass='MODERATE';
  if(evidenceQuality==='UNKNOWN'||coverage==='UNKNOWN'||agreement==='UNKNOWN') confidenceClass='UNKNOWN';
  else if(agreement==='CONFLICTING'||missingness==='MATERIAL'||evidenceQuality==='WEAK') confidenceClass='LOW';
  else if(coverage==='LIMITED'||recency==='STALE'||resolution==='OPEN_LIMITS'||evidenceQuality==='PARTIAL'||missingness==='PRESENT') confidenceClass='LIMITED';
  else if(evidenceQuality==='STRONG'&&coverage==='BROAD'&&agreement==='CONSISTENT'&&recency==='CURRENT'&&resolution==='RESOLVED'&&missingness==='NONE') confidenceClass='HIGH';
  const basisReferences=sortUnique([...input.observationReferences,...input.evidenceReferences,...input.methodProjectionReferences,...input.meaningReferences,...input.knowledgeReferences,...unknownReading.unknowns.map(x=>x.unknownReference),...unknownReading.resolutionLimits.map(x=>x.limitCode)]);
  return withDigest({confidenceCode,confidenceClass,dimensions:{evidenceQuality,coverage,agreement,recency,resolution,missingness},basisReferences,aiConfidence:false,modelSelfAssessment:false,numericScore:null,deterministic:true},'confidenceDigest');
}

export function buildReadoutLineage(input,components,request){
  const lineageCode=required(request?.lineageCode,'RRE_LINEAGE_CODE_REQUIRED'); const prior=(request?.priorReadoutReferences??[]).map(x=>normalizeRef(x,'RRE_PRIOR_READOUT')); const priorTokens=prior.map(refToken);
  const defs=[['OBSERVATION_SUMMARY',components.observationSummary],['RUNTIME_SIGNATURE',components.runtimeSignature],['PATTERNS',components.patterns],['CONSTRAINTS',components.constraints],['LOAD',components.load],['STABILITY',components.stability],['DRIFT',components.drift],['RECOVERY',components.recovery],['UNKNOWN_RESOLUTION',components.unknownResolution],['CONFIDENCE',components.confidence]];
  const reality=[refToken(input.realityReference)]; const fields={EVIDENCE:input.evidenceReferences,OBSERVATION:input.observationReferences,PROJECTION:input.methodProjectionReferences,MEANING:input.meaningReferences,KNOWLEDGE:input.knowledgeReferences,PRIOR_READOUT:priorTokens};
  const conclusionFragments=defs.map(([type,component],i)=>({fragmentCode:`${lineageCode}-F${String(i+1).padStart(2,'0')}`,fragmentType:type,componentDigest:digestOf(component),realityReferences:reality,evidenceReferences:[...input.evidenceReferences],observationReferences:[...input.observationReferences],projectionReferences:[...input.methodProjectionReferences],meaningReferences:[...input.meaningReferences],knowledgeReferences:[...input.knowledgeReferences],priorReadoutReferences:[...priorTokens],componentSupportReferences:sortUnique([...collectSupport(component)]),missingLineageDimensions:Object.entries(fields).filter(([,v])=>v.length===0).map(([k])=>k)}));
  return withDigest({lineageCode,conclusionFragments,missingInputsRemainExplicit:true},'lineageDigest');
}

export function buildCanonicalRuntimeReadout(input,components,confidence,lineage,request,successor){
  const entry=successor?.successorEntries?.find(x=>x.runtimeCode==='RRE'&&x.subauthorityCode==='RRE_READOUT'); if(!entry||!entry.producedDataTypes.includes('REALITY_READOUT_RECORD')) throw new Error('RRE_READOUT_SUCCESSOR_AUTHORITY_REQUIRED');
  const readoutCode=required(request?.readoutCode,'RRE_READOUT_CODE_REQUIRED'); const readoutVersion=required(request?.readoutVersion,'RRE_READOUT_VERSION_REQUIRED'); const authorityReference=required(request?.authorityReference,'RRE_READOUT_AUTHORITY_REFERENCE_REQUIRED');
  const persistenceDecision=required(request?.persistenceDecision,'RRE_PERSISTENCE_DECISION_REQUIRED').toUpperCase(); const allowed=['DENY','REQUIRE_CONSENT','UNRESOLVED','ALLOW_SESSION','ALLOW_SERVICE_SCOPE']; if(!allowed.includes(persistenceDecision)) throw new Error(`RRE_PERSISTENCE_DECISION_INVALID:${persistenceDecision}`);
  const observationSummary={extractionCode:components.observationSummary.extractionCode,supportedCount:[components.observationSummary.observableStates,components.observationSummary.observableTransitions,components.observationSummary.observableDependencies,components.observationSummary.observablePersistence,components.observationSummary.observableLoad,components.observationSummary.observableConstraints].reduce((n,x)=>n+x.length,0),omittedUnsupported:components.observationSummary.omittedUnsupported,extractionDigest:components.observationSummary.extractionDigest};
  const persistentStoreWriteAllowed=['ALLOW_SESSION','ALLOW_SERVICE_SCOPE'].includes(persistenceDecision);
  return withDigest({schemaVersion:'PHI-OS-RRE-CANONICAL-RUNTIME-READOUT-v1.0.0',dataType:'REALITY_READOUT_RECORD',dataDomain:'REALITY_READOUT',readoutCode,readoutVersion,realityReference:clone(input.realityReference),observationSummary,runtimeSignature:clone(components.runtimeSignature),patterns:clone(components.patterns.patterns),constraints:clone(components.constraints.constraints),load:clone(components.load),stability:clone(components.stability),drift:clone(components.drift),recovery:clone(components.recovery),unknowns:clone(components.unknownResolution.unknowns),resolutionLimits:clone(components.unknownResolution.resolutionLimits),confidence:clone(confidence),lineage:clone(lineage),authorityReference,persistenceDecision,persistentStoreWriteAllowed,storageExecutionPerformed:false,diagnosisCreated:false,professionalJudgmentCreated:false,navigationDecisionCreated:false,metricCreated:false},'readoutDigest');
}

export function buildCprReadoutProjection(readout,request,targetRegistry,cprSurfaceRegistry){
  const projectionCode=required(request?.projectionCode,'RRE_CPR_PROJECTION_CODE_REQUIRED'); const projectionVersion=required(request?.projectionVersion,'RRE_CPR_PROJECTION_VERSION_REQUIRED'); const codes=sortUnique(request?.targetCodes??[]); if(!codes.length) throw new Error('RRE_CPR_TARGET_REQUIRED');
  const targets=codes.map(code=>{const def=targetRegistry.targets.find(x=>x.targetCode===code); if(!def) throw new Error(`RRE_CPR_TARGET_UNKNOWN:${code}`); const surface=cprSurfaceRegistry.entries.find(x=>x.projectionCode===def.cprSurface); if(!surface) throw new Error(`RRE_CPR_SURFACE_UNKNOWN:${def.cprSurface}`); return {targetCode:def.targetCode,targetRuntime:def.targetRuntime,cprSurface:def.cprSurface,handoffState:def.handoffState};});
  return withDigest({projectionCode,projectionVersion,sourceReadoutReference:{code:readout.readoutCode,version:readout.readoutVersion,digest:readout.readoutDigest},targets,cprPresentationCreated:false,cprRegistryWritten:false,surfaceActivated:false,reportCreated:false,professionalJudgmentCreated:false},'projectionDigest');
}

export function assertCanonicalReadoutDigest(readout){const copy=clone(readout); const digest=copy.readoutDigest; delete copy.readoutDigest; if(stableDigest(copy)!==digest) throw new Error('RRE_CANONICAL_READOUT_DIGEST_INVALID'); return true;}
