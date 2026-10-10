import {sha256Stable,stableStringify} from '../zi-wei-runtime/zwr-utils.js';
import {ZIWEI_FP_STRUCTURAL_REGISTRY_VERSION,BRANCH_ZH,STEM_ZH,PALACE_ZH,PALACE_EN,STAR_ZH,STAR_CLASS,TRANSFORMATION_ZH,BUREAU_ZH} from './ziwei-structural-registry.js';

export const ZIWEI_CANONICAL_CHART_IR_SCHEMA='PHI-OS-ZIWEI-CANONICAL-CHART-IR-v1.0.0';
function fail(code){const e=new Error(code);e.code=code;throw e;}
function freeze(v){if(v&&typeof v==='object'&&!Object.isFrozen(v)){Object.freeze(v);for(const x of Object.values(v))freeze(x)}return v;}
function structure(p,code){return (p?.calculation?.structures||[]).find(x=>x.code===code)?.items||[];}
function generic(p){return p?.method?.publicMethodCode==='ZI_WEI_PROJECTION';}
function direct(p){return p?.method?.methodCode==='ZI_WEI_DOU_SHU'&&Array.isArray(p?.calculation?.palaces);}
function extractPalaces(p){
 if(generic(p))return structure(p,'ZI_WEI_PALACES').map(x=>({palaceCode:x.code,branch:x.value,stem:x.meta?.stem||null,isLifePalace:x.meta?.isLifePalace===true||x.code==='LIFE',isBodyPalace:x.meta?.isBodyPalace===true}));
 if(direct(p))return p.calculation.palaces.map(x=>({palaceCode:x.palaceCode,branch:x.branch,stem:x.stem,isLifePalace:x.palaceCode==='LIFE',isBodyPalace:x.isBodyPalace===true}));
 return [];
}
function extractStars(p){
 if(generic(p))return structure(p,'ZI_WEI_STARS').map(x=>({starCode:x.code,branch:x.value,starClass:x.meta?.starClass||STAR_CLASS[x.code]||'UNKNOWN',group:x.meta?.group||null,basis:x.meta?.basis||null}));
 if(direct(p))return [...(p.calculation.mainStars||[]).map(x=>({...x,starClass:'MAIN'})),...(p.calculation.supportStars||[]).map(x=>({...x,starClass:'SUPPORT'}))];
 return [];
}
function extractTransformations(p){
 if(generic(p))return structure(p,'ZI_WEI_TRANSFORMATIONS').map(x=>({transformationCode:x.code,targetStarCode:x.meta?.targetStarCode||x.value,branch:x.meta?.branch||null,schoolLabel:x.meta?.schoolLabel||null,scope:x.meta?.scope||null}));
 if(direct(p))return (p.calculation.transformations||[]).map(x=>({...x}));
 return [];
}
function extractBureau(p,sourceCalculationIR){
 if(generic(p)){const code=(p.calculation?.values||[]).find(x=>x.code==='FIVE_ELEMENT_BUREAU')?.value;return code?{code,element:String(code).split('_')[0],bureau:Number(String(code).split('_')[1])}:null;}
 if(direct(p))return p.calculation.fiveElementBureau||null;
 return sourceCalculationIR?.palaceStructure?.fiveElementBureau||null;
}
function sourceDigestExpected(p){return p?.zwrLineage?.sourceCalculationDigest||p?.projection?.sourceCalculationDigest||null;}
function normalizeCalendar(sourceCalculationIR,p){return sourceCalculationIR?.calendar||p?.calculation?.calendar||null;}

export async function buildCanonicalZiweiChartIR({canonicalProjection,sourceCalculationIR,dynamicProjection=null}={}){
 const p=canonicalProjection;if(!p?.projectionId)fail('ZIWEI_FP_W1_PROJECTION_ID_REQUIRED');if(!generic(p)&&!direct(p))fail('ZIWEI_FP_W1_REQUIRES_ZI_WEI_PROJECTION');
 const pSnapshot=stableStringify(p),irSnapshot=sourceCalculationIR?stableStringify(sourceCalculationIR):null,dynSnapshot=dynamicProjection?stableStringify(dynamicProjection):null;
 const expected=sourceDigestExpected(p);if(expected&&sourceCalculationIR?.calculationDigest&&expected!==sourceCalculationIR.calculationDigest)fail('ZIWEI_FP_W1_CALCULATION_LINEAGE_MISMATCH');
 const rawPalaces=extractPalaces(p);if(rawPalaces.length!==12||new Set(rawPalaces.map(x=>x.palaceCode)).size!==12)fail('ZIWEI_FP_W1_REQUIRES_TWELVE_PALACES');
 const byBranch=new Map(rawPalaces.map(x=>[x.branch,x]));const rawStars=extractStars(p);if(rawStars.length<20)fail('ZIWEI_FP_W1_REQUIRES_FROZEN_20_STAR_BASELINE');
 const rawTrans=extractTransformations(p);const bureau=extractBureau(p,sourceCalculationIR);if(!bureau?.code)fail('ZIWEI_FP_W1_FIVE_ELEMENT_BUREAU_REQUIRED');
 const calendar=normalizeCalendar(sourceCalculationIR,p);if(!calendar)fail('ZIWEI_FP_W1_EXISTING_CALENDAR_AUTHORITY_REQUIRED');
 const stars=rawStars.map(s=>({starCode:s.starCode,zh:STAR_ZH[s.starCode]||s.starCode,branch:s.branch,branchZh:BRANCH_ZH[s.branch]||s.branch,palaceCode:byBranch.get(s.branch)?.palaceCode||null,palaceZh:PALACE_ZH[byBranch.get(s.branch)?.palaceCode]||null,starClass:s.starClass||STAR_CLASS[s.starCode]||'UNKNOWN',group:s.group||null,basis:s.basis||null,sourceRef:`${p.projectionId}#STAR:${s.starCode}`}));
 const transformations=rawTrans.map(t=>({transformationCode:t.transformationCode,zh:TRANSFORMATION_ZH[t.transformationCode]||t.transformationCode,targetStarCode:t.targetStarCode,targetStarZh:STAR_ZH[t.targetStarCode]||t.targetStarCode,branch:t.branch||stars.find(s=>s.starCode===t.targetStarCode)?.branch||null,palaceCode:byBranch.get(t.branch||stars.find(s=>s.starCode===t.targetStarCode)?.branch)?.palaceCode||null,scope:t.scope||null,schoolLabel:t.schoolLabel||null,sourceRef:`${p.projectionId}#TRANSFORMATION:${t.transformationCode}`}));
 const palaces=rawPalaces.map(x=>({palaceCode:x.palaceCode,zh:PALACE_ZH[x.palaceCode]||x.palaceCode,en:PALACE_EN[x.palaceCode]||x.palaceCode,branch:x.branch,branchZh:BRANCH_ZH[x.branch]||x.branch,stem:x.stem,stemZh:STEM_ZH[x.stem]||x.stem,isLifePalace:x.isLifePalace,isBodyPalace:x.isBodyPalace,starCodes:stars.filter(s=>s.branch===x.branch).map(s=>s.starCode),transformationCodes:transformations.filter(t=>t.branch===x.branch).map(t=>t.transformationCode),sourceRef:`${p.projectionId}#PALACE:${x.palaceCode}`}));
 const life=palaces.find(x=>x.isLifePalace||x.palaceCode==='LIFE'),body=palaces.find(x=>x.isBodyPalace);if(!life||!body)fail('ZIWEI_FP_W1_LIFE_BODY_PALACE_REQUIRED');
 if(dynamicProjection&&dynamicProjection.sourceNatalProjectionId!==p.projectionId)fail('ZIWEI_FP_W1_DYNAMIC_LINEAGE_MISMATCH');
 const timeLayers=dynamicProjection?{availability:'ATTACHED_CALCULATED',dynamicProjectionId:dynamicProjection.projectionId,scopeCode:dynamicProjection.scopeCode,daXian:dynamicProjection.currentDaXian||null,annual:dynamicProjection.annualContext||null,dynamicTransformations:dynamicProjection.dynamicTransformations||[],executionCompleteness:dynamicProjection.executionCompleteness||null}:{availability:'NOT_ATTACHED',dynamicProjectionId:null,scopeCode:null,daXian:null,annual:null,dynamicTransformations:[],executionCompleteness:null};
 const base={schemaVersion:ZIWEI_CANONICAL_CHART_IR_SCHEMA,work:'ZIWEI-FP-W1',runtimeVersion:'1.0.0',methodCode:'ZWR',authorityState:'ENGINEERING_DERIVED_FROM_EXISTING_CALCULATION_AUTHORITY',sourceProjection:{projectionId:p.projectionId,publicMethodCode:p.method?.publicMethodCode||p.method?.methodCode,methodVersion:p.method?.version||p.method?.methodVersion||null,sourceCalculationDigest:expected||sourceCalculationIR?.calculationDigest||null},birthAuthority:{sourceBirthDate:calendar.sourceBirthDate||null,sourceBirthTime:calendar.sourceBirthTime||null,timezone:calendar.timezone||null,dayBoundary:calendar.dayBoundary||null,lunar:calendar.lunar||null,birthHour:calendar.birthHour||null,birthYear:calendar.birthYear||null,calendarAuthority:calendar.authority||null},lifePalace:{palaceCode:life.palaceCode,branch:life.branch,stem:life.stem,zh:life.zh},bodyPalace:{palaceCode:body.palaceCode,branch:body.branch,stem:body.stem,zh:body.zh},fiveElementBureau:{...bureau,zh:BUREAU_ZH[bureau.code]||bureau.code},palaces,stars,transformations,timeLayers,lineage:{structuralRegistryVersion:ZIWEI_FP_STRUCTURAL_REGISTRY_VERSION,currentNatalPolicyRef:'content/professional/core-method-runtime/zi-wei-calculation-policy-v1.json',fullProductionAuthorityRef:'content/professional/zi-wei-full-production/authority/ziwei-fp-w2-school-calculation-authority-v1.json'},boundaries:{canonicalProjectionReused:true,sourceCalculationAuthorityReused:true,secondProjectionAuthorityCreated:false,natalRecalculated:false,natalTransformationsMutated:false,dynamicRecalculated:false,interpretationCreated:false,goodBadScoreCreated:false,fortunePredictionCreated:false,professionalJudgmentCreated:false,productionEligible:false}};
 const chartDigest=sha256Stable(base);
 if(stableStringify(p)!==pSnapshot||sourceCalculationIR&&stableStringify(sourceCalculationIR)!==irSnapshot||dynamicProjection&&stableStringify(dynamicProjection)!==dynSnapshot)fail('ZIWEI_FP_W1_SOURCE_MUTATION_FORBIDDEN');
 return freeze({...base,chartDigest,executionCompleteness:timeLayers.availability==='ATTACHED_CALCULATED'?(timeLayers.executionCompleteness||'COMPLETE'):'NATAL_COMPLETE_TIME_LAYER_NOT_ATTACHED'});
}
export default Object.freeze({buildCanonicalZiweiChartIR});
