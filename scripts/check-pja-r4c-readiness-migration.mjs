import assert from 'node:assert/strict';
import { loadProductionRepository } from './lib/knowledge-production/production-repository.mjs';
import { loadHistoricalBookIPilot } from './lib/knowledge-production/readiness-authority.mjs';
const root=process.cwd(), repo=await loadProductionRepository(root), pilot=await loadHistoricalBookIPilot(root);
assert.equal(repo.records.length,716); assert.equal(pilot.nodeCount,78); assert.equal(pilot.mayLimitUniversalRuntime,false);
assert.equal(repo.records.filter(r=>r.productionState.productionReady).length,0);
console.log('✓ PJA-R4C Readiness Migration passed.');
