export const PERSONAL_EVIDENCE_REALITY_HANDOFF_SCHEMA='PHI-OS-PERSONAL-EVIDENCE-REALITY-HANDOFF-v1.0.0';
export const PERSONAL_EVIDENCE_DOMAIN_HANDOFF_SCHEMA='PHI-OS-PERSONAL-EVIDENCE-DOMAIN-HANDOFF-BUNDLE-v1.0.0';

const list=v=>Array.isArray(v)?v:[];
const unique=v=>[...new Set(list(v).filter(Boolean))];
const clean=v=>String(v??'').trim();
const freeze=v=>{if(v&&typeof v==='object'&&!Object.isFrozen(v)){Object.freeze(v);for(const x of Object.values(v))freeze(x)}return v};

export function buildPersonalEvidenceRealityHandoff({
  profileView=null,
  selectedEvidenceRefs=[],
  observationNote='',
  openQuestion=''
}={}){
  if(profileView?.schemaVersion!=='PHI-OS-PROGRESSIVE-PROFILE-VIEW-v1') throw new Error('PERSONAL_EVIDENCE_PROFILE_VIEW_REQUIRED');
  const cards=list(profileView.signalCards);
  const allowed=new Map(cards.map(x=>[x.signalRef,x]));
  const selected=unique(selectedEvidenceRefs).map(ref=>allowed.get(ref)).filter(Boolean);
  if(!selected.length) throw new Error('PERSONAL_EVIDENCE_EXPLICIT_SELECTION_REQUIRED');
  return freeze({
    schemaVersion:PERSONAL_EVIDENCE_REALITY_HANDOFF_SCHEMA,
    participantRef:profileView.participantRef||null,
    profileViewRef:profileView.profileViewId||null,
    customerSelected:true,
    automaticPersistence:false,
    selectedEvidenceRefs:selected.map(x=>x.signalRef),
    evidenceReferences:selected.map(x=>({
      sourceId:x.signalRef,
      sourceClass:x.sourceClass,
      providerFamily:x.providerFamily||null,
      assessmentDate:x.assessmentDate||null,
      domainId:x.domainId||null,
      facetId:x.facetId||null,
      statement:`${x.sourceLabel||x.sourceClass}: ${x.domainId||''}${x.facetId?` · ${x.facetId}`:''}`.trim(),
      realityFact:false
    })),
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
  const financialSignals=cards.filter(x=>x.domainId==='FINANCIAL_CAPABILITY'||x.sourceClass==='EXTERNAL_PROFILE_RESULT').map(x=>x.signalRef);
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
