import {currentConsolidationDigest} from './founder-human-presence-successor-r2.mjs';
import fs from 'node:fs';import crypto from 'node:crypto';import assert from 'node:assert/strict';import {parseHTML} from 'linkedom';
const root='content/production-closure/live-customer-commercial-convergence/page-consolidation-r1',manifest='content/web/index-surfaces/page-consolidation-configuration-profile-successor-r1.json',sha=x=>crypto.createHash('sha256').update(x).digest('hex');
export function consolidationSuccessor(){if(!fs.existsSync(manifest))return null;const record=JSON.parse(fs.readFileSync(manifest));assert.equal(record.status,'ENGINEERING_RECONCILIATION');assert.equal(record.humanAcceptanceGranted,false);assert.equal(record.productionActivated,false);assert.equal(sha(fs.readFileSync(root+'/OWNER-WORK-STEP.md')),record.ownerInstructionSha256);return record;}
export function historicalPisBytes(file){const record=consolidationSuccessor(),item=record?.surfaces.find(s=>s.file===file);if(!item)return fs.readFileSync(file);const before=fs.readFileSync(root+'/before/'+file);assert.equal(sha(before),item.previousSha256,file+': consolidation predecessor changed');let expected=currentConsolidationDigest(file,item.sha256);
 const visualLedger='artifacts/visual-r2/CHANGED-FILES.json';
 if(fs.existsSync(visualLedger)){
  const visual=JSON.parse(fs.readFileSync(visualLedger));
  assert.equal(visual.status,'ENGINEERING_RECOMPOSITION');assert.equal(visual.humanAccepted,false);
  const changes=visual.changes.filter(s=>s.file===file);assert(changes.length<=1,file+': duplicate visual successor');
  if(changes.length){const change=changes[0];assert.equal(change.beforeSha256,expected,file+': visual predecessor mismatch');assert.equal(change.backup,'artifacts/visual-r2/before/'+file);assert.equal(sha(fs.readFileSync(change.backup)),expected,file+': visual predecessor changed');expected=change.afterSha256;}
 }
 assert.equal(sha(fs.readFileSync(file)),expected,file+': consolidation source drift');return before;}
export function assertCurrentConsolidatedSurface(document,file){const item=consolidationSuccessor()?.surfaces.find(s=>s.file===file);if(!item)return false;historicalPisBytes(file);const {document:before}=parseHTML(fs.readFileSync(root+'/before/'+file,'utf8'));assert(before.querySelector('main'),file+': historical source lost');for(const selector of item.requiredSelectors)assert(document.querySelector(selector),file+': missing consolidated consumer '+selector);if(item.redirect){assert.equal(document.querySelector('[data-consolidation-target]')?.dataset.consolidationTarget,item.redirect);assert(!document.querySelector('[data-pis-context-figures]'));}return true;}
