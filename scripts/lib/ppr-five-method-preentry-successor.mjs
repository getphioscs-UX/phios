import fs from 'node:fs';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import {r6VisualOwnerBytes} from './final-health-route-successor.mjs';
const sha=s=>crypto.createHash('sha256').update(s).digest('hex');
export const PPR_PREENTRY_SUCCESSOR='content/professional/personal-reality/current/ppr-five-method-preentry-engineering-successor-v1.json';
const path='perspectives/personal/index.html';
const methods=['astrology','bazi','human-design','numerology','ziwei'];

export function validatePprPreentryDelta(next,current,previous){
 assert.equal(next.status,'ENGINEERING_SUCCESSOR_PENDING_HUMAN_REVIEW');
 assert.equal(next.changeType,'FIVE_ADDITIVE_PREENTRY_LINKS_AND_LOCALE_ADAPTER');
 assert.equal(next.path,path);
 for(const k of ['historicalFreezeRewritten','humanAcceptanceGranted','productionActivated'])assert.equal(next[k],false);
 assert.equal(sha(previous),next.previousSha256,'Pre-entry predecessor drift');
 assert.equal(sha(current),next.currentSha256,'Unregistered pre-entry source drift');
 assert.equal(next.insertions.length,6);
 const found=[];let restored=current;
 for(const token of next.insertions){
  assert.equal(restored.split(token).length,2,'Each additive insertion must occur exactly once');
  const p=token.match(/^<p class="cx-meta" data-preentry-r5-link="([a-z-]+)"><a href="([^"]+)" data-cx-en="[^"]+" data-cx-zh="[^"]+">[^<>]+<\/a><\/p>$/);
  if(p){assert(methods.includes(p[1]));assert.equal(p[2],`/perspectives/personal/${p[1]}/`);found.push(p[1]);}
  else assert.equal(token,'<script type="module" src="/assets/customer-ui/js/surfaces/preentry-hub-links-r5.js"></script>');
  restored=restored.replace(token,'');
 }
 assert.deepEqual(found.sort(),methods);
 assert.equal(restored,previous,'Existing form, scripts, wording or host changed outside the six insertions');
 return next;
}

export const PPR_R6_SUCCESSOR='content/production-closure/live-customer-commercial-convergence/final-unified-production-r1/PPR-R6-VISUAL-SUCCESSOR.json';
export function validatePprR6Successor(record,current){
 const predecessor=JSON.parse(fs.readFileSync(PPR_PREENTRY_SUCCESSOR));
 assert.equal(record.predecessor,PPR_PREENTRY_SUCCESSOR);
 assert.equal(record.predecessorSha256,sha(fs.readFileSync(PPR_PREENTRY_SUCCESSOR)));
 assert.equal(record.status,'ENGINEERING_SUCCESSOR_PENDING_HUMAN_REVIEW');
 assert.equal(record.humanDecision,'PENDING');
 assert.equal(record.changeType,'R6_PUBLIC_VISUAL_INCLUDES_AND_CANONICAL_OFFER_CONNECTION');
 assert.equal(record.path,path);
 assert.equal(record.ownerGitRevision,'39176d2f1a2f97e28cd17096fcc62efd5764daf2');
 for(const k of ['historicalFreezeRewritten','humanAcceptanceGranted','productionActivated','calculationOrConsentOwnerChanged','commercialAdmissionGranted'])assert.equal(record[k],false);
 assert.equal(record.previousSha256,predecessor.currentSha256);
 assert.equal(sha(current),record.currentSha256,'R6 source digest drift');
 assert.deepEqual(record.insertions,['<link rel="stylesheet" href="/assets/customer-ui/surfaces/journey-method-visual-r1.css">','<script type="module" src="/assets/customer-ui/js/surfaces/journey-method-visual-r1.js"></script>']);
 let restored=current;for(const token of record.insertions){assert.equal(restored.split(token).length,2);restored=restored.replace(token,'');}
 assert.equal(sha(restored),predecessor.currentSha256,'R6 must preserve the entire existing form and consent host');
 const changed=[...methods.map(m=>`perspectives/personal/${m}/index.html`),'assets/customer-ui/js/surfaces/preentry-five-method-r5-model.js','assets/customer-ui/js/surfaces/preentry-five-method-r5.js'];
 assert.deepEqual(record.dependencies.map(d=>d.path).sort(),changed.sort());
 for(const d of record.dependencies){assert.equal(d.previousSha256,predecessor.dependencies.find(p=>p.path===d.path)?.sha256);assert.equal(d.previousGitRevision,'9a84ceabfe05db12f639d4212db6ce10335b3c19');assert.equal(d.ownerGitRevision,record.ownerGitRevision);assert.equal(sha(fs.readFileSync(d.path)),d.currentSha256);}
 assert.deepEqual(record.additionalDependencies.map(d=>d.path),['assets/customer-ui/js/surfaces/journey-method-visual-model-r1.js','assets/customer-ui/js/surfaces/journey-method-visual-r1.js','assets/customer-ui/surfaces/journey-method-visual-r1.css','content/web-production/registries/current-client-visual-registry.json','content/web-production/registries/client-visual-asset-registry-v1.9.json']);
 for(const d of record.additionalDependencies){assert.equal(d.ownerGitRevision,record.ownerGitRevision);assert.equal(sha(r6VisualOwnerBytes(d.path)),d.sha256);}
 return restored;
}
export function readPprPreentrySuccessor(owner){
 const next=JSON.parse(fs.readFileSync(PPR_PREENTRY_SUCCESSOR,'utf8'));
 assert.equal(next.previousSha256,owner.currentSha256);
 const current=fs.readFileSync(path,'utf8');
 const r6=JSON.parse(fs.readFileSync(PPR_R6_SUCCESSOR));
 validatePprPreentryDelta(next,validatePprR6Successor(r6,current),fs.readFileSync(next.previousPath,'utf8'));
 for(const e of [...next.dependencies,...next.sourceEvidence]){
  const replacement=r6.dependencies.find(d=>d.path===e.path);
  assert.equal(sha(fs.readFileSync(e.path)),replacement?.currentSha256||e.sha256,'Pre-entry dependency/provenance drift: '+e.path);
 }
 return {...next,currentSha256:r6.currentSha256,recognizedPredecessors:[next.currentSha256],engineeringSuccessorRef:PPR_R6_SUCCESSOR};
}
