import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import { loadProductionRepository } from './lib/knowledge-production/production-repository.mjs';
import { resolveWaveNodes } from './lib/knowledge-production/wave-binding.mjs';
const root=process.cwd(), repo=await loadProductionRepository(root);
const registry=JSON.parse(await fs.readFile('content/knowledge/production/orchestration/wave-registry.json','utf8'));
for(const wave of registry.waves){const b=resolveWaveNodes(repo,wave); assert.equal(b.bookScopeAuthority,false);}
const synthetic=resolveWaveNodes(repo,{waveCode:'TEST',nodeCodes:['KN-B1-P4-001','KN-B1-P5-001']}); assert.equal(synthetic.crossBook,true);
console.log('✓ PJA-R4D Production Orchestration Migration passed.');
