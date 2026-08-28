import {SMR_R2_SECTION_RULES} from './smr-r2-w6-w8-rules.js';

const list=value=>Array.isArray(value)?value:[];
const uniq=value=>[...new Set(list(value).filter(Boolean))];
const freeze=value=>{if(value&&typeof value==='object'&&!Object.isFrozen(value)){Object.freeze(value);for(const item of Object.values(value))freeze(item)}return value};
function fail(code,details={}){throw Object.assign(new Error(code),{code,...details})}
function claimSubject(claim){return String(claim?.semanticDimension||'').split(':').at(-1)?.toUpperCase()||''}
function relationState(claim){
  if(['SUPPORT'].includes(claim.claimType))return 'SUPPORT';
  if(['TENSION'].includes(claim.claimType))return 'TENSION';
  if(['CONDITION','TEMPORAL_ACTIVATION'].includes(claim.claimType))return 'CONDITIONAL';
  if(['TRADEOFF'].includes(claim.claimType))return 'COUNTERBALANCED';
  if(['OPEN'].includes(claim.claimType))return 'OPEN';
  return null;
}
function relationRef(claim){const state=relationState(claim);return state?`SMR2-REL:${state}:${claim.claimId}`:null}
function conditionRefs(claim){
  const refs=uniq(claim.conditions);
  if(['CONDITION','TEMPORAL_ACTIVATION'].includes(claim.claimType))refs.unshift(`SMR2-CONDITION:${claim.claimId}`);
  return uniq(refs);
}
function observationRefs(claim){
  const refs=[];
  if(claim.claimType==='OBSERVATION')refs.push(`SMR2-OBSERVATION:${claim.claimId}`);
  for(const value of uniq(claim.conditions))if(String(value).startsWith('QUESTION:')||String(value).startsWith('OBSERVATION:'))refs.push(String(value));
  return uniq(refs);
}
function technicalRefsFor(selector,claims,priorityResolution){
  if(selector==='TECHNICAL_METHOD')return uniq(claims.flatMap(claim=>claim.interpretationUnitRefs));
  if(selector==='TECHNICAL_SOURCE')return uniq(claims.flatMap(claim=>[...list(claim.lineage?.projectionRefs),...list(claim.lineage?.meaningRefs),...list(claim.lineage?.boundaryRefs)]));
  if(selector==='TECHNICAL_RULE')return uniq(claims.flatMap(claim=>list(claim.lineage?.ruleRefs)));
  if(selector==='TECHNICAL_CALCULATION')return uniq([priorityResolution.readingAuthorityRef,priorityResolution.semanticDigest]);
  return [];
}
function hasConditionalDestination(claim){
  const domains=list(claim.customerDomains);
  return claim.claimType==='TEMPORAL_ACTIVATION'||domains.some(domain=>['WORK_RESOURCES','RELATIONSHIP_EXCHANGE','ENVIRONMENT_DIRECTION','REGULATION_PRESSURE'].includes(domain));
}
function candidatesFor(config,{claims,firstScreenClaimRefs}){
  const first=new Set(firstScreenClaimRefs);
  if(config.selector==='FIRST_SCREEN')return claims.filter(claim=>first.has(claim.claimId));
  if(config.selector==='REMAINING_ELIGIBLE_CLAIMS')return claims.filter(claim=>!first.has(claim.claimId)&&!['SUPPRESS','TECHNICAL'].includes(claim.priorityClass)&&!hasConditionalDestination(claim));
  if(config.selector==='RELATIONAL_CLAIMS')return claims.filter(claim=>relationState(claim)||list(claim.counterEvidenceRefs).length||list(claim.conditions).length);
  if(config.selector==='OBSERVATION_REFS')return claims.filter(claim=>observationRefs(claim).length);
  if(config.selector==='DOMAIN')return claims.filter(claim=>list(claim.customerDomains).some(domain=>list(config.domains).includes(domain)));
  if(config.selector==='WORK_DOMAIN')return claims.filter(claim=>list(claim.customerDomains).some(domain=>list(config.domains).includes(domain))&&!list(config.excludedSubjectTokens).some(token=>claimSubject(claim).includes(token)));
  if(config.selector==='RESOURCE_DOMAIN')return claims.filter(claim=>list(claim.customerDomains).some(domain=>list(config.domains).includes(domain))&&list(config.subjectTokens).some(token=>claimSubject(claim).includes(token)));
  if(config.selector==='TEMPORAL')return claims.filter(claim=>claim.claimType==='TEMPORAL_ACTIVATION');
  return [];
}
function subtractNew(refs,seen){return uniq(refs).filter(ref=>!seen.has(ref))}
function addSeen(refs,seen){for(const ref of refs)seen.add(ref)}

export function resolveSectionInformationGain({priorityResolution,themeCollection=null}={}){
  if(priorityResolution?.schemaVersion!=='PHI-OS-CUSTOMER-READING-PRIORITY-RESOLUTION-v1.0.0')fail('SMR_R2_PRIORITY_RESOLUTION_REQUIRED');
  if(themeCollection&&themeCollection.schemaVersion!=='PHI-OS-CUSTOMER-THEME-IR-COLLECTION-v1.0.0')fail('SMR_R2_THEME_COLLECTION_INVALID');
  const claims=list(priorityResolution.claims);
  if(!claims.length)fail('SMR_R2_INFORMATION_GAIN_CLAIMS_REQUIRED');
  const claimById=new Map(claims.map(claim=>[claim.claimId,claim]));
  const themeByClaim=new Map();
  for(const theme of list(themeCollection?.themes))for(const ref of list(theme.claimRefs)){if(!themeByClaim.has(ref))themeByClaim.set(ref,[]);themeByClaim.get(ref).push(theme.themeId)}
  const seen={claims:new Set(),relations:new Set(),conditions:new Set(),counterEvidence:new Set(),observations:new Set()};
  const sections=[];
  for(const config of SMR_R2_SECTION_RULES.sections){
    const isTechnical=config.sectionClass==='TECHNICAL';
    const candidateClaims=isTechnical?claims:candidatesFor(config,{claims,firstScreenClaimRefs:priorityResolution.firstScreenClaimRefs});
    const rawClaimRefs=uniq(candidateClaims.map(claim=>claim.claimId));
    const rawRelationRefs=uniq(candidateClaims.map(relationRef));
    const rawConditionRefs=uniq(candidateClaims.flatMap(conditionRefs));
    const rawCounterEvidenceRefs=uniq(candidateClaims.flatMap(claim=>list(claim.counterEvidenceRefs)));
    const rawObservationRefs=uniq(candidateClaims.flatMap(observationRefs));
    const claimGainAllowed=!isTechnical&&!['RELATIONAL_CLAIMS','OBSERVATION_REFS'].includes(config.selector);
    const relationGainAllowed=!isTechnical&&config.selector==='RELATIONAL_CLAIMS';
    const conditionGainAllowed=!isTechnical&&config.selector==='RELATIONAL_CLAIMS';
    const counterGainAllowed=!isTechnical&&config.selector==='RELATIONAL_CLAIMS';
    const observationGainAllowed=!isTechnical&&config.selector==='OBSERVATION_REFS';
    const newClaimRefs=claimGainAllowed?subtractNew(rawClaimRefs,seen.claims):[];
    const newRelationRefs=relationGainAllowed?subtractNew(rawRelationRefs,seen.relations):[];
    const newConditionRefs=conditionGainAllowed?subtractNew(rawConditionRefs,seen.conditions):[];
    const newCounterEvidenceRefs=counterGainAllowed?subtractNew(rawCounterEvidenceRefs,seen.counterEvidence):[];
    const newObservationRefs=observationGainAllowed?subtractNew(rawObservationRefs,seen.observations):[];
    const bodyGainCount=newClaimRefs.length+newRelationRefs.length+newConditionRefs.length+newCounterEvidenceRefs.length+newObservationRefs.length;
    const technicalDisclosureRefs=isTechnical?technicalRefsFor(config.selector,claims,priorityResolution):[];
    const eligibility=bodyGainCount>0?'SECTION_ELIGIBLE':'SECTION_NOT_ELIGIBLE';
    if(eligibility==='SECTION_ELIGIBLE'){
      addSeen(newClaimRefs,seen.claims);addSeen(newRelationRefs,seen.relations);addSeen(newConditionRefs,seen.conditions);addSeen(newCounterEvidenceRefs,seen.counterEvidence);addSeen(newObservationRefs,seen.observations);
    }
    const effectiveClass=eligibility==='SECTION_NOT_ELIGIBLE'&&!isTechnical?'SUPPRESSED':config.sectionClass;
    sections.push(freeze({
      sectionId:config.sectionId,order:config.order,sectionClass:effectiveClass,configuredSectionClass:config.sectionClass,eligibility,
      newClaimRefs,newRelationRefs,newConditionRefs,newCounterEvidenceRefs,newObservationRefs,
      candidateClaimRefs:rawClaimRefs,
      themeRefs:uniq(rawClaimRefs.flatMap(ref=>themeByClaim.get(ref)||[])),
      technicalDisclosureRefs,
      technicalAppendixEligible:isTechnical&&technicalDisclosureRefs.length>0,
      defaultCollapsed:isTechnical,
      informationGainCount:bodyGainCount,
      eligibilityReasonRefs:eligibility==='SECTION_ELIGIBLE'?uniq([
        ...(newClaimRefs.length?[`NEW_CLAIMS:${newClaimRefs.length}`]:[]),
        ...(newRelationRefs.length?[`NEW_RELATIONS:${newRelationRefs.length}`]:[]),
        ...(newConditionRefs.length?[`NEW_CONDITIONS:${newConditionRefs.length}`]:[]),
        ...(newCounterEvidenceRefs.length?[`NEW_COUNTER_EVIDENCE:${newCounterEvidenceRefs.length}`]:[]),
        ...(newObservationRefs.length?[`NEW_OBSERVATIONS:${newObservationRefs.length}`]:[])
      ]):['NO_NEW_CUSTOMER_INFORMATION'],
      boundary:freeze({rendererEligibility:false,semanticFillerAllowed:false,technicalDisclosureIsBodyInformationGain:false})
    }));
  }
  const eligibleSections=sections.filter(section=>section.eligibility==='SECTION_ELIGIBLE');
  for(const section of sections){
    if(section.eligibility==='SECTION_NOT_ELIGIBLE'&&section.informationGainCount!==0)fail('SMR_R2_INFORMATION_GAIN_STATE_INCONSISTENT',{sectionId:section.sectionId});
  }
  return freeze({
    schemaVersion:'PHI-OS-SMR-R2-SECTION-INFORMATION-GAIN-v1.0.0',
    methodId:priorityResolution.methodId,readingAuthorityRef:priorityResolution.readingAuthorityRef,semanticDigest:priorityResolution.semanticDigest,
    rulesVersion:SMR_R2_SECTION_RULES.schemaVersion,
    sections,eligibleSectionRefs:eligibleSections.map(section=>section.sectionId),
    suppressedSectionRefs:sections.filter(section=>section.eligibility==='SECTION_NOT_ELIGIBLE'&&section.configuredSectionClass!=='TECHNICAL').map(section=>section.sectionId),
    technicalAppendixRefs:sections.filter(section=>section.technicalAppendixEligible).map(section=>section.sectionId),
    boundary:freeze({deterministic:true,emptyValueSections:0,rendererMayCreateSection:false,conditionalSectionsRequireInformationGain:true,timingRequiresTemporalClaim:true})
  });
}
