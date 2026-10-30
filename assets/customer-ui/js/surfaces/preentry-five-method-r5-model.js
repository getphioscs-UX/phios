import{ASK_CAPABILITIES}from'../../../js/ask-entry-capabilities.js';
export const PREENTRY_METHODS=Object.freeze([
 {slug:'astrology',code:'AST',en:'Astrology',zh:'占星'},
 {slug:'bazi',code:'BZR',en:'BaZi',zh:'八字'},
 {slug:'ziwei',code:'ZWR',en:'Zi Wei Dou Shu',zh:'紫微斗数'},
 {slug:'numerology',code:'NUM',en:'Numerology',zh:'数字学'},
 {slug:'human-design',code:'HD',en:'Human Design',zh:'人类图'}
]);
export function preentryStartRoute(slug,locale='en'){
 const m=PREENTRY_METHODS.find(x=>x.slug===slug);if(!m)throw Error('PREENTRY_METHOD_NOT_ALLOWED');
 const q=new URLSearchParams({locale:locale==='zh-Hans'?'zh-Hans':'en'});
 if(m.code==='HD')q.set('externalProfile','human-design');else{const value=ASK_CAPABILITIES.methods.find(x=>x.methodId===m.code)?.formValue;if(!value)throw Error('EXISTING_METHOD_ENTRY_UNAVAILABLE');q.set('method',value);}
 return'/perspectives/personal/?'+q+'#personal-input';
}
export function preentryFullOffer(products,code){
 // A catalog projection is an offer, never proof of customer entitlement.
 const matches=(products||[]).filter(p=>p.paidReportSetup?.methodCode===code);
 if(matches.length!==1)return{state:'NO_ADMITTED_METHOD_OFFER',product:null};
 const product=matches[0];return{state:product.paidReportSetup.admitted===true?'SERVER_SETUP_REQUIRED':'METHOD_ADMISSION_CLOSED',product};
}
