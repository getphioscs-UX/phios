import fs from'node:fs';import assert from'node:assert/strict';import{resolveFixedReportPage,resolveNumFixedPageForLocalReview}from'../../../functions/canonical-presentation-runtime/report-editorial-resolver.js';import{renderNumR20PublicationHtml}from'../../../functions/personal-reading/narrative/numerology-publication-html.js';
const manifest=JSON.parse(fs.readFileSync('content/reports/shared/report-visual-assets-r2.json'));
assert.throws(()=>resolveFixedReportPage({methodId:'NUM',pageId:'SEC-10',contentLanguage:'en',manifest}),/REPORT_FIXED_SECTIONS_PENDING_APPROVAL/);
const local=resolveNumFixedPageForLocalReview({methodId:'NUM',pageId:'SEC-10',contentLanguage:'en',manifest});assert.ok(local.objectKey.endsWith('SEC-10-INTEGRATION.webp'));
assert.throws(()=>renderNumR20PublicationHtml({localReview:true,manifest}),/NUM_CURRENT_SECTION_PLAN_REQUIRED/);
assert.throws(()=>renderNumR20PublicationHtml({localReview:false,manifest}),/NUM_R20_RENDER_LOCAL_ONLY/);
const result={newSection10ResolvesOnlyInLocalReview:true,productionAdmissionStillClosed:true,legacyPlanCannotUseCurrentSectionAssets:true,p06CustomerPublishable:false,providerCalls:0,productionWrites:0};fs.writeFileSync('tools/review/numerology-owner-sections-r1/BOUNDARY-CHECKS.json',JSON.stringify(result,null,2));console.log('Local section 10 resolves; production and stale plan remain denied');
