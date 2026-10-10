import assert from 'node:assert/strict';
import fs from 'node:fs';
import {base, readJson, requireFile, sha256File} from './fdr-check-lib.mjs';

const paths = {
 baseline:`${base}/authority/financial-data-authority-baseline-v1.json`,
 reality:`${base}/contracts/financial-reality-object-contract-v1.json`,
 snapshot:`${base}/contracts/financial-reality-snapshot-contract-v1.json`,
 change:`${base}/contracts/financial-change-event-contract-v1.json`,
 adapter:`${base}/contracts/financial-intake-adapter-contract-v1.json`,
 freeze:`${base}/authority/fdr-w0-w24-freeze-manifest-v1.json`,
 acceptance:`${base}/acceptance/fdr-w0-w24-acceptance-v1.json`,
 willAssets:'content/legal/will/registries/will-asset-type-registry-v1.json'
};
Object.values(paths).forEach(requireFile);
const baseline=readJson(paths.baseline), reality=readJson(paths.reality), snapshot=readJson(paths.snapshot), change=readJson(paths.change), adapter=readJson(paths.adapter);
assert.equal(baseline.authority.runtimeCode,'FDR');
assert.ok(baseline.authority.owns.includes('CANONICAL_FINANCIAL_FACTS'));
for (const forbidden of ['FINANCIAL_CALCULATION','FINANCIAL_ANALYSIS','PROFESSIONAL_JUDGMENT','PROFESSIONAL_RECOMMENDATION','ESTATE_DISTRIBUTION_INSTRUCTION','LEGAL_CLAUSE']) assert.ok(baseline.authority.doesNotOwn.includes(forbidden),`FDR authority boundary missing ${forbidden}`);
assert.equal(reality.objectType,'CANONICAL_FINANCIAL_REALITY');
assert.equal(reality.invariants.calculationsAllowed,false); assert.equal(reality.invariants.analysisAllowed,false); assert.equal(reality.invariants.recommendationsAllowed,false);
assert.equal(snapshot.rules.snapshotPayloadMayContainCalculation,false); assert.equal(snapshot.rules.snapshotPayloadMayContainRecommendation,false);
assert.equal(change.rules.calculationAllowed,false); assert.equal(change.rules.analysisAllowed,false); assert.equal(change.rules.recommendationAllowed,false); assert.equal(change.rules.professionalJudgmentAllowed,false);
assert.equal(adapter.rules.adapterIsFactAuthority,false); assert.equal(adapter.rules.candidateFactsAreCanonicalFactsBeforeCommit,false);
const willAssets=readJson(paths.willAssets);
assert.equal(willAssets.status,'ACTIVE_TAXONOMY_NO_LEGAL_TREATMENT_AUTHORITY');
assert.ok(willAssets.assetTypes.every(x=>x.legalTreatment==='UNDETERMINED_BY_TAXONOMY'),'DAR Will asset taxonomy acquired treatment authority');
assert.equal(willAssets.rules.classificationDoesNotProveOwnership,true);
const contentFiles=[];
const walk=d=>{for(const e of fs.readdirSync(d,{withFileTypes:true})){const p=`${d}/${e.name}`; if(e.isDirectory())walk(p); else if(e.isFile()&&p.endsWith('.json'))contentFiles.push(p)}}; walk(base);
const canonicalOwners=contentFiles.filter(p=>{const x=readJson(p); return x.objectType==='CANONICAL_FINANCIAL_REALITY'});
assert.deepEqual(canonicalOwners,[paths.reality],'More than one canonical Financial Reality authority detected');
const freeze=readJson(paths.freeze);
for (const item of freeze.artifactDigests) { requireFile(item.path); assert.equal(sha256File(item.path),item.sha256,`Frozen FDR artifact drift: ${item.path}`); }
const acceptance=readJson(paths.acceptance); assert.equal(acceptance.proofs.oneSharedFinancialReality,true); assert.equal(acceptance.proofs.noDuplicateWillAssetRegistry,true); assert.equal(acceptance.proofs.noCalculationsInFdr,true); assert.equal(acceptance.proofs.noRecommendationInFdr,true);
console.log('✓ FDR authority passed: one canonical Financial Reality, no second Account/Will fact authority, no calculation/analysis/recommendation/professional/legal authority in FDR.');
