import {deepFreeze,sha256Stable} from '../../interpretation-runtime/mir7-utils.js';

export const REPORT_NARRATIVE_SNAPSHOT_VERSION='PHI-OS-REPORT-NARRATIVE-SNAPSHOT-v1.0.0';
const KINDS=new Set(['EDITORIAL_ACCEPTANCE_ARTIFACT','CUSTOMER_DELIVERY_SNAPSHOT','RENDERED_ARTIFACT_SNAPSHOT']);
function text(v){return String(v??'').trim();}
function fail(code,details={}){const e=new Error(code);e.code=code;e.details=details;throw e;}

export async function buildReportNarrativeSnapshotId(input={}){
 const fields=['kind','methodId','locale','authorityVersion','claimIrVersion','compositionVersion','verifierVersion','sourceSemanticDigest','subjectFingerprint'];
 for(const k of fields)if(!text(input[k]))fail('RNT2_SNAPSHOT_ID_FIELD_REQUIRED',{field:k});
 if(!KINDS.has(input.kind))fail('RNT2_SNAPSHOT_KIND_INVALID');
 const seed=Object.fromEntries(fields.map(k=>[k,text(input[k])]));
 const digest=await sha256Stable(seed);
 return deepFreeze({...seed,snapshotId:`RNS-${digest.toUpperCase()}`});
}

export function classifyReportSnapshotInvalidation(change={}){
 if(change.calculationFactChanged||change.claimIrChanged||change.authorityChanged||change.materialPromptChanged)return 'SEMANTIC';
 if(change.verifierContractChanged)return 'REVALIDATE';
 if(change.localeProseChanged)return 'LOCALE_SEMANTIC';
 if(change.cssOnlyChanged||change.coverCoordinatesChanged||change.coverFontChanged||change.paginationOnlyChanged)return 'RENDER_ONLY';
 return 'NONE';
}

export function assertSnapshotSubjectMatch({snapshotIdentity,subjectFingerprint}={}){
 if(!snapshotIdentity?.subjectFingerprint||!text(subjectFingerprint))fail('RNT2_SNAPSHOT_SUBJECT_REQUIRED');
 if(snapshotIdentity.subjectFingerprint!==subjectFingerprint)fail('SUBJECT_MISMATCH');
 return true;
}

export function buildSnapshotLineage({snapshotId,supersedes=null,reason='INITIAL'}={}){
 if(!text(snapshotId))fail('RNT2_SNAPSHOT_ID_REQUIRED');
 return deepFreeze({snapshotId:text(snapshotId),supersedes:text(supersedes)||null,supersededBy:null,reason:text(reason)||'INITIAL',immutable:true});
}

export default Object.freeze({buildReportNarrativeSnapshotId,classifyReportSnapshotInvalidation,assertSnapshotSubjectMatch,buildSnapshotLineage});
