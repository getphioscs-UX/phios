import {deepFreeze,sha256Stable} from '../../interpretation-runtime/mir7-utils.js';
export const REPORT_SECTION_SNAPSHOT_VERSION='PHI-OS-REPORT-SECTION-SNAPSHOT-v1.0.0';
function text(v){return String(v??'').trim();}
function required(v,code){if(!text(v))throw Error(code);return text(v);}
export async function createEditorialAcceptanceArtifact(input={}){
 const seed={schemaVersion:'PHI-OS-EDITORIAL-ACCEPTANCE-ARTIFACT-v1.0.0',methodId:required(input.methodId,'SNAPSHOT_METHOD_REQUIRED'),sectionKey:required(input.sectionKey,'SNAPSHOT_SECTION_REQUIRED'),locale:required(input.locale,'SNAPSHOT_LOCALE_REQUIRED'),compositionVersion:required(input.compositionVersion,'SNAPSHOT_COMPOSITION_VERSION_REQUIRED'),claimIrVersion:required(input.claimIrVersion,'SNAPSHOT_CLAIM_IR_VERSION_REQUIRED'),authorityVersion:required(input.authorityVersion,'SNAPSHOT_AUTHORITY_VERSION_REQUIRED'),verifierVersion:required(input.verifierVersion,'SNAPSHOT_VERIFIER_VERSION_REQUIRED'),editorialVersion:required(input.editorialVersion,'SNAPSHOT_EDITORIAL_VERSION_REQUIRED'),contentDigest:required(input.contentDigest,'SNAPSHOT_CONTENT_DIGEST_REQUIRED'),accepted:input.accepted===true,acceptedAt:input.acceptedAt||null,acceptedBy:input.acceptedBy||null};
 if(seed.accepted&&(!seed.acceptedAt||!seed.acceptedBy))throw Error('SNAPSHOT_ACCEPTANCE_IDENTITY_REQUIRED');
 return deepFreeze({...seed,artifactDigest:await sha256Stable(seed)});
}
export async function createCustomerDeliverySnapshot(input={}){
 if(!input.semanticContent||typeof input.semanticContent!=='object')throw Error('DELIVERY_SEMANTIC_CONTENT_REQUIRED');
 if(!['BZR','ZWR','AST','NUM','PROFILE','ECR','HD','CROSS'].includes(input.methodId)||!['en','zh-Hans'].includes(input.locale))throw Error('DELIVERY_METHOD_OR_LOCALE_INVALID');
 const seed={schemaVersion:'PHI-OS-CUSTOMER-DELIVERY-SNAPSHOT-v1.0.0',methodId:required(input.methodId,'DELIVERY_METHOD_REQUIRED'),locale:required(input.locale,'DELIVERY_LOCALE_REQUIRED'),subjectFingerprint:required(input.subjectFingerprint,'DELIVERY_SUBJECT_FINGERPRINT_REQUIRED'),inputFingerprint:required(input.inputFingerprint,'DELIVERY_INPUT_FINGERPRINT_REQUIRED'),compositionVersion:required(input.compositionVersion,'DELIVERY_COMPOSITION_VERSION_REQUIRED'),authorityVersion:required(input.authorityVersion,'DELIVERY_AUTHORITY_VERSION_REQUIRED'),claimIrVersion:required(input.claimIrVersion,'DELIVERY_CLAIM_IR_VERSION_REQUIRED'),verifierVersion:required(input.verifierVersion,'DELIVERY_VERIFIER_VERSION_REQUIRED'),semanticContent:input.semanticContent,createdAt:input.createdAt||new Date(0).toISOString(),supersedes:input.supersedes||null};
 const semanticSnapshotId='RDS-'+(await sha256Stable(seed)).toUpperCase();
 return deepFreeze({...seed,semanticSnapshotId,immutable:true,providerRegenerationOnReopen:false});
}
export async function createRenderedArtifactSnapshot(input={}){
 const seed={schemaVersion:'PHI-OS-RENDERED-ARTIFACT-SNAPSHOT-v1.0.0',semanticSnapshotId:required(input.semanticSnapshotId,'RENDER_SEMANTIC_SNAPSHOT_REQUIRED'),renderVersion:required(input.renderVersion,'RENDER_VERSION_REQUIRED'),surface:required(input.surface,'RENDER_SURFACE_REQUIRED'),assetBindingVersion:required(input.assetBindingVersion,'RENDER_ASSET_VERSION_REQUIRED'),coverBindingVersion:required(input.coverBindingVersion,'RENDER_COVER_BINDING_VERSION_REQUIRED'),paginationVersion:required(input.paginationVersion,'RENDER_PAGINATION_VERSION_REQUIRED'),outputDigest:required(input.outputDigest,'RENDER_OUTPUT_DIGEST_REQUIRED'),createdAt:input.createdAt||new Date(0).toISOString()};
 const renderSnapshotId='RDR-'+(await sha256Stable(seed)).toUpperCase();
 return deepFreeze({...seed,renderSnapshotId});
}
export default Object.freeze({createEditorialAcceptanceArtifact,createCustomerDeliverySnapshot,createRenderedArtifactSnapshot});
