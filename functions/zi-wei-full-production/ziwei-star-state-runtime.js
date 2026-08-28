import {sha256Stable} from '../zi-wei-runtime/zwr-utils.js';
import {ZIWEI_STAR_STATE_AUTHORITY_VERSION,ZIWEI_STAR_STATE_TABLE} from './ziwei-star-state-authority-v1.js';
import {STAR_STATE_VOCABULARY} from './ziwei-structural-registry.js';
export const ZIWEI_STAR_STATE_SCHEMA='PHI-OS-ZIWEI-STAR-STATE-RESULT-v1.0.0';
function fail(code){const e=new Error(code);e.code=code;throw e;}
function freeze(v){if(v&&typeof v==='object'&&!Object.isFrozen(v)){Object.freeze(v);for(const x of Object.values(v))freeze(x)}return v;}
export function resolveZiweiStarStates({placement}={}){
 if(placement?.schemaVersion!=='PHI-OS-ZIWEI-COMPLETE-STAR-PLACEMENT-v1.0.0')fail('ZIWEI_FP_W4_COMPLETE_STAR_PLACEMENT_REQUIRED');
 const table=ZIWEI_STAR_STATE_TABLE;
 const stars=placement.allStars.map(star=>{const entry=table[star.starCode]?.[star.branch]||null,stateCode=entry?.stateCode||'UNSPECIFIED',vocab=STAR_STATE_VOCABULARY[stateCode]||STAR_STATE_VOCABULARY.UNSPECIFIED;return {...star,state:{stateCode,zh:vocab.zh,sourceTerm:entry?.sourceTerm||null,explicitlyClassified:Boolean(entry),authorityVersion:ZIWEI_STAR_STATE_AUTHORITY_VERSION,sourceWitness:entry?.sourceWitness||null},strengthScore:null,goodBadConclusion:null};});
 const classified=stars.filter(x=>x.state.explicitlyClassified).length,unclassified=stars.length-classified;
 const base={schemaVersion:ZIWEI_STAR_STATE_SCHEMA,work:'ZIWEI-FP-W4',runtimeVersion:'1.0.0',scopeCode:'CLASSICAL_STAR_STATE_AUTHORITY_V1_SOURCE_EXPLICIT_ONLY',sourcePlacementDigest:placement.placementDigest,authorityVersion:ZIWEI_STAR_STATE_AUTHORITY_VERSION,vocabulary:Object.entries(STAR_STATE_VOCABULARY).map(([stateCode,x])=>({stateCode,zh:x.zh})),stars,coverage:{totalStars:stars.length,explicitlyClassifiedAtThisChart:classified,unclassifiedAtThisChart:unclassified,allCellsFilled:false,unspecifiedIsNotPing:true,sourceExplicitOnly:true},boundaries:{sourcePlacementMutated:false,starStateScoreCreated:false,numericStrengthScoreCreated:false,goodBadConclusionCreated:false,interpretationCreated:false,fortunePredictionCreated:false,professionalJudgmentCreated:false,productionEligible:false}};
 return freeze({...base,stateDigest:sha256Stable(base)});
}
export default Object.freeze({resolveZiweiStarStates});
