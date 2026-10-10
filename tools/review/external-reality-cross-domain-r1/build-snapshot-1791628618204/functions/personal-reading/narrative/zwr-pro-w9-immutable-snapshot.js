import {deepFreeze,sha256Stable} from '../../interpretation-runtime/mir7-utils.js';
import {createCustomerDeliverySnapshot} from './report-section-snapshot.js';

export const ZWR_PRO_W9_SNAPSHOT_VERSION='ZWR-PRO-W9-IMMUTABLE-SNAPSHOT-v1';
const W5='ZWR-PRO-W5-SEMANTIC-VERIFIER-v1';
const W6='ZWR-PRO-W6-REFERENCE-QUALITY-VERIFIER-v1';
const W7='ZWR-PRO-W7-CROSS-SECTION-DUPLICATION-VERIFIER-v1';
const W8='ZWR-PRO-W8-BILINGUAL-PARITY-v1';
const IDS=['S02','S03','S04','S05','S06','S07','S08','S09','S10','S11'];

function required(v,code){if(v===null||v===undefined||v==='')throw Error(code);return v;}
function localeSemanticContent(side){
 return Object.freeze({
  candidates:side.candidates.map(c=>Object.freeze({
   sectionId:c.sectionId,title:c.title,paragraphs:c.paragraphs,
   usedClaimRefs:c.usedClaimRefs,usedPalaceCodes:c.usedPalaceCodes,usedTransformationKeys:c.usedTransformationKeys,
   candidateDigest:c.candidateDigest,sourceBriefDigest:c.sourceBriefDigest
  })),
  sectionVerifications:side.sectionVerifications.map(v=>Object.freeze({
   sectionId:v.sectionId,semanticDigest:v.semantic.verificationDigest,qualityDigest:v.quality.verificationDigest
  })),
  duplicationDigest:side.duplication.verificationDigest
 });
}
function assertW4W8Pass(result){
 if(result?.schemaVersion!=='ZWR-PRO-W4-W8-PIPELINE-v1'||result?.status!=='PASS_W4_W8')throw Error('ZWR_PRO_W9_W4_W8_PASS_REQUIRED');
 if(result.productionAdmissionGranted!==false)throw Error('ZWR_PRO_W9_PREMATURE_PRODUCTION_ADMISSION');
 for(const side of [result.zh,result.en]){
  if(side?.candidates?.length!==10||side?.sectionVerifications?.length!==10)throw Error('ZWR_PRO_W9_TEN_SECTIONS_REQUIRED');
  if(side.candidates.map(c=>c.sectionId).join('|')!==IDS.join('|'))throw Error('ZWR_PRO_W9_SECTION_ORDER_REQUIRED');
  if(side.sectionVerifications.some(v=>v.semantic?.accepted!==true||v.quality?.accepted!==true))throw Error('ZWR_PRO_W9_SECTION_VERIFICATION_REQUIRED');
  if(side.duplication?.accepted!==true)throw Error('ZWR_PRO_W9_DUPLICATION_PASS_REQUIRED');
 }
 if(result.parity?.accepted!==true)throw Error('ZWR_PRO_W9_BILINGUAL_PARITY_REQUIRED');
}
export async function createZwrProImmutableSnapshotW9({pipelineResult,createdAt='1970-01-01T00:00:00.000Z',supersedes=null}={}){
 assertW4W8Pass(pipelineResult);
 const binding=required(pipelineResult.subjectBinding,'ZWR_PRO_W9_SUBJECT_BINDING_REQUIRED');
 const subjectFingerprint=required(binding.subjectKey||binding.subjectId,'ZWR_PRO_W9_SUBJECT_FINGERPRINT_REQUIRED');
 const inputFingerprint=required(binding.inputFingerprint,'ZWR_PRO_W9_INPUT_FINGERPRINT_REQUIRED');
 const common={
  methodId:'ZWR',subjectFingerprint,inputFingerprint,
  compositionVersion:'ZWR-PRO-W4-LLM-PROFESSIONAL-COMPOSER-v1',
  authorityVersion:'ZIWEI-R5-AUTHORING-PACK-v2',
  claimIrVersion:'ZIWEI-PROFESSIONAL-SYNTHESIS-R5',
  verifierVersion:[W5,W6,W7,W8].join('+'),
  createdAt,supersedes
 };
 const zh=await createCustomerDeliverySnapshot({...common,locale:'zh-Hans',semanticContent:localeSemanticContent(pipelineResult.zh)});
 const en=await createCustomerDeliverySnapshot({...common,locale:'en',semanticContent:localeSemanticContent(pipelineResult.en)});
 const manifestSeed={
  schemaVersion:ZWR_PRO_W9_SNAPSHOT_VERSION,
  methodId:'ZWR',
  subjectBinding:binding,
  sourcePipelineDigest:pipelineResult.pipelineDigest,
  localeSnapshots:Object.freeze({'zh-Hans':zh.semanticSnapshotId,en:en.semanticSnapshotId}),
  bilingualParityDigest:pipelineResult.parity.verificationDigest,
  immutable:true,
  providerRegenerationOnReopen:false,
  publicationRequiresExactSnapshotId:true,
  productionAdmissionGranted:false,
  createdAt
 };
 const reportSnapshotId='ZWR-RDS-'+(await sha256Stable(manifestSeed)).toUpperCase();
 return deepFreeze({...manifestSeed,reportSnapshotId,localeSnapshots:Object.freeze({'zh-Hans':zh,en})});
}
export function assertZwrProSnapshotReopenW9(snapshot){
 if(snapshot?.schemaVersion!==ZWR_PRO_W9_SNAPSHOT_VERSION||snapshot?.immutable!==true)throw Error('ZWR_PRO_W9_IMMUTABLE_SNAPSHOT_REQUIRED');
 if(snapshot.providerRegenerationOnReopen!==false)throw Error('ZWR_PRO_W9_PROVIDER_REGENERATION_FORBIDDEN');
 if(!snapshot.reportSnapshotId||!snapshot.localeSnapshots?.['zh-Hans']?.semanticSnapshotId||!snapshot.localeSnapshots?.en?.semanticSnapshotId)throw Error('ZWR_PRO_W9_SNAPSHOT_ID_REQUIRED');
 return snapshot;
}
export default Object.freeze({createZwrProImmutableSnapshotW9,assertZwrProSnapshotReopenW9,ZWR_PRO_W9_SNAPSHOT_VERSION});
