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
 const next=JSON.parse(fs.readFileSync('content/web/index-surfaces/pis-r1-current-surface-successor-v2.json'));
 assert.equal(next.status,'ENGINEERING_RECONCILIATION');
 assert.equal(next.predecessor.path,'content/web/index-surfaces/pis-r1-current-surface-successor-v1.json');
 assert.equal(next.predecessor.sha256,sha(fs.readFileSync(next.predecessor.path)));
 for(const value of [next.predecessor.rewritten,next.historicalCopyRewritten,next.historicalVisualBindingsRewritten,next.humanAcceptanceGranted])assert.equal(value,false);
 assert.deepEqual(next.surfaces.map(s=>s.file),['index.html','reality/index.html']);
 const founder=JSON.parse(fs.readFileSync('content/web/index-surfaces/pis-r1-founder-publication-successor-v3.json'));
 assert.equal(founder.status,'ENGINEERING_RECONCILIATION');assert.equal(founder.file,'about/founder/index.html');
 assert.equal(founder.predecessor.path,'content/web/index-surfaces/pis-r1-current-surface-successor-v2.json');
 assert.equal(founder.predecessor.sha256,sha(fs.readFileSync(founder.predecessor.path)));
 assert.equal(founder.copyAuthoritySha256,sha(fs.readFileSync(founder.copyAuthority)));
 assert.equal(founder.humanAcceptanceGranted,false);assert.equal(founder.historicalRecordsRewritten,false);
 for(const s of r.surfaces){
  const current=s.file===founder.file?founder:next.surfaces.find(x=>x.file===s.file);
  if(current){assert.equal(current.predecessorSha256,s.sha256);if(current!==founder){const source=fs.readFileSync(s.file,'utf8');for(const ref of ['/assets/customer-ui/surfaces/visual-binding-r5.css','/assets/customer-ui/js/surfaces/visual-binding-r5-guides.js'])assert(source.includes(ref),s.file+': missing R5 consumer');}}
  assert.equal(sha(fs.readFileSync(s.file)),current?.sha256||s.sha256,'PIS current source drift: '+s.file);
 }
 r.surfaces[r.surfaces.findIndex(s=>s.file===founder.file)]=founder;
 assert.deepEqual(next.additionalSurfaces.map(s=>s.file),['professional/financial/index.html']);
 const proofs=JSON.parse(fs.readFileSync('content/production-closure/live-customer-commercial-convergence/VISUAL-BINDING-R5-89-R2-VERIFICATION.json')).records;
 const assets=JSON.parse(fs.readFileSync('content/customer-experience-rebuild/authority/customer-visual-asset-registry-v4.json')).entries;
 for(let number=29;number<=35;number++){
  const id='PLAN-FIN-'+String(number).padStart(3,'0'),proof=proofs.find(p=>p.planId===id),asset=assets.find(a=>a.assetId===id);
  assert.equal(proof?.decoded,true);assert.equal(asset?.available,true);
  assert.equal(asset.contentHash,proof.sha256);assert.equal(asset.publicUrl,proof.requestedURL);
 }
 for(const s of next.additionalSurfaces){assert.equal(sha(fs.readFileSync(s.file)),s.sha256,'PIS current source drift: '+s.file);r.surfaces.push(s);}
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
