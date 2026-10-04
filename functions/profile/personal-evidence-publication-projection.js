import {buildPersonalEvidenceDossierProjection} from './personal-evidence-dossier-projection.js';

export const PERSONAL_EVIDENCE_PUBLICATION_SCHEMA='PHI-OS-PERSONAL-EVIDENCE-PUBLICATION-PROJECTION-v1.0.0';

const list=v=>Array.isArray(v)?v:[];
const unique=v=>[...new Set(list(v).filter(Boolean))];
const freeze=v=>{if(v&&typeof v==='object'&&!Object.isFrozen(v)){Object.freeze(v);for(const x of Object.values(v))freeze(x)}return v};

export function buildPersonalEvidencePublicationProjection({
  profileView=null,
  visualProjection=null,
  locale='en',
  consentReferences=[]
}={}){
  if(profileView?.schemaVersion!=='PHI-OS-PROGRESSIVE-PROFILE-VIEW-v1') throw new Error('PERSONAL_EVIDENCE_PROFILE_VIEW_REQUIRED');
  const dossier=buildPersonalEvidenceDossierProjection({
    visualProjection,
    participantRef:profileView.participantRef,
    asOfDate:profileView.asOfDate
  });
  const signalRefs=unique(list(profileView.signalCards).map(x=>x?.signalRef));
  const pfigRefs=unique(dossier.sections.flatMap(section=>section.pfigs.map(fig=>fig?.pfig)));
  const boundaries=unique(profileView.boundaries);
  const consentRefs=unique(consentReferences);
  const rrSections=[
    {
      sectionCode:'EVIDENCE',
      authority:'PROFILE_PPR_REFERENCE_PENDING_RRE_ADMISSION',
      dataType:'CAPABILITY_EVIDENCE_REFERENCE',
      references:[...signalRefs,...pfigRefs],
      assemblyMode:'REFERENCE_ONLY'
    },
    {
      sectionCode:'UNKNOWN',
      authority:'RRE',
      dataType:'REALITY_READOUT_RECORD',
      references:list(profileView.signalCards).filter(x=>x?.freshness?.state==='UNDATED'||x?.freshness?.state==='OLD_RESULT').map(x=>x.signalRef),
      assemblyMode:'REFERENCE_ONLY'
    },
    {
      sectionCode:'BOUNDARY',
      authority:'RDG',
      dataType:'GOVERNANCE_RECORD',
      references:boundaries.map((_,i)=>`PROFILE_BOUNDARY_${i+1}`),
      assemblyMode:'REFERENCE_ONLY'
    }
  ];
  return freeze({
    schemaVersion:PERSONAL_EVIDENCE_PUBLICATION_SCHEMA,
    reportCode:'PERSONAL_EVIDENCE_DOSSIER',
    reportClass:'EVIDENCE_DOSSIER_NOT_METHOD_REPORT',
    participantRef:profileView.participantRef||null,
    locale:locale==='zh-Hans'?'zh-Hans':'en',
    sourceProfileViewRef:profileView.profileViewId||null,
    sourceSemanticDigest:profileView.semanticDigest||null,
    consentReferences:consentRefs,
    rrEligibility:{
      publicationProjectionReady:signalRefs.length>0&&consentRefs.length>0,
      rrHandoffReady:false,
      rrHandoffBlock:'PROFILE_PPR_NOT_DIRECTLY_ADMITTED_BY_RR_EVIDENCE_SECTION',
      canonicalReportCreated:false,
      reviewPassed:false,
      approved:false,
      released:false
    },
    rrAssembly:{
      serviceContractReference:'PRD-W6-PERSONAL-EVIDENCE-DOSSIER-PROJECTION',
      allowedChannels:['HTML','PDF','WORKSPACE'],
      sections:rrSections,
      sourceReferences:[
        ...signalRefs.map(ref=>({ref,authority:'PROFILE_PPR',kind:'PROFILE_SIGNAL_REFERENCE'})),
        ...pfigRefs.map(ref=>({ref,authority:'PVP_R1',kind:'PFIG_PROJECTION_REFERENCE'}))
      ]
    },
    presentationPlan:{
      staticPages:dossier.staticPages,
      sections:dossier.sections.map(section=>({
        section:section.section,
        master:section.master,
        body:section.body,
        sectionStyle:section.sectionStyle,
        pfigRefs:section.pfigs.map(x=>x.pfig),
        sourceKeys:section.sourceKeys,
        repeatMasterEditorialCopy:false
      }))
    },
    governance:{
      evidenceTruthOwner:'PROFILE_PPR',
      reportAssemblyOwner:'RR',
      rrEvidenceAdmissionRequired:true,
      presentationOwner:'CPR',
      publicationProjectionCreatesMeaning:false,
      publicationProjectionCreatesJudgment:false,
      publicationProjectionCreatesRecommendation:false,
      rawSectionContentIncluded:false,
      liveLlmRequired:false,
      liveProviderWritingRequired:false
    }
  });
}
