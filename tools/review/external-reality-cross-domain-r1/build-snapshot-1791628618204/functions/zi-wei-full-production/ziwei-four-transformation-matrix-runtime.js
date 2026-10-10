import {sha256Stable} from '../zi-wei-runtime/zwr-utils.js';
import {TRANSFORMATION_ZH,STAR_ZH,PALACE_ZH} from './ziwei-structural-registry.js';
import {assertZiweiSourceAdmission} from './ziwei-source-admission-authority-v1.js';

export const ZIWEI_FOUR_TRANSFORMATION_MATRIX_SCHEMA='PHI-OS-ZIWEI-FOUR-TRANSFORMATION-MATRIX-v1.0.0';
export const ZIWEI_FOUR_TRANSFORMATION_MATRIX_VERSION='1.0.0';
const CODES=Object.freeze(['HUA_LU','HUA_QUAN','HUA_KE','HUA_JI']);
const LAYERS=Object.freeze(['NATAL','DA_XIAN','LIU_NIAN']);
function fail(code){const e=new Error(code);e.code=code;throw e;}
function freeze(v){if(v&&typeof v==='object'&&!Object.isFrozen(v)){Object.freeze(v);for(const x of Object.values(v))freeze(x)}return v;}
function unique4(items,scope){if(items.length!==4||new Set(items.map(x=>x.transformationCode)).size!==4||!CODES.every(code=>items.some(x=>x.transformationCode===code)))fail(`ZIWEI_FP_W5_${scope}_FOUR_TRANSFORMATIONS_REQUIRED`);}
function palaceMap(chart){return new Map(chart.palaces.map(p=>[p.palaceCode,p]));}
function normalizeOne(x,layer,sourceStem,chart){
 const star=chart.stars.find(s=>s.starCode===x.targetStarCode);if(!star)fail('ZIWEI_FP_W5_TRANSFORMATION_TARGET_STAR_REQUIRED');
 const palace=chart.palaces.find(p=>p.branch===(x.branch||star.branch));if(!palace)fail('ZIWEI_FP_W5_TRANSFORMATION_TARGET_PALACE_REQUIRED');
 return freeze({
  layer,sourceStem:sourceStem||null,transformationCode:x.transformationCode,transformationZh:TRANSFORMATION_ZH[x.transformationCode]||x.transformationCode,
  targetStarCode:x.targetStarCode,targetStarZh:STAR_ZH[x.targetStarCode]||x.targetStarCode,branch:x.branch||star.branch,palaceCode:x.palaceCode||palace.palaceCode,palaceZh:PALACE_ZH[x.palaceCode||palace.palaceCode]||x.palaceCode||palace.palaceCode,
  sourceScope:x.scope||x.sourceLayer||layer,sourceRef:x.sourceRef||null
 });
}
function layerStatus(chart,layer){
 if(layer==='NATAL')return {state:'ACTIVE',sourceStem:chart.birthAuthority?.birthYear?.stem||null,sourceContext:{basis:'LUNAR_BIRTH_YEAR_STEM'}};
 const t=chart.timeLayers||{};if(t.availability!=='ATTACHED_CALCULATED')return {state:'NOT_ATTACHED',sourceStem:null,sourceContext:null};
 if(layer==='DA_XIAN'){
  if(t.daXian?.state!=='ACTIVE'||!t.daXian?.current)return {state:t.daXian?.state||'NOT_ACTIVE',sourceStem:null,sourceContext:t.daXian||null};
  return {state:'ACTIVE',sourceStem:t.daXian.current.palaceStem||null,sourceContext:{cycleIndex:t.daXian.current.cycleIndex,startNominalAge:t.daXian.current.startNominalAge,endNominalAge:t.daXian.current.endNominalAge,lifeBranch:t.daXian.current.lifeBranch,natalDomainCode:t.daXian.current.natalDomainCode,palaceStem:t.daXian.current.palaceStem}};
 }
 if(layer==='LIU_NIAN')return {state:'ACTIVE',sourceStem:t.annual?.yearStem||null,sourceContext:t.annual?{lunarYear:t.annual.lunarYear,yearStem:t.annual.yearStem,yearBranch:t.annual.yearBranch,lifeBranch:t.annual.lifeBranch,natalDomainCode:t.annual.natalDomainCode}:null};
 fail('ZIWEI_FP_W5_UNKNOWN_LAYER');
}
export function buildZiweiFourTransformationMatrix({chart}={}){
 assertZiweiSourceAdmission();
 if(chart?.schemaVersion!=='PHI-OS-ZIWEI-CANONICAL-CHART-IR-v1.0.0')fail('ZIWEI_FP_W5_CANONICAL_CHART_REQUIRED');
 const natal=chart.transformations.map(x=>normalizeOne(x,'NATAL',chart.birthAuthority?.birthYear?.stem,chart));unique4(natal,'NATAL');
 const dyn=Array.isArray(chart.timeLayers?.dynamicTransformations)?chart.timeLayers.dynamicTransformations:[];
 for(const x of dyn)if(!['DA_XIAN','LIU_NIAN'].includes(x.sourceLayer))fail('ZIWEI_FP_W5_UNAUTHORISED_DYNAMIC_LAYER');
 const layers=[];const all=[...natal];
 for(const layer of LAYERS){
  const status=layerStatus(chart,layer);let items=[];
  if(layer==='NATAL')items=natal;
  else if(status.state==='ACTIVE'){
   items=dyn.filter(x=>x.sourceLayer===layer).map(x=>normalizeOne(x,layer,x.sourceStem||status.sourceStem,chart));unique4(items,layer);
   if(status.sourceStem&&items.some(x=>x.sourceStem!==status.sourceStem))fail(`ZIWEI_FP_W5_${layer}_STEM_LINEAGE_MISMATCH`);
   all.push(...items);
  } else if(dyn.some(x=>x.sourceLayer===layer))fail(`ZIWEI_FP_W5_${layer}_UNEXPECTED_TRANSFORMATIONS`);
  layers.push(freeze({layer,state:status.state,sourceStem:status.sourceStem,sourceContext:status.sourceContext,transformations:items}));
 }
 const byPalace=palaceMap(chart);const palaceMatrix=chart.palaces.map(p=>freeze({palaceCode:p.palaceCode,palaceZh:p.zh,branch:p.branch,byLayer:Object.fromEntries(LAYERS.map(layer=>[layer,all.filter(x=>x.layer===layer&&x.palaceCode===p.palaceCode)])),allTransformations:all.filter(x=>x.palaceCode===p.palaceCode)}));
 const overlaps=[];
 for(const star of new Set(all.map(x=>x.targetStarCode))){const xs=all.filter(x=>x.targetStarCode===star);if(new Set(xs.map(x=>x.layer)).size>1)overlaps.push(freeze({type:'SAME_TARGET_STAR_ACROSS_LAYERS',targetStarCode:star,targetStarZh:STAR_ZH[star]||star,layers:[...new Set(xs.map(x=>x.layer))],transformations:xs.map(x=>({layer:x.layer,transformationCode:x.transformationCode,palaceCode:x.palaceCode}))}));}
 for(const p of chart.palaces){const xs=all.filter(x=>x.palaceCode===p.palaceCode);if(new Set(xs.map(x=>x.layer)).size>1)overlaps.push(freeze({type:'SAME_PALACE_ACROSS_LAYERS',palaceCode:p.palaceCode,palaceZh:p.zh,layers:[...new Set(xs.map(x=>x.layer))],transformationCount:xs.length}));}
 const base={schemaVersion:ZIWEI_FOUR_TRANSFORMATION_MATRIX_SCHEMA,work:'ZIWEI-FP-W5',runtimeVersion:ZIWEI_FOUR_TRANSFORMATION_MATRIX_VERSION,scopeCode:'NATAL_DA_XIAN_LIU_NIAN_TRANSFORMATION_MATRIX_V1',sourceChartDigest:chart.chartDigest,sourceProjectionId:chart.sourceProjection?.projectionId||null,sourceDynamicProjectionId:chart.timeLayers?.dynamicProjectionId||null,layers,allTransformations:all,palaceMatrix,overlaps,coverage:{natal:true,daXian:layers.find(x=>x.layer==='DA_XIAN').state==='ACTIVE',liuNian:layers.find(x=>x.layer==='LIU_NIAN').state==='ACTIVE',palaceStemFlying:false,liuYue:false,liuRi:false,liuShi:false},authority:{natal:'BIRTH_YEAR_STEM_FOUR_TRANSFORMATIONS_SOUTHERN_TABLE_V1',daXian:'ZI_WEI_DYNAMIC_DOMAIN_POLICY@2.0.0',liuNian:'ZI_WEI_DYNAMIC_DOMAIN_POLICY@2.0.0',sourceAdmission:'ZIWEI-SOURCE-CLAIM-BATCH-001:HUMAN_ADMITTED_29_OF_29',renConflictPolicy:'PRESERVE_CURRENT_HUMAN_FROZEN_REN_ROW_NO_CLASSICAL_VARIANT_OVERRIDE'},boundaries:{sourceChartMutated:false,natalRecalculated:false,dynamicRecalculated:false,natalTransformationTableChanged:false,palaceStemFlyingCreated:false,monthlyCreated:false,dailyCreated:false,hourlyCreated:false,interpretationCreated:false,goodBadConclusionCreated:false,fortunePredictionCreated:false,professionalJudgmentCreated:false,customerCutoverAllowed:false}};
 return freeze({...base,matrixDigest:sha256Stable(base),executionCompleteness:layers.some(x=>x.layer!=='NATAL'&&x.state!=='ACTIVE')?'NATAL_COMPLETE_DYNAMIC_PARTIAL_OR_NOT_ATTACHED':'COMPLETE_NATAL_DA_XIAN_LIU_NIAN'});
}
export default Object.freeze({buildZiweiFourTransformationMatrix});
