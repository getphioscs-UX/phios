import assert from 'node:assert/strict';
import {BASELINE,ROOT,readJson,list,benchmarkGapIndex,assertCoreRefSet} from './mfp-r-support.mjs';
const r=readJson(`${ROOT}/method-full-production-gap-registry-v1.json`), index=benchmarkGapIndex();
assert.equal(r.baselineCommit,BASELINE);assert.equal(r.workCode,'MFP-R-W0');assert.equal(r.status,'GAP_HARVEST_COMPLETE');
const gaps=list(r.gaps), exclusions=list(r.harvestExclusions), all=[...gaps.map(x=>x.affectedClaimRefs?.[0]),...exclusions.map(x=>x.benchmarkGapCode)];
assert.equal(index.size,17,'benchmark gap candidate count drifted');assert.equal(gaps.length,1,'W0 should admit only current product-impacting method gaps');assert.equal(exclusions.length,16);assert.equal(new Set(all).size,17,'duplicate semantic gap/disposition');
for(const g of gaps){assert.ok(g.gapId&&g.methodId);assert.ok(index.has(g.affectedClaimRefs?.[0]),`gap lacks benchmark evidence: ${g.gapId}`);assert.ok(['BLOCKING','MATERIAL','MINOR'].includes(g.customerImpact),`gap customer impact missing: ${g.gapId}`);assert.ok(list(g.benchmarkGapRefs).length>0);assert.ok(list(g.affectedReadingRefs).length>0);assert.ok(list(g.evidenceRefs).length>0);assert.notEqual(g.customerImpact,'NONE');assert.doesNotMatch(g.description,/theor(?:y|etical).*richer|理论.*丰富/i)}
for(const x of exclusions){assert.ok(index.has(x.benchmarkGapCode));assert.equal(x.disposition,'CLOSED_NOT_PRODUCT_BLOCKING');assert.equal(x.customerImpact,'NONE');assert.ok(list(x.currentProductEvidenceRefs).length>0)}
assert.equal(r.harvest.benchmarkGapCandidateCount,17);assert.equal(r.harvest.admittedMethodGapCount,1);assert.equal(r.harvest.closedNotProductBlockingCount,16);assert.equal(r.harvest.speculativeGapCount,0);
assert.deepEqual(r.compositionGap,['MFP-R-AST-001']);for(const k of ['calculationGap','structuralGap','relationGap','meaningGap','timingGap','sourceGap'])assert.deepEqual(r[k],[]);
assertCoreRefSet(r);
console.log('✓ MFP-R-W0 gap harvest passed: 17 benchmark tickets reconciled to current products; 1 MATERIAL method gap admitted, 16 stale/non-product-blocking tickets retired, 0 speculative gaps.');
