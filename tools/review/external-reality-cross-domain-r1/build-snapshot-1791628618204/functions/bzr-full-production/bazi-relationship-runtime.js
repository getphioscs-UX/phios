import {sha256,stableSerialize} from '../method-runtime/shared-calculation-runtime.js';
import {STEM_COMBINATIONS,BRANCH_SIX_COMBINATIONS,BRANCH_CLASHES,BRANCH_HARMS,BRANCH_BREAKS,THREE_HARMONIES,THREE_MEETINGS,THREE_PUNISHMENT_GROUPS,SELF_PUNISHMENT_BRANCHES} from './bazi-structural-registry.js';
export const BAZI_RELATIONSHIP_SCHEMA='PHI-OS-BAZI-STEM-BRANCH-RELATIONSHIPS-v1.0.0';
const freeze=value=>{if(value&&typeof value==='object'&&!Object.isFrozen(value)){Object.freeze(value);for(const v of Object.values(value))freeze(v)}return value};
const key=(a,b)=>[a,b].sort().join('|');
function pairs(items){const out=[];for(let i=0;i<items.length;i++)for(let j=i+1;j<items.length;j++)out.push([items[i],items[j]]);return out;}
function relationPairs(items,defs,type){const set=new Set(defs.map(x=>key(x[0],x[1])));return pairs(items).filter(([a,b])=>set.has(key(a.code,b.code))).map(([a,b])=>({type,members:[a.code,b.code],memberZh:[a.zh,b.zh],positions:[a.position,b.position],transformationEstablished:false,sourceAuthorityState:'SOURCE_GATED'}));}
function groupRelations(items,defs,type){const codes=new Set(items.map(x=>x.code));return defs.filter(d=>d.branches.every(x=>codes.has(x))).map(d=>({type,members:d.branches,element:d.element||null,positions:d.branches.map(code=>items.filter(x=>x.code===code).map(x=>x.position)).flat(),transformationEstablished:false,sourceAuthorityState:'SOURCE_GATED'}));}
export async function analyzeBaziRelationships({chart}={}){
 if(chart?.schemaVersion!=='PHI-OS-BAZI-CANONICAL-CHART-IR-v1.0.0')throw new Error('BAZI_FP_W3_REQUIRES_W1_CHART_IR');
 const snapshot=stableSerialize(chart),stems=chart.pillars.map(x=>({...x.stem,position:x.position})),branches=chart.pillars.map(x=>({...x.branch,position:x.position}));
 const relations=[...relationPairs(stems,STEM_COMBINATIONS,'STEM_COMBINATION'),...relationPairs(branches,BRANCH_SIX_COMBINATIONS,'BRANCH_SIX_COMBINATION'),...relationPairs(branches,BRANCH_CLASHES,'BRANCH_CLASH'),...relationPairs(branches,BRANCH_HARMS,'BRANCH_HARM'),...relationPairs(branches,BRANCH_BREAKS,'BRANCH_BREAK'),...groupRelations(branches,THREE_HARMONIES,'BRANCH_THREE_HARMONY'),...groupRelations(branches,THREE_MEETINGS,'BRANCH_THREE_MEETING'),...groupRelations(branches,THREE_PUNISHMENT_GROUPS,'BRANCH_PUNISHMENT_GROUP')];
 if(branches.some(x=>x.code==='ZI')&&branches.some(x=>x.code==='MAO'))relations.push({type:'BRANCH_PUNISHMENT_PAIR',members:['ZI','MAO'],positions:branches.filter(x=>x.code==='ZI'||x.code==='MAO').map(x=>x.position),transformationEstablished:false,sourceAuthorityState:'SOURCE_GATED'});
 for(const code of SELF_PUNISHMENT_BRANCHES){const found=branches.filter(x=>x.code===code);if(found.length>=2)relations.push({type:'BRANCH_SELF_PUNISHMENT',members:[code,code],positions:found.map(x=>x.position),transformationEstablished:false,sourceAuthorityState:'SOURCE_GATED'});}
 const typeCounts={};for(const r of relations)typeCounts[r.type]=(typeCounts[r.type]||0)+1;
 const base={schemaVersion:BAZI_RELATIONSHIP_SCHEMA,work:'BAZI-FP-W3',runtimeVersion:'1.0.0',sourceChartDigest:chart.chartDigest,authorityState:'ENGINEERING_STRUCTURAL_RELATIONS_SOURCE_GATED',relations,typeCounts,
  limitations:['PAIR_OR_FULL_GROUP_PRESENCE_ONLY','NO_TRANSFORMATION_OR_COMBINATION_SUCCESS_VERDICT','NO_GOOD_BAD_SCORING','NO_EVENT_PREDICTION'],
  lineage:{sourceStrategyRef:'content/interpretation/bazi/authority/bzr-r1-source-strategy-v1.json'},boundaries:{transformationVerdictCreated:false,goodBadConclusionCreated:false,interpretationCreated:false,eventPredictionCreated:false,productionEligible:false}};
 const relationshipDigest=await sha256(base);if(stableSerialize(chart)!==snapshot)throw new Error('BAZI_FP_W3_CHART_MUTATION_FORBIDDEN');return freeze({...base,relationshipDigest});
}
export default Object.freeze({analyzeBaziRelationships});
