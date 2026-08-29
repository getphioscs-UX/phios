import {buildAstCustomerWorkspaceCandidate} from '../ast-full-production/ast-customer-reading-production.js';
import {buildMethodMeaningPayloadV2} from '../customer-projection/method-customer-reading-v2.js';
import {getPersonalRealityProductionAdapter} from './adapter-registry.js';
import {routePersonalRealityProducts} from './product-router.js';
import {composeEcrPhiCardSpread} from '../ecr-phi-card/ecr-card-reading.js';
import {ECR_PHI_CARD_MAPPING,ECR_PHI_CARD_DECK,ECR_PHI_CARD_ASSETS,ECR_PHI_CARD_ADMISSION} from '../ecr-phi-card/ecr-card-runtime-authority.js';
const METHOD_ID_BY_CODE=Object.freeze({ASTROLOGY:'AST',BAZI:'BZR',NUMEROLOGY:'NUM',ZI_WEI_DOU_SHU:'ZWR',EMBODIED_CONFIGURATION:'ECR'});
function ecrCoordinate(readingIR){return {ECR_CONTEXT:readingIR?.sections?.coordinate?.context||[],ECR_GRAMMAR:readingIR?.sections?.coordinate?.grammar||[],ECR_QUESTION:readingIR?.sections?.coordinate?.question||[],ECR_CAPABILITIES:readingIR?.sections?.response?.capabilities||[],ECR_DRIVER_PRIORITY:readingIR?.sections?.response?.driverPriority||[],ECR_MOTION:readingIR?.sections?.change?.motion||[],ECR_CONFIGURATION:readingIR?.sections?.change?.configuration||[],ECR_ACTIVATION:readingIR?.sections?.change?.activation||[]};}
export async function buildPersonalRealityProductRoute({selectedKeys=[],results=[],methodNativeReading={},locale='en',intent=''}={}){
 const productsByMethod={};const adapt=(id,args)=>{const fn=getPersonalRealityProductionAdapter(id);if(!fn)return null;try{return fn(args)}catch{return null}};
 const bazi=methodNativeReading?.BZR;if(bazi)productsByMethod.BZR=adapt('BZR',{report:bazi,locale});
 const num=results.find(x=>x.ok&&x.spec?.methodCode==='NUMEROLOGY')?.numerologyIntegratedReading;if(num)productsByMethod.NUM=adapt('NUM',{reading:num,locale});
 const zwr=results.find(x=>x.ok&&x.ziweiFullProduction)?.ziweiFullProduction;if(zwr)productsByMethod.ZWR=adapt('ZWR',{publicationEnvelope:zwr,locale});
 const ast=results.find(x=>x.ok&&x.spec?.methodCode==='ASTROLOGY');if(ast?.canonicalProjection){try{const bundle=await buildAstCustomerWorkspaceCandidate({canonicalProjection:ast.canonicalProjection,rawIntent:intent||'',locale,sourceMainCommit:'1a702272ecf00cdc074dfe16594d4420983c1691'});productsByMethod.AST=adapt('AST',{workspace:bundle.workspace,locale});}catch{}}
 const ecr=results.find(x=>x.ok&&x.spec?.methodCode==='EMBODIED_CONFIGURATION');if(ecr?.canonicalProjection){try{const meaning=await buildMethodMeaningPayloadV2({canonicalProjection:ecr.canonicalProjection,locale}),readingIR=meaning.reading,technicalUnits=new Map((ecr.readingMethod?.technical?.interpretationUnits||[]).map(x=>[x.unitId,x])),interpretationUnits=(ecr.readingMethod?.insights||[]).map(x=>{const t=technicalUnits.get(x.insightId)||{};return {interpretationUnitId:x.insightId,observableSignals:x.observableSignals||[],realityComparisonQuestions:x.openQuestions||[],projectionRefs:t.projectionRefs||[],meaningRefs:t.meaningRefs||[],ruleRefs:t.derivationRefs||[]};});let phiCardSpread=null;if(ECR_PHI_CARD_ADMISSION.customerAdmission===true&&interpretationUnits.length)phiCardSpread=composeEcrPhiCardSpread({coordinate:ecrCoordinate(readingIR),interpretationUnits,customerPublishable:true,locale},ECR_PHI_CARD_MAPPING,ECR_PHI_CARD_DECK,ECR_PHI_CARD_ASSETS);productsByMethod.ECR=adapt('ECR',{readingIR,phiCardSpread,fullReport:null,customerAdmission:ECR_PHI_CARD_ADMISSION,locale});}catch{}}
 const selectedMethodIds=selectedKeys.map(key=>{const result=results.find(x=>x.key===key);return METHOD_ID_BY_CODE[result?.spec?.methodCode]||({astrology:'AST',bazi:'BZR',numeric:'NUM',ziwei:'ZWR',ecr:'ECR'}[key]);}).filter(Boolean);
 return routePersonalRealityProducts({selectedMethodIds,productsByMethod});
}
export default Object.freeze({buildPersonalRealityProductRoute});
