import{ASK_CAPABILITIES}from'../../../js/ask-entry-capabilities.js';
export const PREENTRY_METHODS=Object.freeze([
 {slug:'astrology',code:'AST',productId:'COM-REPORT-ASTROLOGY-FULL',en:'Astrology',zh:'占星'},
 {slug:'bazi',code:'BZR',productId:'COM-REPORT-BAZI-FULL',en:'BaZi',zh:'八字'},
 {slug:'ziwei',code:'ZWR',productId:'COM-REPORT-ZIWEI-FULL',en:'Zi Wei Dou Shu',zh:'紫微斗数'},
 {slug:'numerology',code:'NUM',productId:'COM-REPORT-NUMEROLOGY-FULL',en:'Numerology',zh:'数字学'},
 {slug:'human-design',code:'HD',productId:'COM-REPORT-HD-FULL',en:'Human Design',zh:'人类图'}
]);
export function preentryStartRoute(slug,locale='en'){
 const m=PREENTRY_METHODS.find(x=>x.slug===slug);if(!m)throw Error('PREENTRY_METHOD_NOT_ALLOWED');
 const q=new URLSearchParams({locale:locale==='zh-Hans'?'zh-Hans':'en'});
 return '/perspectives/personal/'+m.slug+'/?'+q+'#method-input';
}
export function preentryFullOffer(products,code){
 // A catalog projection is an offer, never proof of customer entitlement.
 const method=PREENTRY_METHODS.find(m=>m.code===code);
 const matches=method?(products||[]).filter(p=>p.productId===method.productId):[];
 if(matches.length!==1)return{state:'NO_ADMITTED_METHOD_OFFER',product:null};
 const product=matches[0];return{state:product.paidReportSetup?.methodCode===code&&product.paidReportSetup?.admitted===true?'SERVER_SETUP_REQUIRED':'METHOD_ADMISSION_CLOSED',product};
}
