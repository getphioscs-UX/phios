import {
  resolvePersonalEvidenceStaticPage,
  resolvePersonalEvidenceSectionMaster,
  resolvePersonalEvidenceSharedVisual
} from './personal-evidence-visual-assets.js';

export const PERSONAL_EVIDENCE_DOSSIER_PROJECTION_SCHEMA='PHI-OS-PERSONAL-EVIDENCE-DOSSIER-PROJECTION-v1.0.0';

const PFIG_PRIMARY=Object.freeze({
  'PFIG-001':'SEC-01',
  'PFIG-002':'SEC-07',
  'PFIG-003':'SEC-03',
  'PFIG-004':'SEC-09',
  'PFIG-005':'SEC-09',
  'PFIG-006':'SEC-06',
  'PFIG-007':'SEC-05',
  'PFIG-008':'SEC-04',
  'PFIG-009':'SEC-09'
});

const SECTION_SOURCE_KEYS=Object.freeze({
  'SEC-01':['profileOverview','sourceScopedDimensions'],
  'SEC-02':['sourceLegend','sourceScopedDimensions','provenance'],
  'SEC-03':['tensionSignals','confirmations'],
  'SEC-04':['decisionEvidence','currentReality'],
  'SEC-05':['relationshipEvidence'],
  'SEC-06':['careerInterest','workObservations'],
  'SEC-07':['sourceScopedDimensions','assessmentResults'],
  'SEC-08':['financialSummary','externalProfileResults'],
  'SEC-09':['contextEvidence','crossSource','contradictions','realityQuestions'],
  'SEC-10':['boundaries','unknowns','provenance','limitations']
});

const clone=v=>v==null?v:JSON.parse(JSON.stringify(v));

export function buildPersonalEvidenceDossierProjection({visualProjection=null,participantRef=null,asOfDate=null}={}){
  const figures=Array.isArray(visualProjection?.figures)?visualProjection.figures:[];
  const bySection=new Map(Array.from({length:10},(_,i)=>[`SEC-${String(i+1).padStart(2,'0')}`,[]]));
  for(const figure of figures){
    const section=PFIG_PRIMARY[figure?.pfig];
    if(section) bySection.get(section).push(clone(figure));
  }
  const staticPages=['P01','P02','P03','P04','P05'].map(resolvePersonalEvidenceStaticPage);
  const body=resolvePersonalEvidenceSharedVisual('BODY');
  const sectionStyle=resolvePersonalEvidenceSharedVisual('SECTION_STYLE');
  const sections=[...bySection.keys()].map(section=>Object.freeze({
    section,
    master:resolvePersonalEvidenceSectionMaster(section),
    body,
    sectionStyle,
    pfigs:Object.freeze(bySection.get(section)),
    sourceKeys:Object.freeze([...(SECTION_SOURCE_KEYS[section]||[])]),
    rules:Object.freeze({
      masterIsFullPageOpener:true,
      repeatMasterEditorialCopy:false,
      renderPfigOnlyInPrimarySection:true
    })
  }));
  return Object.freeze({
    schemaVersion:PERSONAL_EVIDENCE_DOSSIER_PROJECTION_SCHEMA,
    participantRef:participantRef||visualProjection?.participantRef||null,
    asOfDate:asOfDate||visualProjection?.asOfDate||null,
    staticPages:Object.freeze(staticPages),
    sections:Object.freeze(sections),
    governance:Object.freeze({
      sourceTruthOwner:'PROFILE_PPR',
      pfigProjectionOwner:'PVP_R1',
      dossierProjectionCreatesMeaning:false,
      sharedBilingualStaticVisuals:true,
      pfigCountExpected:9,
      missingEvidenceMayBeInvented:false,
      automaticPersistenceAllowed:false
    })
  });
}

export const PERSONAL_EVIDENCE_PFIG_PRIMARY_SECTION=PFIG_PRIMARY;
export const PERSONAL_EVIDENCE_SECTION_SOURCE_KEYS=SECTION_SOURCE_KEYS;
