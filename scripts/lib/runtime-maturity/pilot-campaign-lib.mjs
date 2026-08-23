import fs from 'node:fs';
import crypto from 'node:crypto';

export function readJson(path){ return JSON.parse(fs.readFileSync(path,'utf8')); }
export function sha256(path){ return crypto.createHash('sha256').update(fs.readFileSync(path)).digest('hex'); }
export function capabilityKey(runtimeCode, capabilityCode){ return `${runtimeCode}::${capabilityCode}`; }
export function emOrdinal(em){ const m=/^EM-(\d+)$/.exec(String(em||'')); return m?Number(m[1]):-1; }

function allStrings(value,out=[]){
  if(typeof value==='string') out.push(value);
  else if(Array.isArray(value)) for(const v of value) allStrings(v,out);
  else if(value && typeof value==='object') for(const v of Object.values(value)) allStrings(v,out);
  return out;
}
function hasForbiddenField(value, forbidden, found=[], prefix=''){
  if(!value || typeof value!=='object') return found;
  if(Array.isArray(value)){ value.forEach((v,i)=>hasForbiddenField(v,forbidden,found,`${prefix}[${i}]`)); return found; }
  for(const [k,v] of Object.entries(value)){
    const p=prefix?`${prefix}.${k}`:k;
    if(forbidden.has(k)) found.push(p);
    hasForbiddenField(v,forbidden,found,p);
  }
  return found;
}

export function buildMatrixIndex(matrix){
  return new Map((matrix.records||[]).map(r=>[capabilityKey(r.runtimeCode,r.capabilityCode),r]));
}

export function validatePilotCase(caseRecord,{candidateRegistry,stageRegistry,admissionContract,baseMatrix}){
  const errors=[];
  const candidate=(candidateRegistry.candidates||[]).find(c=>c.campaignCaseId===caseRecord?.campaignCaseId);
  if(!candidate) errors.push('UNKNOWN_CAMPAIGN_CASE');
  if(candidate && caseRecord?.product!==candidate.product) errors.push('PRODUCT_MISMATCH');
  for(const f of admissionContract.requiredFields||[]) if(caseRecord?.[f]===undefined || caseRecord?.[f]===null || caseRecord?.[f]==='') errors.push(`MISSING_REQUIRED_FIELD:${f}`);
  if(caseRecord?.realCaseAttestation?.synthetic!==false) errors.push('SYNTHETIC_CASE_FORBIDDEN');
  if(caseRecord?.privacyEnvelope?.rawPayloadStoredInRepository!==false) errors.push('RAW_PAYLOAD_IN_REPOSITORY_FORBIDDEN');
  const forbidden=new Set(admissionContract.forbiddenRepositoryFields||[]);
  for(const p of hasForbiddenField(caseRecord,forbidden)) errors.push(`FORBIDDEN_REPOSITORY_FIELD:${p}`);
  for(const s of allStrings(caseRecord)){
    if(/(^|[\\/])tests[\\/]fixtures([\\/]|$)/i.test(s) || /(^|[\\/])fixtures?([\\/]|$)/i.test(s)) errors.push(`FIXTURE_REFERENCE_FORBIDDEN:${s}`);
    if(/^https?:\/\//i.test(s) && /private|evidence|customer|consent/i.test(s)) errors.push(`PUBLIC_URL_PRIVATE_EVIDENCE_FORBIDDEN:${s}`);
  }
  const expected=(stageRegistry.products||[]).find(x=>x.product===caseRecord?.product)?.requiredStages||[];
  const actual=(caseRecord?.stageEvidence||[]).map(x=>x.stageCode);
  if(expected.length && JSON.stringify(expected)!==JSON.stringify(actual)) errors.push('VERTICAL_SLICE_STAGE_SEQUENCE_INCOMPLETE_OR_DRIFTED');
  for(const [i,s] of (caseRecord?.stageEvidence||[]).entries()){
    for(const f of ['stageCode','stageAuthority','runtimeVersion','inputReference','inputDigest','outputReference','outputDigest','executedAt','evidenceState']) if(s?.[f]===undefined || s?.[f]===null || s?.[f]==='') errors.push(`STAGE_${i}_MISSING:${f}`);
  }
  if(!Array.isArray(caseRecord?.runtimeCapabilities) || caseRecord.runtimeCapabilities.length===0) errors.push('NO_EXECUTED_RUNTIME_CAPABILITIES');
  const idx=buildMatrixIndex(baseMatrix);
  const executed=new Set();
  for(const c of caseRecord?.runtimeCapabilities||[]){
    if(!c.runtimeCode||!c.capabilityCode||!c.runtimeVersion) errors.push('RUNTIME_CAPABILITY_VERSION_BINDING_REQUIRED');
    else executed.add(capabilityKey(c.runtimeCode,c.capabilityCode));
  }
  for(const cap of candidate?.candidatePromotionCapabilities||[]){
    const rec=[...idx.values()].find(r=>r.capabilityCode===cap);
    if(!rec || emOrdinal(rec.evaluatedEM)!==2) errors.push(`PROMOTION_TARGET_PRIOR_EM2_REQUIRED:${cap}`);
    if(rec && !executed.has(capabilityKey(rec.runtimeCode,rec.capabilityCode))) errors.push(`PROMOTION_TARGET_NOT_EXECUTED:${cap}`);
  }
  if(caseRecord?.completionState!=='COMPLETED') errors.push('CASE_NOT_COMPLETED');
  if(!caseRecord?.consentReference) errors.push('EXPLICIT_CONSENT_REFERENCE_REQUIRED');
  if(!Array.isArray(caseRecord?.consentPurposeScopes) || caseRecord.consentPurposeScopes.length===0) errors.push('CONSENT_PURPOSE_SCOPE_REQUIRED');
  if(candidate?.product==='DAR' && !caseRecord?.consentPurposeScopes?.includes('WILL_ASSEMBLY')) errors.push('DAR_WILL_ASSEMBLY_CONSENT_SCOPE_REQUIRED');
  if(candidate?.product==='FINANCIAL') for(const scope of ['FINANCIAL_PLANNING','PROFESSIONAL_REVIEW','REPORT']) if(!caseRecord?.consentPurposeScopes?.includes(scope)) errors.push(`FINANCIAL_CONSENT_SCOPE_REQUIRED:${scope}`);
  if(candidate?.product==='RRP' && caseRecord?.consentPurposeScopes?.some(x=>x==='EXPLICIT_PURPOSE_BOUND_RUNTIME_CONSENT')) errors.push('RRP_PLACEHOLDER_CONSENT_SCOPE_FORBIDDEN');
  for(const f of candidate?.requiredProductBindings||[]){ const v=caseRecord?.productBindings?.[f]; if(v===undefined || v===null || v==='' || (Array.isArray(v)&&v.length===0)) errors.push(`PRODUCT_BINDING_REQUIRED:${f}`); }
  if(!caseRecord?.customerReference) errors.push('OPAQUE_CUSTOMER_REFERENCE_REQUIRED');
  if(!caseRecord?.privacyEnvelope?.privateStorageReference) errors.push('PRIVATE_STORAGE_REFERENCE_REQUIRED');
  if(!caseRecord?.realCaseAttestation?.sourceSystemReference) errors.push('REAL_CASE_SOURCE_REFERENCE_REQUIRED');
  if((caseRecord?.humanInterventions||[]).some(x=>x?.hidden===true)) errors.push('HIDDEN_MANUAL_REPAIR_FORBIDDEN');
  return {qualifying:errors.length===0, errors:[...new Set(errors)]};
}

export function evaluateCapabilityPromotions(caseRecord,{candidateRegistry,baseMatrix}){
  const candidate=(candidateRegistry.candidates||[]).find(c=>c.campaignCaseId===caseRecord.campaignCaseId);
  const idx=buildMatrixIndex(baseMatrix);
  const executed=new Set((caseRecord.runtimeCapabilities||[]).map(c=>capabilityKey(c.runtimeCode,c.capabilityCode)));
  const promotions=[];
  for(const code of candidate?.candidatePromotionCapabilities||[]){
    const rec=[...idx.values()].find(r=>r.capabilityCode===code);
    if(rec && rec.evaluatedEM==='EM-2' && executed.has(capabilityKey(rec.runtimeCode,rec.capabilityCode))) promotions.push({runtimeCode:rec.runtimeCode,capabilityCode:rec.capabilityCode,from:'EM-2',to:'EM-3',pilotCaseId:caseRecord.pilotCaseId});
  }
  return promotions;
}
