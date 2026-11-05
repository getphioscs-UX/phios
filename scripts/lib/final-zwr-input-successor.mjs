import fs from 'node:fs';import crypto from 'node:crypto';import assert from 'node:assert/strict';
import {mainConvergencePredecessors} from './main-convergence-source-successor-r1.mjs';
const hash=b=>crypto.createHash('sha256').update(b).digest('hex');
export const ZWR_INPUT_SUCCESSOR='content/production-closure/live-customer-commercial-convergence/final-unified-production-r1/REPORT-CANONICAL-INPUT-SUCCESSOR.json';
export function validateZwrInputSuccessor(r,current,expected){
 assert.equal(r.status,'ENGINEERING_SUCCESSOR_PENDING_OWNER_RELEASE_ACCEPT');assert.equal(r.path,'functions/report-delivery/ziwei-production-generation-v1.js');assert.equal(r.predecessor.path,'content/reports/ziwei/production-v1-acceptance.json');assert.equal(hash(fs.readFileSync(r.predecessor.path)),r.predecessor.sha256);assert.equal(r.previousSha256,expected);
 for(const k of ['historicalFreezeRewritten','humanAcceptanceGranted','productionActivated','commercialAdmissionGranted','calculationOrAcceptedTextChanged'])assert.equal(r[k],false);
 if(hash(current)!==r.currentSha256){
  const predecessor=mainConvergencePredecessors({paths:[r.path]}).get(r.path);
  assert.ok(predecessor,'ZiWei purchase-binding successor must be explicitly registered');assert.equal(hash(predecessor),r.currentSha256);
  let original=current.toString('utf8');
  const replacements=[
   ["import {ownedZiweiPurchase} from './ziwei-purchase-binding.js';","import {ownedReportPresentation} from '../commerce/book-commerce-store.js';"],
   ['requireZiweiEntitlement(context,locale,{purchaseId=null}={})','requireZiweiEntitlement(context,locale)'],
   ['await ownedZiweiPurchase(context,identity.userId,ZIWEI_PRODUCT,{purchaseId})','await ownedReportPresentation(context.env,identity.userId,ZIWEI_PRODUCT)'],
   ['personId,personVersion:record.personVersion,locale,purchaseId:owned.purchase_id','personId,locale,purchaseId:owned.purchase_id']
  ];
  for(const [successor,prior]of replacements){assert.equal(original.split(successor).length,2,'Unexpected ZiWei purchase-binding source');original=original.replace(successor,prior);}
  assert.equal(hash(Buffer.from(original)),r.currentSha256,'Only registered purchase/subject binding may extend canonical-input successor');current=Buffer.from(original);
 }
 assert.equal(r.exactInsertion,'canonicalInputSnapshot:structuredClone(input),');assert.equal(hash(current),r.currentSha256);const source=current.toString('utf8');assert.equal(source.split(r.exactInsertion).length,2);const previous=Buffer.from(source.replace(r.exactInsertion,''));assert.equal(hash(previous),expected,'Only the canonical input snapshot insertion may differ from frozen V1');return previous;
}
export function frozenZwrV1Bytes(file,expected){const current=fs.readFileSync(file);if(hash(current)===expected)return current;const r=JSON.parse(fs.readFileSync(ZWR_INPUT_SUCCESSOR));assert.equal(r.path,file,'Unregistered ZiWei V1 source successor');return validateZwrInputSuccessor(r,current,expected);}
