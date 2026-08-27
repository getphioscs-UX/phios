import {
  EXTERNAL_PROFILE_FAMILY,
  EXTERNAL_PROFILE_IR_VERSION,
  normalizeManualAdvancedFields
} from './external-profile-contract.js';
import {parseHumanDesignProfileText} from './hd-profile-parser.js';

const freeze=value=>{if(value&&typeof value==='object'&&!Object.isFrozen(value)){Object.freeze(value);for(const child of Object.values(value))freeze(child)}return value};

export function buildExternalProfileExtractionIr({intakeId,sources=[],pastedText='',manualFields={}}={}){
  if(typeof intakeId!=='string'||!intakeId.trim())throw new TypeError('EXTERNAL_PROFILE_INTAKE_ID_REQUIRED');
  const parsed=parseHumanDesignProfileText(pastedText);
  const manual=normalizeManualAdvancedFields(manualFields);
  const hasDocument=sources.some(source=>['CUSTOMER_UPLOADED_DOCUMENT','CUSTOMER_UPLOADED_IMAGE'].includes(source.sourceType));
  const unresolved=[...parsed.unresolved];
  if(hasDocument)unresolved.push('BINARY_DOCUMENT_EXTRACTION_PENDING_SUCCESSOR');
  let status='DOCUMENT_ACCEPTED_EXTRACTION_PENDING';
  if(parsed.candidates.length&&manual.length)status='MIXED_INPUT_READY';
  else if(parsed.candidates.length)status='EXTRACTION_CANDIDATES_READY';
  else if(manual.length)status=hasDocument?'MIXED_INPUT_READY':'MANUAL_FIELDS_READY';
  return freeze({
    schemaVersion:EXTERNAL_PROFILE_IR_VERSION,
    intakeId:intakeId.trim(),
    profileFamily:EXTERNAL_PROFILE_FAMILY,
    status,
    sources:[...sources],
    candidates:[...parsed.candidates],
    manualFields:[...manual],
    unresolved:[...new Set(unresolved)],
    conflicts:[...parsed.conflicts],
    boundary:{
      customerSuppliedExternalContext:true,
      phiosCalculated:false,
      canonicalMethodProjection:false,
      machineExtractedCandidatesRequireCustomerConfirmation:true,
      manualFieldsAreCustomerConfirmed:true,
      binaryDocumentExtractionPerformed:false,
      fileContentPersisted:false,
      runtimeMemoryWritten:false,
      rendererCreatesMeaning:false,
      aiCreatesMeaning:false
    }
  });
}
