import assert from 'node:assert/strict';
import { loadProductionRepository } from './lib/knowledge-production/production-repository.mjs';
const repo=await loadProductionRepository(process.cwd()); assert.equal(repo.records.length,716);
assert.equal(repo.resolveNode('KN-B1-P5-001').publicationContext.publicationBookCode,'BOOK-2');
assert.equal(repo.records.filter(r=>r.productionState.productionReady).length,0);
assert.equal(repo.records.filter(r=>r.productionState.published).length,0);
console.log('✓ PJA-R4F Acceptance and Freeze passed.');
