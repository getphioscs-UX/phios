import fs from 'node:fs';
import {buildZiWeiCalculationIR} from '../../../functions/zi-wei-runtime/zi-wei-calculation-ir-runtime.js';
import {executeAndProjectZwrProduction} from '../../../functions/method-client-delivery/zwr-canonical-projection-runtime.js';
import {getZwrMpaProductionDecision} from '../../../functions/method-production-activation/zwr-production-authority-runtime.js';
import {buildZiWeiDynamicProjection} from '../../../functions/zi-wei-dynamic/dynamic-runtime.js';
import {buildCanonicalZiweiChartIR} from '../../../functions/zi-wei-full-production/ziwei-chart-runtime.js';
import {calculateZiweiCompleteStarPlacement} from '../../../functions/zi-wei-full-production/ziwei-complete-star-placement-runtime.js';
import {resolveZiweiStarStates} from '../../../functions/zi-wei-full-production/ziwei-star-state-runtime.js';
import {buildZiweiFourTransformationMatrix} from '../../../functions/zi-wei-full-production/ziwei-four-transformation-matrix-runtime.js';
import {buildZiweiPalaceRelationshipEngine} from '../../../functions/zi-wei-full-production/ziwei-palace-relationship-engine.js';
import {buildZiweiStarCombinationRuntime} from '../../../functions/zi-wei-full-production/ziwei-star-combination-runtime.js';
import {evaluateAdmittedZiweiPatterns} from '../../../functions/zi-wei-full-production/ziwei-admitted-pattern-runtime.js';
import {buildZiweiDaXianIntegrationIR} from '../../../functions/zi-wei-full-production/ziwei-da-xian-integration-runtime.js';
import {buildZiweiLiuNianIntegrationIR} from '../../../functions/zi-wei-full-production/ziwei-liu-nian-integration-runtime.js';
import {buildZiweiMeaningContext} from '../../../functions/zi-wei-full-production/ziwei-meaning-registry-runtime.js';
import {buildZiweiStructuralFindingRegistry} from '../../../functions/zi-wei-full-production/ziwei-structural-finding-runtime.js';
import {buildZiweiInterpretationEvidenceGraph} from '../../../functions/zi-wei-full-production/ziwei-interpretation-evidence-graph-runtime.js';
import {buildZiweiCrossFindingComposition} from '../../../functions/zi-wei-full-production/ziwei-cross-finding-composition-runtime.js';
import {resolveZiweiContradictions} from '../../../functions/zi-wei-full-production/ziwei-contradiction-resolver-runtime.js';
import {buildZiweiSemanticDedupIR} from '../../../functions/zi-wei-full-production/ziwei-semantic-dedup-runtime.js';
import {buildZiweiReadingIR} from '../../../functions/zi-wei-full-production/ziwei-reading-ir-runtime.js';
import {composeZiweiCustomerReport} from '../../../functions/zi-wei-full-production/ziwei-customer-report-runtime.js';
import {buildZiweiInteractiveChartSurface} from '../../../functions/zi-wei-full-production/ziwei-interactive-chart-surface-runtime.js';
import {buildZiweiTopicReadings} from '../../../functions/zi-wei-full-production/ziwei-topic-reading-runtime.js';

const j=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const base='content/professional/zi-wei-full-production';
const w56=()=>j(`${base}/fixtures/ziwei-fp-w5-w6-validation-fixture-v1.json`);

export function canonicalInputFromCase(ci,{consentId,locale='zh-Hans',birthPlace='Hong Kong',countryCode='HK'}={}){
  return {birthDate:ci.birthDate,birthTime:ci.birthTime,birthPlace:{displayName:birthPlace,countryCode,latitude:null,longitude:null},timezone:{iana:ci.timezone.iana,utcOffsetAtBirth:ci.timezone.utcOffsetAtBirth,source:'HUMAN_DECLARATION',confidence:'MEDIUM'},timeAccuracy:ci.timeAccuracy||'EXACT',locale,consent:{recordId:consentId,granted:true,purposeCode:'PERSONAL_RUNTIME_METHOD_PROJECTION',persistence:'NONE'},inputVersion:'MCD-3-CANONICAL-BIRTH-INPUT-v1.0.0'};
}

export async function buildZiweiFullCase({caseId,canonicalCase,locale='zh-Hans',traditionalCalculationSex='MALE',targetDate=null,targetTime=null,targetTimezone=null}={}){
  const id=caseId||'ZIWEI-FP-CASE';
  const policy=j('content/professional/core-method-runtime/zi-wei-calculation-policy-v1.json');
  const fixture=w56();
  const consentId=`CONSENT-${id}`;const requestId=`REQ-${id}`;
  const canonicalInput=canonicalInputFromCase(canonicalCase,{consentId,locale});
  const sourceIR=buildZiWeiCalculationIR({birthDate:canonicalInput.birthDate,birthTime:canonicalInput.birthTime,timeAccuracy:canonicalInput.timeAccuracy,timezone:canonicalInput.timezone},{policy,executionMode:'INTERNAL_VALIDATION'});
  const decision=getZwrMpaProductionDecision('ZI_WEI_DOU_SHU','1.0.0','CALCULATION');
  if(decision.decision!=='ELIGIBLE')throw new Error(`ZIWEI_FP_TEST_SUPPORT_MPA_NOT_ELIGIBLE:${decision.decision}`);
  const req={schemaVersion:'PHI-OS-MCD-METHOD-EXECUTION-REQUEST-v1.0.0',methodCode:'ZI_WEI_DOU_SHU',methodVersion:'1.0.0',capability:'CALCULATION',purposeCode:'PERSONAL_RUNTIME_METHOD_PROJECTION',canonicalInput,executionParameters:{},consentRecordId:consentId,requestId};
  const projection=await executeAndProjectZwrProduction(req,decision);
  const dyn=await buildZiWeiDynamicProjection({requestId:`${requestId}-DYN`,consentRecordId:consentId,canonicalInput,natalProjection:projection,targetContext:{targetDate:targetDate||fixture.dynamicInput.targetDate,targetTime:targetTime||fixture.dynamicInput.targetTime,targetTimezone:targetTimezone||fixture.dynamicInput.targetTimezone},executionParameters:{traditionalCalculationSex}});
  const upstream=[sourceIR,projection,dyn],upstreamSnapshots=upstream.map(x=>JSON.stringify(x));
  const chart=await buildCanonicalZiweiChartIR({canonicalProjection:projection,sourceCalculationIR:sourceIR,dynamicProjection:dyn});
  const placement=calculateZiweiCompleteStarPlacement({chart});
  const states=resolveZiweiStarStates({placement});
  const matrix=buildZiweiFourTransformationMatrix({chart});
  const relationships=buildZiweiPalaceRelationshipEngine({chart,placement,starStates:states,transformationMatrix:matrix});
  const combinations=buildZiweiStarCombinationRuntime({chart,placement,starStates:states,transformationMatrix:matrix,relationships});
  const patterns=evaluateAdmittedZiweiPatterns({combinations});
  const da=buildZiweiDaXianIntegrationIR({chart,transformationMatrix:matrix,relationships,combinations,admittedPatterns:patterns});
  const ln=buildZiweiLiuNianIntegrationIR({chart,transformationMatrix:matrix,relationships,combinations,admittedPatterns:patterns,daXianIntegration:da});
  const meanings=buildZiweiMeaningContext({chart,starStates:states,relationships,combinations,admittedPatterns:patterns,daXianIntegration:da,liuNianIntegration:ln,locale});
  const findings=await buildZiweiStructuralFindingRegistry({chart,relationships,combinations,admittedPatterns:patterns,daXianIntegration:da,liuNianIntegration:ln,meaningContext:meanings});
  const graph=buildZiweiInterpretationEvidenceGraph({structuralFindings:findings,meaningContext:meanings});
  const composition=await buildZiweiCrossFindingComposition({structuralFindings:findings,evidenceGraph:graph});
  const resolution=resolveZiweiContradictions({composition,structuralFindings:findings,evidenceGraph:graph});
  const dedup=buildZiweiSemanticDedupIR({composition,contradictionResolution:resolution});
  const reading=buildZiweiReadingIR({meaningContext:meanings,structuralFindings:findings,evidenceGraph:graph,composition,contradictionResolution:resolution,dedup,locale});
  const report=composeZiweiCustomerReport({readingIR:reading,locale});
  const surface=buildZiweiInteractiveChartSurface({customerReport:report,locale});
  const topics=buildZiweiTopicReadings({customerReport:report,interactiveSurface:surface,locale});
  for(let i=0;i<upstream.length;i++)if(JSON.stringify(upstream[i])!==upstreamSnapshots[i])throw new Error('ZIWEI_FP_TEST_SUPPORT_UPSTREAM_MUTATED');
  return {canonicalInput,sourceIR,projection,dyn,chart,placement,states,matrix,relationships,combinations,patterns,da,ln,meanings,findings,graph,composition,resolution,dedup,reading,report,surface,topics};
}

export function defaultFixtureCase(){return w56().canonicalInput;}
