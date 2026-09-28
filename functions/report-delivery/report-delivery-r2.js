import {buildReportDeliveryEnvelope} from './report-delivery-envelope.js';
export const REPORT_DELIVERY_R2_VERSION='PHI-OS-REPORT-DELIVERY-R2-v1.0.0';
export const REPORT_DELIVERY_R2_STATES=Object.freeze(['FREE','LOCKED','ENTITLED','FULL_REPORT','EXPLORE_DETAILS','UNAVAILABLE','DATA_REQUIRED']);
export function buildReportDeliveryR2({methodId,access,admitted,reportAvailable,semanticSnapshot=null,exploreRequested=false,expectedBinding=null,productionAdmission=null}={}){
 const base=buildReportDeliveryEnvelope({methodId,access,admitted,reportAvailable});
 let state=base.access.state;
 if(state==='ENTITLED'&&semanticSnapshot){
  if(semanticSnapshot.schemaVersion!=='PHI-OS-CUSTOMER-DELIVERY-SNAPSHOT-v1.0.0'||semanticSnapshot.methodId!==methodId||semanticSnapshot.locale!==expectedBinding?.locale||semanticSnapshot.subjectFingerprint!==expectedBinding?.subjectFingerprint||semanticSnapshot.inputFingerprint!==expectedBinding?.inputFingerprint)throw Error('REPORT_DELIVERY_SNAPSHOT_BINDING_MISMATCH');
  if(productionAdmission?.state!=='PRODUCTION_ADMITTED'||productionAdmission.semanticSnapshotId!==semanticSnapshot.semanticSnapshotId)throw Error('REPORT_DELIVERY_PRODUCTION_ADMISSION_REQUIRED');
  if(semanticSnapshot.immutable===true)state=exploreRequested?'EXPLORE_DETAILS':'FULL_REPORT';
 }
 if(state==='ENTITLED'&&!semanticSnapshot)state='ENTITLED';
 if(!REPORT_DELIVERY_R2_STATES.includes(state))throw Error('REPORT_DELIVERY_R2_STATE_INVALID');
 return Object.freeze({
  ...base,
  schemaVersion:REPORT_DELIVERY_R2_VERSION,
  availability:Object.freeze({...base.availability,fullReport:['FULL_REPORT','EXPLORE_DETAILS'].includes(state),technicalExplorer:['FULL_REPORT','EXPLORE_DETAILS'].includes(state)}),
  access:Object.freeze({...base.access,state}),
  semanticSnapshotId:['FULL_REPORT','EXPLORE_DETAILS'].includes(state)?semanticSnapshot?.semanticSnapshotId:null,
  snapshotImmutable:semanticSnapshot?.immutable===true,
  providerRegenerationOnReopen:false,
  explore:Object.freeze({requested:exploreRequested===true,mutatesSnapshot:false,recalculatesMethod:false,productionClaimsOnly:true}),
  governance:Object.freeze({entitlementRequiredForFullReport:true,browserMayGrantEntitlement:false,queryMayGrantEntitlement:false,localStorageMayGrantEntitlement:false})
 });
}
export default Object.freeze({buildReportDeliveryR2});
