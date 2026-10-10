import assert from 'node:assert/strict';
import { loadProductionRepository } from './lib/knowledge-production/production-repository.mjs';
import { buildArticlePackageBinding, validateArticlePackageBinding } from './lib/knowledge-production/article-package-v2.mjs';
const repo=await loadProductionRepository(process.cwd()), r=repo.resolveNode('KN-B1-P5-001'), entry=repo.blueprintContext.registry.books.find(b=>b.bookCode==='BOOK-2');
const b=buildArticlePackageBinding(r,{blueprintRegistryContract:repo.blueprintContext.registry.contract,blueprintRegistryDigest:'registry-controlled',blueprintDigest:entry.sha256,productionWaveCode:null}); assert.equal(b.publicationBookCode,'BOOK-2'); assert.equal(validateArticlePackageBinding(b).valid,true);
console.log('✓ PJA-R4E Article Package Contract v2 passed.');
