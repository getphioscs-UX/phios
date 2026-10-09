// Explicit owner price/cost decision, 2026-10-09. MYR prices are minor units.
// Caps cover BOTH languages, defects/recovery and four report follow-ups.
export const COMMERCE_ECONOMICS_VERSION = 'PHIOS-COMMERCE-2026-10-09';
const rows = [
 ['COM-REPORT-BAZI-FULL',5900,4,false,'BZR'],
 ['COM-REPORT-ZIWEI-FULL',5900,3,false,'ZWR'],
 ['COM-REPORT-ASTROLOGY-FULL',5900,3,false,'AST'],
 ['COM-REPORT-PROFILE-FULL',12900,6,true,'PROFILE'],
 ['COM-REPORT-HD-FULL',12900,5,false,'HD'],
 ['COM-REPORT-ECR-FULL',12900,6,false,'ECR'],
 ['COM-REPORT-NUMEROLOGY-FULL',3900,2,false,'NUM'],
 ['COM-REPORT-CROSS-FULL',29900,10,false,'CROSS'],
 ['COM-READING-TAROT-FULL',1900,1,true,'TAROT'],
 ['COM-READING-ICHING-FULL',3900,2,true,'ICHING'],
 ['COM-REPORT-FINANCIAL-FULL',15900,7,true,'FINANCIAL'],
 ['COM-WILL-WRITING',2900,2,true,'WILL'],
 ['COM-REPORT-BUNDLE-2',9900,null,false,null],
 ['COM-REPORT-BUNDLE-3',14900,null,false,null]
];
export const COMMERCE_ECONOMICS = Object.freeze(Object.fromEntries(rows.map(([productId,amountMinor,providerCapUsd,bilingualOnly,methodId]) => [productId,Object.freeze({productId,amountMinor,currency:'MYR',providerCapUsd,bilingualOnly,methodId,bilingualSurchargeMinor:bilingualOnly?0:1000,includedFollowups:4,freeProviderCalls:0,costScope:'REPORT_REPAIR_BILINGUAL_AND_FOUR_FOLLOWUPS'})])));
export const STANDARD_BUNDLE_PRODUCTS = Object.freeze(['COM-REPORT-BAZI-FULL','COM-REPORT-ZIWEI-FULL','COM-REPORT-ASTROLOGY-FULL']);
export const RETIRED_COMMERCE_PRODUCTS = Object.freeze(['COM-REPORT-BUNDLE-5PLUS']);
export function reportEconomics(reference) {
 const aliases={BAZI:'BZR',ZIWEI:'ZWR',ASTROLOGY:'AST',NUMEROLOGY:'NUM',HUMAN_DESIGN:'HD'};
 const method=aliases[reference]||reference;
 const row=COMMERCE_ECONOMICS[reference]||Object.values(COMMERCE_ECONOMICS).find(p=>p.methodId===method);
 if(!row||row.providerCapUsd===null)throw Error('REPORT_ECONOMICS_PRODUCT_REQUIRED');
 return row;
}
export function reportFollowupReserve(reference){return Number((reportEconomics(reference).providerCapUsd*.1).toFixed(8));}
export function reportGenerationCeiling(reference){const p=reportEconomics(reference);return Number((p.providerCapUsd-reportFollowupReserve(reference)).toFixed(8));}
