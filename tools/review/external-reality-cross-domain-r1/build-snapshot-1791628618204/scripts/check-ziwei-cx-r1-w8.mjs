import assert from 'node:assert/strict';
import fs from 'node:fs';
import crypto from 'node:crypto';
import {buildZiweiFullProductionCustomerRuntime} from '../functions/zi-wei-full-production/ziwei-full-production-customer-runtime.js';
import {projectZiweiW18FullReport,ZIWEI_CX_R1_W8_REPORT_PROJECTION_SCHEMA,ZIWEI_CX_R1_W8_REPORT_RENDERER_ID} from '../functions/personal-reality-product/adapters/ziwei-w18-full-report-projection.js';
import {adaptZiweiPersonalRealityProduct} from '../functions/personal-reality-product/adapters/ziwei-production-adapter.js';
import {renderMethodProduct} from '../assets/customer-ui/js/personal-products/personal-product-renderers.js';
import {renderZiweiW18FullReport,isZiweiW18FullReportProduct} from '../assets/customer-ui/js/personal-products/ziwei-w18-full-report-renderer.js';

const j=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const sha=p=>crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
const contract=j('content/customer-experience-rebuild/ziwei-cx-r1/contracts/ziwei-cx-r1-w8-full-report-renderer-contract-v1.json');
assert.equal(contract.integrationBaselineCommit,'b6fce24a1a4262e69aa01417e82267524f72fae6');
assert.equal(contract.frozenSharedBaseline,'PPR-R2-W12');
assert.equal(contract.boundaries.sharedPersonalRealityMutationAllowed,false);
assert.equal(contract.boundaries.sharedSingleMethodReadingMutationAllowed,false);
assert.equal(contract.boundaries.newPprR2SharedSuccessorRequired,false);
for(const [path,digest] of Object.entries(contract.frozenSharedFiles))assert.equal(sha(path),digest,`PPR-R2 frozen/shared file drift: ${path}`);

function fixedExecutionRequest(locale='zh-Hans'){
  const consentRecordId='CONSENT-ZIWEI-CX-R1-W8';
  const canonicalInput={birthDate:'2023-01-22',birthTime:'05:00:00',birthPlace:{displayName:'Hong Kong',countryCode:'HK',latitude:22.3193,longitude:114.1694},timezone:{iana:'Asia/Hong_Kong',utcOffsetAtBirth:'+08:00',source:'GOVERNED_RESOLUTION',confidence:'HIGH'},timeAccuracy:'EXACT',locale,consent:{recordId:consentRecordId,granted:true,purposeCode:'PERSONAL_RUNTIME_METHOD_PROJECTION',persistence:'NONE'},inputVersion:'MCD-3-CANONICAL-BIRTH-INPUT-v1.0.0'};
  return {schemaVersion:'PHI-OS-MCD-METHOD-EXECUTION-REQUEST-v1.0.0',methodCode:'ZI_WEI_DOU_SHU',methodVersion:'1.0.0',capability:'CALCULATION',purposeCode:'PERSONAL_RUNTIME_METHOD_PROJECTION',canonicalInput,executionParameters:{traditionalCalculationSex:'MALE'},consentRecordId,requestId:'REQ-ZIWEI-CX-R1-W8'};
}
const targetContext={targetDate:'2026-08-28',targetTime:'12:00',targetTimezone:{iana:'Asia/Kuala_Lumpur',utcOffsetAtTarget:'+08:00'},source:'EXPLICIT_REQUEST'};
const full=await buildZiweiFullProductionCustomerRuntime({executionRequest:fixedExecutionRequest(),targetContext,locale:'zh-Hans'});
const publicationEnvelope=full.customerProduct;
const report=publicationEnvelope.report;
assert.equal(publicationEnvelope.state,'CUSTOMER_PUBLISHABLE');
assert.equal(report.schemaVersion,'PHI-OS-ZIWEI-CUSTOMER-REPORT-v1.0.0');
assert.equal(report.summary.palaceBlockCount,12);
assert.equal(report.summary.duplicateCustomerTextCount,0);

const projection=projectZiweiW18FullReport({publicationEnvelope,locale:'zh-Hans'});
assert.equal(projection.schemaVersion,ZIWEI_CX_R1_W8_REPORT_PROJECTION_SCHEMA);
assert.equal(projection.rendererId,ZIWEI_CX_R1_W8_REPORT_RENDERER_ID);
assert.equal(projection.summary.palaceSectionCount,12);
assert.equal(projection.summary.timingSectionCount,3);
assert.equal(projection.summary.openBoundaryItemCount,8);
assert.equal(projection.summary.duplicateCustomerTextCount,0);
assert.equal(projection.boundaries.newMeaningCreated,false);
assert.equal(projection.boundaries.secondPalaceEssayCreated,false);
assert.equal(projection.boundaries.sharedPersonalRealityFileMutationRequired,false);
assert.equal(new Set(projection.sections.filter(x=>x.kind==='PALACE_READING').map(x=>x.title)).size,12);
for(const s of projection.sections)assert.ok(s.payload.length<=12,`Frozen PPR-R2 renderer truncation risk: ${s.sectionId} has ${s.payload.length} rows`);

const reportPalaces=report.sections.find(x=>x.sectionCode==='PALACES').items;
for(const palace of reportPalaces){
  const projected=projection.sections.find(x=>x.kind==='PALACE_READING'&&x.title===palace.title);assert.ok(projected,`Missing palace projection ${palace.title}`);
  for(const paragraph of palace.paragraphs)assert.ok(projected.payload.includes(paragraph),`W18 palace paragraph not projected: ${palace.title}`);
  if(palace.networkContext?.summary)assert.ok(projected.payload.some(x=>x.includes(palace.networkContext.summary)),`Palace network missing: ${palace.title}`);
}
const open=report.sections.find(x=>x.sectionCode==='OPEN_BOUNDARIES');
const openProjected=projection.sections.find(x=>x.kind==='OPEN');
for(const item of open.items)assert.ok(openProjected.payload.includes(item.customerCopy),`Open boundary suppressed: ${item.starLabel}`);
const timing=report.sections.find(x=>x.sectionCode==='TIMING').items;
for(const item of timing){const projected=projection.sections.find(x=>x.kind==='TIMING'&&x.title===item.title);assert.ok(projected);for(const paragraph of item.paragraphs)assert.ok(projected.payload.includes(paragraph));}
const evidence=report.sections.find(x=>x.sectionCode==='WHY_THIS_READING');
assert.ok(projection.sections.find(x=>x.kind==='EVIDENCE').payload.includes(evidence.customerSummary));

const product=adaptZiweiPersonalRealityProduct({publicationEnvelope,locale:'zh-Hans'});
assert.equal(product.methodId,'ZWR');
assert.equal(product.productType,'ZIWEI_FULL_PRODUCTION');
assert.equal(product.state,'CUSTOMER_PUBLISHABLE');
assert.equal(product.hero.title,'紫微斗数专业读取');
assert.equal(product.lineage.preferredSpecialistRenderer,ZIWEI_CX_R1_W8_REPORT_RENDERER_ID);
assert.equal(product.lineage.w18FullReportProjectionDigest,projection.projectionDigest);
assert.equal(product.boundaries.w18NarrativeProjectedToFrozenPprMount,true);
assert.equal(product.boundaries.sharedPersonalRealityFileMutationRequired,false);
assert.equal(product.sections.filter(x=>x.kind==='PALACE_READING').length,12);
assert.equal(product.sourceProduct.report.reportDigest,report.reportDigest);

globalThis.document={documentElement:{lang:'zh-Hans'}};

// The frozen PPR-R2 shared product renderer must already be able to expose the
// projected W18 narrative without any shared-file modification.
const frozenMountHtml=renderMethodProduct(product);
assert.match(frozenMountHtml,/紫微斗数专业读取/);
for(const palace of reportPalaces){assert.ok(frozenMountHtml.includes(palace.title),`Frozen mount missing palace title ${palace.title}`);assert.ok(frozenMountHtml.includes(palace.paragraphs[0]),`Frozen mount missing W18 palace narrative ${palace.title}`);}
assert.ok(frozenMountHtml.includes(evidence.customerSummary),'Frozen mount missing why-this-reading customer summary');
assert.doesNotMatch(frozenMountHtml,/PALACE_LIFE|PALACE_SPOUSE|TIMING_DA_XIAN|READING_FIRST/,'Raw projection section identifiers leaked into customer mount');

// Specialist renderer is method-owned and ready for any specialist mount that
// consumes the W8 product; no PPR-R2 shared dispatcher is changed in W8.
assert.equal(isZiweiW18FullReportProduct(product),true);
const specialistHtml=renderZiweiW18FullReport(product);
assert.match(specialistHtml,/data-renderer="ZIWEI_CX_R1_W8_FULL_REPORT"/);
assert.equal((specialistHtml.match(/data-kind="PALACE_READING"/g)||[]).length,12);
assert.ok(specialistHtml.includes(reportPalaces[0].paragraphs[0]));
assert.ok(fs.readFileSync('assets/customer-ui/surfaces/ziwei-w18-full-report.css','utf8').includes('ZIWEI-CX-R1-W8 specialist stylesheet'));

const saved=j('content/customer-experience-rebuild/ziwei-cx-r1/projections/ziwei-cx-r1-w8-full-report-projection-v1.json');
assert.equal(saved.schemaVersion,projection.schemaVersion);
assert.equal(saved.projectionDigest,projection.projectionDigest);
assert.equal(saved.summary.palaceSectionCount,12);
assert.equal(saved.summary.openBoundaryItemCount,8);

console.log('✓ ZIWEI-CX-R1-W8 W18 Full Customer Report projection/renderer passed.');
console.log(`  W18 -> ${projection.summary.sectionCount} customer-safe projected sections, including 12/12 palace owners, ${projection.summary.timingSectionCount} timing blocks and ${projection.summary.openBoundaryItemCount} explicit open boundaries.`);
console.log('  Frozen PPR-R2-W12 shared product mount can render the projected W18 narrative; no Personal Reality shared file or shared single-method-reading file changed.');
console.log('  A method-owned specialist renderer + CSS is supplied without modifying the frozen shared dispatcher.');
