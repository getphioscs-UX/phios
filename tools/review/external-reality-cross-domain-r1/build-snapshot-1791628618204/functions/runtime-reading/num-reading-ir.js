import { consumeCanonicalMeaningForRuntimeReading } from './canonical-meaning-consumer.js';
export const NUM_RUNTIME_READING_IR_SCHEMA='PHI-OS-NUM-RUNTIME-READING-IR-v1.0.0';
function fail(code){const e=new Error(code);e.code=code;throw e;}
function freeze(value){if(value&&typeof value==='object'&&!Object.isFrozen(value)){Object.freeze(value);for(const v of Object.values(value))freeze(v)}return value;}
export function buildNumRuntimeReadingIR({projection,bundle,localeProjection}={}){
 if(projection?.method?.publicMethodCode!=='NUMEROLOGY_PROJECTION')fail('NUM_READING_REQUIRES_NUM_PROJECTION');
 if(bundle?.sourceProjection?.projectionId!==projection.projectionId)fail('NUM_READING_PROJECTION_LINEAGE_MISMATCH');
 const meaning=consumeCanonicalMeaningForRuntimeReading({bundle,localeProjection});
 const values=(projection.calculation?.values||[]).map(x=>freeze({code:x.code,value:x.value,rawValue:x.rawValue,certainty:x.certainty}));
 const cycles=(projection.calculation?.cycles||[]).map(x=>freeze({code:x.code,value:x.value,startAge:x.startAge,endAge:x.endAge,cycleNumber:x.cycleNumber,certainty:x.certainty}));
 const executionCompleteness=projection.projection?.status==='COMPLETE'?'COMPLETE':projection.projection?.status==='PARTIAL'?'PARTIAL':'UNAVAILABLE';
 return freeze({schemaVersion:NUM_RUNTIME_READING_IR_SCHEMA,capabilityVersion:'1.0.0',executionAuthorityMethodVersion:projection.method?.version||'0.1.0-candidate',methodCode:'NUMEROLOGY',publicMethodCode:'NUMEROLOGY_PROJECTION',sourceProjectionId:projection.projectionId,sourceMeaningBundleCode:bundle.bundleCode,locale:localeProjection.locale,executionCompleteness,sections:{calculatedStructure:{values,cycles},canonicalMeaning:{statements:meaning.statements},unknownAndLimitations:{unknowns:projection.unknown||[],limitations:(projection.unknown||[]).map(x=>x.code)},provenance:{projectionId:projection.projectionId,bundleCode:bundle.bundleCode,bundleDigest:bundle.bundleDigest}},boundaries:{fortunePredictionCreated:false,professionalJudgmentCreated:false,recalculated:false,meaningInvented:false,identityFactCreated:false}});
}
export default Object.freeze({buildNumRuntimeReadingIR});
