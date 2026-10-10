export const CROSS_METHOD_RUNTIME_READING_IR_SCHEMA='PHI-OS-CROSS-METHOD-RUNTIME-READING-IR-v1.0.0';
const ALLOWED=new Map([
 ['PHI-OS-AST-RUNTIME-READING-IR-v1.0.0','ASTROLOGY'],
 ['PHI-OS-BZR-RUNTIME-READING-IR-v1.0.0','BAZI'],
 ['PHI-OS-NUM-RUNTIME-READING-IR-v1.0.0','NUMEROLOGY']
]);
function fail(code){const e=new Error(code);e.code=code;throw e;}
function freeze(v){if(v&&typeof v==='object'&&!Object.isFrozen(v)){Object.freeze(v);for(const x of Object.values(v))freeze(x)}return v;}
export function buildCrossMethodRuntimeReadingIR({readings=[]}={}){
 if(!Array.isArray(readings)||readings.length<2||readings.length>3)fail('CROSS_METHOD_READING_REQUIRES_TWO_OR_THREE_ACCEPTED_READINGS');
 const seen=new Set();
 const sources=readings.map(r=>{const method=ALLOWED.get(r?.schemaVersion);if(!method||r.methodCode!==method)fail('CROSS_METHOD_READING_UNACCEPTED_READING_SCHEMA');if(seen.has(method))fail('CROSS_METHOD_READING_DUPLICATE_METHOD');seen.add(method);if(!r.sourceProjectionId||!r.sourceMeaningBundleCode)fail('CROSS_METHOD_READING_LINEAGE_REQUIRED');return freeze({methodCode:method,readingSchema:r.schemaVersion,sourceProjectionId:r.sourceProjectionId,sourceMeaningBundleCode:r.sourceMeaningBundleCode,executionCompleteness:r.executionCompleteness,locale:r.locale});});
 return freeze({schemaVersion:CROSS_METHOD_RUNTIME_READING_IR_SCHEMA,status:'COMPOSED_FROM_ACCEPTED_READINGS',sources,composition:{classification:'NOT_INFERRED_V1',claims:[],recommendations:[],professionalJudgment:null},boundaries:{sourceReadingsRecalculated:false,rawProjectionConsumed:false,newCanonicalMeaningCreated:false,convergenceClassificationCreated:false,professionalJudgmentCreated:false,recommendationCreated:false}});
}
export default Object.freeze({buildCrossMethodRuntimeReadingIR});
