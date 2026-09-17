import {buildEcrCanonicalProjectionFromAnchor} from '../../functions/embodied-configuration/ecr-canonical-projection-runtime.js';
import {buildMethodMeaningPayloadV2,buildAcceptedMethodCustomerResult} from '../../functions/customer-projection/method-customer-reading-v2.js';
import {buildEcrCustomerMandalaProjection} from '../../functions/embodied-configuration/ecr-customer-mandala-projection.js';
import {composeEcrPhiCardSpread} from '../../functions/ecr-phi-card/ecr-card-reading.js';
import {ECR_PHI_CARD_MAPPING,ECR_PHI_CARD_DECK,ECR_PHI_CARD_ASSETS,ECR_PHI_CARD_ADMISSION} from '../../functions/ecr-phi-card/ecr-card-runtime-authority.js';
import {buildEcrCustomerFullReport} from '../../functions/ecr-full-report/ecr-customer-full-report.js';
import {adaptEcrPersonalRealityProduct} from '../../functions/personal-reality-product/adapters/ecr-production-adapter.js';
import {evaluateMethodJourneyEntitlement} from '../../functions/_lib/knowledge-answer-governance.js';
export function fixtureInput(locale){return {birthDate:'2000-01-01',birthTime:'12:00:00',birthPlace:{displayName:'Synthetic review fixture',countryCode:'MY',latitude:3.139,longitude:101.6869},timezone:{iana:'Asia/Kuala_Lumpur',utcOffsetAtBirth:'+08:00',source:'HUMAN_DECLARATION',confidence:'HIGH'},timeAccuracy:'EXACT',locale,consent:{recordId:'ECR-FULL-REVIEW',granted:true,purposeCode:'ECR_MACHINE_VALIDATION',persistence:'NONE'},inputVersion:'MCD-3-CANONICAL-BIRTH-INPUT-v1.0.0'}};
export const reviewEntitlement=paid=>evaluateMethodJourneyEntitlement({methodCode:'ECR',paidAccess:paid,mpaDispatchAllowed:true,mcdProductionAvailable:true,readingDepthAllowed:true});
export async function fullReportFixture(index=0,locale='en'){
 const longitude=index*(360/64)+((index%8)+.5)*(360/512);
 const projection=await buildEcrCanonicalProjectionFromAnchor({canonicalInput:fixtureInput(locale),anchor:{longitude,utcIso:'2000-01-01T04:00:00.000Z',engineCode:'ECR_TEST_ANCHOR',referenceFrame:'TEST_DETERMINISTIC_SOLAR_ANCHOR'},requestId:`ECR-FULL-REVIEW-${index}`});
 const {reading:readingIR}=await buildMethodMeaningPayloadV2({canonicalProjection:projection,locale});
 const acceptedReading=await buildAcceptedMethodCustomerResult({canonicalProjection:projection,locale});
 const technical=new Map(acceptedReading.technical.interpretationUnits.map(x=>[x.unitId,x]));
 const units=acceptedReading.insights.map(x=>({interpretationUnitId:x.insightId,observableSignals:x.observableSignals,realityComparisonQuestions:x.openQuestions,projectionRefs:technical.get(x.insightId).projectionRefs,meaningRefs:technical.get(x.insightId).meaningRefs,ruleRefs:technical.get(x.insightId).derivationRefs}));
 const coordinate=Object.fromEntries(projection.calculation.structures.map(x=>[x.code,x.items]));
 const phiCardSpread=composeEcrPhiCardSpread({coordinate,interpretationUnits:units,customerPublishable:true,locale},ECR_PHI_CARD_MAPPING,ECR_PHI_CARD_DECK,ECR_PHI_CARD_ASSETS);
 const mandalaProjection=buildEcrCustomerMandalaProjection(readingIR);
 const args={readingIR,acceptedReading,phiCardSpread,customerAdmission:ECR_PHI_CARD_ADMISSION,locale,edition:'ECR_FULL_R1',reviewMode:true};
 const report=(paid,contextProjection=null)=>buildEcrCustomerFullReport({...args,sharedEntitlement:reviewEntitlement(paid),contextProjection});
 const product=fullReport=>adaptEcrPersonalRealityProduct({readingIR,mandalaProjection,phiCardSpread,fullReport,customerAdmission:ECR_PHI_CARD_ADMISSION,locale});
 return {projection,readingIR,acceptedReading,phiCardSpread,mandalaProjection,args,report,product,longitude};
}
