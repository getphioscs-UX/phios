import {getZwrMpaProductionDecision} from '../method-production-activation/zwr-production-authority-runtime.js';
import {executeAndProjectZwrProductionWithSource} from '../method-client-delivery/zwr-canonical-projection-runtime.js';
import {buildZiWeiDynamicProjection} from '../zi-wei-dynamic/dynamic-runtime.js';
import {buildCanonicalZiweiChartIR} from './ziwei-chart-runtime.js';
import {calculateZiweiCompleteStarPlacement} from './ziwei-complete-star-placement-runtime.js';
import {resolveZiweiStarStates} from './ziwei-star-state-runtime.js';
import {buildZiweiFourTransformationMatrix} from './ziwei-four-transformation-matrix-runtime.js';
import {buildZiweiPalaceRelationshipEngine} from './ziwei-palace-relationship-engine.js';
import {buildZiweiStarCombinationRuntime} from './ziwei-star-combination-runtime.js';
import {evaluateAdmittedZiweiPatterns} from './ziwei-admitted-pattern-runtime.js';
import {buildZiweiDaXianIntegrationIR} from './ziwei-da-xian-integration-runtime.js';
import {buildZiweiLiuNianIntegrationIR} from './ziwei-liu-nian-integration-runtime.js';
import {buildZiweiMeaningContext} from './ziwei-meaning-registry-runtime.js';
import {buildZiweiStructuralFindingRegistry} from './ziwei-structural-finding-runtime.js';
import {buildZiweiInterpretationEvidenceGraph} from './ziwei-interpretation-evidence-graph-runtime.js';
import {buildZiweiCrossFindingComposition} from './ziwei-cross-finding-composition-runtime.js';
import {resolveZiweiContradictions} from './ziwei-contradiction-resolver-runtime.js';
import {buildZiweiSemanticDedupIR} from './ziwei-semantic-dedup-runtime.js';
import {buildZiweiReadingIR} from './ziwei-reading-ir-runtime.js';
import {composeZiweiCustomerReport} from './ziwei-customer-report-runtime.js';
import {buildZiweiInteractiveChartSurface} from './ziwei-interactive-chart-surface-runtime.js';
import {buildZiweiTopicReadings} from './ziwei-topic-reading-runtime.js';
import {resolveZiweiLiveTargetContext,projectZiweiTargetContextForDynamic} from './ziwei-live-target-context-runtime.js';
import {buildZiweiCurrentPublicationEnvelope} from './ziwei-current-publication-envelope-runtime.js';
import {stableStringify} from '../zi-wei-runtime/zwr-utils.js';

export const ZIWEI_CX_R1_FULL_PRODUCTION_CUSTOMER_RUNTIME_SCHEMA='PHI-OS-ZIWEI-CX-R1-FULL-PRODUCTION-CUSTOMER-RUNTIME-v1.0.0';
const freeze=v=>{if(v&&typeof v==='object'&&!Object.isFrozen(v)){Object.freeze(v);for(const x of Object.values(v))freeze(x)}return v};
function fail(code,status=422){const e=new Error(code);e.code=code;e.status=status;throw e;}

function assertExecutionRequest(request){
  if(request?.schemaVersion!=='PHI-OS-MCD-METHOD-EXECUTION-REQUEST-v1.0.0'||request?.methodCode!=='ZI_WEI_DOU_SHU'||request?.methodVersion!=='1.0.0')fail('ZIWEI_CX_R1_W1_ZWR_EXECUTION_REQUEST_REQUIRED',400);
  if(request?.canonicalInput?.consent?.granted!==true||!request?.consentRecordId||request.consentRecordId!==request.canonicalInput?.consent?.recordId)fail('ZIWEI_CX_R1_W1_CONSENT_REQUIRED',403);
}

export async function buildZiweiFullProductionCustomerRuntime({executionRequest,targetContext,locale}={}){
  assertExecutionRequest(executionRequest);
  const l=locale||executionRequest.canonicalInput?.locale;
  if(!['zh-Hans','en'].includes(l)||l!==executionRequest.canonicalInput?.locale)fail('ZIWEI_CX_R1_W1_LOCALE_MISMATCH',400);
  const normalizedTarget=resolveZiweiLiveTargetContext(targetContext);
  const requestSnap=stableStringify(executionRequest),targetSnap=stableStringify(normalizedTarget);
  const decision=getZwrMpaProductionDecision('ZI_WEI_DOU_SHU','1.0.0','CALCULATION');
  if(decision?.decision!=='ELIGIBLE'||decision?.dispatchAllowed!==true)fail('ZIWEI_CX_R1_W1_ZWR_PRODUCTION_NOT_ELIGIBLE',423);

  // W1 trusted execution: the natal source IR is built once and the canonical
  // projection is created from that same IR. Downstream full-production works
  // consume both without a second natal calculation.
  const execution=await executeAndProjectZwrProductionWithSource(executionRequest,decision);
  const canonicalProjection=execution.canonicalProjection;
  const sourceCalculationIR=execution.sourceCalculationIR;
  if(canonicalProjection.zwrLineage?.sourceCalculationDigest!==sourceCalculationIR.calculationDigest)fail('ZIWEI_CX_R1_W1_SOURCE_REUSE_MISMATCH',500);

  const dynamicProjection=await buildZiWeiDynamicProjection({
    requestId:`${executionRequest.requestId}-ZWD`,
    consentRecordId:executionRequest.consentRecordId,
    canonicalInput:executionRequest.canonicalInput,
    natalProjection:canonicalProjection,
    targetContext:projectZiweiTargetContextForDynamic(normalizedTarget),
    executionParameters:{traditionalCalculationSex:executionRequest.executionParameters?.traditionalCalculationSex}
  });
  const chart=await buildCanonicalZiweiChartIR({canonicalProjection,sourceCalculationIR,dynamicProjection});
  const placement=calculateZiweiCompleteStarPlacement({chart});
  const starStates=resolveZiweiStarStates({placement});
  const transformationMatrix=buildZiweiFourTransformationMatrix({chart});
  const relationships=buildZiweiPalaceRelationshipEngine({chart,placement,starStates,transformationMatrix});
  const combinations=buildZiweiStarCombinationRuntime({chart,placement,starStates,transformationMatrix,relationships});
  const admittedPatterns=evaluateAdmittedZiweiPatterns({combinations});
  const daXianIntegration=buildZiweiDaXianIntegrationIR({chart,transformationMatrix,relationships,combinations,admittedPatterns});
  const liuNianIntegration=buildZiweiLiuNianIntegrationIR({chart,transformationMatrix,relationships,combinations,admittedPatterns,daXianIntegration});
  const meaningContext=buildZiweiMeaningContext({chart,starStates,relationships,combinations,admittedPatterns,daXianIntegration,liuNianIntegration,locale:l});
  const structuralFindings=await buildZiweiStructuralFindingRegistry({chart,relationships,combinations,admittedPatterns,daXianIntegration,liuNianIntegration,meaningContext});
  const evidenceGraph=buildZiweiInterpretationEvidenceGraph({structuralFindings,meaningContext});
  const composition=await buildZiweiCrossFindingComposition({structuralFindings,evidenceGraph});
  const contradictionResolution=resolveZiweiContradictions({composition,structuralFindings,evidenceGraph});
  const dedup=buildZiweiSemanticDedupIR({composition,contradictionResolution});
  const readingIR=buildZiweiReadingIR({meaningContext,structuralFindings,evidenceGraph,composition,contradictionResolution,dedup,locale:l});
  const report=composeZiweiCustomerReport({readingIR,locale:l});
  const interactiveSurface=buildZiweiInteractiveChartSurface({customerReport:report,locale:l});
  const topics=buildZiweiTopicReadings({customerReport:report,interactiveSurface,locale:l});

  const sourceDigests=freeze({
    sourceCalculationDigest:sourceCalculationIR.calculationDigest,
    canonicalProjectionId:canonicalProjection.projectionId,
    dynamicProjectionId:dynamicProjection.projectionId,
    chartDigest:chart.chartDigest,
    readingDigest:readingIR.readingDigest,
    reportDigest:report.reportDigest,
    interactiveSurfaceDigest:interactiveSurface.surfaceDigest,
    topicReadingDigest:topics.topicReadingDigest
  });
  const publicationEnvelope=buildZiweiCurrentPublicationEnvelope({report,interactiveSurface,topics,targetContext:normalizedTarget,sourceDigests,locale:l});
  const base={
    schemaVersion:ZIWEI_CX_R1_FULL_PRODUCTION_CUSTOMER_RUNTIME_SCHEMA,
    work:'ZIWEI-CX-R1-W1-W4',
    state:'CUSTOMER_PUBLISHABLE',
    canonicalProjection,
    customerProduct:publicationEnvelope,
    executionReuse:freeze({
      sourceCalculationBuiltOnce:execution.reuse?.sourceCalculationBuiltOnce===true,
      canonicalProjectionConsumesSameSourceCalculationIR:execution.reuse?.canonicalProjectionConsumesSameSourceCalculationIR===true,
      secondNatalCalculationPerformed:false,
      sourceCalculationIrExposedToCustomer:false
    }),
    sourceDigests
  };
  if(stableStringify(executionRequest)!==requestSnap||stableStringify(normalizedTarget)!==targetSnap)fail('ZIWEI_CX_R1_W1_INPUT_MUTATION_FORBIDDEN',500);
  return freeze(base);
}

export default Object.freeze({buildZiweiFullProductionCustomerRuntime});
