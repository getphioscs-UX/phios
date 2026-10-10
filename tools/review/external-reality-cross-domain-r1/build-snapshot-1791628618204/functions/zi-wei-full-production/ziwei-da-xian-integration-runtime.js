import {sha256Stable,stableStringify} from '../zi-wei-runtime/zwr-utils.js';
import {PALACE_ZH} from './ziwei-structural-registry.js';

export const ZIWEI_DA_XIAN_INTEGRATION_SCHEMA='PHI-OS-ZIWEI-DA-XIAN-INTEGRATION-IR-v1.0.0';
export const ZIWEI_DA_XIAN_INTEGRATION_VERSION='1.0.0';
function fail(code){const e=new Error(code);e.code=code;throw e;}
function freeze(v){if(v&&typeof v==='object'&&!Object.isFrozen(v)){Object.freeze(v);for(const x of Object.values(v))freeze(x)}return v;}
function layer(matrix,code){return matrix.layers.find(x=>x.layer===code)||null;}
function txByPalace(matrix,layerCode,palaceCode){return (layer(matrix,layerCode)?.transformations||[]).filter(x=>x.palaceCode===palaceCode);}
function txByStar(matrix,layerCode,starCode){return (layer(matrix,layerCode)?.transformations||[]).filter(x=>x.targetStarCode===starCode);}
function litePalace(p,roleByBranch){return freeze({branch:p.branch,natalPalaceCode:p.palaceCode,natalPalaceZh:p.palaceZh||PALACE_ZH[p.palaceCode]||p.palaceCode,daXianRoleCode:roleByBranch.get(p.branch)||null,daXianRoleZh:PALACE_ZH[roleByBranch.get(p.branch)]||roleByBranch.get(p.branch)||null});}
function overlapRows(matrix,layers){
 const out=[];const tx=matrix.allTransformations.filter(x=>layers.includes(x.layer));
 const stars=[...new Set(tx.map(x=>x.targetStarCode))].sort();
 for(const starCode of stars){const rows=tx.filter(x=>x.targetStarCode===starCode);const present=[...new Set(rows.map(x=>x.layer))];if(present.length>1)out.push(freeze({type:'SAME_TARGET_STAR_ACROSS_LAYERS',starCode,palaceCode:rows[0].palaceCode,layers:present.sort(),transformations:rows.map(x=>({layer:x.layer,transformationCode:x.transformationCode,sourceStem:x.sourceStem}))}));}
 const palaces=[...new Set(tx.map(x=>x.palaceCode))].sort();
 for(const palaceCode of palaces){const rows=tx.filter(x=>x.palaceCode===palaceCode);const present=[...new Set(rows.map(x=>x.layer))];if(present.length>1)out.push(freeze({type:'SAME_PALACE_TRANSFORMATION_ACROSS_LAYERS',palaceCode,layers:present.sort(),transformations:rows.map(x=>({layer:x.layer,transformationCode:x.transformationCode,targetStarCode:x.targetStarCode,sourceStem:x.sourceStem}))}));}
 return out;
}

export function buildZiweiDaXianIntegrationIR({chart,transformationMatrix,relationships,combinations,admittedPatterns}={}){
 if(chart?.schemaVersion!=='PHI-OS-ZIWEI-CANONICAL-CHART-IR-v1.0.0')fail('ZIWEI_FP_W9_CANONICAL_CHART_REQUIRED');
 if(transformationMatrix?.schemaVersion!=='PHI-OS-ZIWEI-FOUR-TRANSFORMATION-MATRIX-v1.0.0'||transformationMatrix.sourceChartDigest!==chart.chartDigest)fail('ZIWEI_FP_W9_TRANSFORMATION_MATRIX_LINEAGE_REQUIRED');
 if(relationships?.schemaVersion!=='PHI-OS-ZIWEI-PALACE-RELATIONSHIP-ENGINE-v1.0.0'||relationships.sourceChartDigest!==chart.chartDigest)fail('ZIWEI_FP_W9_RELATIONSHIP_LINEAGE_REQUIRED');
 if(combinations?.schemaVersion!=='PHI-OS-ZIWEI-STAR-COMBINATION-RUNTIME-v1.0.0'||combinations.sourceChartDigest!==chart.chartDigest)fail('ZIWEI_FP_W9_COMBINATION_LINEAGE_REQUIRED');
 if(admittedPatterns?.schemaVersion!=='PHI-OS-ZIWEI-PATTERN-RUNTIME-v1.0.0'||admittedPatterns.sourceCombinationDigest!==combinations.combinationDigest||admittedPatterns.ruleState!=='ADMITTED_TRADITIONAL_RULESET_ACTIVE')fail('ZIWEI_FP_W9_ADMITTED_PATTERN_CONTEXT_REQUIRED');
 if(chart.timeLayers?.availability!=='ATTACHED_CALCULATED'||!chart.timeLayers.dynamicProjectionId)fail('ZIWEI_FP_W9_EXISTING_ZWD_TIME_LAYER_REQUIRED');
 const snapshots=[stableStringify(chart),stableStringify(transformationMatrix),stableStringify(relationships),stableStringify(combinations),stableStringify(admittedPatterns)];
 const da=chart.timeLayers.daXian;if(!da)fail('ZIWEI_FP_W9_DA_XIAN_CONTEXT_REQUIRED');
 const daLayer=layer(transformationMatrix,'DA_XIAN');
 const unknowns=[];
 if(da.state!=='ACTIVE'||!da.current){unknowns.push(freeze({code:da.reasonCode||'ZIWEI_FP_W9_DA_XIAN_NOT_ACTIVE',scope:'DA_XIAN',state:da.state,rendererMustDisplay:true}));}
 const roleByBranch=new Map((da.roles||[]).map(x=>[x.branch,x.roleCode]));
 const comboByPalace=new Map(combinations.palaceCombinations.map(x=>[x.palaceCode,x]));
 const roleOverlays=(da.state==='ACTIVE'?chart.palaces:[]).map(p=>{
   const comb=comboByPalace.get(p.palaceCode);const roleCode=roleByBranch.get(p.branch)||null;
   return freeze({daXianRoleCode:roleCode,daXianRoleZh:PALACE_ZH[roleCode]||roleCode,branch:p.branch,natalPalaceCode:p.palaceCode,natalPalaceZh:p.zh,stars:(comb?.stars||[]).map(s=>({starCode:s.starCode,starZh:s.starZh,starClass:s.starClass,state:s.state})),natalTransformations:txByPalace(transformationMatrix,'NATAL',p.palaceCode),daXianTransformations:txByPalace(transformationMatrix,'DA_XIAN',p.palaceCode),relationshipNetworkRef:`${relationships.relationshipDigest}#PALACE:${p.palaceCode}`});
 });
 const activeNetwork=da.current?relationships.networks.find(n=>n.target.branch===da.current.lifeBranch):null;
 if(da.state==='ACTIVE'&&!activeNetwork)fail('ZIWEI_FP_W9_CURRENT_DA_XIAN_NETWORK_REQUIRED');
 const currentLifeNetwork=activeNetwork?freeze({
   target:litePalace(activeNetwork.target,roleByBranch),
   opposite:litePalace(activeNetwork.opposite,roleByBranch),
   triads:activeNetwork.triadPalaces.map(x=>litePalace(x,roleByBranch)),
   sanFangSiZheng:activeNetwork.sanFangSiZheng.map(x=>litePalace(x,roleByBranch)),
   flanks:{previous:litePalace(activeNetwork.flankingPalaces.previous,roleByBranch),next:litePalace(activeNetwork.flankingPalaces.next,roleByBranch)},
   emptyPalace:activeNetwork.emptyPalace,
   relationRefs:activeNetwork.relationRefs
 }):null;
 const transformationBindings=daLayer?.state==='ACTIVE'?(daLayer.transformations||[]):[];
 if(da.state==='ACTIVE'&&transformationBindings.length!==4)fail('ZIWEI_FP_W9_REQUIRES_FOUR_DA_XIAN_TRANSFORMATIONS');
 const period=freeze({state:da.state,direction:da.direction,startNominalAge:da.current?.startNominalAge??null,endNominalAge:da.current?.endNominalAge??null,nominalAge:da.nominalAge,cycleIndex:da.current?.cycleIndex??null,lifeBranch:da.current?.lifeBranch??null,natalDomainCode:da.current?.natalDomainCode??null,palaceStem:da.current?.palaceStem??null,fiveElementBureauStartAge:da.startAge});
 const patternContext=freeze({sourcePatternDigest:admittedPatterns.patternDigest,activeRuleCount:admittedPatterns.coverage.activeRuleCount,qualifiedNatalPatternCount:admittedPatterns.traditionalPatterns.length,qualifiedNatalPatterns:admittedPatterns.traditionalPatterns.map(x=>({patternCode:x.patternCode,labelZh:x.labelZh,sourceClaimId:x.sourceClaimId,qualificationStatus:x.qualificationStatus})),temporalPatternRequalificationPerformed:false});
 const base={schemaVersion:ZIWEI_DA_XIAN_INTEGRATION_SCHEMA,work:'ZIWEI-FP-W9',runtimeVersion:ZIWEI_DA_XIAN_INTEGRATION_VERSION,scopeCode:'EXISTING_ZWD_DA_XIAN_OVER_NATAL_STRUCTURAL_CONTEXT_V1',sourceChartDigest:chart.chartDigest,sourceDynamicProjectionId:chart.timeLayers.dynamicProjectionId,sourceTransformationMatrixDigest:transformationMatrix.matrixDigest,sourceRelationshipDigest:relationships.relationshipDigest,sourceCombinationDigest:combinations.combinationDigest,sourcePatternDigest:admittedPatterns.patternDigest,period,roleOverlays,currentLifeNetwork,transformationBindings,natalDaXianTransformationOverlaps:overlapRows(transformationMatrix,['NATAL','DA_XIAN']),patternContext,unknowns,executionCompleteness:unknowns.length?'PARTIAL':'COMPLETE',authority:{dynamicPeriod:'ZI_WEI_DYNAMIC_DOMAIN_POLICY@2.0.0',dynamicProductionAcceptance:'content/professional/zi-wei-dynamic/acceptance/zi-wei-dynamic-production-acceptance-v1.json',fourTransformations:'ZIWEI-FP-W5_EXISTING_ZWD_DA_XIAN_LAYER',palaceGeometry:'ZIWEI-FP-W6_REUSED_BY_BRANCH',starCombination:'ZIWEI-FP-W7',patternRules:'ZIWEI-FP-W8_HUMAN_ADMITTED_11_RULES'},boundaries:{zwdRecalculated:false,daXianDirectionRecalculated:false,daXianPeriodReselected:false,natalChartMutated:false,natalStarPlacementMutated:false,patternRequalifiedAsTemporalPattern:false,eventPredictionCreated:false,fortunePredictionCreated:false,goodBadScoreCreated:false,customerInterpretationCreated:false,professionalJudgmentCreated:false,monthlyCreated:false,dailyCreated:false,hourlyCreated:false,customerCutoverAllowed:false}};
 const out=freeze({...base,daXianIntegrationDigest:sha256Stable(base)});
 if(stableStringify(chart)!==snapshots[0]||stableStringify(transformationMatrix)!==snapshots[1]||stableStringify(relationships)!==snapshots[2]||stableStringify(combinations)!==snapshots[3]||stableStringify(admittedPatterns)!==snapshots[4])fail('ZIWEI_FP_W9_SOURCE_MUTATION_FORBIDDEN');
 return out;
}
export default Object.freeze({buildZiweiDaXianIntegrationIR});
