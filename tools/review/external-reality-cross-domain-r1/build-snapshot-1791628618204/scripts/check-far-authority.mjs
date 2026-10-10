import assert from 'node:assert/strict'; import fs from 'node:fs'; import {readJson,sha256File} from './lib/far/far-check-lib.mjs';
const a=readJson('content/financial/analysis-runtime/authority/financial-analysis-authority-baseline-v1.json');
assert.equal(a.baselineCommit,'f010b29'); assert.equal(a.status,'ACTIVE_CANONICAL_FINANCIAL_ANALYSIS_AUTHORITY');
for(const s of ['FINANCIAL_ADVICE','PROFESSIONAL_JUDGMENT','PROFESSIONAL_RECOMMENDATION']) assert.ok(a.authority.doesNotOwn.includes(s));
assert.equal(a.reconciliation.FCR.independentRecalculationAllowed,false); assert.equal(a.reconciliation.FDR.mutationAllowed,false);
for(const x of a.frozenPredecessors){ assert.ok(fs.existsSync(x.path),`missing ${x.path}`); assert.equal(sha256File(x.path),x.sha256,`predecessor drift ${x.path}`); }
console.log('✓ FAR-W0 authority reconciliation passed.');
