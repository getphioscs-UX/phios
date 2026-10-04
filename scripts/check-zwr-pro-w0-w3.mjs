import fs from 'node:fs';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';

const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const sha=p=>createHash('sha256').update(fs.readFileSync(p)).digest('hex');

const w0=read('content/professional/ziwei-pro/w0-gold-standard-reference-freeze-v1.json');
const w1=read('content/professional/ziwei-pro/w1-customer-authority-pack-contract-v1.json');
const w2=read('content/professional/ziwei-pro/w2-section-ownership-anti-duplication-v1.json');
const w3=read('content/professional/ziwei-pro/w3-reference-quality-profile-v1.json');
const zh=read('content/professional/ziwei-r5/accepted-copy-zh-Hans-v1.json');
const en=read('content/professional/ziwei-r5/accepted-copy-en-v1.json');
const reg=read('content/professional/ziwei-r5/accepted-candidates-v1.json');

assert.equal(w0.status,'PASS_REFERENCE_FROZEN');
assert.equal(w0.controlledSubject,'ZPA-CONTROLLED-01');
assert.equal(w0.reusableAsArbitraryCustomerBody,false);
assert.equal(w0.frozenFiles.length,3);
for(const f of w0.frozenFiles)assert.equal(sha(f.path),f.sha256,'W0 reference drift: '+f.path);
assert.equal(zh.humanDecision,'ACCEPT');
assert.equal(en.humanDecision,'ACCEPT');
assert.equal(reg.acceptedCountZhHans,10);
assert.equal(reg.acceptedCountEn,10);
assert.equal(reg.productionAdmissionGranted,false);

assert.equal(w1.status,'PASS_CONTRACT_LOCKED');
assert.equal(w1.packIdentity.subjectBound,true);
assert.equal(w1.packIdentity.inputFingerprintRequired,true);
assert(w1.requiredTopLevel.includes('subjectBinding'));
assert(w1.requiredTopLevel.includes('wholeChartTechnicalSnapshot'));
assert(w1.requiredSectionFields.includes('technicalEvidence'));
assert(w1.hardBoundaries.includes('NO_LLM_RECALCULATION'));
assert(w1.hardBoundaries.includes('NO_REFERENCE_FACT_COPYING'));
assert.equal(w1.productionAdmissionGranted,false);

const ids=['S02','S03','S04','S05','S06','S07','S08','S09','S10','S11'];
assert.deepEqual(Object.keys(w2.sections),ids);
assert.equal(w2.antiDuplication.primaryThesisOwnerExactlyOne,true);
assert.equal(w2.antiDuplication.verbatimSentenceReuseAcrossSections,false);
assert(w2.sections.S08.mustNotOwn.includes('DIAGNOSIS'));
assert(w2.sections.S11.mustNotOwn.includes('NEW_TECHNICAL_CLAIM'));
assert.equal(w2.productionAdmissionGranted,false);

assert.equal(w3.status,'PASS_PROFILE_DERIVED_FROM_HUMAN_ACCEPTED_REFERENCE');
assert.equal(w3.referenceSubject,'ZPA-CONTROLLED-01');
assert.deepEqual(Object.keys(w3.observedReferenceMetrics),ids);
for(const id of ids){
 const z=w3.observedReferenceMetrics[id].zhHans,e=w3.observedReferenceMetrics[id].en;
 assert(z.paragraphs>=5&&z.characters>0,id+': invalid zh reference metric');
 assert(e.paragraphs>=5&&e.words>0,id+': invalid en reference metric');
}
assert.equal(w3.qualityDimensions.technicalGrounding.required,true);
assert.equal(w3.qualityDimensions.governanceLeakage.required,true);
assert(w3.hardReject.includes('REFERENCE_SENTENCE_COPY_FOR_DIFFERENT_SUBJECT'));
assert.equal(w3.productionAdmissionGranted,false);

console.log('PASS ZWR-PRO W0-W3: gold-standard reference frozen; customer-specific Authority Pack contract locked; section ownership/anti-duplication locked; reference-quality profile derived; production cutover remains closed.');
