import { sha256Hex } from './digest.js';
import { canonicalClone } from './canonical-json.js';

function assertIso(value){ if(typeof value!=='string' || Number.isNaN(Date.parse(value))) throw new Error('DAR_EXPORT_CREATED_AT_ISO_REQUIRED'); }
function clauseVersions(ir){ return ir.sections.map((section)=>Object.freeze({clauseId:section.clauseId,clauseVersion:section.clauseVersion,approvalDigest:section.approvalDigest})); }

export function createDocumentExportVersion({ documentId, ir, format, artifactBytes, exportAuthorization, createdAt, previousVersion = null } = {}){
  if(typeof documentId!=='string' || !documentId) throw new Error('DAR_DOCUMENT_ID_REQUIRED');
  if(!ir?.assemblyDigest) throw new Error('DAR_ASSEMBLY_IR_REQUIRED');
  if(exportAuthorization?.status!=='APPROVED_FOR_EXPORT' || exportAuthorization.assemblyDigest!==ir.assemblyDigest) throw new Error('DAR_EXPORT_AUTHORIZATION_REQUIRED_FOR_EXACT_ASSEMBLY');
  if(!['PDF','DOCX'].includes(format)) throw new Error(`DAR_EXPORT_FORMAT_UNSUPPORTED:${format}`);
  if(!Buffer.isBuffer(artifactBytes) && !(artifactBytes instanceof Uint8Array)) throw new Error('DAR_EXPORT_ARTIFACT_BYTES_REQUIRED');
  assertIso(createdAt);
  const outputDigest=sha256Hex(artifactBytes);
  const immutableBasis={documentId,assemblyVersion:ir.assemblyVersion,templateVersion:ir.templateVersion,clauseVersions:clauseVersions(ir),inputDigest:ir.inputDigest,assemblyDigest:ir.assemblyDigest,outputDigest,format};
  if(previousVersion){
    const priorBasis={documentId:previousVersion.documentId,assemblyVersion:previousVersion.assemblyVersion,templateVersion:previousVersion.templateVersion,clauseVersions:previousVersion.clauseVersions,inputDigest:previousVersion.inputDigest,assemblyDigest:previousVersion.assemblyDigest,outputDigest:previousVersion.outputDigest,format:previousVersion.format};
    if(sha256Hex(priorBasis)===sha256Hex(immutableBasis)) return Object.freeze({action:'REUSE_EXISTING_VERSION',version:canonicalClone(previousVersion)});
  }
  const nextNumber=previousVersion ? Number(previousVersion.versionNumber)+1 : 1;
  if(!Number.isInteger(nextNumber) || nextNumber<1) throw new Error('DAR_PREVIOUS_VERSION_INVALID');
  const version={
    recordType:'DAR_DOCUMENT_EXPORT_VERSION',documentId,versionNumber:nextNumber,documentVersion:`v${nextNumber}`,versionId:`${documentId}:v${nextNumber}`,
    assemblyVersion:ir.assemblyVersion,templateVersion:ir.templateVersion,clauseVersions:clauseVersions(ir),inputDigest:ir.inputDigest,assemblyDigest:ir.assemblyDigest,outputDigest,format,createdAt,
    previousVersionId:previousVersion?.versionId ?? null,confirmationDigest:exportAuthorization.confirmationDigest,status:'EXPORTED',legallyExecuted:false
  };
  return Object.freeze({action:'CREATE_NEW_VERSION',version:Object.freeze(canonicalClone(version))});
}

export default Object.freeze({ createDocumentExportVersion });
