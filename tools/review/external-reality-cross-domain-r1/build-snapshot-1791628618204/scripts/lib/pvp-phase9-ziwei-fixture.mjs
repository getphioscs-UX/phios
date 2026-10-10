import fs from 'node:fs';
import {buildZiweiFullProductionCustomerRuntime} from '../../functions/zi-wei-full-production/ziwei-full-production-customer-runtime.js';
import {adaptZiweiPersonalRealityProduct} from '../../functions/personal-reality-product/adapters/ziwei-production-adapter.js';
import {buildZiweiW12W13RenderPlan} from '../../assets/customer-ui/js/specialists/ziwei/ziwei-specialist-workspace.js';

const CASE_PATH='content/professional/zi-wei-professional-reading-r2/review/ziwei-pro-r2-w16-human-review-cases-v1.json';
export const PVP_PHASE9_TARGET_CONTEXT=Object.freeze({targetDate:'2026-09-10',targetTime:'12:00',targetTimezone:{iana:'Asia/Kuala_Lumpur',utcOffsetAtTarget:'+08:00'},source:'EXPLICIT_REQUEST'});
export function loadPhase9ZiweiCases(){return JSON.parse(fs.readFileSync(CASE_PATH,'utf8')).cases;}
export function phase9ExecutionRequest(c){
 const input=c.input||c; const id=c.caseId||'CASE'; const consentRecordId=`CONSENT-PVP-P9-${id}`;
 const canonicalInput={birthDate:input.birthDate,birthTime:input.birthTime,birthPlace:{displayName:'Hong Kong',countryCode:'HK',latitude:22.3193,longitude:114.1694},timezone:{iana:'Asia/Hong_Kong',utcOffsetAtBirth:'+08:00',source:'GOVERNED_RESOLUTION',confidence:'HIGH'},timeAccuracy:'EXACT',locale:input.locale,consent:{recordId:consentRecordId,granted:true,purposeCode:'PERSONAL_RUNTIME_METHOD_PROJECTION',persistence:'NONE'},inputVersion:'MCD-3-CANONICAL-BIRTH-INPUT-v1.0.0'};
 return {schemaVersion:'PHI-OS-MCD-METHOD-EXECUTION-REQUEST-v1.0.0',methodCode:'ZI_WEI_DOU_SHU',methodVersion:'1.0.0',capability:'CALCULATION',purposeCode:'PERSONAL_RUNTIME_METHOD_PROJECTION',canonicalInput,executionParameters:{traditionalCalculationSex:input.traditionalCalculationSex},consentRecordId,requestId:`REQ-PVP-P9-${id}`};
}
export async function buildPhase9ZiweiCase(c){
 const locale=c.input?.locale||c.locale||'zh-Hans';
 const full=await buildZiweiFullProductionCustomerRuntime({executionRequest:phase9ExecutionRequest(c),targetContext:PVP_PHASE9_TARGET_CONTEXT,locale});
 const product=adaptZiweiPersonalRealityProduct({publicationEnvelope:full.customerProduct,locale});
 const projection=product.visuals.find(v=>v.type==='ZIWEI_PVP_PHASE9_VISUAL_SET')?.payload||null;
 const pro=product.visuals.find(v=>v.type==='ZIWEI_PRO_R2_PROFESSIONAL_PRESENTATION')?.payload||null;
 const specialist=product.visuals.find(v=>v.type==='ZIWEI_SPECIALIST_PRESENTATION')?.payload||null;
 const plan=buildZiweiW12W13RenderPlan(product);
 return {caseRecord:c,full,product,projection,pro,specialist,plan};
}
export default Object.freeze({loadPhase9ZiweiCases,phase9ExecutionRequest,buildPhase9ZiweiCase,PVP_PHASE9_TARGET_CONTEXT});
