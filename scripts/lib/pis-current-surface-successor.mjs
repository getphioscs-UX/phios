import fs from 'node:fs';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
const sha=bytes=>crypto.createHash('sha256').update(bytes).digest('hex');
export function pisCurrentSurfaceSuccessor(){
 const r=JSON.parse(fs.readFileSync('content/web/index-surfaces/pis-r1-current-surface-successor-v1.json'));
 assert.equal(r.status,'ENGINEERING_RECONCILIATION');
 for(const field of ['historicalCopyRewritten','historicalVisualBindingsRewritten','newVisualAuthorityCreated','humanAcceptanceGranted'])assert.equal(r[field],false);
 assert.deepEqual(r.surfaces.map(s=>s.file),['index.html','about/founder/index.html','perspectives/index.html','professional/index.html','reality/index.html']);
 for(const p of r.predecessors)assert.equal(sha(fs.readFileSync(p.path)),p.sha256,'PIS predecessor drift: '+p.path);
 for(const s of r.surfaces)assert.equal(sha(fs.readFileSync(s.file)),s.sha256,'PIS current source drift: '+s.file);
 return r;
}
export function assertPisCurrentSurface(document,surface){
 if(!surface)return;
 for(const selector of surface.requiredSelectors)assert(document.querySelector(selector),surface.file+': missing current component '+selector);
 for(const extra of surface.additionalEditorial){
  const found=[...document.querySelectorAll('.pis-editorial:not(.pis-visual-story)')].filter(n=>n.querySelector('h2')?.getAttribute('data-cx-en')===extra.headingEn);
  assert.equal(found.length,1,surface.file+': missing/duplicate successor editorial');
  assert.equal(found[0].querySelector('h2').getAttribute('data-cx-zh'),extra.headingZh);
  assert.equal(sha(found[0].outerHTML),extra.sha256,surface.file+': successor editorial drift');
 }
}
