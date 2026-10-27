import fs from 'node:fs';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {validateEcrAuthorVisualBindings} from '../functions/ecr-full-report/ecr-author-led-publication-r31.js';
const read=p=>JSON.parse(fs.readFileSync(p));
const dir='tools/review/phi-configuration-deep-reading-r2-integrated/r33-publication/binding-closure-20261027';
const binding=read('content/reports/ecr/ecr-author-visual-binding-r33.json');
const visual=read('content/reports/shared/report-visual-assets-r2.json');
const proof=read(dir+'/20-SOURCE-HASH-CHECKS.json');
const manuscripts=proof.checks.map(c=>({sectionId:c.sectionId,locale:c.locale,version:c.version,exactTextSha256:c.sha256,shaVerified:true,explicitFounderEvidence:true}));
const tests=[];
function test(name,fn){fn();tests.push({name,status:'PASS'});}
const validate=b=>validateEcrAuthorVisualBindings({bindingManifest:b,manuscripts,visualManifest:visual});
test('Ten explicit accepted bindings',()=>assert.equal(validate(binding).length,10));
for(const [name,mutate] of [
 ['Wrong visual SHA rejected',b=>b.sections[6].visualAssetSHA256='0'.repeat(64)],
 ['Wrong author SHA rejected',b=>b.sections[0].manuscriptSHA256.en='0'.repeat(64)],
 ['Wrong author version rejected',b=>b.sections[1].acceptedManuscriptId='OLD_VERSION'],
 ['Duplicate section rejected',b=>b.sections[1].sectionId=b.sections[0].sectionId],
 ['Unapproved binding rejected',b=>b.sections[2].bindingApproval='CANDIDATE'],
 ['Commercial elevation rejected',b=>b.sections[2].customerPublicationEligible=true],
 ['Missing section rejected',b=>b.sections.pop()]
])test(name,()=>{const b=structuredClone(binding);mutate(b);assert.throws(()=>validate(b));});
test('Order is not authority',()=>assert.equal(validate({...binding,sections:[...binding.sections].reverse()}).length,10));
const presentation=read(dir+'/SEC07-PRESENTATION.json');
test('A4, uncropped and isotropic source',()=>{assert.equal(presentation.scaleX,presentation.scaleY);assert.equal(presentation.cropped,false);assert(Math.abs(presentation.a4.width/presentation.a4.height-210/297)<1e-10);assert.equal(presentation.originalImageBox.y,0);assert.equal(presentation.originalImageBox.height,presentation.a4.height);});
test('Fixed example, not customer chart',()=>assert.equal(presentation.customerCalculationWritten,false));
test('Accepted bytes preserved',()=>assert.equal(createHash('sha256').update(fs.readFileSync('.tmp/ecr-r33-binding-closure-20261027/SEC07-ACCEPTED-ORIGINAL.webp')).digest('hex'),presentation.sourceSha256));
test('All eleven legacy modules explicitly disposed',()=>{const d=read(dir+'/11-MODULE-DISPOSITION.json');assert.equal(d.rows.length,11);assert(d.rows.every(r=>r.exclusionExplicit===true));});
fs.writeFileSync(dir+'/BINDING-REGRESSION.json',JSON.stringify({tests,providerCalls:0,productionWrites:0},null,2));
console.log(tests.length+' binding/presentation checks PASS');
