import {baziFreeChartCapability,baziFreeChartRequest} from '../_lib/bazi-free-chart-contract.js';
import {validateCanonicalBirthInput} from '../method-client-delivery/canonical-birth-input-runtime.js';
import {consumeConfirmedBirthLocationSnapshot} from '../location/confirmed-birth-location-snapshot.js';
import {executeAndProjectMcd5CurrentRequest} from '../method-client-delivery/canonical-projection-runtime-current.js';
import {buildCanonicalBaziChartIR} from '../bzr-full-production/bazi-chart-runtime.js';
import {analyzeBaziTenGods} from '../bzr-full-production/bazi-ten-god-runtime.js';
import {BAZI_FULL_PRODUCTION_GATE as sourceGate} from '../bzr-full-production/bazi-production-gate-runtime.js';
import {buildMethodNativeCustomerReading} from './method-native-reading-product.js';
import {buildMethodProductEnvelope,PPR_R3_SPECIALIST_RENDERER_REFERENCE_CONTRACT} from '../personal-reality-product/product-envelope-core.js';
import {routePersonalRealityProducts} from '../personal-reality-product/product-router.js';
import {projectMethodsForCustomer} from '../customer-projection/method-customer-projection.js';
const json=(payload,status=200)=>Response.json(payload,{status,headers:{'cache-control':'no-store','x-content-type-options':'nosniff','referrer-policy':'no-referrer'}});
// Pure native calculation entry. No account, entitlement, context, manuscript,
// publication formatter, PDF or Provider function is imported or invoked here.
export async function onRequestPost(context){
 if(!baziFreeChartCapability(context.env))return json({ok:false,error:'READING_SERVICE_UNAVAILABLE'},503);
 let body;try{body=await context.request.json();}catch{return json({ok:false,error:'INVALID_JSON'},400);}
 if(!baziFreeChartRequest(body))return json({ok:false,error:'BAZI_FREE_CHART_INPUT_SCOPE_REQUIRED'},403);
 try{
  const time=body.birthTimeUnknown===true||!body.birthTime?null:body.birthTime;
  const location=consumeConfirmedBirthLocationSnapshot(body.birthLocationSnapshot,{providerRef:body.placeRef,birthDate:body.birthDate,birthTime:time});
  const id='CX-CONSENT-'+crypto.randomUUID();
  const input={birthDate:body.birthDate,birthTime:time?(time.length===5?time+':00':time):null,birthPlace:{displayName:location.displayName,countryCode:location.countryCode,latitude:location.latitude,longitude:location.longitude},timezone:{iana:location.timezone.iana,utcOffsetAtBirth:location.timezone.utcOffsetAtBirth,source:location.timezone.source,confidence:location.timezone.confidence},timeAccuracy:time?'EXACT':'UNKNOWN',locale:body.locale,consent:{recordId:id,granted:true,purposeCode:'PERSONAL_RUNTIME_METHOD_PROJECTION',persistence:'NONE'},inputVersion:'MCD-3-CANONICAL-BIRTH-INPUT-v1.0.0'};
  const shape=validateCanonicalBirthInput(input);if(!shape.valid)return json({ok:false,error:'PERSONAL_REALITY_INPUT_INVALID',reasonCodes:shape.reasonCodes},422);
  const request={schemaVersion:'PHI-OS-MCD-METHOD-EXECUTION-REQUEST-v1.0.0',methodCode:'BAZI',methodVersion:'0.1.0',capability:'CALCULATION',purposeCode:input.consent.purposeCode,canonicalInput:input,executionParameters:body.traditionalCalculationSex?{traditionalCalculationSex:body.traditionalCalculationSex}:{},consentRecordId:id,requestId:'BZR-FREE-'+crypto.randomUUID()};
  const {execution,canonicalProjection:p}=await executeAndProjectMcd5CurrentRequest(request);
  const admitted=['EXECUTED_BOUND_SCOPE','PARTIAL_EXECUTION'].includes(execution?.executionStatus)&&p?.method?.publicMethodCode==='BAZI_PROJECTION'&&p.projection?.clientRenderable===true&&p.projection?.productionResult===true&&sourceGate.customerPublishable===true&&sourceGate.productionAllowed===true;
  if(!admitted)return json({ok:false,error:'METHOD_FREE_READING_UNAVAILABLE',reasonCodes:execution?.reasonCodes||[]},422);
  const chart=await buildCanonicalBaziChartIR({canonicalProjection:p}),roles=await analyzeBaziTenGods({chart});
  if(![3,4].includes(chart.pillars.length)||!['YEAR','MONTH','DAY'].every(x=>chart.pillars.some(p=>p.position===x)))return json({ok:false,error:'METHOD_FREE_READING_UNAVAILABLE'},422);
  const pillars=chart.pillars.map(p=>({position:p.position,stem:p.stem,branch:p.branch,stemRole:roles.visibleStems.find(r=>r.pillar===p.position)||null,hiddenStems:p.hiddenStems.map(h=>{
   const role=roles.hiddenStems.find(r=>r.pillar===p.position&&r.order===h.order);
   if(!h.zh||h.zh==='—'||!role||role.hiddenStemCode!==h.code||role.hiddenStemZh!==h.zh||!p.branch.sourceRef||!chart.lineage.structuralRegistryVersion)throw Object.assign(new Error('BAZI_FREE_HIDDEN_STEM_UNAVAILABLE'),{code:'BAZI_FREE_HIDDEN_STEM_UNAVAILABLE'});
   // Existing renderer consumes stemZh. Retain the original IR and role fields;
   // identify the branch fact and registry derivation rather than inventing a value.
   return {...h,...role,stemCode:h.code,stemZh:h.zh,sourceRef:p.branch.sourceRef,sourceEvidence:{branchCode:p.branch.code,stemCode:h.code,order:h.order,registryVersion:chart.lineage.structuralRegistryVersion,derivationClass:h.sourceClass}};
  })}));
  const decision={customerPublishable:admitted,defaultCustomerSurfaceAllowed:admitted,scope:'FREE_CHART_ONLY',fullReportPublication:false,humanAdmissionRef:sourceGate.humanAdmissionRef,machineAdmissionRef:sourceGate.machineAdmissionRef};
  const title=body.locale==='en'?'Your Four Pillars':'你的四柱';
  const native=buildMethodNativeCustomerReading({methodId:'BZR',summary:{title,keyPoints:[]},structuralModel:{pillars},publicationDecision:decision,evidence:{sourceProjectionId:p.projectionId,methodVersion:p.method.version,calculationStatus:p.calculation.status,unknown:p.unknown||[]},governance:{freeChartOnly:true,fullReportCreated:false,contextUsed:false}});
  const base=buildMethodProductEnvelope({methodId:'BZR',productType:'BAZI_PROFESSIONAL_READING',locale:body.locale,state:'CUSTOMER_PUBLISHABLE',publication:decision,hero:{title},navigation:['FREE_CHART'],sections:[{sectionId:'FREE_CHART',title,kind:'STRUCTURE'}],specialistRenderer:{rendererId:'PPR_R3_BAZI_PRODUCT_V1',surfaceContract:PPR_R3_SPECIALIST_RENDERER_REFERENCE_CONTRACT,capabilities:['FOUR_PILLAR_VISUAL']},boundaries:{fullReportCreated:false,currentRealityKnown:false}});
  const product={...base,navigation:[],sections:[],freeChartSource:native,reportAccess:{state:'FREE_REPORT_PREVIEW',fullState:'PAID_LOCKED',verifiedPurchase:false,reason:'FREE_CHART_ONLY'}};
  const source=projectMethodsForCustomer({projections:[p],blocked:[],intent:null,locale:body.locale,includeLegacyInterpretation:false});
  return json({ok:true,view:{surface:source.surface,locale:body.locale,intent:null,structure:source.structure,reading:{methods:[],stages:[]},methodNativeReading:{},singleMethodReading:null,productRoute:routePersonalRealityProducts({selectedMethodIds:['BZR'],productsByMethod:{BZR:product}})},privacy:{saved:false}});
 }catch(error){return json({ok:false,error:error.code||'METHOD_FREE_READING_UNAVAILABLE'},422);}
}
