import crypto from 'node:crypto';
import {cleanExternalProfileText,EXTERNAL_PROFILE_MANUAL_FIELDS} from './external-profile-contract.js';
import {parseHumanDesignProfileText} from './hd-profile-parser.js';

export const EXTERNAL_PROFILE_CONFIRMATION_DRAFT_VERSION='PHI-OS-EXTERNAL-PROFILE-CONFIRMATION-DRAFT-v1.0.0';
export const EXTERNAL_PROFILE_CONFIRMED_VERSION='PHI-OS-CONFIRMED-EXTERNAL-PROFILE-v1.0.0';
export const EXTERNAL_PROFILE_CORE_FIELDS=Object.freeze(['type','strategy','authority','profile','definition','incarnationCross','signature','notSelfTheme']);
export const EXTERNAL_PROFILE_STRUCTURAL_FIELDS=Object.freeze(['activations','channels','definedCenters','openCenters']);

const freeze=value=>{if(value&&typeof value==='object'&&!Object.isFrozen(value)){Object.freeze(value);for(const child of Object.values(value))freeze(child)}return value};
const stable=value=>Array.isArray(value)?value.map(stable):value&&typeof value==='object'?Object.fromEntries(Object.keys(value).sort().map(key=>[key,stable(value[key])])):value;
const digest=value=>crypto.createHash('sha256').update(JSON.stringify(stable(value))).digest('hex');

function candidateRank(item){
  if(item.customerConfirmed===true)return 100;
  if(item.sourceType==='CUSTOMER_UPLOADED_DOCUMENT'||item.sourceType==='CUSTOMER_UPLOADED_IMAGE')return 80;
  if(item.sourceType==='CUSTOMER_PASTED_TEXT')return 70;
  return 10;
}
function bestCandidate(items){return [...items].sort((a,b)=>candidateRank(b)-candidateRank(a))[0]||null}
function groupCandidates(items=[]){const map=new Map();for(const item of items){if(!item?.field)continue;if(!map.has(item.field))map.set(item.field,[]);map.get(item.field).push(item)}return map}
function fieldDraft(field,items){const selected=bestCandidate(items)||null;return freeze({field,value:selected?.normalizedValue??null,sourceType:selected?.sourceType??null,sourceRegion:selected?.sourceRegion??null,extractionConfidence:selected?.extractionConfidence??null,customerConfirmed:selected?.customerConfirmed===true,alternatives:Object.freeze(items.filter(item=>item!==selected).map(item=>item.normalizedValue))})}

export function buildExternalProfileConfirmationDraft(extractionIr){
  if(!extractionIr||typeof extractionIr!=='object')throw new TypeError('EXTERNAL_PROFILE_EXTRACTION_IR_REQUIRED');
  const grouped=groupCandidates([...(extractionIr.candidates||[]),...(extractionIr.manualFields||[])]);
  const fields={};
  for(const field of [...EXTERNAL_PROFILE_CORE_FIELDS,...EXTERNAL_PROFILE_MANUAL_FIELDS])fields[field]=fieldDraft(field,grouped.get(field)||[]);
  const structure={};
  for(const field of EXTERNAL_PROFILE_STRUCTURAL_FIELDS)structure[field]=fieldDraft(field,grouped.get(field)||[]);
  const body={
    schemaVersion:EXTERNAL_PROFILE_CONFIRMATION_DRAFT_VERSION,
    intakeId:extractionIr.intakeId,
    profileFamily:extractionIr.profileFamily,
    fields:freeze(fields),
    structure:freeze(structure),
    sourceRefs:freeze((extractionIr.sources||[]).map(source=>({sourceType:source.sourceType,fileName:source.fileName||null,sha256:source.sha256||null}))),
    conflicts:freeze(extractionIr.conflicts||[]),
    boundary:freeze({customerConfirmationRequired:true,phiosCalculated:false,canonicalMethodProjection:false,meaningCreated:false,interpretationCreated:false})
  };
  return freeze({...body,draftDigest:digest(body)});
}

function cleanEdit(value){return cleanExternalProfileText(value,600)||null}
function normalizeStructureEdit(field,value){
  const text=cleanExternalProfileText(value,4000);if(!text)return null;
  const labels={channels:'Channels',definedCenters:'Defined Centers',openCenters:'Open Centers'};
  const label=labels[field];if(!label)return null;
  const parsed=parseHumanDesignProfileText(`${label}: ${text}`,{sourceType:'CUSTOMER_CORRECTED',sourceRegionPrefix:`CUSTOMER_CORRECTED:${field}`});
  return parsed.structuralCandidates?.find(item=>item.field===field)?.normalizedValue||null;
}
function recordsFromDraft(draft,edits={},structureEdits={}){
  const records=[];
  for(const field of [...EXTERNAL_PROFILE_CORE_FIELDS,...EXTERNAL_PROFILE_MANUAL_FIELDS]){
    const original=draft.fields?.[field]||{};
    const edited=Object.prototype.hasOwnProperty.call(edits,field)?cleanEdit(edits[field]):original.value;
    if(!edited)continue;
    const corrected=edited!==original.value;
    records.push(freeze({field,value:edited,sourceType:corrected?'CUSTOMER_CORRECTED':(original.sourceType||'CUSTOMER_CONFIRMED'),sourceRegion:original.sourceRegion||null,sourceValue:original.value||null,customerConfirmed:true,phiosCalculated:false}));
  }
  for(const field of EXTERNAL_PROFILE_STRUCTURAL_FIELDS){
    const original=draft.structure?.[field]||{};
    if(Object.prototype.hasOwnProperty.call(structureEdits,field)&&field!=='activations'){
      const edited=normalizeStructureEdit(field,structureEdits[field]);
      if(!edited||!edited.length)continue;
      records.push(freeze({field,value:edited,sourceType:'CUSTOMER_CORRECTED',sourceRegion:`CUSTOMER_CORRECTED:${field}`,sourceValue:original.value??null,customerConfirmed:true,phiosCalculated:false}));
      continue;
    }
    if(original.value==null)continue;
    records.push(freeze({field,value:original.value,sourceType:original.sourceType||'CUSTOMER_CONFIRMED_UPLOAD',sourceRegion:original.sourceRegion||null,sourceValue:original.value,customerConfirmed:true,phiosCalculated:false}));
  }
  return records;
}

export function confirmExternalProfile({confirmationDraft,edits={},structureEdits={},confirmedAt=new Date().toISOString()}={}){
  if(!confirmationDraft||confirmationDraft.schemaVersion!==EXTERNAL_PROFILE_CONFIRMATION_DRAFT_VERSION)throw new TypeError('EXTERNAL_PROFILE_CONFIRMATION_DRAFT_INVALID');
  if(typeof confirmationDraft.intakeId!=='string'||!confirmationDraft.intakeId)throw new TypeError('EXTERNAL_PROFILE_CONFIRMATION_INTAKE_ID_REQUIRED');
  const records=recordsFromDraft(confirmationDraft,edits,structureEdits);
  if(!records.length)throw new TypeError('EXTERNAL_PROFILE_CONFIRMATION_VALUE_REQUIRED');
  const profile={
    schemaVersion:EXTERNAL_PROFILE_CONFIRMED_VERSION,
    methodId:'XPF',
    profileFamily:confirmationDraft.profileFamily,
    authorityClass:'CUSTOMER_SUPPLIED_EXTERNAL_CONTEXT',
    intakeId:confirmationDraft.intakeId,
    confirmedAt:new Date(confirmedAt).toISOString(),
    records:freeze(records),
    sourceRefs:confirmationDraft.sourceRefs||[],
    provenance:freeze({customerConfirmed:true,phiosCalculated:false,hdrShadowMayValidateButMayNotOverwrite:true}),
    boundary:freeze({canonicalMethodProjection:false,calculatedMethodConsensusEligible:false,meaningCreated:false,interpretationCreated:false,persisted:false})
  };
  return freeze({...profile,profileDigest:digest(profile)});
}
