import {prepareAccountBaziCandidate} from './bazi-account-candidate.js';
import {inspectBaziAcceptedCopyCoverage,baziProjectionPillars} from './bazi-accepted-copy-coverage.js';
import {loadCanonicalPersonSubject,personIdentity} from '../account/canonical-person-store.js';
import {createReportSubjectPresentationFromAccountPerson,assertReportSubjectBinding,reportBirthInputFingerprint} from '../canonical-presentation-runtime/report-cover-subject.js';
import {sha256Stable,deepFreeze} from '../interpretation-runtime/mir7-utils.js';
const issuedCandidates=new WeakMap();
export const BAZI_RELEASE_STATES=Object.freeze(['INPUT_INVALID','INPUT_REQUIRED','CALCULATION_FAILED','BLOCKED_ACCEPTED_COPY_COVERAGE','VERIFICATION_REJECTED','RENDERING_FAILED','ENTITLEMENT_MISSING','ACCOUNT_OR_SUBJECT_MISMATCH','RELEASE_CANDIDATE_READY','RELEASED_ACCOUNT_AUTHORIZED','SUPERSEDED']);
const stateFor=e=>/ENTITLEMENT/.test(e.code||e.message)?'ENTITLEMENT_MISSING':/ACCOUNT|PERSON_NOT_FOUND|SUBJECT_SELECTION|PRODUCTION_NOT_ADMITTED|PERSON_USE_DENIED/.test(e.code||e.message)?'ACCOUNT_OR_SUBJECT_MISMATCH':/INVALID|REQUIRED/.test(e.code||e.message)?'INPUT_INVALID':'CALCULATION_FAILED';
// Server-only local candidate. No release registration, provider fallback,
// production storage, account visibility or entitlement mutation.
export async function buildBaziSubjectReleaseCandidate(context,selection){
 let prepared;try{prepared=await prepareAccountBaziCandidate(context,selection);}catch(e){return {state:stateFor(e),error:e.code||e.message,status:e.status||409,released:false,providerCalls:0,productionAdmitted:false};}
 if(prepared.state==='INPUT_REQUIRED')return {...prepared,state:'INPUT_REQUIRED',coverage:null,snapshot:null};
 const owner=personIdentity(context).userId,subject=await loadCanonicalPersonSubject(context.env,owner,selection.personId);
 if(subject.personVersion!==prepared.personVersion||await reportBirthInputFingerprint(subject.canonicalBirthInput)!==prepared.canonicalBirthInputFingerprint)return {...prepared,state:'VERIFICATION_REJECTED',error:'SUBJECT_CHANGED_DURING_CALCULATION',snapshot:null,released:false};
 const presentation=await createReportSubjectPresentationFromAccountPerson({accountPersonReference:subject.person,canonicalBirthInput:subject.canonicalBirthInput,birthSourceRef:subject.birthSourceRef});
 const expectedBinding={...presentation,inputSubjectFingerprint:presentation.subjectFingerprint,semanticSubjectFingerprint:presentation.subjectFingerprint};
 await assertReportSubjectBinding({presentation,expectedBinding});
 const authority={schemaVersion:'BAZI-SUBJECT-CALCULATED-AUTHORITY-v1',customerId:owner,personId:prepared.personId,personVersion:prepared.personVersion,birthSourceRef:prepared.birthSourceRef,canonicalBirthInputFingerprint:prepared.canonicalBirthInputFingerprint,calculationDigest:prepared.calculationDigest,projection:prepared.execution.canonicalProjection,unknown:prepared.execution.canonicalProjection.unknown,interpretationAdmission:'NONE_ADDED',timingContext:'NOT_SELECTED'};
 const coverage=inspectBaziAcceptedCopyCoverage({pillars:baziProjectionPillars(authority.projection)});
 const snapshot={schemaVersion:'BAZI-LOCAL-BLOCKED-CANDIDATE-SNAPSHOT-v1',customerId:owner,personId:prepared.personId,personVersion:prepared.personVersion,purchaseId:prepared.purchaseId,presentation,authority,coverage,publicationIR:null,report:null,releaseState:coverage.state,downloadAllowed:false};
 const candidate=deepFreeze({...prepared,state:coverage.state,presentation,authority,coverage,snapshot,snapshotDigest:await sha256Stable(snapshot),downstream:{...prepared.downstream,composition:coverage.state,verification:'NOT_RUN_NO_ADMITTED_COPY',rendering:'FACTUAL_REVIEW_ONLY',release:'BLOCKED'},released:false});issuedCandidates.set(candidate,candidate.snapshotDigest);return candidate;
}

// Local in-memory test/review history only. Stores immutable serialized
// blocked snapshots, never native customer release receipts or grants.
export function createLocalBaziCandidateHistory(){
 const rows=new Map();
 return {
  async save(context,candidate){const owner=personIdentity(context).userId;if(context.env?.PHIOS_ENVIRONMENT!=='local'||issuedCandidates.get(candidate)!==candidate.snapshotDigest||candidate.customerId!==owner||!candidate.snapshot||candidate.snapshot.customerId!==owner||candidate.personId!==candidate.snapshot.personId||candidate.personVersion!==candidate.snapshot.personVersion||await sha256Stable(candidate.snapshot)!==candidate.snapshotDigest)throw Error('LOCAL_CANDIDATE_SNAPSHOT_REJECTED');const live=await prepareAccountBaziCandidate(context,{personId:candidate.personId});if(live.personVersion!==candidate.personVersion||live.canonicalBirthInputFingerprint!==candidate.canonicalBirthInputFingerprint)throw Error('LOCAL_CANDIDATE_SNAPSHOT_STALE');const id=owner+':'+candidate.personId+':'+candidate.snapshotDigest;if(!rows.has(id))rows.set(id,JSON.stringify({...candidate,candidateId:id}));return id;},
  async view(context,id,personId){const owner=personIdentity(context).userId;if(context.env?.PHIOS_ENVIRONMENT!=='local')throw Error('LOCAL_HISTORY_ONLY');const row=rows.get(id);if(!row)throw Error('CANDIDATE_NOT_FOUND');const c=JSON.parse(row);if(c.customerId!==owner||c.personId!==personId)throw Error('ACCOUNT_OR_SUBJECT_MISMATCH');await prepareAccountBaziCandidate(context,{personId});await loadCanonicalPersonSubject(context.env,owner,personId);const later=[...rows.values()].map(JSON.parse).some(r=>r.customerId===owner&&r.personId===personId&&r.personVersion>c.personVersion);return {...c,historyState:later?'SUPERSEDED':'CURRENT_BLOCKED_CANDIDATE',downloadAllowed:false};},
  async download(context,id,personId){await this.view(context,id,personId);throw Error('NATIVE_RELEASE_REQUIRED');},
  release(){throw Error('PRODUCTION_RELEASE_NOT_ADMITTED');}
 };
}
