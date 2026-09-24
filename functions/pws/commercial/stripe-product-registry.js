// Additive COM-STRIPE-R1 registry under the existing PWS commercial authority.
import { resolveReportProduct, eligibleReportIds } from './report-successor-contract.js';
export const STRIPE_QA_ACCOUNT = 'acct_1UFr0TBEKXJyHMkK';
export const COMMERCE_STRIPE_VERSION = 'COM-STRIPE-R1';
const rows = [
  {
    "productId": "COM-SERVICE-NATURAL-HEALER",
    "category": "HUMAN_SERVICE",
    "billingType": "ONE_TIME",
    "currency": "MYR",
    "amountMinor": 10000,
    "qaProductId": "prod_VHPtICmRyTxUTJ",
    "qaPriceId": "price_1UGr3rBEKXJyHMkKycFy3VrE",
    "liveProductId": null,
    "livePriceId": null,
    "active": true,
    "title": "SERVICE NATURAL HEALER",
    "entitlementPolicy": "PURCHASED_INTAKE_REQUIRED",
    "fulfillmentType": "HUMAN_SERVICE",
    "durationMinutes": 60,
    "initialModality": "UNDECIDED"
  },
  {
    "productId": "COM-SERVICE-CASH-FLOW-GAME",
    "category": "HUMAN_SERVICE",
    "billingType": "ONE_TIME",
    "currency": "MYR",
    "amountMinor": 10000,
    "qaProductId": "prod_VHPtAg35IB3oWs",
    "qaPriceId": "price_1UGr3pBEKXJyHMkKgcRniO8X",
    "liveProductId": null,
    "livePriceId": null,
    "active": true,
    "title": "SERVICE CASH FLOW GAME",
    "entitlementPolicy": "PURCHASED_INTAKE_REQUIRED",
    "fulfillmentType": "HUMAN_SERVICE",
    "durationMinutes": 120
  },
  {
    "productId": "COM-SERVICE-FINANCIAL-CONSULTATION",
    "category": "HUMAN_SERVICE",
    "billingType": "ONE_TIME",
    "currency": "MYR",
    "amountMinor": 10000,
    "qaProductId": "prod_VHPtGMdqOKxW8w",
    "qaPriceId": "price_1UGr3nBEKXJyHMkK8TlT1TOe",
    "liveProductId": null,
    "livePriceId": null,
    "active": true,
    "title": "SERVICE FINANCIAL CONSULTATION",
    "entitlementPolicy": "PURCHASED_INTAKE_REQUIRED",
    "fulfillmentType": "HUMAN_SERVICE",
    "durationMinutes": 60
  },
  {
    "productId": "COM-SUBSCRIPTION-MONTHLY",
    "category": "MEMBERSHIP",
    "billingType": "RECURRING",
    "currency": "MYR",
    "amountMinor": 1900,
    "qaProductId": "prod_VHPt9J27xVQl7q",
    "qaPriceId": "price_1UGr3lBEKXJyHMkKOuDD7NVR",
    "liveProductId": null,
    "livePriceId": null,
    "active": true,
    "title": "SUBSCRIPTION MONTHLY",
    "entitlementPolicy": "PHIOS_MEMBERSHIP",
    "fulfillmentType": "SUBSCRIPTION_ACCESS"
  },
  {
    "productId": "COM-WILL-WRITING",
    "category": "HUMAN_SERVICE",
    "billingType": "ONE_TIME",
    "currency": "MYR",
    "amountMinor": 2900,
    "qaProductId": "prod_VHPt6JmDxsSc70",
    "qaPriceId": "price_1UGr3jBEKXJyHMkKCulLqIpr",
    "liveProductId": null,
    "livePriceId": null,
    "active": true,
    "title": "WILL WRITING",
    "entitlementPolicy": "PURCHASED_INTAKE_REQUIRED",
    "fulfillmentType": "HUMAN_SERVICE"
  },
  {
    "productId": "COM-REPORT-FINANCIAL-FULL",
    "category": "REPORT",
    "billingType": "ONE_TIME",
    "currency": "MYR",
    "amountMinor": 15900,
    "qaProductId": "prod_VHPtDLeg1UajcN",
    "qaPriceId": "price_1UGr3gBEKXJyHMkKAmHkIrmz",
    "liveProductId": null,
    "livePriceId": null,
    "active": true,
    "title": "REPORT FINANCIAL FULL",
    "entitlementPolicy": "REPORT_FINANCIAL_FULL",
    "fulfillmentType": "REPORT_ACCESS",
    "professionalReviewRequired": true
  },
  {
    "productId": "COM-REPORT-BUNDLE-5PLUS",
    "category": "REPORT",
    "billingType": "ONE_TIME",
    "currency": "MYR",
    "amountMinor": 15900,
    "qaProductId": "prod_VHPtWWpUFzts4C",
    "qaPriceId": "price_1UGr3eBEKXJyHMkKRDancawo",
    "liveProductId": null,
    "livePriceId": null,
    "active": true,
    "title": "REPORT BUNDLE 5PLUS",
    "entitlementPolicy": "SELECTED_STANDARD_REPORTS",
    "fulfillmentType": "REPORT_ACCESS"
  },
  {
    "productId": "COM-REPORT-BUNDLE-3",
    "category": "REPORT",
    "billingType": "ONE_TIME",
    "currency": "MYR",
    "amountMinor": 9900,
    "qaProductId": "prod_VHPtwqHj0F4P7C",
    "qaPriceId": "price_1UGr3cBEKXJyHMkKWoVsrCVn",
    "liveProductId": null,
    "livePriceId": null,
    "active": true,
    "title": "REPORT BUNDLE 3",
    "entitlementPolicy": "SELECTED_STANDARD_REPORTS",
    "fulfillmentType": "REPORT_ACCESS"
  },
  {
    "productId": "COM-REPORT-BUNDLE-2",
    "category": "REPORT",
    "billingType": "ONE_TIME",
    "currency": "MYR",
    "amountMinor": 6900,
    "qaProductId": "prod_VHPttr1bpn1AU8",
    "qaPriceId": "price_1UGr3aBEKXJyHMkKPnlBqWP1",
    "liveProductId": null,
    "livePriceId": null,
    "active": true,
    "title": "REPORT BUNDLE 2",
    "entitlementPolicy": "SELECTED_STANDARD_REPORTS",
    "fulfillmentType": "REPORT_ACCESS"
  },
  {
    "productId": "COM-REPORT-ECR-FULL",
    "category": "REPORT",
    "billingType": "ONE_TIME",
    "currency": "MYR",
    "amountMinor": 3900,
    "qaProductId": "prod_VHPtFV3gJ4MbA2",
    "qaPriceId": "price_1UGr3YBEKXJyHMkKBagvT0b3",
    "liveProductId": null,
    "livePriceId": null,
    "active": true,
    "title": "REPORT ECR FULL",
    "entitlementPolicy": "REPORT_ECR_FULL",
    "fulfillmentType": "REPORT_ACCESS"
  },
  {
    "productId": "COM-REPORT-CROSS-FULL",
    "category": "REPORT",
    "billingType": "ONE_TIME",
    "currency": "MYR",
    "amountMinor": 29900,
    "qaProductId": "prod_VHPtFwBBbFdgNN",
    "qaPriceId": "price_1UGr3WBEKXJyHMkKMzKNaaEm",
    "liveProductId": null,
    "livePriceId": null,
    "active": true,
    "title": "REPORT CROSS FULL",
    "entitlementPolicy": "REPORT_CROSS_FULL",
    "fulfillmentType": "REPORT_ACCESS"
  },
  {
    "productId": "COM-REPORT-HD-FULL",
    "category": "REPORT",
    "billingType": "ONE_TIME",
    "currency": "MYR",
    "amountMinor": 12900,
    "qaProductId": "prod_VHPtAElGHLi3gh",
    "qaPriceId": "price_1UGr3UBEKXJyHMkK4u9lYF0A",
    "liveProductId": null,
    "livePriceId": null,
    "active": true,
    "title": "REPORT HD FULL",
    "entitlementPolicy": "REPORT_HD_FULL",
    "fulfillmentType": "REPORT_ACCESS"
  },
  {
    "productId": "COM-REPORT-PROFILE-FULL",
    "category": "REPORT",
    "billingType": "ONE_TIME",
    "currency": "MYR",
    "amountMinor": 3900,
    "qaProductId": "prod_VHPtnVjpP4CUMG",
    "qaPriceId": "price_1UGr3RBEKXJyHMkKteu1HeRH",
    "liveProductId": null,
    "livePriceId": null,
    "active": true,
    "title": "REPORT PROFILE FULL",
    "entitlementPolicy": "REPORT_PROFILE_FULL",
    "fulfillmentType": "REPORT_ACCESS"
  },
  {
    "productId": "COM-REPORT-NUMEROLOGY-FULL",
    "category": "REPORT",
    "billingType": "ONE_TIME",
    "currency": "MYR",
    "amountMinor": 3900,
    "qaProductId": "prod_VHPtzvhrG3VnuD",
    "qaPriceId": "price_1UGr3PBEKXJyHMkKH6EsZNQy",
    "liveProductId": null,
    "livePriceId": null,
    "active": true,
    "title": "REPORT NUMEROLOGY FULL",
    "entitlementPolicy": "REPORT_NUMEROLOGY_FULL",
    "fulfillmentType": "REPORT_ACCESS"
  },
  {
    "productId": "COM-REPORT-ASTROLOGY-FULL",
    "category": "REPORT",
    "billingType": "ONE_TIME",
    "currency": "MYR",
    "amountMinor": 3900,
    "qaProductId": "prod_VHPtQk6R2hKboU",
    "qaPriceId": "price_1UGr3NBEKXJyHMkKXBx8geSX",
    "liveProductId": null,
    "livePriceId": null,
    "active": true,
    "title": "REPORT ASTROLOGY FULL",
    "entitlementPolicy": "REPORT_ASTROLOGY_FULL",
    "fulfillmentType": "REPORT_ACCESS"
  },
  {
    "productId": "COM-REPORT-ZIWEI-FULL",
    "category": "REPORT",
    "billingType": "ONE_TIME",
    "currency": "MYR",
    "amountMinor": 3900,
    "qaProductId": "prod_VHPt5VvsD8UtOj",
    "qaPriceId": "price_1UGr3LBEKXJyHMkKOGsjmm4C",
    "liveProductId": null,
    "livePriceId": null,
    "active": true,
    "title": "REPORT ZIWEI FULL",
    "entitlementPolicy": "REPORT_ZIWEI_FULL",
    "fulfillmentType": "REPORT_ACCESS"
  },
  {
    "productId": "COM-REPORT-BAZI-FULL",
    "category": "REPORT",
    "billingType": "ONE_TIME",
    "currency": "MYR",
    "amountMinor": 3900,
    "qaProductId": "prod_VHPthmjwXsFaSG",
    "qaPriceId": "price_1UGr3JBEKXJyHMkK8gOJBTe7",
    "liveProductId": null,
    "livePriceId": null,
    "active": true,
    "title": "REPORT BAZI FULL",
    "entitlementPolicy": "REPORT_BAZI_FULL",
    "fulfillmentType": "REPORT_ACCESS"
  },
  {
    "productId": "COM-BOOK-07",
    "category": "BOOK",
    "billingType": "ONE_TIME",
    "currency": "MYR",
    "amountMinor": 5900,
    "qaProductId": "prod_VGP1BLTCYDrb91",
    "qaPriceId": "price_1UFsDJBEKXJyHMkKSjpjX9cy",
    "liveProductId": null,
    "livePriceId": null,
    "active": true,
    "title": "PHI OS Book VII · Reality Navigation",
    "entitlementPolicy": "BOOK_07_FULL_ACCESS",
    "fulfillmentType": "DIGITAL_ACCESS"
  },
  {
    "productId": "COM-BOOK-06",
    "category": "BOOK",
    "billingType": "ONE_TIME",
    "currency": "MYR",
    "amountMinor": 5900,
    "qaProductId": "prod_VGP0cERwXu94fE",
    "qaPriceId": "price_1UFsCmBEKXJyHMkKf8oIIZOw",
    "liveProductId": null,
    "livePriceId": null,
    "active": true,
    "title": "PHI OS Book VI · Reality Observation",
    "entitlementPolicy": "BOOK_06_FULL_ACCESS",
    "fulfillmentType": "DIGITAL_ACCESS"
  },
  {
    "productId": "COM-BOOK-05",
    "category": "BOOK",
    "billingType": "ONE_TIME",
    "currency": "MYR",
    "amountMinor": 10900,
    "qaProductId": "prod_VGP0CeBp5eJPAD",
    "qaPriceId": "price_1UFsCEBEKXJyHMkKuRZ9kLcl",
    "liveProductId": null,
    "livePriceId": null,
    "active": true,
    "title": "PHI OS Book V · Reality Differentiation",
    "entitlementPolicy": "BOOK_05_FULL_ACCESS",
    "fulfillmentType": "DIGITAL_ACCESS"
  },
  {
    "productId": "COM-BOOK-04",
    "category": "BOOK",
    "billingType": "ONE_TIME",
    "currency": "MYR",
    "amountMinor": 8900,
    "qaProductId": "prod_VGOzuWuFgFxjZB",
    "qaPriceId": "price_1UFsBBBEKXJyHMkKA5xMRsFa",
    "liveProductId": null,
    "livePriceId": null,
    "active": true,
    "title": "PHI OS Book IV · Reality Expansion",
    "entitlementPolicy": "BOOK_04_FULL_ACCESS",
    "fulfillmentType": "DIGITAL_ACCESS"
  },
  {
    "productId": "COM-BOOK-03",
    "category": "BOOK",
    "billingType": "ONE_TIME",
    "currency": "MYR",
    "amountMinor": 8900,
    "qaProductId": "prod_VGOnfMW59B4xyJ",
    "qaPriceId": "price_1UFrzXBEKXJyHMkKjL6kjuFT",
    "liveProductId": null,
    "livePriceId": null,
    "active": true,
    "title": "PHI OS Book III · Reality Continuity",
    "entitlementPolicy": "BOOK_03_FULL_ACCESS",
    "fulfillmentType": "DIGITAL_ACCESS"
  },
  {
    "productId": "COM-BOOK-02",
    "category": "BOOK",
    "billingType": "ONE_TIME",
    "currency": "MYR",
    "amountMinor": 8900,
    "qaProductId": "prod_VGOm5pFpxQlAqG",
    "qaPriceId": "price_1UFryrBEKXJyHMkKyqtxoNgm",
    "liveProductId": null,
    "livePriceId": null,
    "active": true,
    "title": "PHI OS Book II · Reality Runtime",
    "entitlementPolicy": "BOOK_02_FULL_ACCESS",
    "fulfillmentType": "DIGITAL_ACCESS"
  },
  {
    "productId": "COM-BOOK-01",
    "category": "BOOK",
    "billingType": "ONE_TIME",
    "currency": "MYR",
    "amountMinor": 8900,
    "qaProductId": "prod_VGNrkqQT5jOa8O",
    "qaPriceId": "price_1UFr6EBEKXJyHMkKNFEDlDg5",
    "liveProductId": null,
    "livePriceId": null,
    "active": true,
    "title": "PHI OS Book I · Reality Formation",
    "entitlementPolicy": "BOOK_01_FULL_ACCESS",
    "fulfillmentType": "DIGITAL_ACCESS"
  }
];
// Product and entitlement IDs identify a work, never its mutable volume number.
// Keep the seven-volume purchase IDs and private-source bindings intact.
const bookPublication = {
  'COM-BOOK-01': [1, 'Reality Formation', '世界如何形成', 'BOOK_01_FULL_ACCESS'],
  'COM-BOOK-02': [2, 'Reality Runtime', '世界如何运行', 'BOOK_02_FULL_ACCESS'],
  'COM-BOOK-03': [3, 'Reality Continuity', '世界如何维持', 'BOOK_03_FULL_ACCESS'],
  'COM-BOOK-04': [4, 'Reality Expansion', '世界如何扩展', 'BOOK_04_FULL_ACCESS'],
  'COM-BOOK-05': [5, 'Reality Differentiation', '世界如何分化', 'BOOK_05_FULL_ACCESS'],
  'COM-BOOK-CONFIGURATION': [6, 'Reality Reconfiguration', '世界如何重组', 'BOOK_CONFIGURATION_FULL_ACCESS'],
  'COM-BOOK-06': [7, 'Reality Observation', '世界如何被观察', 'BOOK_06_FULL_ACCESS'],
  'COM-BOOK-07': [8, 'Reality Navigation', '世界将如何继续', 'BOOK_07_FULL_ACCESS']
};
rows.push({productId:'COM-BOOK-CONFIGURATION',category:'BOOK',billingType:'ONE_TIME',currency:'MYR',amountMinor:10900,
  qaProductId:'prod_VHXHiFJUW2FBEX',qaPriceId:'price_1UGyClBEKXJyHMkKLUjUaBMH',liveProductId:null,livePriceId:null,
  active:true,title:'PHI OS Book VI · Reality Reconfiguration',entitlementPolicy:'BOOK_CONFIGURATION_FULL_ACCESS',fulfillmentType:'DIGITAL_ACCESS'});
const roman=['I','II','III','IV','V','VI','VII','VIII'];
for(const row of rows){const b=bookPublication[row.productId];if(!b)continue;
  Object.assign(row,{publicationBookCode:`BOOK-${b[0]}`,publicationVolume:b[0],workId:b[1].toLowerCase().replaceAll(' ','-'),
    title:`PHI OS Book ${roman[b[0]-1]} · ${b[1]}`,titleZh:`PHI OS 第${b[0]}册 · ${b[2]}`});
  if(row.productId==='COM-BOOK-CONFIGURATION')row.workId='reality-configuration';
  if(row.entitlementPolicy!==b[3])throw new Error('BOOK_ENTITLEMENT_IDENTITY_DRIFT');
}
export const STRIPE_PRODUCT_REGISTRY = Object.freeze(rows.map(row => Object.freeze(row)));
export function commerceProduct(id) {
  const product = STRIPE_PRODUCT_REGISTRY.find(row => row.productId === id);
  if (!product?.active) throw Object.assign(new Error('Unknown or inactive product.'), {status:422,code:'commerce_product_invalid'});
  return product;
}
export function standardBundleProducts() {
  return eligibleReportIds('BUNDLE_5PLUS').map(id => 'COM-REPORT-' + id.replace('_FULL_REPORT','-FULL'));
}
export function commerceSelection(productId, selectedProducts = []) {
  const product=commerceProduct(productId);
  if (!Array.isArray(selectedProducts)) throw Object.assign(new Error('Invalid selection.'),{status:422,code:'bundle_selection_invalid'});
  if (!productId.includes('BUNDLE')) {
    if(selectedProducts.length) throw Object.assign(new Error('Unexpected selection.'),{status:422,code:'bundle_selection_invalid'});
    return [productId];
  }
  const n=selectedProducts.length, eligible=standardBundleProducts();
  const validCount=productId.endsWith('-2')?n===2:productId.endsWith('-3')?n===3:n>=5&&n<=eligible.length;
  if(!validCount||new Set(selectedProducts).size!==n||selectedProducts.some(id=>!eligible.includes(id))) throw Object.assign(new Error('Select distinct eligible standard reports.'),{status:422,code:'bundle_selection_invalid'});
  return [...selectedProducts].sort();
}
export function commerceEntitlements(productId, selectedProducts=[]) {
  return commerceSelection(productId,selectedProducts).map(id=>({productId:id,entitlementCode:commerceProduct(id).entitlementPolicy}));
}
export function assertReportPriceParity() {
  for(const row of STRIPE_PRODUCT_REGISTRY.filter(p=>p.category==='REPORT'&&!p.professionalReviewRequired)){
    const id=row.productId.replace('COM-REPORT-','').replaceAll('-','_');
    const legacy=id.startsWith('BUNDLE')?id:id.replace('_FULL','_FULL_REPORT');
    if(resolveReportProduct(legacy)?.amountMinor!==row.amountMinor) throw new Error('REPORT_PRICE_AUTHORITY_DRIFT:'+row.productId);
  }
  return true;
}
