import assert from 'node:assert/strict';
import fs from 'node:fs';
import { spawnSync } from 'node:child_process';

const exists = p => fs.existsSync(p);
const read = p => JSON.parse(fs.readFileSync(p, 'utf8'));

const bfr = [
  'content/web-production/bfr-backend-capability-inventory-v1.json',
  'content/web-production/bfr-frontend-surface-inventory-v1.json',
  'content/web-production/bfr-capability-surface-gap-matrix-v1.json',
  'content/web-production/surface-production-manifest-v1.json',
  'content/web-production/bfr-pds-cpr-wpr-lineage-v1.json',
  'content/web-production/bfr-five-volume-visual-projection-v1.json',
  'content/web-production/bfr-personal-reality-surface-reconciliation-v1.json',
  'content/web-production/bfr-academy-services-professional-reconciliation-v1.json',
  'content/web-production/bfr-r2-visual-consumption-v1.json',
  'content/web-production/acceptance/bfr-capability-consumption-acceptance-v1.json',
  'content/web-production/acceptance/bfr-production-surface-acceptance-v1.json',
  'content/web-production/wpr-post-freeze-visual-baseline-v1.json',
  'content/web-production/acceptance/wpr-post-freeze-visual-acceptance-v1.json'
];
const hpc2 = [
  'content/web/homepage/hpc2/homepage-capability-intake-v1.json',
  'content/web/homepage/hpc2/v8-content-preservation-manifest-v1.json',
  'content/web/homepage/hpc2/v8-content-destination-map-v1.json',
  'content/web/homepage/hpc2/acceptance/v8-content-preservation-acceptance-v1.json',
  'content/web/homepage/hpc2/homepage-scene-registry-v2.json',
  'content/web/homepage/hpc2/homepage-production-coverage-matrix-v1.json',
  'content/web/homepage/hpc2/homepage-visual-consumption-v2.json',
  'content/web/homepage/hpc2/acceptance/homepage-composition-acceptance-v2.json'
];
const cka = [
  'content/client/knowledge-ask/contracts/cka-entry-contract-v1.json',
  'content/client/knowledge-ask/contracts/cka-question-composer-contract-v1.json',
  'content/client/knowledge-ask/contracts/cka-answer-surface-contract-v1.json',
  'content/client/knowledge-ask/contracts/cka-knowledge-card-contract-v1.json',
  'content/client/knowledge-ask/contracts/cka-follow-up-contract-v1.json',
  'content/client/knowledge-ask/contracts/cka-guided-context-contract-v1.json',
  'content/client/knowledge-ask/contracts/cka-account-boundary-v1.json',
  'content/client/knowledge-ask/contracts/cka-retrieval-contract-v1.json',
  'content/client/knowledge-ask/contracts/cka-grounded-answer-binding-v1.json',
  'content/client/knowledge-ask/contracts/cka-answer-state-model-v1.json',
  'content/client/knowledge-ask/contracts/cka-external-authority-handoff-v1.json',
  'content/client/knowledge-ask/contracts/cka-method-boundary-v1.json',
  'content/client/knowledge-ask/contracts/cka-reality-context-boundary-v1.json',
  'content/client/knowledge-ask/contracts/cka-related-knowledge-contract-v1.json',
  'content/client/knowledge-ask/contracts/cka-contextual-entry-contract-v1.json',
  'content/client/knowledge-ask/contracts/cka-rjx-handoff-contract-v1.json',
  'content/client/knowledge-ask/acceptance/cka-privacy-acceptance-v1.json',
  'content/client/knowledge-ask/acceptance/cka-entitlement-acceptance-v1.json',
  'content/client/knowledge-ask/acceptance/cka-production-acceptance-v1.json'
];
for (const p of [...bfr, ...hpc2, ...cka]) assert.ok(exists(p), `PART_G_REQUIRED_FILE_MISSING:${p}`);
assert.equal(new Set([...bfr, ...hpc2, ...cka]).size, 40);

const archPath = 'content/web-production/contracts/bfr-h-central-checker-architecture-v1.json';
assert.ok(exists(archPath), `Missing Part H architecture contract: ${archPath}`);
const arch = read(archPath);
assert.equal(arch.publicFinalEntry, 'npm run check:bfr-h');
assert.deepEqual(arch.developerEntries, ['npm run check:hpc2','npm run check:cka','npm run check:bfr-h']);
assert.deepEqual(arch.finalValidationEntries, ['npm run check:bfr-h','npm run check:web-production-current','npm run check']);
assert.equal(arch.logicalOrder.at(-2), 'BFR-H15_CAPABILITY_CONSUMPTION');
assert.equal(arch.logicalOrder.at(-1), 'BFR-H16_PRODUCTION_ACCEPTANCE');
assert.equal(arch.compatibility.existingCheckBfrHCommandStringPreserved, true);
assert.equal(arch.compatibility.manualPerWorkExecutionRequiredForTL, false);

const pkg = read('package.json');
assert.equal(pkg.scripts['check:bfr-h-required-files'], 'node scripts/check-bfr-h-required-files-contracts.mjs');
assert.equal(pkg.scripts['precheck:bfr-h'], 'npm run check:bfr-h-required-files');
assert.equal(pkg.scripts['check:bfr-h15'], 'node scripts/check-bfr-h15-capability-consumption.mjs');
assert.equal(pkg.scripts['check:bfr-h16'], 'node scripts/check-bfr-h16-visual-production.mjs');
assert.equal(pkg.scripts['postcheck:bfr-h'], 'npm run check:hpc2-cka-direct-mapping && npm run check:bfr-h-cka-direct-mapping && npm run check:bfr-h15 && npm run check:bfr-h16');
assert.equal(pkg.scripts['check:web-production-current'], 'npm run check:web-production-runtime && npm run check:wpr-pf');
assert.ok(pkg.scripts['check:bfr-h'].includes('npm run check:cka'), 'Frozen-compatible BFR-H predecessor chain must retain CKA');
assert.ok(pkg.scripts['check:bfr-h'].endsWith('npm run check:hpc2-w14'), 'Frozen-compatible BFR-H predecessor chain must retain W14 terminal shape');

const ckaRun = spawnSync(process.execPath, ['scripts/check-cka-canonical-contract-projections.mjs'], {encoding:'utf8'});
assert.equal(ckaRun.status, 0, `${ckaRun.stdout}\n${ckaRun.stderr}`);
process.stdout.write(ckaRun.stdout);
console.log('✓ PART G required files passed: BFR-H 13/13 + HPC2 8/8 + CKA 19/19 = 40/40 canonical required files.');
console.log('✓ PART H central entry contract passed: one TL-facing BFR-H entry, H15/H16 lifecycle closure, and web-production-current alias are wired without rewriting the frozen predecessor check:bfr-h command.');
