/**
 * ICHI-DEPTH-W5-W6 — admitted-editorial selection and Reading IR supplement.
 *
 * Candidate corpora are intentionally invisible here. Only named, timestamped,
 * source/locale/boundary-checked HUMAN_APPROVED entries may be selected.
 */

export const ICHING_DEPTH_EDITORIAL_RUNTIME_VERSION='1.0.0';
export const ICHING_DEPTH_SELECTION_SCHEMA='PHI-OS-ICHI-DEPTH-SELECTION-v1.0.0';
export const ICHING_DEPTH_READING_SUPPLEMENT_SCHEMA='PHI-OS-ICHI-DEPTH-READING-SUPPLEMENT-v1.0.0';

const arr=value=>Array.isArray(value)?value:[];
const clone=value=>structuredClone(value);
const freeze=value=>Object.freeze(value);
const LOCALES=new Set(['zh-Hans','en']);
const coordinate=entry=>entry.scope==='LINE'?`${entry.hexagramId}:L${entry.linePosition}`:entry.hexagramId;

function approved(entry){
  const review=entry?.review;
  return review?.status==='HUMAN_APPROVED'
    &&review.humanApproved===true
    &&typeof review.reviewer==='string'
    &&review.reviewer.trim().length>0
    &&typeof review.reviewedAt==='string'
    &&Number.isFinite(Date.parse(review.reviewedAt))
    &&review.sourceFidelityChecked===true
    &&review.localeFidelityChecked===true
    &&review.boundaryChecked===true;
}

function validateEntry(entry){
  if(entry?.schemaVersion!=='PHI-OS-ICHI-DEPTH-INTERPRETATION-ENTRY-v1.0.0') throw new TypeError('ICHI_DEPTH_ENTRY_SCHEMA_INVALID');
  if(entry.methodCode!=='I_CHING') throw new TypeError('ICHI_DEPTH_METHOD_INVALID');
  if(!/^HEXAGRAM-(0[1-9]|[1-5][0-9]|6[0-4])$/.test(entry.hexagramId)) throw new TypeError('ICHI_DEPTH_HEXAGRAM_ID_INVALID');
  if(!['HEXAGRAM','LINE'].includes(entry.scope)) throw new TypeError('ICHI_DEPTH_SCOPE_INVALID');
  if(entry.scope==='LINE'&&(!Number.isInteger(entry.linePosition)||entry.linePosition<1||entry.linePosition>6)) throw new TypeError('ICHI_DEPTH_LINE_POSITION_INVALID');
  if(entry.scope==='HEXAGRAM'&&entry.linePosition!==undefined) throw new TypeError('ICHI_DEPTH_HEXAGRAM_MAY_NOT_HAVE_LINE_POSITION');
  if(entry.contentClass!=='PHIOS_DEPTH_EDITORIAL_INTERPRETATION') throw new TypeError('ICHI_DEPTH_CONTENT_CLASS_INVALID');
  if(!arr(entry.sourceBindings?.sourceIds).length||!arr(entry.sourceBindings?.sourceClaimRefs).length||entry.sourceBindings?.sourceTextCopied!==false) throw new TypeError('ICHI_DEPTH_SOURCE_BINDING_INVALID');
  if(!entry.localeProjections?.['zh-Hans']||!entry.localeProjections?.en) throw new TypeError('ICHI_DEPTH_BILINGUAL_PROJECTION_REQUIRED');
  if(entry.authority?.canonicalMeaningCreated!==false||entry.authority?.realityTruthCreated!==false||entry.authority?.fateConclusionCreated!==false||entry.authority?.professionalJudgmentCreated!==false||entry.authority?.runtimeModelGenerationAllowed!==false) throw new TypeError('ICHI_DEPTH_AUTHORITY_BOUNDARY_INVALID');
}

export function createIChingDepthEditorialIndex(admittedCorpus){
  if(admittedCorpus?.schemaVersion!=='PHI-OS-ICHI-DEPTH-ADMITTED-EDITORIAL-CORPUS-v1.0.0'||!Array.isArray(admittedCorpus.entries)) throw new TypeError('ICHI_DEPTH_ADMITTED_CORPUS_REQUIRED');
  const index=new Map();
  for(const entry of admittedCorpus.entries){
    validateEntry(entry);
    if(!approved(entry)) throw new TypeError(`ICHI_DEPTH_UNAPPROVED_ENTRY_IN_ADMITTED_CORPUS:${entry.interpretationId}`);
    const key=coordinate(entry);
    if(index.has(key)) throw new TypeError(`ICHI_DEPTH_DUPLICATE_ADMITTED_COORDINATE:${key}`);
    index.set(key,entry);
  }
  return index;
}

export function selectIChingDepthInterpretation({hexagramId,changingLines=[],locale='en',admittedCorpus}={}){
  if(!LOCALES.has(locale)) throw new TypeError('ICHI_DEPTH_LOCALE_UNSUPPORTED');
  if(!/^HEXAGRAM-(0[1-9]|[1-5][0-9]|6[0-4])$/.test(String(hexagramId||''))) throw new TypeError('ICHI_DEPTH_HEXAGRAM_ID_REQUIRED');
  const positions=[...new Set(arr(changingLines).map(Number))].sort((a,b)=>a-b);
  if(positions.some(value=>!Number.isInteger(value)||value<1||value>6)) throw new TypeError('ICHI_DEPTH_CHANGING_LINES_INVALID');
  const index=createIChingDepthEditorialIndex(admittedCorpus);
  const required=[hexagramId,...positions.map(position=>`${hexagramId}:L${position}`)];
  const missing=required.filter(key=>!index.has(key));
  if(missing.length){
    return freeze({
      schemaVersion:ICHING_DEPTH_SELECTION_SCHEMA,
      runtimeVersion:ICHING_DEPTH_EDITORIAL_RUNTIME_VERSION,
      methodCode:'I_CHING',
      hexagramId,
      changingLines:freeze(positions),
      locale,
      status:'CONTROLLED_UNAVAILABLE',
      missingCoordinates:freeze(missing),
      hexagram:null,
      lines:freeze([]),
      authority:freeze({
        candidateFallbackUsed:false,
        runtimeModelGenerationUsed:false,
        publicDepthAuthorityCreated:false,
        realityTruthCreated:false,
        fateConclusionCreated:false
      })
    });
  }
  const hexagram=index.get(hexagramId);
  const lines=positions.map(position=>index.get(`${hexagramId}:L${position}`));
  const project=entry=>freeze({
    interpretationId:entry.interpretationId,
    coordinate:coordinate(entry),
    scope:entry.scope,
    ...(entry.scope==='LINE'?{linePosition:entry.linePosition}:{}),
    content:freeze(clone(entry.localeProjections[locale])),
    provenance:freeze({
      sourceIds:freeze([...entry.sourceBindings.sourceIds]),
      sourceClaimRefs:freeze([...entry.sourceBindings.sourceClaimRefs]),
      derivationMode:entry.sourceBindings.derivationMode,
      reviewer:entry.review.reviewer,
      reviewedAt:entry.review.reviewedAt
    })
  });
  return freeze({
    schemaVersion:ICHING_DEPTH_SELECTION_SCHEMA,
    runtimeVersion:ICHING_DEPTH_EDITORIAL_RUNTIME_VERSION,
    methodCode:'I_CHING',
    hexagramId,
    changingLines:freeze(positions),
    locale,
    status:'AVAILABLE',
    missingCoordinates:freeze([]),
    hexagram:project(hexagram),
    lines:freeze(lines.map(project)),
    authority:freeze({
      candidateFallbackUsed:false,
      runtimeModelGenerationUsed:false,
      publicDepthAuthorityCreated:false,
      realityTruthCreated:false,
      fateConclusionCreated:false
    })
  });
}

export function composeIChingDepthReadingSupplement({readingIr,selection}={}){
  if(readingIr?.schemaVersion!=='PHI-OS-ICHING-READING-IR-v1.0.0'||readingIr?.methodCode!=='I_CHING') throw new TypeError('ICHI_DEPTH_READING_IR_REQUIRED');
  if(selection?.schemaVersion!==ICHING_DEPTH_SELECTION_SCHEMA) throw new TypeError('ICHI_DEPTH_SELECTION_REQUIRED');
  const projectedHexagram=readingIr.structuralProjection?.primary?.hexagramId;
  const projectedLines=arr(readingIr.structuralProjection?.changingLines).map(Number).sort((a,b)=>a-b);
  if(selection.hexagramId!==projectedHexagram||JSON.stringify(selection.changingLines)!==JSON.stringify(projectedLines)) throw new TypeError('ICHI_DEPTH_SELECTION_PROJECTION_MISMATCH');
  return freeze({
    schemaVersion:ICHING_DEPTH_READING_SUPPLEMENT_SCHEMA,
    runtimeVersion:ICHING_DEPTH_EDITORIAL_RUNTIME_VERSION,
    methodCode:'I_CHING',
    readingProjectionCode:readingIr.structuralProjection.projectionCode,
    status:selection.status,
    locale:selection.locale,
    depth:selection.status==='AVAILABLE'?freeze({hexagram:clone(selection.hexagram),lines:clone(selection.lines)}):null,
    controlledUnavailable:selection.status==='CONTROLLED_UNAVAILABLE'?freeze({missingCoordinates:clone(selection.missingCoordinates),reason:'HUMAN_APPROVED_DEPTH_EDITORIAL_NOT_AVAILABLE'}):null,
    authority:freeze({
      existingReadingIrMutated:false,
      canonicalStructureOverridden:false,
      sourceClaimsOverridden:false,
      candidateFallbackUsed:false,
      runtimeModelGenerationUsed:false,
      realityTruthCreated:false,
      fateConclusionCreated:false,
      professionalJudgmentCreated:false,
      userDecisionAuthority:true,
      publicProductionEligible:false
    })
  });
}

export function inspectIChingDepthAdmission(admittedCorpus){
  const index=createIChingDepthEditorialIndex(admittedCorpus);
  const hexagram=[...index.keys()].filter(key=>!key.includes(':L')).length;
  const line=index.size-hexagram;
  return freeze({
    admitted:index.size,
    hexagram,
    line,
    coverage:freeze({hexagram:`${hexagram}/64`,line:`${line}/384`,total:`${index.size}/448`}),
    humanEditorialComplete:hexagram===64&&line===384,
    publicDepthReady:false,
    productionAuthorityChanged:false
  });
}
