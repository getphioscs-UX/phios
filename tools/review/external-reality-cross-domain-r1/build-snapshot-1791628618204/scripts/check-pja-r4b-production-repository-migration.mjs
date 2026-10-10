import assert from 'node:assert/strict';
import { loadProductionRepository } from './lib/knowledge-production/production-repository.mjs';
const repo = await loadProductionRepository(process.cwd());
assert.equal(repo.records.length,716); assert.equal(repo.bookScopeAuthority,false);
assert.equal(repo.resolveScope('BOOK-1').length,65); assert.equal(repo.resolveScope('BOOK-2').length,266);
const p5=repo.resolveNode('KN-B1-P5-001'); assert.equal(p5.publicationContext.publicationBookCode,'BOOK-2');
assert.equal(repo.eligible('ALL').length,0);
console.log('✓ PJA-R4B Production Repository Migration passed.');
