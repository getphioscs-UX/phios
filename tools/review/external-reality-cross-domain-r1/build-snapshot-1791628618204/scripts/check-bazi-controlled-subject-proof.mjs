import fs from 'node:fs';import assert from 'node:assert/strict';import {createHash} from 'node:crypto';import {createRequire} from 'node:module';import {pathToFileURL} from 'node:url';import path from 'node:path';import {PDFDocument} from 'pdf-lib';
import {executeAndProjectMcd5CurrentRequest} from '../functions/method-client-delivery/canonical-projection-runtime-current.js';
import {sha256Stable} from '../functions/interpretation-runtime/mir7-utils.js';
import {assertReportSubjectBinding,reportBirthInputFingerprint} from '../functions/canonical-presentation-runtime/report-cover-subject.js';
import {formatReportCoverFields,assertCoverOverlayValues} from '../functions/canonical-presentation-runtime/report-cover-overlay.js';
const dir='docs/acceptance/bazi-paid-report/controlled-subject-r1',read=p=>JSON.parse(fs.readFileSync(p,'utf8')),proof=read(dir+'/proof.json'),input=read(dir+'/governed-input.json'),calc=read(dir+'/calculation.json');
const replay=await executeAndProjectMcd5CurrentRequest(calc.request);
assert.equal(await sha256Stable(calc.execution.canonicalProjection),calc.receipt.calculationDigest);
// Wall-clock execution metadata is not a calculation result. Compare every
// other projection field, including its subject-derived projection ID.
const replayProjection=structuredClone(replay.canonicalProjection);
replayProjection.execution.executedAt=calc.execution.canonicalProjection.execution.executedAt;
assert.deepEqual(replayProjection,calc.execution.canonicalProjection,'fresh real calculation must match saved calculation');
assert.deepEqual(calc.request.canonicalInput,input.birthInput);assert.equal(calc.receipt.canonicalBirthInputFingerprint,await reportBirthInputFingerprint(input.birthInput));assert.equal(calc.receipt.requestDigest,await sha256Stable(calc.request));
const frozen=read('docs/acceptance/bazi-paid-report/composition-r1/HUMAN-ACCEPTANCE.json');for(const [p,h] of Object.entries(frozen.files))assert.equal(createHash('sha256').update(fs.readFileSync(p)).digest('hex'),h,'Frozen BaZi content/composition changed');
const require=createRequire(import.meta.url),{chromium}=require(path.join(process.env.USERPROFILE,'.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright'));
const browser=await chromium.launch({channel:'msedge',headless:true}),browserResults=[];
try{for(const a of proof.artifacts){
 const r=read(a.evidencePath);assert.equal(r.presentation.subjectReference,input.accountPerson.personId);assert.equal(r.reading.evidence.sourceNatalProjectionId,replay.canonicalProjection.projectionId);assert.equal(r.readingReceipt.readingDigest,await sha256Stable(r.reading));assert.equal(r.snapshotReceipt.publicationDigest,await sha256Stable(r.publicationIR));assert.equal(r.snapshotReceipt.snapshotDigest,await sha256Stable(r.snapshot));
 assert.deepEqual(r.snapshot.subjectPresentation,r.presentation);assert.deepEqual(r.snapshot.intro[0].subject,r.presentation);assert.equal(r.expectedBinding.canonicalBirthInputFingerprint,calc.receipt.canonicalBirthInputFingerprint);await assertReportSubjectBinding({presentation:r.presentation,expectedBinding:r.expectedBinding});
 assert(r.publicationIR.every(p=>p.publicationIr.blocks.every(b=>b.snapshotLineage.calculationDigest===calc.receipt.calculationDigest&&b.snapshotLineage.readingDigest===r.readingReceipt.readingDigest&&b.snapshotLineage.canonicalBirthInputFingerprint===calc.receipt.canonicalBirthInputFingerprint)));
 assert.deepEqual(r.snapshot.pages.flatMap(p=>p.paragraphs),r.publicationIR.flatMap(p=>p.publicationIr.blocks.map(b=>b.prose)));
 await assert.rejects(()=>assertReportSubjectBinding({presentation:{...r.presentation,subjectReference:'WRONG'},expectedBinding:r.expectedBinding}),/MISMATCH/);
 await assert.rejects(()=>assertReportSubjectBinding({presentation:r.presentation,expectedBinding:{...r.expectedBinding,canonicalBirthInputFingerprint:'0'.repeat(64)}}),/MISMATCH/);
 assert.equal(createHash('sha256').update(fs.readFileSync(a.path)).digest('hex'),a.artifactDigest);assert.equal(r.negativeTests.length,6);
 const page=await browser.newPage({viewport:{width:1100,height:1300}}),errors=[];page.on('pageerror',e=>errors.push(e.message));await page.goto(pathToFileURL(path.resolve(a.path)).href);await page.waitForFunction(()=>window.batchReady,{timeout:90000});await page.emulateMedia({media:'print'});
 const values=await page.locator('[data-cover-field]').evaluateAll(ns=>Object.fromEntries(ns.map(n=>[n.dataset.coverField,n.textContent])));assertCoverOverlayValues({methodId:'BZR',subject:r.presentation,renderedValues:values});assert.deepEqual(values,formatReportCoverFields({methodId:'BZR',subject:r.presentation}));
 const printed=(await PDFDocument.load(await page.pdf({format:'A4',printBackground:true,preferCSSPageSize:true}))).getPageCount();assert.equal(printed,26);
 const fit=await page.evaluate(()=>window.reviewQuality),broken=await page.evaluate(()=>[...document.images].filter(i=>!i.complete||!i.naturalWidth).map(i=>i.src));assert(!errors.length&&!broken.length);assert(fit.every(p=>p.fits));
 await page.locator('.pub-cover').screenshot({path:`${dir}/${a.locale}-cover.png`});browserResults.push({locale:a.locale,coverValues:values,printedPages:printed,fit:'PASS',brokenAssets:broken,errors});await page.close();
}}
finally{await browser.close();}
fs.writeFileSync(dir+'/validation.json',JSON.stringify({status:'PASS',freshRealCalculationReplay:'PASS',coverCalculationReadingSnapshotEquality:'PASS',sourceBoundPublicationIr:'PASS',frozenHistoricalContentUnchanged:'PASS',negativeCasesPerLocale:6,browserResults,productionAdmissionGranted:false,commerceE2E:'NOT_PROVEN'},null,2)+'\n');
console.log('PASS: real calculation replay, cover/calculation/reading/IR/snapshot chain, 12 negative results, rendered bilingual covers, 26-page print, frozen historical source unchanged.');
