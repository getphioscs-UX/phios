import profiles from '../../content/reports/method-publication-profiles-v1.json';
import {PAID_REPORT_METHODS} from './paid-report-method-registry.js';
import {reportEconomics} from '../pws/commercial/commerce-economics-policy.js';

// References to existing native owners, not a second report or product registry.
const nativeOwners=Object.freeze({
 AST:{calculation:'functions/single-method-reading/astrology-production-adapter.js',publication:'scripts/build-ast-vfr-r1r5.mjs',input:['ACCOUNT_OWNED_SUBJECT','EXPLICIT_CONSENT','VERIFIED_BIRTH_DATE_TIME_PLACE']},
 BZR:{calculation:'functions/report-delivery/bazi-customer-native-inputs.js',publication:'functions/personal-reading/deep-manuscript/bazi-deep-manuscript-publication.js',input:['ACCOUNT_OWNED_SUBJECT','EXPLICIT_CONSENT','VERIFIED_BIRTH_DATE_TIME_PLACE','SUPPORTED_CALENDAR_AND_SOLAR_TERMS']},
 ZWR:{calculation:'functions/personal-reading/narrative/ziwei-publication-adapter.js',publication:'functions/report-delivery/ziwei-vfr-profile-policy.js',input:['ACCOUNT_OWNED_SUBJECT','EXPLICIT_CONSENT','VERIFIED_BIRTH_DATE_TIME_PLACE','REQUIRED_CALCULATION_SEX']},
 NUM:{calculation:'functions/personal-reading/narrative/numerology-publication-adapter.js',publication:'functions/personal-reading/narrative/numerology-publication-system.js',input:['ACCOUNT_OWNED_SUBJECT','EXPLICIT_CONSENT','BIRTH_DATE','OPTIONAL_ORIGINAL_NAME_WITH_DECLARED_RULES']},
 HD:{calculation:'functions/external-profile/external-profile-confirmation.js',publication:'functions/external-profile/human-design-r3-professional-runtime.js',input:['ACCOUNT_OWNED_SUBJECT','AUTHORISED_EXTERNAL_CHART','USER_CONFIRMED_CHART','SOURCE_BINDING','ADVANCED_FIELDS_REQUIRE_ADMITTED_DATA']}
});
const lifecycle=['readiness','prepare','generate','validate','compile','render','release','reconcile','verifyDelivered'];
export function fiveMethodReportCapability(productId,env={},registry=PAID_REPORT_METHODS){
 let economics;try{economics=reportEconomics(productId);}catch{return null;}
 const methodId=economics.methodId,native=nativeOwners[methodId];
 if(!native||economics.productId!==productId)return null;
 const adapter=registry[methodId],profile=profiles.profiles.find(p=>p.methodId===methodId);
 const blockedReason=!adapter?'SHARED_ADAPTER_ABSENT':adapter.p8Admitted!==true?'METHOD_ADMISSION_CLOSED':lifecycle.some(k=>typeof adapter[k]!=='function')?'METHOD_LIFECYCLE_INCOMPLETE':env.PHIOS_SHARED_PAID_REPORT_ENABLED!=='true'?'SHARED_REPORT_SETUP_DISABLED':null;
 return {schemaVersion:'FIVE_METHOD_REPORT_CAPABILITY_V1',methodId,productId,
  publication:{version:profile?.version||null,profileVersion:profile?.profileVersion||null,status:profile?.status||'UNRESOLVED',unresolvedFieldCount:profile?.unresolvedFields?.length??null,owner:'content/reports/method-publication-profiles-v1.json'},
  nativeOwners:{calculation:native.calculation,publication:native.publication},eligibleInputRequirements:[...native.input],
  sharedAdapterPresent:!!adapter,admitted:adapter?.p8Admitted===true,setupAvailable:blockedReason===null,blockedReason,
  supportedPresentations:[...(adapter?.supportedPresentations||[])],
  checkoutDestination:blockedReason===null?'/account/?product='+encodeURIComponent(productId):null,accountDestination:'/account/',
  serverReadinessRequired:true,grantsEntitlement:false};
}
export function requireFiveMethodReportSetup(productId,env,registry=PAID_REPORT_METHODS){
 const capability=fiveMethodReportCapability(productId,env,registry);
 if(capability&&!capability.setupAvailable)throw Object.assign(Error(capability.blockedReason),{code:capability.blockedReason,status:409});
 return capability;
}
