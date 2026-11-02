import fs from 'node:fs';import crypto from 'node:crypto';import assert from 'node:assert/strict';import {execFileSync} from 'node:child_process';
const hash=b=>crypto.createHash('sha256').update(b).digest('hex');
export const BAZI_RENDERER_SUCCESSOR='content/production-closure/live-customer-commercial-convergence/final-unified-production-r1/BAZI-RENDERER-SUCCESSOR.json';
export function validateFinalBaziRendererSuccessor(r=JSON.parse(fs.readFileSync(BAZI_RENDERER_SUCCESSOR))){
 assert.equal(r.status,'ENGINEERING_HISTORICAL_EVIDENCE_RECONCILIATION');assert.equal(r.predecessor.path,'docs/acceptance/bazi-paid-report/deep-manuscript-r2/FINAL-CLOSURE-VERSION-RECONCILIATION-v1.json');assert.equal(hash(fs.readFileSync(r.predecessor.path)),r.predecessor.sha256);
 for(const key of ['historicalEvidenceRewritten','productionAdmissionGranted','currentRendererFitGranted','providerCallsAuthorized','humanAcceptanceGranted'])assert.equal(r[key],false);
 assert.deepEqual(r.entries.map(e=>e.path),['assets/customer-ui/js/personal-products/bazi-deep-diagrams.js','assets/customer-ui/js/personal-products/bazi-deep-manuscript-pages.js','functions/personal-reading/publication-fit/bazi-publication-fit-gate.js']);
 for(const e of r.entries){assert.equal(e.ownerIntegratedRevision,'400ac5eed99fb73d7db085e1df3394933dd2fb57');assert.equal(e.historicalFitTransferGranted,false);assert.equal(hash(Buffer.from(e.historicalBytesBase64,'base64')),e.historicalSha256);assert.equal(hash(fs.readFileSync(e.path)),e.currentSha256,'Unregistered R1.2 renderer drift '+e.path);}
 return r;
}
export function frozenBaziRendererBytes(file,expected){const current=fs.readFileSync(file);if(hash(current)===expected)return current;const e=validateFinalBaziRendererSuccessor().entries.find(e=>e.path===file);assert(e,'Unregistered historical renderer successor '+file);assert.equal(e.historicalSha256,expected);const owner=execFileSync('git',['show',e.ownerIntegratedRevision+':'+file]);assert.equal(hash(owner),e.currentSha256,'Current source must match the immutable first integrated Owner handoff');return Buffer.from(e.historicalBytesBase64,'base64');}
