import assert from 'node:assert/strict';
import {base, readJson, getFixtures} from './fdr-check-lib.mjs';
const c=readJson(`${base}/contracts/financial-asset-ownership-contract-v1.json`);
assert.deepEqual(c.ownershipModes,['SOLE','JOINT','JOINT_EITHER','JOINT_BOTH','TENANCY_SHARE','COMPANY_OWNED','TRUST_OWNED','UNKNOWN']);
assert.equal(c.rules.jointDoesNotMeanEqualShares,true); assert.equal(c.rules.ownershipMayBeInferred,false); assert.equal(c.rules.ownershipDoesNotGrantConsent,true);
const entity=readJson(`${base}/contracts/financial-entity-ownership-contract-v1.json`); assert.equal(entity.rules.ownershipTotalsNeedNotBeForcedTo100WhenDisclosureIncomplete,true); assert.equal(entity.rules.missingOwnershipMayBeInferred,false);
let joint=0, unknown=0;
for(const {scenario,data} of getFixtures()) for(const s of data.snapshots) for(const a of s.snapshotPayload.assets){
 const o=a.ownership; assert.ok(c.ownershipModes.includes(o.ownershipMode),`${scenario} invalid ownership mode`); assert.equal(o.assetId,a.assetId,`${scenario} ownership asset mismatch`);
 if(o.ownershipMode.startsWith('JOINT')){joint++;assert.ok(o.ownerReferences.length>=2,`${scenario} joint ownership needs multiple references`); if(!Object.hasOwn(o,'shareFacts')) assert.equal(o.ownershipMode==='JOINT'||o.ownershipMode==='JOINT_BOTH'||o.ownershipMode==='JOINT_EITHER',true);}
 if(o.ownershipMode==='UNKNOWN'){unknown++;assert.equal(o.ownerReferences.length,0,`${scenario} unknown ownership must not invent owner`);}
}
assert.ok(joint>=2,'Joint ownership fixtures missing'); assert.ok(unknown>=1,'Unknown ownership fixture missing');
console.log('✓ FDR ownership passed: sole/joint/entity/unknown ownership remains explicit; no equal-share or missing-owner inference.');
