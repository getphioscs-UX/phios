import {
  EXTERNAL_PROFILE_FAMILY,
  EXTERNAL_PROFILE_IR_VERSION,
  normalizeManualAdvancedFields,
  normalizeManualCoreFields
} from './external-profile-contract.js';
import {parseHumanDesignProfileText} from './hd-profile-parser.js';

const freeze=value=>{if(value&&typeof value==='object'&&!Object.isFrozen(value)){Object.freeze(value);for(const child of Object.values(value))freeze(child)}return value};

function mergeCandidateSets(...sets){
  const out=[],seen=new Set();
  for(const set of sets){for(const item of set||[]){const key=`${item.field}:${JSON.stringify(item.normalizedValue)}:${item.sourceType}:${item.sourceRegion}`;if(seen.has(key))continue;seen.add(key);out.push(item)}}
  return out;
}

export function buildExternalProfileExtractionIr({intakeId,sources=[],pastedText='',manualFields={},manualCoreFields={},manualStructureText='',documentExtraction=null,calculationReference=null}={}){
  if(typeof intakeId!=='string'||!intakeId.trim())throw new TypeError('EXTERNAL_PROFILE_INTAKE_ID_REQUIRED');
  const parsed=parseHumanDesignProfileText(pastedText);
  const manualAdvanced=normalizeManualAdvancedFields(manualFields);
  const manualCore=normalizeManualCoreFields(manualCoreFields);
  const manualStructureParsed=manualStructureText?parseHumanDesignProfileText(manualStructureText,{sourceType:'CUSTOMER_MANUAL_STRUCTURED_ENTRY',sourceRegionPrefix:'MANUAL_STRUCTURED'}):{candidates:[],structuralCandidates:[]};
  const manualStructure=[...(manualStructureParsed.candidates||[]),...(manualStructureParsed.structuralCandidates||[])].map(item=>freeze({...item,sourceType:'CUSTOMER_MANUAL_STRUCTURED_ENTRY',customerConfirmed:true,extractionConfidence:'CUSTOMER_ENTERED',extractionRule:'MANUAL_STRUCTURED_ENTRY',phiosCalculated:false}));
  const manual=freeze([...manualCore,...manualAdvanced,...manualStructure]);
  const documentText=documentExtraction?.status==='EXTRACTED'&&documentExtraction.text?documentExtraction.text:'';
  const documentSource=sources.find(source=>['CUSTOMER_UPLOADED_DOCUMENT','CUSTOMER_UPLOADED_IMAGE'].includes(source.sourceType));
  const documentParsed=documentText?parseHumanDesignProfileText(documentText,{sourceType:documentSource?.sourceType||'CUSTOMER_UPLOADED_DOCUMENT',sourceRegionPrefix:'UPLOADED_MATERIAL'}):{candidates:[],structuralCandidates:[],unresolved:[],conflicts:[]};
  const hasDocument=Boolean(documentSource);
  const calculatedCandidates=calculationReference?.status==='AVAILABLE'?(calculationReference.candidates||[]):[];
  const candidates=mergeCandidateSets(documentParsed.candidates,documentParsed.structuralCandidates,parsed.candidates,parsed.structuralCandidates,calculatedCandidates);
  const unresolved=[...parsed.unresolved];
  if(hasDocument&&documentExtraction?.status!=='EXTRACTED')unresolved.push(documentExtraction?documentExtraction.reasonCode||'BINARY_DOCUMENT_EXTRACTION_UNAVAILABLE':'BINARY_DOCUMENT_EXTRACTION_PENDING_SUCCESSOR');
  if(hasDocument&&documentExtraction?.status==='EXTRACTED'&&!documentParsed.candidates.length&&!documentParsed.structuralCandidates.length)unresolved.push('DOCUMENT_TEXT_EXTRACTED_NO_PROFILE_FIELDS');
  const conflicts=[...(documentParsed.conflicts||[]),...(parsed.conflicts||[])];
  let status='DOCUMENT_ACCEPTED_EXTRACTION_PENDING';
  if(candidates.length&&manual.length)status='MIXED_INPUT_READY';
  else if(candidates.length)status='EXTRACTION_CANDIDATES_READY';
  else if(manual.length)status=hasDocument?'MIXED_INPUT_READY':'MANUAL_FIELDS_READY';
  else if(documentExtraction?.status==='FAILED')status='DOCUMENT_EXTRACTION_FAILED';
  return freeze({
    schemaVersion:EXTERNAL_PROFILE_IR_VERSION,
    intakeId:intakeId.trim(),
    profileFamily:EXTERNAL_PROFILE_FAMILY,
    status,
    sources:[...sources],
    documentExtraction:documentExtraction?freeze({schemaVersion:documentExtraction.schemaVersion,status:documentExtraction.status,extractionMethod:documentExtraction.extractionMethod,reasonCode:documentExtraction.reasonCode||null,format:documentExtraction.format||null,mimeType:documentExtraction.mimeType||null,characterCount:documentExtraction.characterCount||0,tokens:documentExtraction.tokens??null,conversionId:documentExtraction.conversionId||null,aiServiceUsed:documentExtraction.aiServiceUsed===true,meaningCreated:false,interpretationCreated:false}):null,
    calculationReference:calculationReference?freeze({schemaVersion:calculationReference.schemaVersion,status:calculationReference.status,sourceType:calculationReference.sourceType||null,calculatedBasicFields:freeze([...(calculationReference.calculatedBasicFields||[])]),calculatedStructuralFields:freeze([...(calculationReference.calculatedStructuralFields||[])]),incarnationConfiguration:calculationReference.incarnationConfiguration||null,calculationReference:calculationReference.calculationReference||null,boundary:calculationReference.boundary||null}):null,
    candidates:freeze(candidates),
    manualFields:[...manual],
    unresolved:[...new Set(unresolved)],
    conflicts:freeze(conflicts),
    boundary:{
      customerSuppliedExternalContext:true,
      phiosCalculated:false,
      phiosCalculationReferencePresent:calculationReference?.status==='AVAILABLE',
      calculatedReferenceRequiresCustomerConfirmation:true,
      canonicalMethodProjection:false,
      machineExtractedCandidatesRequireCustomerConfirmation:true,
      manualFieldsAreCustomerConfirmed:true,
      binaryDocumentExtractionPerformed:documentExtraction?.status==='EXTRACTED',
      documentConversionMayUseWorkersAI:documentExtraction?.aiServiceUsed===true,
      documentConversionCreatesMeaning:false,
      fileContentPersisted:false,
      runtimeMemoryWritten:false,
      rendererCreatesMeaning:false,
      aiCreatesMeaning:false
    }
  });
}
