import {historicalFounderRuntimeBytes} from './founder-human-presence-successor-r2.mjs';
import {historicalPisBytes,assertCurrentConsolidatedSurface} from './page-consolidation-successor-r1.mjs';
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
 const guides=JSON.parse(fs.readFileSync('content/web/index-surfaces/pis-r1-guide-consumer-successor-v4.json'));
 assert.equal(guides.status,'ENGINEERING_RECONCILIATION');
 assert.equal(guides.predecessor.path,'content/web/index-surfaces/pis-r1-founder-publication-successor-v3.json');
 assert.equal(guides.predecessor.sha256,sha(fs.readFileSync(guides.predecessor.path)));
 assert.equal(guides.historicalRecordsRewritten,false);assert.equal(guides.humanAcceptanceGranted,false);
 assert.deepEqual(guides.surfaces.map(s=>s.file),['perspectives/index.html','professional/index.html']);
 const hero=JSON.parse(fs.readFileSync('content/web/index-surfaces/pis-r1-perspectives-hero-successor-v5.json'));
 assert.equal(hero.status,'ENGINEERING_RECONCILIATION');assert.equal(hero.file,'perspectives/index.html');
 assert.equal(hero.predecessor.path,'content/web/index-surfaces/pis-r1-guide-consumer-successor-v4.json');
 assert.equal(hero.predecessor.sha256,sha(fs.readFileSync(hero.predecessor.path)));
 assert.equal(hero.predecessorSha256,guides.surfaces.find(s=>s.file===hero.file).sha256);
 assert.equal(hero.historicalRecordsRewritten,false);assert.equal(hero.humanAcceptanceGranted,false);
 const cache=JSON.parse(fs.readFileSync('content/web/index-surfaces/pis-r1-founder-cache-successor-v9.json'));
 assert.equal(cache.status,'ENGINEERING_RECONCILIATION');assert.equal(cache.file,founder.file);
 assert.equal(cache.predecessor.path,'content/web/index-surfaces/pis-r1-explore-gallery-successor-v8.json');assert.equal(cache.predecessor.sha256,sha(fs.readFileSync(cache.predecessor.path)));
 assert.equal(cache.previousSha256,founder.sha256);assert.equal(cache.historicalRecordsRewritten,false);assert.equal(cache.humanAcceptanceGranted,false);
 assert.equal(cache.runtime.path,'assets/js/pages/founder-publication-r1.js');assert.equal(cache.runtime.sha256,sha(historicalFounderRuntimeBytes(cache.runtime.path)));
 for(const s of r.surfaces){
  const current=s.file===founder.file?founder:guides.surfaces.find(x=>x.file===s.file)||next.surfaces.find(x=>x.file===s.file);
  if(current){assert.equal(current.predecessorSha256,s.sha256);if(current!==founder){const source=historicalPisBytes(s.file).toString('utf8');for(const ref of ['/assets/customer-ui/surfaces/visual-binding-r5.css','/assets/customer-ui/js/surfaces/visual-binding-r5-guides.js'])assert(source.includes(ref),s.file+': missing R5 consumer');}}
  if(s.file===hero.file){const source=historicalPisBytes(s.file).toString('utf8');assert(source.includes('data-r6-perspectives-hero'));assert(source.includes('pv-hero-preserved'));}
  assert.equal(sha(historicalPisBytes(s.file)),s.file===founder.file?cache.sha256:s.file===hero.file?hero.sha256:current?.sha256||s.sha256,'PIS current source drift: '+s.file);
 }
 r.surfaces[r.surfaces.findIndex(s=>s.file===founder.file)]={...founder,sha256:cache.sha256,copyRuntime:cache.copyRuntime};
 assert.deepEqual(next.additionalSurfaces.map(s=>s.file),['professional/financial/index.html']);
 const proofs=JSON.parse(fs.readFileSync('content/production-closure/live-customer-commercial-convergence/VISUAL-BINDING-R5-89-R2-VERIFICATION.json')).records;
 const assets=JSON.parse(fs.readFileSync('content/customer-experience-rebuild/authority/customer-visual-asset-registry-v4.json')).entries;
 for(let number=29;number<=35;number++){
  const id='PLAN-FIN-'+String(number).padStart(3,'0'),proof=proofs.find(p=>p.planId===id),asset=assets.find(a=>a.assetId===id);
  assert.equal(proof?.decoded,true);assert.equal(asset?.available,true);
  assert.equal(asset.contentHash,proof.sha256);assert.equal(asset.publicUrl,proof.requestedURL);
 }
 const financial=JSON.parse(fs.readFileSync('content/web/index-surfaces/pis-r1-financial-guide-successor-v6.json'));
 assert.equal(financial.status,'ENGINEERING_RECONCILIATION');assert.equal(financial.file,'professional/financial/index.html');
 assert.equal(financial.predecessor.path,'content/web/index-surfaces/pis-r1-perspectives-hero-successor-v5.json');
 assert.equal(financial.predecessor.sha256,sha(fs.readFileSync(financial.predecessor.path)));
 assert.equal(financial.historicalRecordsRewritten,false);assert.equal(financial.humanAcceptanceGranted,false);
 for(const s of next.additionalSurfaces){let expected=s.sha256;for(const step of financial.steps){assert.equal(step.previousSha256,expected);expected=step.successorSha256;}assert.equal(sha(historicalPisBytes(s.file)),expected,'PIS current source drift: '+s.file);r.surfaces.push(s);}
 assert.deepEqual(guides.additionalSurfaces.map(s=>s.file),['professional/services/index.html']);
 const service=JSON.parse(fs.readFileSync('content/web/index-surfaces/pis-r1-service-scope-successor-v7.json'));
 assert.equal(service.status,'ENGINEERING_RECONCILIATION');assert.equal(service.surface.file,'professional/services/index.html');
 assert.equal(service.predecessor.path,'content/web/index-surfaces/pis-r1-financial-guide-successor-v6.json');assert.equal(service.predecessor.sha256,sha(fs.readFileSync(service.predecessor.path)));
 assert.equal(service.historicalRecordsRewritten,false);assert.equal(service.humanAcceptanceGranted,false);
 for(const s of guides.additionalSurfaces){assert.equal(service.previousSha256,s.sha256);assert.equal(sha(historicalPisBytes(s.file)),service.surface.sha256,'PIS current source drift: '+s.file);r.surfaces.push(service.surface);}
 const explore=JSON.parse(fs.readFileSync('content/web/index-surfaces/pis-r1-explore-gallery-successor-v8.json'));
 assert.equal(explore.status,'ENGINEERING_RECONCILIATION');assert.equal(explore.surface.file,'explore/how-it-works/index.html');
 assert.equal(explore.predecessor.path,'content/web/index-surfaces/pis-r1-service-scope-successor-v7.json');assert.equal(explore.predecessor.sha256,sha(fs.readFileSync(explore.predecessor.path)));
 assert.equal(explore.historicalRecordsRewritten,false);assert.equal(explore.humanAcceptanceGranted,false);
 assert.deepEqual(explore.surface.retiredContextFigures,['FIG-002','FIG-005','FIG-012']);
 assert.equal(sha(historicalPisBytes(explore.surface.file)),explore.surface.sha256,'PIS current source drift: '+explore.surface.file);r.surfaces.push(explore.surface);
 return r;
}
export function assertPisCurrentSurface(document,surface){
 if(!surface)return;
 if(assertCurrentConsolidatedSurface(document,surface.file))return;
 for(const selector of surface.requiredSelectors)assert(document.querySelector(selector),surface.file+': missing current component '+selector);
 for(const extra of surface.additionalEditorial){
  const found=[...document.querySelectorAll('.pis-editorial:not(.pis-visual-story)')].filter(n=>n.querySelector('h2')?.getAttribute('data-cx-en')===extra.headingEn);
  assert.equal(found.length,1,surface.file+': missing/duplicate successor editorial');
  assert.equal(found[0].querySelector('h2').getAttribute('data-cx-zh'),extra.headingZh);
  assert.equal(sha(found[0].outerHTML),extra.sha256,surface.file+': successor editorial drift');
 }
}
