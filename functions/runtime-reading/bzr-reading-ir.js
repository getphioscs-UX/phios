import { consumeCanonicalMeaningForRuntimeReading } from './canonical-meaning-consumer.js';
export const BZR_RUNTIME_READING_IR_SCHEMA='PHI-OS-BZR-RUNTIME-READING-IR-v1.0.0';
function fail(code){const e=new Error(code);e.code=code;throw e;}
function freeze(value){if(value&&typeof value==='object'&&!Object.isFrozen(value)){Object.freeze(value);for(const v of Object.values(value))freeze(v)}return value;}
function executionCompleteness(projection){if(projection?.projection?.status==='COMPLETE')return 'COMPLETE';if(projection?.projection?.status==='PARTIAL')return 'PARTIAL';if(projection?.projection?.status==='BLOCKED_INPUT')return 'INPUT_REQUIRED';return 'UNAVAILABLE';}
export function buildBzrRuntimeReadingIR({projection,bundle,localeProjection}={}){
 if(projection?.method?.publicMethodCode!=='BAZI_PROJECTION')fail('BZR_READING_REQUIRES_BAZI_PROJECTION');
 if(bundle?.sourceProjection?.projectionId!==projection.projectionId)fail('BZR_READING_PROJECTION_LINEAGE_MISMATCH');
 const meaning=consumeCanonicalMeaningForRuntimeReading({bundle,localeProjection});
 const structures=(projection.calculation?.structures||[]).map(group=>freeze({code:group.code,items:(group.items||[]).map(item=>freeze({code:item.code,value:item.value,meta:item.meta||{}}))}));
 const cycles=(projection.calculation?.cycles||[]).map(item=>freeze({code:item.code,value:item.value,startAge:item.startAge,endAge:item.endAge,cycleNumber:item.cycleNumber,certainty:item.certainty}));
 const unknowns=(projection.unknown||[]).map(item=>freeze({code:item.code,category:item.category,scope:item.scope,reasonCodes:item.reasonCodes||[]}));
 const evidence=(projection.evidence||[]).map(item=>freeze({type:item.type,status:item.status,sourceCode:item.sourceCode,reference:item.reference,version:item.version,confidence:item.confidence}));
 return freeze({schemaVersion:BZR_RUNTIME_READING_IR_SCHEMA,capabilityVersion:'1.0.0',executionAuthorityMethodVersion:projection.method?.version||'0.1.0',methodCode:'BAZI',publicMethodCode:'BAZI_PROJECTION',sourceProjectionId:projection.projectionId,sourceMeaningBundleCode:bundle.bundleCode,locale:localeProjection.locale,executionCompleteness:executionCompleteness(projection),sections:{calculatedStructure:{structures,cycles},canonicalMeaning:{statements:meaning.statements},unknownAndLimitations:{unknowns,limitations:unknowns.map(x=>x.code)},inputAndAuthorityDisclosure:{evidence},provenance:{projectionId:projection.projectionId,bundleCode:bundle.bundleCode,bundleDigest:bundle.bundleDigest}},boundaries:{fortunePredictionCreated:false,eventPredictionCreated:false,professionalJudgmentCreated:false,recalculated:false,meaningInvented:false,identityFactCreated:false,traditionalCalculationSexTreatedAsIdentity:false}});
}
export default Object.freeze({buildBzrRuntimeReadingIR});
