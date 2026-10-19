import fs from 'node:fs';
import {FINANCE_PAGES,FINANCE_PUBLICATION_VERSION,FINANCE_LAYOUT_VERSION} from '../functions/financial/holistic-planning-product/report-publication-v2.js';
import {FINANCE_EXPLANATION_POLICY} from '../functions/financial/holistic-planning-product/financial-explanation-v2.js';
const root='content/financial/reports';fs.mkdirSync(root,{recursive:true});
fs.writeFileSync(`${root}/publication-v2-contract.json`,JSON.stringify({
 contract:FINANCE_PUBLICATION_VERSION,layoutVersion:FINANCE_LAYOUT_VERSION,status:'IMPLEMENTED_LOCAL_CANDIDATE_NOT_PRODUCTION_RELEASED',
 decisionSource:'EXPLICIT_USER_REQUEST_2026_10_20',productId:'COM-REPORT-FINANCIAL-FULL',productName:{'zh-Hans':'个人与家庭财务准备报告',en:'Personal & Household Financial Preparation Report'},
 price:{currency:'MYR',amountMinor:6900,languageMode:'BILINGUAL',providerCapUSD:5,includedFollowups:4,costScope:'REPORT_REPAIR_BILINGUAL_AND_FOUR_FOLLOWUPS'},
 entitlement:{source:'ONE_EXACT_SAVED_VERSION',languages:['zh-Hans','en'],reopen:'STORED_ARTIFACT_NO_PROVIDER_CALL',download:'STORED_ARTIFACT_NO_PROVIDER_CALL',updatedDataRegeneration:'NEW_PURCHASE',historicalOrders:'KEEP_STORED_PRICE_AND_ENTITLEMENT'},
 free:['INPUT','SAVE_AND_REOPEN','DETERMINISTIC_CALCULATIONS','SINGLE_TOOLS','MISSING_INFORMATION','PREPARATION_EXPORT','SAVED_VERSION_COVERAGE_PREVIEW'],
 pages:FINANCE_PAGES.map(([key,zh,en,metricRefs,commonZh,commonEn],index)=>({page:index+1,key,title:{'zh-Hans':zh,en},metricRefs,commonText:{'zh-Hans':commonZh,en:commonEn}})),
 appendices:['LOAN_AMORTIZATION','RENTAL_DETAILS','RENTAL_PORTFOLIO'],providerPolicy:FINANCE_EXPLANATION_POLICY,
 preservation:{legacyReportVersion:'1.0.0',legacyLayoutVersion:'FINANCE_HTML_v1.1.0',newJobIdentityIncludesPublicationVersion:true,existingCalculationsAndSavedDrafts:true},
 verification:{samples:['COMPLETE','SHORTFALL','MISSING'],languages:['zh-Hans','en'],browserWidths:[360,768,1440],corePdfPages:16,providerCalls:0},
 production:{enabled:false,remoteStripePricesChanged:false,deployed:false,remainingWork:['ACCEPT_AND_REFINE_PUBLICATION_LAYOUT_AND_CHARTS','ADMIT_FINANCIAL_SHARED_PAID_DELIVERY_ADAPTER','BIND_RM69_STRIPE_PRICE_FOR_NEW_ORDERS','WIRE_OPENAI_REQUEST_TO_BUDGETED_DISPATCH_AND_SEMANTIC_VALIDATION','CONNECT_FOUR_QUESTION_ENTITLEMENT_TO_FINANCIAL_DELIVERY','END_TO_END_PAID_DELIVERY_VERIFICATION']},
 referenceDocuments:{pageContract:'Desktop/PAGE-CONTRACT.json',checklist:'Desktop/REPORT-CHECKLIST.md',interpretation:'REFERENCE_MATERIAL_ONLY_RM29_AND_USD0_SUPERSEDED_BY_CURRENT_USER_RM69_AND_USD5'}
},null,2)+'\n');console.log('Financial publication and RM69 / USD5 contract written');
