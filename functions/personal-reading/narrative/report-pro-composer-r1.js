import {deepFreeze,sha256Stable} from '../../interpretation-runtime/mir7-utils.js';
import {composeReportSectionT3,REPORT_SECTION_T3_COMPOSER_VERSION} from './report-section-t3-composer.js';
import {REPORT_SECTION_SEMANTIC_VERIFIER_VERSION} from './report-section-semantic-verifier.js';
import {createCustomerDeliverySnapshot} from './report-section-snapshot.js';
import {reportProReference} from './report-pro-reference-registry.js';

export const REPORT_PRO_COMPOSER_R1_VERSION='PHI-OS-REPORT-PRO-COMPOSER-R1-v1.0.0';
const registry=Object.freeze({methods:Object.freeze([
  Object.freeze({methodId:'BZR',name:'BaZi',referenceState:'ACTIVE'}),
  Object.freeze({methodId:'ZWR',name:'Zi Wei',referenceState:'ACTIVE'}),
  Object.freeze({methodId:'AST',name:'Astrology',referenceState:'REQUIRED'}),
  Object.freeze({methodId:'NUM',name:'Numerology',referenceState:'REQUIRED'}),
  Object.freeze({methodId:'PROFILE',name:'Profile',referenceState:'REQUIRED'}),
  Object.freeze({methodId:'ECR',name:'Embodied Configuration',referenceState:'REQUIRED'}),
  Object.freeze({methodId:'HD',name:'Human Design',referenceState:'REQUIRED'}),
  Object.freeze({methodId:'CROSS',name:'Incarnation Cross',referenceState:'REQUIRED'})
])});

function fail(code,details={}){const e=new Error(code);e.code=code;e.details=details;throw e;}
function methodPolicy(methodId){return (registry.methods||[]).find(x=>x.methodId===methodId)||null;}

export function assertReferenceGovernance({brief,reference}={}){
  reference=reference||reportProReference(brief?.methodId);
  const policy=methodPolicy(brief?.methodId);
  if(!policy)fail('REPORT_PRO_METHOD_NOT_REGISTERED',{methodId:brief?.methodId||null});
  if(policy.referenceState!=='ACTIVE')fail('REPORT_PRO_REFERENCE_NOT_ADMITTED',{methodId:brief.methodId,referenceState:policy.referenceState});
  if(!reference||reference.accepted!==true)fail('REPORT_PRO_HUMAN_ACCEPTED_REFERENCE_REQUIRED',{methodId:brief.methodId});
  if(reference.methodId!==brief.methodId)fail('REPORT_PRO_REFERENCE_METHOD_MISMATCH');
  if(reference.locale&&reference.locale!==brief.locale)fail('REPORT_PRO_REFERENCE_LOCALE_MISMATCH');
  if(!reference.referenceId||!reference.qualityContract)fail('REPORT_PRO_REFERENCE_CONTRACT_REQUIRED');
  return deepFreeze({policy,reference});
}

async function governedBrief(brief,reference){
  const {briefSemanticDigest:previousBriefSemanticDigest,...baseBrief}=brief;
  const seed={
    ...baseBrief,
    predecessorBriefSemanticDigest:previousBriefSemanticDigest||null,
    referenceGovernance:{
      schemaVersion:'PHI-OS-REPORT-REFERENCE-GOVERNANCE-v1.0.0',
      referenceId:reference.referenceId,
      referenceDigest:reference.referenceDigest||null,
      qualityContract:reference.qualityContract,
      sectionOwnership:reference.sectionOwnership||null,
      editorialExemplar:reference.editorialExemplar||[],
      prohibitedVisibleBlocks:['PROFESSIONAL_NOTE','METHOD_GOVERNANCE','SOURCE_ADMISSION_MEMO'],
      requireSectionIsolation:true,
      requireCustomerVoice:true,
      requireReferenceQuality:true,
      referenceIsStyleAndDepthAuthorityNotSubjectSemanticAuthority:true
    },
    styleIntent:{
      ...(brief.styleIntent||{}),
      referenceGoverned:true,
      customerVoice:'PERSONAL_PAID_REPORT',
      noProfessionalNote:true,
      noMethodologyMemo:true,
      sectionIsolation:true
    }
  };
  return deepFreeze({...seed,briefSemanticDigest:await sha256Stable(seed)});
}

export async function composeReferenceGovernedDraftR1({
  brief,reference,registry:providerRegistry,env={},fetcher,providerAdapters,requestId,cache,timeoutMs=180000
}={}){
  const resolvedReference=reference||reportProReference(brief?.methodId);
  const {policy}=assertReferenceGovernance({brief,reference:resolvedReference});
  const gBrief=await governedBrief(brief,resolvedReference);
  const result=await composeReportSectionT3({
    brief:gBrief,registry:providerRegistry,env,fetcher,providerAdapters,
    requestId:requestId||`REPORT-PRO:${brief.methodId}:${brief.sectionKey}:${brief.locale}`,
    cache,timeoutMs
  });
  if(result?.status!=='PASS'||!result?.candidate||result?.verification?.accepted!==true){
    return deepFreeze({
      status:'CONTROLLED_NOT_READY',
      reason:result?.internalOnly?.fallbackReason||result?.verification?.reasons?.[0]||'REFERENCE_GOVERNED_COMPOSITION_FAILED',
      deterministicProseFallbackUsed:false,
      methodId:brief.methodId,sectionKey:brief.sectionKey,locale:brief.locale,
      referenceId:resolvedReference?.referenceId||null,
      governedBrief:gBrief,
      internalOnly:result?.internalOnly||null,
      candidate:result?.candidate||null,
      verification:result?.verification||null
    });
  }
  return deepFreeze({
    status:'PASS',
    referenceId:resolvedReference.referenceId,
    referenceState:policy.referenceState,
    governedBrief:gBrief,
    candidate:result.candidate,
    verification:result.verification,
    compositionDigest:result.compositionDigest||null,
    usageRecord:result.usageRecord||null,
    verificationUsageRecords:result.verificationUsageRecords||[],
    internalOnly:result.internalOnly
  });
}

export async function composeReferenceGovernedSectionR1({
  brief,reference,registry:providerRegistry,env={},fetcher,providerAdapters,requestId,cache,timeoutMs=180000,
  subjectFingerprint,inputFingerprint,createdAt
}={}){
  const resolvedReference=reference||reportProReference(brief?.methodId);
  const draft=await composeReferenceGovernedDraftR1({brief,reference:resolvedReference,registry:providerRegistry,env,fetcher,providerAdapters,requestId,cache,timeoutMs});
  if(draft.status!=='PASS')return draft;
  const gBrief=draft.governedBrief;
  const result={candidate:draft.candidate,verification:draft.verification,internalOnly:draft.internalOnly};
  const semanticContent={
    sectionKey:brief.sectionKey,
    referenceId:resolvedReference.referenceId,
    sourceBriefDigest:gBrief.briefSemanticDigest,
    candidate:result.candidate,
    verification:result.verification
  };
  const snapshot=await createCustomerDeliverySnapshot({
    methodId:brief.methodId,
    locale:brief.locale,
    subjectFingerprint,
    inputFingerprint,
    compositionVersion:REPORT_PRO_COMPOSER_R1_VERSION,
    authorityVersion:brief.sourceAuthorityVersion||brief.authorityVersion||'UNVERSIONED_AUTHORITY',
    claimIrVersion:brief.claimIrVersion||'UNVERSIONED_CLAIM_IR',
    verifierVersion:REPORT_SECTION_SEMANTIC_VERIFIER_VERSION,
    semanticContent,
    createdAt
  });
  const auditSeed={
    composerVersion:REPORT_PRO_COMPOSER_R1_VERSION,
    methodId:brief.methodId,sectionKey:brief.sectionKey,locale:brief.locale,
    referenceId:resolvedReference.referenceId,
    referenceState:policy.referenceState,
    t3ComposerVersion:REPORT_SECTION_T3_COMPOSER_VERSION,
    semanticSnapshotId:snapshot.semanticSnapshotId,
    deterministicProseFallbackUsed:false
  };
  return deepFreeze({
    status:'PASS',
    snapshot,
    audit:{...auditSeed,auditDigest:await sha256Stable(auditSeed)},
    candidate:result.candidate,
    verification:result.verification,
    internalOnly:result.internalOnly
  });
}

export function reportProMethodReadiness(){
  return deepFreeze((registry.methods||[]).map(x=>({
    methodId:x.methodId,
    name:x.name,
    referenceState:x.referenceState,
    productionEligible:x.referenceState==='ACTIVE',
    disposition:x.referenceState==='ACTIVE'?'REFERENCE_GOVERNED_COMPOSITION':'CONTROLLED_NOT_READY_REFERENCE_REQUIRED'
  })));
}

export default Object.freeze({composeReferenceGovernedDraftR1,composeReferenceGovernedSectionR1,assertReferenceGovernance,reportProMethodReadiness});
