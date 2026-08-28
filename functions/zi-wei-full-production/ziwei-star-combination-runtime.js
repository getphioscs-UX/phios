import {sha256Stable} from '../zi-wei-runtime/zwr-utils.js';
import {MAIN_STARS,STAR_ZH} from './ziwei-structural-registry.js';
import {assertZiweiSourceAdmission} from './ziwei-source-admission-authority-v1.js';

export const ZIWEI_STAR_COMBINATION_SCHEMA='PHI-OS-ZIWEI-STAR-COMBINATION-RUNTIME-v1.0.0';
export const ZIWEI_STAR_COMBINATION_VERSION='1.0.0';
const RELATION_PRIORITY=Object.freeze(['SAME_PALACE','OPPOSITE_PALACES','TRIAD_PALACES','ADJACENT_PALACES']);
function fail(code){const e=new Error(code);e.code=code;throw e;}
function freeze(v){if(v&&typeof v==='object'&&!Object.isFrozen(v)){Object.freeze(v);for(const x of Object.values(v))freeze(x)}return v;}
function key2(a,b){return [a,b].sort().join('|');}
function uniq(values){return [...new Set(values)];}
function sortStars(stars){return [...stars].sort((a,b)=>a.starCode.localeCompare(b.starCode));}
function pairs(values){const out=[];for(let i=0;i<values.length;i++)for(let j=i+1;j<values.length;j++)out.push([values[i],values[j]]);return out;}
function starLite(s,stateByStar,txByStar){return freeze({starCode:s.starCode,starZh:s.zh||STAR_ZH[s.starCode]||s.starCode,starClass:s.starClass,palaceCode:s.palaceCode,branch:s.branch,state:stateByStar.get(s.starCode)||null,transformations:txByStar.get(s.starCode)||[]});}

export function buildZiweiStarCombinationRuntime({chart,placement,starStates,transformationMatrix,relationships}={}){
 assertZiweiSourceAdmission();
 if(chart?.schemaVersion!=='PHI-OS-ZIWEI-CANONICAL-CHART-IR-v1.0.0')fail('ZIWEI_FP_W7_CANONICAL_CHART_REQUIRED');
 if(placement?.schemaVersion!=='PHI-OS-ZIWEI-COMPLETE-STAR-PLACEMENT-v1.0.0'||placement.sourceChartDigest!==chart.chartDigest)fail('ZIWEI_FP_W7_PLACEMENT_LINEAGE_REQUIRED');
 if(starStates?.schemaVersion!=='PHI-OS-ZIWEI-STAR-STATE-RESULT-v1.0.0'||starStates.sourcePlacementDigest!==placement.placementDigest)fail('ZIWEI_FP_W7_STAR_STATE_LINEAGE_REQUIRED');
 if(transformationMatrix?.schemaVersion!=='PHI-OS-ZIWEI-FOUR-TRANSFORMATION-MATRIX-v1.0.0'||transformationMatrix.sourceChartDigest!==chart.chartDigest)fail('ZIWEI_FP_W7_TRANSFORMATION_MATRIX_LINEAGE_REQUIRED');
 if(relationships?.schemaVersion!=='PHI-OS-ZIWEI-PALACE-RELATIONSHIP-ENGINE-v1.0.0'||relationships.sourcePlacementDigest!==placement.placementDigest)fail('ZIWEI_FP_W7_RELATIONSHIP_LINEAGE_REQUIRED');
 if(placement.allStars.length!==28||new Set(placement.allStars.map(x=>x.starCode)).size!==28)fail('ZIWEI_FP_W7_REQUIRES_28_UNIQUE_STARS');
 const stateByStar=new Map(starStates.stars.map(s=>[s.starCode,s.state]));
 const txByStar=new Map();for(const tx of transformationMatrix.allTransformations){if(!txByStar.has(tx.targetStarCode))txByStar.set(tx.targetStarCode,[]);txByStar.get(tx.targetStarCode).push(freeze({layer:tx.layer,transformationCode:tx.transformationCode,palaceCode:tx.palaceCode,sourceStem:tx.sourceStem||null}));}
 const palaceByCode=new Map(chart.palaces.map(p=>[p.palaceCode,p]));
 const starsByPalace=new Map(chart.palaces.map(p=>[p.palaceCode,sortStars(placement.allStars.filter(s=>s.palaceCode===p.palaceCode))]));
 const oppositeSet=new Set(relationships.oppositePairs.map(x=>key2(x.a.palaceCode,x.b.palaceCode)));
 const triadSet=new Set();for(const g of relationships.trineGroups){for(const [a,b] of pairs(g.palaces.map(p=>p.palaceCode)))triadSet.add(key2(a,b));}
 const adjacentSet=new Set(relationships.adjacencyPairs.map(x=>key2(x.a.palaceCode,x.b.palaceCode)));
 function relationType(aPalace,bPalace){if(aPalace===bPalace)return 'SAME_PALACE';const k=key2(aPalace,bPalace);if(oppositeSet.has(k))return 'OPPOSITE_PALACES';if(triadSet.has(k))return 'TRIAD_PALACES';if(adjacentSet.has(k))return 'ADJACENT_PALACES';return 'OTHER';}
 const palaceCombinations=chart.palaces.map(p=>{
   const ss=starsByPalace.get(p.palaceCode)||[];
   const samePalacePairs=pairs(ss).map(([a,b])=>freeze({pairId:`ZWR-COMB-SAME:${[a.starCode,b.starCode].sort().join(':')}`,relationType:'SAME_PALACE',palaceCode:p.palaceCode,branch:p.branch,stars:[starLite(a,stateByStar,txByStar),starLite(b,stateByStar,txByStar)]}));
   const main=ss.filter(s=>MAIN_STARS.includes(s.starCode));
   return freeze({palaceCode:p.palaceCode,palaceZh:p.zh,branch:p.branch,starCount:ss.length,mainStarCount:main.length,starCodes:ss.map(s=>s.starCode),mainStarCodes:main.map(s=>s.starCode),stars:ss.map(s=>starLite(s,stateByStar,txByStar)),samePalacePairs});
 });
 const networkPairs=[];const all=sortStars(placement.allStars);
 for(const [a,b] of pairs(all)){
   const rel=relationType(a.palaceCode,b.palaceCode);if(rel==='OTHER'||rel==='SAME_PALACE')continue;
   networkPairs.push(freeze({pairId:`ZWR-COMB-${rel}:${[a.starCode,b.starCode].sort().join(':')}`,relationType:rel,palaces:[a.palaceCode,b.palaceCode],stars:[starLite(a,stateByStar,txByStar),starLite(b,stateByStar,txByStar)]}));
 }
 const samePalacePairs=palaceCombinations.flatMap(x=>x.samePalacePairs);
 const networks=relationships.networks.map(n=>{
   const own=starsByPalace.get(n.target.palaceCode)||[],opp=starsByPalace.get(n.opposite.palaceCode)||[];
   const triads=n.triadPalaces.map(p=>({palaceCode:p.palaceCode,starCodes:(starsByPalace.get(p.palaceCode)||[]).map(s=>s.starCode)}));
   const prev=starsByPalace.get(n.flankingPalaces.previous.palaceCode)||[],next=starsByPalace.get(n.flankingPalaces.next.palaceCode)||[];
   return freeze({targetPalaceCode:n.target.palaceCode,targetBranch:n.target.branch,targetStarCodes:own.map(s=>s.starCode),opposite:{palaceCode:n.opposite.palaceCode,starCodes:opp.map(s=>s.starCode)},triads,flanks:{previous:{palaceCode:n.flankingPalaces.previous.palaceCode,starCodes:prev.map(s=>s.starCode)},next:{palaceCode:n.flankingPalaces.next.palaceCode,starCodes:next.map(s=>s.starCode)}},emptyMainStarPalace:n.emptyPalace.isEmptyMainStarPalace,oppositeMainStarReference:n.emptyPalace.oppositeMainStarReference});
 });
 const transformationBindings=all.map(s=>freeze({starCode:s.starCode,starZh:s.zh||STAR_ZH[s.starCode]||s.starCode,palaceCode:s.palaceCode,bindings:txByStar.get(s.starCode)||[]})).filter(x=>x.bindings.length>0);
 const relationCounts=Object.fromEntries(RELATION_PRIORITY.map(r=>[r,r==='SAME_PALACE'?samePalacePairs.length:networkPairs.filter(x=>x.relationType===r).length]));
 const base={schemaVersion:ZIWEI_STAR_COMBINATION_SCHEMA,work:'ZIWEI-FP-W7',runtimeVersion:ZIWEI_STAR_COMBINATION_VERSION,scopeCode:'STAR_COPRESENCE_NETWORK_STATE_TRANSFORMATION_BINDING_V1',sourceChartDigest:chart.chartDigest,sourcePlacementDigest:placement.placementDigest,sourceStarStateDigest:starStates.stateDigest,sourceTransformationMatrixDigest:transformationMatrix.matrixDigest,sourceRelationshipDigest:relationships.relationshipDigest,palaceCombinations,samePalacePairs,networkPairs,networks,transformationBindings,coverage:{stars:all.length,palaces:palaceCombinations.length,samePalacePairs:samePalacePairs.length,networkPairs:networkPairs.length,relationCounts,flankNetworks:networks.length,starStateBindings:all.length,transformationBoundStars:transformationBindings.length},authority:{starPlacement:'ZIWEI-FP-W3_SOURCE_ADMITTED',starState:'ZIWEI-FP-W4_SOURCE_ADMITTED',fourTransformations:'ZIWEI-FP-W5_EXISTING_AUTHORITIES_REUSED',palaceGeometry:'ZIWEI-FP-W6_STRUCTURAL_GEOMETRY_FROZEN'},boundaries:{sourceInputsMutated:false,traditionalPatternQualified:false,combinationMeaningCreated:false,numericCombinationStrengthCreated:false,goodBadConclusionCreated:false,fortunePredictionCreated:false,professionalJudgmentCreated:false,customerInterpretationCreated:false,customerCutoverAllowed:false}};
 return freeze({...base,combinationDigest:sha256Stable(base)});
}
export default Object.freeze({buildZiweiStarCombinationRuntime});
