export const PERSONAL_EVIDENCE_REALITY_HANDOFF_SCHEMA='PHI-OS-PERSONAL-EVIDENCE-REALITY-HANDOFF-v1.0.0';
export const PERSONAL_EVIDENCE_DOMAIN_HANDOFF_SCHEMA='PHI-OS-PERSONAL-EVIDENCE-DOMAIN-HANDOFF-BUNDLE-v1.0.0';

const list=v=>Array.isArray(v)?v:[];
const unique=v=>[...new Set(list(v).filter(Boolean))];
const clean=v=>String(v??'').trim();
const freeze=v=>{if(v&&typeof v==='object'&&!Object.isFrozen(v)){Object.freeze(v);for(const x of Object.values(v))freeze(x)}return v};
export function preservePersonalEvidenceReference(x={}){
  return {sourceId:clean(x.sourceId||x.signalRef),sourceClass:clean(x.sourceClass),providerFamily:x.providerFamily||null,
    assessmentDate:x.assessmentDate||null,observedAt:x.observedAt||null,domainId:x.domainId||null,facetId:x.facetId||null,
    nativeValue:structuredClone(x.nativeValue??x.value??null),context:structuredClone(x.context??null),
    confirmationState:x.confirmationState||null,provenance:structuredClone(x.provenance||[]),precisionBoundary:structuredClone(x.precisionBoundary||[]),
    realityQuestion:x.realityQuestion||null,unknownState:x.unknownState||'OPEN',statement:clean(x.statement)||`${x.sourceLabel||x.sourceClass}: ${x.domainId||''}${x.facetId?` · ${x.facetId}`:''}`.trim(),realityFact:false};
}
export function selectPersonalEvidenceHandoffReferences(view){
  if(view?.customerSelected!==true||view?.automaticPersistence!==false)throw new Error('PERSONAL_EVIDENCE_SELECTION_REQUIRED');
  const selected=unique(view.selectedEvidenceRefs),references=list(view.evidenceReferences);
  if(!selected.length||selected.some(ref=>references.filter(x=>x.sourceId===ref).length!==1))throw new Error('PERSONAL_EVIDENCE_SELECTION_MISMATCH');
  return selected.map(ref=>preservePersonalEvidenceReference(references.find(x=>x.sourceId===ref)));
}

export function buildPersonalEvidenceRealityHandoff({
  profileView=null,
  selectedEvidenceRefs=[],
  observationNote='',
  openQuestion='',
  selectionAction='KEEP_EVIDENCE'
}={}){
  if(profileView?.schemaVersion!=='PHI-OS-PROGRESSIVE-PROFILE-VIEW-v1') throw new Error('PERSONAL_EVIDENCE_PROFILE_VIEW_REQUIRED');
  const cards=list(profileView.signalCards);
  const allowed=new Map(cards.map(x=>[x.signalRef,x]));
  const selected=unique(selectedEvidenceRefs).map(ref=>allowed.get(ref)).filter(Boolean);
  if(!selected.length) throw new Error('PERSONAL_EVIDENCE_EXPLICIT_SELECTION_REQUIRED');
  if(unique(selectedEvidenceRefs).some(ref=>!allowed.has(ref)))throw new Error('PERSONAL_EVIDENCE_SELECTION_MISMATCH');
  if(!['KEEP_EVIDENCE','COMPARE_CURRENT_REALITY','OBSERVATION_TARGET','OPEN_QUESTION'].includes(selectionAction))throw new Error('PERSONAL_EVIDENCE_SELECTION_ACTION_INVALID');
  return freeze({
    schemaVersion:PERSONAL_EVIDENCE_REALITY_HANDOFF_SCHEMA,
    participantRef:profileView.participantRef||null,
    profileViewRef:profileView.profileViewId||null,
    customerSelected:true,
    selectionAction,
    automaticPersistence:false,
    selectedEvidenceRefs:selected.map(x=>x.signalRef),
    evidenceReferences:selected.map(preservePersonalEvidenceReference),
    observationNote:clean(observationNote),
    openQuestion:clean(openQuestion),
    governance:{
      explicitSelection:true,
      explicitConsentStillRequiredAtApi:true,
      fullDossierTransferred:false,
      assessmentBecomesRealityFact:false,
      automaticPersistence:false
    }
  });
}

function figBy(visualProjection,id){return list(visualProjection?.figures).find(x=>x?.pfig===id)||null;}
function envelope(target,route,evidenceRefs,rules,extra={}){return freeze({
  schemaVersion:'PHI-OS-PERSONAL-EVIDENCE-DOMAIN-HANDOFF-v1.0.0',
  target,route,evidenceRefs:unique(evidenceRefs),state:unique(evidenceRefs).length?'AVAILABLE':'EMPTY',
  customerActionRequired:true,automaticPersistence:false,...extra,
  governance:{referenceOnly:true,targetMutation:false,targetFactCreated:false,...rules}
});}

export function buildPersonalEvidenceDomainHandoffs({
  profileView=null,
  visualProjection=null,
  financialSummary=null
}={}){
  if(profileView?.schemaVersion!=='PHI-OS-PROGRESSIVE-PROFILE-VIEW-v1') throw new Error('PERSONAL_EVIDENCE_PROFILE_VIEW_REQUIRED');
  const relationship=figBy(visualProjection,'PFIG-007');
  const work=figBy(visualProjection,'PFIG-006');
  const decision=figBy(visualProjection,'PFIG-008');
  const cards=list(profileView.signalCards);
  const financialSignals=cards.filter(x=>x.domainId==='FINANCIAL_CAPABILITY'||String(x.domainId||'').startsWith('FINANCIAL_CAPABILITY::')).map(x=>x.signalRef);
  return freeze({
    schemaVersion:PERSONAL_EVIDENCE_DOMAIN_HANDOFF_SCHEMA,
    participantRef:profileView.participantRef||null,
    relationship:envelope(
      'RELATIONSHIP_CURRENT_REALITY_EVIDENCE','/perspectives/relationship/',
      relationship?.state==='READY'?relationship.evidenceRefs:[],
      {compatibilityScoreAllowed:false,partnerHiddenStateInferenceAllowed:false,targetPurposeAndConsentRequired:true},
      {sourcePfig:'PFIG-007'}
    ),
    career:envelope(
      'PERSONAL_REALITY_CAREER_CONTEXT','/perspectives/personal/',
      work?.state==='READY'?work.evidenceRefs:[],
      {jobFitVerdictAllowed:false,employmentGuaranteeAllowed:false,currentRealityRequiredForRealityClaim:true},
      {sourcePfig:'PFIG-006'}
    ),
    financial:envelope(
      'FINANCIAL_REALITY_CONTEXT_CANDIDATE','/professional/financial/',
      [...financialSignals,...(decision?.state==='READY'?decision.evidenceRefs:[])],
      {fdrFactCreated:false,directFarInputAllowed:false,financialAdviceAllowed:false,fdrIntakeAndConsentRequired:true},
      {sourcePfig:decision?.state==='READY'?'PFIG-008':null,financialCapabilityPresent:Boolean(financialSummary)}
    )
  });
}

export function preparePersonalEvidenceDomainHandoff({bundle,targetDomain,purpose,selectedEvidenceRefs=[],consentRef,time,explicitConsent=false,otherParticipantRef=null}={}){
  const target={RELATIONSHIP:'relationship',CAREER:'career',FINANCIAL:'financial'}[targetDomain];
  const lane=target&&bundle?.[target];
  if(!lane)throw new Error('PERSONAL_EVIDENCE_TARGET_DOMAIN_INVALID');
  if(explicitConsent!==true||!clean(consentRef)||!clean(purpose)||!Number.isFinite(Date.parse(time)))throw new Error('PERSONAL_EVIDENCE_TARGET_CONSENT_REQUIRED');
  const selected=unique(selectedEvidenceRefs);
  if(!selected.length||selected.some(ref=>!lane.evidenceRefs.includes(ref)))throw new Error('PERSONAL_EVIDENCE_TARGET_SELECTION_INVALID');
  if(otherParticipantRef&&otherParticipantRef===bundle.participantRef)throw new Error('PERSONAL_EVIDENCE_PARTICIPANTS_MUST_DIFFER');
  return freeze({purpose:clean(purpose),targetDomain,selectedEvidenceRefs:selected,consentRef:clean(consentRef),time:new Date(time).toISOString(),
    participantRef:bundle.participantRef,otherParticipantRef,route:lane.route,lane:targetDomain==='RELATIONSHIP'?'SEPARATE_PROFILE_EVIDENCE_LANE':lane.target,
    targetMutation:false,automaticPersistence:false,contextProjectionOnly:true,governance:lane.governance});
}

export function buildPersonalEvidenceFinancialContext({profileView,selectedEvidenceRefs=[]}={}){
  if(profileView?.schemaVersion!=='PHI-OS-PROGRESSIVE-PROFILE-VIEW-v1')throw new Error('PERSONAL_EVIDENCE_PROFILE_VIEW_REQUIRED');
  const cards=list(profileView.signalCards).filter(x=>unique(selectedEvidenceRefs).includes(x.signalRef));
  if(cards.length!==unique(selectedEvidenceRefs).length)throw new Error('PERSONAL_EVIDENCE_FINANCIAL_SELECTION_INVALID');
  return freeze({participantRef:profileView.participantRef,financialCapabilityEvidenceRefs:cards.filter(x=>String(x.domainId).startsWith('FINANCIAL_CAPABILITY')).map(x=>x.signalRef),
    contextualEvidence:cards.map(preservePersonalEvidenceReference),limitations:['CONTEXT_ONLY','NOT_FDR_FACT','NOT_FCR_CALCULATION','NOT_FAR_INPUT','NOT_FINANCIAL_ADVICE'],
    farAdmission:false,fdrMutation:false,fcrMutation:false,automaticPersistence:false});
}
