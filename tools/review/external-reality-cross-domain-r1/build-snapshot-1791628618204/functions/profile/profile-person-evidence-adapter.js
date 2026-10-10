const classes=Object.freeze({CUSTOMER_SELF_REPORT:'SELF_REPORTED',STANDARDIZED_SELF_REPORT:'STANDARDIZED_SELF_REPORT',MEASURED_TASK_PERFORMANCE:'MEASURED_TASK',EXTERNAL_PROFILE_RESULT:'EXTERNAL_ASSESSMENT'});
export function projectPersonEvidenceSignal(card,personId){
 if(!personId||!card?.signalRef)throw Error('PERSON_EVIDENCE_IDENTITY_REQUIRED');
 const nativeClass=card.sourceClass;if(!classes[nativeClass])throw Error('PERSON_EVIDENCE_SOURCE_NOT_ADMITTED');
 let sourceClass=classes[nativeClass];if(String(card.domainId||'').startsWith('FINANCIAL_CAPABILITY'))sourceClass='FINANCIAL_CAPABILITY';
 if(/CAREER_INTEREST|RIASEC/.test(card.domainId||'')||card.providerFamily==='O_NET')sourceClass='CAREER_INTEREST';
 return Object.freeze({kind:'PERSON_EVIDENCE_SIGNAL',signalId:card.signalRef,personId,sourceClass,nativeSourceClass:nativeClass,provider:card.providerFamily??null,domain:card.domainId??null,facet:card.facetId??null,observedAt:card.observedAt??null,assessmentDate:card.assessmentDate??null,value:structuredClone(card.value??null),range:structuredClone(card.range??null),confidence:card.confidence??null,provenance:structuredClone(card.provenance||[]),limitations:structuredClone(card.precisionBoundary||[]),freshnessState:card.freshness?.state??'UNKNOWN',realityFact:false});
}
export function projectProfilePersonEvidence(profileView,selectedEvidenceRefs=null){
 const cards=profileView?.signalCards||[];if(!profileView?.participantRef)throw Error('PERSON_EVIDENCE_IDENTITY_REQUIRED');
 const selected=selectedEvidenceRefs==null?null:new Set(selectedEvidenceRefs);
 if(selected&&[...selected].some(ref=>cards.filter(c=>c.signalRef===ref).length!==1))throw Error('PERSON_EVIDENCE_SELECTION_INVALID');
 return cards.filter(c=>(!selected||selected.has(c.signalRef))&&c.sourceClass!=='SYMBOLIC_INTERPRETATION').map(c=>projectPersonEvidenceSignal(c,profileView.participantRef));
}
