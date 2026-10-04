import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {reportProMethodReadiness,REPORT_PRO_COMPOSER_R1_VERSION} from '../functions/personal-reading/narrative/report-pro-composer-r1.js';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const registry=JSON.parse(fs.readFileSync(path.join(root,'config/reports/report-pro-composer-r1.json'),'utf8'));
const baziRef=JSON.parse(fs.readFileSync(path.join(root,'config/reports/bazi-editorial-reference-r2.json'),'utf8'));
const ziweiRef=JSON.parse(fs.readFileSync(path.join(root,'config/reports/ziwei-editorial-reference-r5.json'),'utf8'));
const writer=fs.readFileSync(path.join(root,'functions/personal-reading/narrative/narrative-writer.js'),'utf8');
const composer=fs.readFileSync(path.join(root,'functions/personal-reading/narrative/report-pro-composer-r1.js'),'utf8');
const refRegistry=fs.readFileSync(path.join(root,'functions/personal-reading/narrative/report-pro-reference-registry.js'),'utf8');
const deliveryR2=fs.readFileSync(path.join(root,'functions/report-delivery/report-delivery-r2.js'),'utf8');

assert.equal(registry.composerId,'REPORT-PRO-COMPOSER-R1');
assert.equal(registry.execution.productionTier,'T3_DEEP_COMPOSITION');
assert.equal(registry.execution.deterministicProseFallbackAllowed,false);
assert.deepEqual(registry.methods.map(x=>x.methodId).sort(),['AST','BZR','CROSS','ECR','HD','NUM','PROFILE','ZWR'].sort());
assert.equal(baziRef.accepted,true);
assert.equal(ziweiRef.accepted,true);
assert.equal(baziRef.qualityContract.customerVisibleProfessionalNote,false);
assert.match(writer,/REFERENCE-GOVERNED PAID REPORT/);
assert.match(writer,/do not pre-consume later sections/i);
assert.match(composer,/deterministicProseFallbackUsed:false/);
assert.match(composer,/composeReportSectionT3/);
assert.match(composer,/createCustomerDeliverySnapshot/);
assert.match(composer,/REFERENCE_GOVERNED_COMPOSITION/);
assert.match(composer,/predecessorBriefSemanticDigest/);
assert.match(refRegistry,/GEN-01-S01-HUMAN-ACCEPTED/);
assert.match(writer,/referenceGovernance\.editorialExemplar/);
assert.match(deliveryR2,/referenceGovernedComposerRequired:true/);
assert.match(deliveryR2,/deterministicProseFallbackAllowed:false/);
assert.equal(typeof REPORT_PRO_COMPOSER_R1_VERSION,'string');

const readiness=reportProMethodReadiness();
assert.equal(readiness.find(x=>x.methodId==='BZR').productionEligible,true);
assert.equal(readiness.find(x=>x.methodId==='ZWR').productionEligible,true);
for(const id of ['AST','NUM','PROFILE','ECR','HD','CROSS']){
 const row=readiness.find(x=>x.methodId===id);
 assert.ok(row);
 assert.equal(row.productionEligible,false);
 assert.equal(row.disposition,'CONTROLLED_NOT_READY_REFERENCE_REQUIRED');
}

console.log('PASS REPORT-PRO-COMPOSER-R1: all eight report methods are governed by the same reference-required T3 composition policy; unaccepted methods fail closed instead of falling back to deterministic prose.');
