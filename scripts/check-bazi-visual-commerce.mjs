import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createHash} from 'node:crypto';
import {attachBaziPublicationAccess,buildBaziCustomerPublication,readingPublicationTime} from '../functions/personal-reading/bazi-customer-publication.js';
import {buildBzrPhase10Case} from './lib/pvp-phase10-method-fixture.mjs';
import {projectBaziPublicationPages} from '../functions/personal-reading/bazi-visual-report-projection.js';
import {defaultPersonalReadingTab} from '../assets/customer-ui/js/personal-products/final-personal-reading-experience.js';
import {adaptBaziPersonalRealityProduct} from '../functions/personal-reality-product/adapters/bazi-production-adapter.js';
import {renderBaziProduct} from '../assets/customer-ui/js/specialists/bazi/product-renderer.js';
import {renderPublicationReport} from '../assets/customer-ui/js/personal-products/publication-report-pages.js';
import {buildBaziPublicationVisual} from '../functions/canonical-presentation-runtime/bazi-publication-visuals.js';
import {visualModules,visualAssets} from '../functions/canonical-presentation-runtime/report-section-config.generated.js';
import {createReportSubjectPresentation} from '../functions/canonical-presentation-runtime/report-cover-subject.js';
import {sha256Stable} from '../functions/interpretation-runtime/mir7-utils.js';
globalThis.document={documentElement:{lang:'en'}};
const read=p=>JSON.parse(fs.readFileSync(p)),{reading,temporalSnapshot}=read('docs/guided-report-successor-r2/bazi-source.json');
for(const [file,expected] of Object.entries(read('docs/guided-report-successor-r2/visual-commerce/semantic-freeze.json').files))assert.equal(createHash('sha256').update(fs.readFileSync(file,'utf8').replace(/\r\n?/g,'\n')).digest('hex'),expected,`Frozen BaZi source: ${file}`);
const original=JSON.stringify(reading),product=adaptBaziPersonalRealityProduct({report:reading,locale:'en'}),other={methodId:'AST',preserved:true};
const view={methodNativeReading:{BZR:reading,AST:other},singleMethodReading:{secret:'full'},structure:{methods:[{publicMethodCode:'BAZI',projectionId:'bzr',privateDetail:true},{publicMethodCode:'AST',projectionId:'ast'}]},patterns:{items:[{projectionId:'bzr',privateDetail:true},{projectionId:'ast'}]},productRoute:{mode:'SINGLE_METHOD',methodId:'BZR',primaryProduct:product,products:[product]},reading:{methods:[{methodId:'BZR',secret:'full'},other]}};
const ctx={env:{PHIOS_ENVIRONMENT:'qa'},data:{},request:new Request('https://qa.phios-github.pages.dev/api/customer-personal-reality',{method:'POST',body:JSON.stringify({paid:true,entitlementKey:'report:bazi:full',customerId:'attacker'})})};
let queries=0;const free=await attachBaziPublicationAccess(view,ctx,{loadEntitlement:async()=>{queries++;return {entitlement_status:'active'}}});assert.equal(queries,0);
const p=free.productRoute.primaryProduct;assert.equal(p.reportAccess.state,'FREE_REPORT_PREVIEW');assert(!p.sourceProduct);assert(!free.methodNativeReading.BZR);assert.equal(free.singleMethodReading,null);assert.deepEqual(free.methodNativeReading.AST,other);assert.deepEqual(free.reading.methods,[other]);assert.equal(free.structure.methods.length,1);assert.equal(free.patterns.items.length,1);
assert.equal(defaultPersonalReadingTab(free),'overview');assert.equal(defaultPersonalReadingTab({productRoute:{products:[p,other]}}),'overview');
const freeHtml=renderBaziProduct({product:p}).readingHtml;assert(!freeHtml.includes('cx-bazi-w12-workspace'));assert(freeHtml.includes('FREE_REPORT_PREVIEW'));assert(!freeHtml.includes('COM-REPORT-BAZI-FULL'),'unavailable historical source must not render an unlock offer');
assert.equal(p.reportDelivery.access.state,'UNAVAILABLE');assert.equal(p.lockedOutline.length,10);assert(p.lockedOutline.every(s=>Object.keys(s).join(',')==='title'));assert(!freeHtml.includes('data-report-locked-outline'));
assert.equal(p.publicationReport,null,'historical reference must not enter customer preview');
assert(!freeHtml.includes('data-publication-visual='),'unavailable historical report must not expose chart visuals');
const historicalPreview=await buildBaziCustomerPublication({historicalReferenceReview:true,reading,locale:'en',temporalSnapshot,full:false});
const historicalPreviewProduct={...p,publicationReport:historicalPreview};
const historicalPreviewHtml=renderBaziProduct({product:historicalPreviewProduct}).readingHtml;
assert(historicalPreviewHtml.includes('PAID_LOCKED'));assert(historicalPreviewHtml.includes('COM-REPORT-BAZI-FULL'));assert.match(historicalPreviewHtml,/RM\s*39/);assert(historicalPreviewHtml.includes('data-report-locked-outline'));
assert.equal(defaultPersonalReadingTab({productRoute:{products:[historicalPreviewProduct]}}),'details');
for(const key of ['FOUR_PILLARS','FIVE_ELEMENTS','TEN_GOD_OVERVIEW','TEN_GOD_FUNCTION_GROUPS'])assert(historicalPreviewHtml.includes(`data-publication-visual="${key}"`),key);
for(const key of ['TEN_GOD_DETAILS','DAY_MASTER_CARRYING','PATTERN_PATHS','PROFESSIONAL_TOPICS'])assert(!freeHtml.includes(`data-publication-visual="${key}"`));
assert(!renderBaziProduct({product}).readingHtml.includes('cx-bazi-w12-workspace'),'missing access envelope must fail closed');
const identity={userId:'account-a',providerId:'auth0',verified:true,authenticated:true};ctx.data.symbolicAccountIdentity=identity;
for(const row of [null,{entitlement_status:'refunded',purchase_id:'p'},{entitlement_status:'active',purchase_id:'p',reportPresentation:{reportLanguageMode:'SINGLE',reportLocale:'zh-Hans'}}]){const denied=await attachBaziPublicationAccess(view,ctx,{loadEntitlement:async(_env,id,sku)=>{assert.equal(id,'account-a');assert.equal(sku,'COM-REPORT-BAZI-FULL');return row;}});assert.equal(denied.productRoute.primaryProduct.reportAccess.verifiedPurchase,false);}
const purchased={entitlement_status:'active',purchase_id:'verified-payment',reportPresentation:{reportLanguageMode:'SINGLE',reportLocale:'en'}};
// An owned purchase alone no longer admits a full report: the newer cover
// contract also requires a trusted subject binding. Keep the missing-binding
// rejection, then prove that even an explicit cover fixture cannot rebind historical prose.
const missingSubject=await attachBaziPublicationAccess(view,ctx,{loadEntitlement:async()=>purchased});
assert.equal(missingSubject.productRoute.primaryProduct.reportAccess.state,'FREE_REPORT_PREVIEW');
assert.equal(missingSubject.productRoute.primaryProduct.reportAccess.reason,'PUBLICATION_UNAVAILABLE');
const coverBirth={inputVersion:'MCD-3-CANONICAL-BIRTH-INPUT-v1.0.0',birthDate:'2001-02-03',birthTime:null,timeAccuracy:'UNKNOWN',locale:'en',consent:{},birthPlace:{displayName:null,countryCode:null,latitude:null,longitude:null},timezone:{iana:null,utcOffsetAtBirth:null,source:'UNKNOWN',confidence:'UNKNOWN'}};
const coverInput={subjectReference:'account-a',displayName:'Synthetic cover client',birthDate:coverBirth.birthDate,birthTime:null,timeAccuracy:'UNKNOWN',identitySourceRef:'QA_VISUAL_COMMERCE_PERSON',birthSourceRef:'QA_VISUAL_COMMERCE_COVER_ONLY'};
// Expected fingerprint comes from the fixture input, not the submitted overlay.
const coverFingerprint=await sha256Stable(coverInput);
ctx.data.reportSubjectPresentation=await createReportSubjectPresentation({...coverInput,canonicalBirthInput:coverBirth});
ctx.data.reportSubjectBinding={subjectReference:coverInput.subjectReference,birthDate:coverInput.birthDate,birthTime:null,timeAccuracy:'UNKNOWN',inputSubjectFingerprint:coverFingerprint,semanticSubjectFingerprint:coverFingerprint};
const wrongSubject=await attachBaziPublicationAccess(view,{...ctx,data:{...ctx.data,reportSubjectPresentation:{...ctx.data.reportSubjectPresentation,displayName:'Different client'}}},{loadEntitlement:async()=>purchased});
assert.equal(wrongSubject.productRoute.primaryProduct.reportAccess.reason,'PUBLICATION_UNAVAILABLE');
assert(!wrongSubject.productRoute.primaryProduct.sourceProduct);
const paid=await attachBaziPublicationAccess(view,ctx,{loadEntitlement:async()=>purchased});
assert.equal(paid.productRoute.primaryProduct.reportAccess.state,'FREE_REPORT_PREVIEW');
assert.equal(paid.productRoute.primaryProduct.reportAccess.reason,'PUBLICATION_UNAVAILABLE');
assert.equal(paid.productRoute.primaryProduct.publicationReport,null);assert(!paid.productRoute.primaryProduct.sourceProduct);
await assert.rejects(()=>buildBaziCustomerPublication({reading,locale:'en',temporalSnapshot,full:true}),/BCR_HISTORICAL_REFERENCE_NOT_PRODUCTION_ADMITTED/);
await assert.rejects(()=>buildBaziCustomerPublication({historicalReferenceReview:true,reading,locale:'en',temporalSnapshot,full:true,reportSubjectPresentation:ctx.data.reportSubjectPresentation}),/BCR_HISTORICAL_REFERENCE_NOT_PRODUCTION_ADMITTED/);
const full=await buildBaziCustomerPublication({historicalReferenceReview:true,reading,locale:'en',temporalSnapshot,full:true}),html=renderPublicationReport(full);assert(full.totalPages>36);assert.equal(full.totalPages,full.pages.length+6);
for(const module of visualModules.modules){assert.equal(module.publicationCreatesMeaning,false);assert(module.sourceRefs.length);assert(html.includes(`data-publication-visual="${module.key}"`),module.key);}
// Print Shell V2 intentionally projects one required background per page:
 // section masters on opener pages and the shared body on reading pages. The
 // legacy motif assets remain registered fallbacks, but are not emitted as
 // layered <img> nodes in the V2 publication HTML.
assert(html.includes('data-print-shell="PHI-OS-REPORT-PRINT-SHELL-V2"'));
assert(html.includes('VIS-REPORT-BAZI-BODY.webp'));
assert(html.includes('pub-page-background--body'));
assert(html.includes('pub-page-background--section'));
assert(full.pages.every(page=>page.visualBinding?.backgroundMode==='METHOD_PRINT_SHELL_V2'));
assert(full.pages.every(page=>page.visualBinding?.suppressSyntheticMotif===true));
for(const sectionAsset of Object.values(visualAssets.sections)){
 const url=visualAssets.bindings[sectionAsset];
 assert(url,sectionAsset);
 assert(html.includes(url),sectionAsset);
}
for(const motifKey of visualAssets.global.motifs){
 const url=visualAssets.bindings[motifKey];
 assert(url,motifKey);
 assert(!html.includes(url),`PRINT_SHELL_V2_MOTIF_SHOULD_NOT_RENDER:${motifKey}`);
}
assert(!html.includes('data-decorative-layer='),'Print Shell V2 must not emit legacy layered decoration');
assert.equal(visualAssets.intensityByFamily.SECTION_OPENER_PAGE,0.4);
for(const color of ['#3aa878','#e66d52','#c79b52','#9a9da3','#438fc4','#c87949','#f0aa2f','#3c8fd0','#48c094','#e26d71'])assert(html.includes(color),color);
const prod=await attachBaziPublicationAccess(view,{...ctx,env:{PHIOS_ENVIRONMENT:'production'}},{loadEntitlement:async()=>purchased});assert.equal(prod.productRoute.primaryProduct.reportAccess.reason,'PUBLICATION_UNAVAILABLE');assert(!prod.productRoute.primaryProduct.sourceProduct);
assert.equal(JSON.stringify(reading),original,'publication must not mutate native semantics');
const {native:noTarget}=await buildBzrPhase10Case(),unselected=readingPublicationTime(noTarget);
await assert.rejects(()=>projectBaziPublicationPages({reading:noTarget,locale:'en',temporalContext:unselected}),/PUBLICATION_RESOLVED_TEMPORAL_REQUIRED/);
for(const locale of ['en','zh-Hans']){
 const untimed=await projectBaziPublicationPages({reading:noTarget,locale,temporalContext:unselected,allowUnselectedTiming:true});
 assert(untimed.reports.length);assert(untimed.reports.every(r=>!r.pages.some(p=>p.temporal)),'No selected time may not invent a current-period layer');
 for(const full of [false,true]){
  await assert.rejects(()=>buildBaziCustomerPublication({historicalReferenceReview:true,reading:noTarget,locale,temporalSnapshot:unselected,full}),/BCR_ACCEPTED_REFERENCE_SUBJECT_OR_TIME_MISMATCH/,'a different chart/time must not inherit accepted historical prose');
 }
}
assert.equal(noTarget.professionalModules.professionalTimeline.targetContext,null);
const unavailable=await attachBaziPublicationAccess({...view,methodNativeReading:{BZR:{...reading,publicationDecision:{customerPublishable:false}},AST:other}},ctx,{loadEntitlement:async()=>purchased});
assert.equal(unavailable.productRoute.primaryProduct.reportAccess.reason,'PUBLICATION_UNAVAILABLE');
assert(!unavailable.productRoute.primaryProduct.sourceProduct);assert(!unavailable.methodNativeReading.BZR);assert.deepEqual(unavailable.methodNativeReading.AST,other);
assert.throws(()=>buildBaziPublicationVisual({reading,primaryVisualRef:'UNKNOWN'}));
const store=fs.readFileSync('functions/commerce/book-commerce-store.js','utf8');assert.match(store,/p.purchase_state='purchased'/);assert.match(store,/o.customer_id=e.customer_id/);assert.match(store,/expires_at>\?3/);
console.log('PASS: free payload excludes specialist detail; forged client payment cannot unlock; existing owned purchase + language + expiry boundaries; historical reference is review-only and rejects production/subject overlays; Print Shell V2 body/section-master projection, registered motif fallbacks and category colours; Production release remains closed.');
