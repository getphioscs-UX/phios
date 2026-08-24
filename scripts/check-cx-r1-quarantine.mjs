import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { root, base, readJson } from './lib/customer-experience-rebuild/cx-r1-guards.mjs';

const CURRENT = '306b84652102583690a7f7665167f8dfdbb82541';
const R0 = '60411a80e0247a99f26d6321ea6a4f6305042b5f';
const files = {
  r0: `${base}/acceptance/cx-r0-acceptance-v1.json`,
  registry: `${base}/legacy/legacy-customer-presentation-registry-v2.json`,
  cssFreeze: `${base}/legacy/legacy-css-freeze-v1.json`,
  signatures: `${base}/legacy/legacy-component-signature-registry-v1.json`,
  acceptance: `${base}/acceptance/cx-r1-acceptance-v1.json`,
  cssGuard: 'scripts/check-cx-no-legacy-css.mjs',
  selectorGuard: 'scripts/check-cx-no-legacy-selectors.mjs',
  copyGuard: 'scripts/check-cx-no-old-component-copy.mjs'
};
for (const rel of Object.values(files)) assert.equal(fs.existsSync(path.join(root, rel)), true, `missing CX-R1 artifact: ${rel}`);
const r0 = readJson(files.r0);
const registry = readJson(files.registry);
const cssFreeze = readJson(files.cssFreeze);
const signatures = readJson(files.signatures);
const acceptance = readJson(files.acceptance);

assert.equal(r0.baselineCommit, R0, 'CX-R1 predecessor CX-R0 baseline drift');
for (const artifact of [registry, cssFreeze, signatures, acceptance]) assert.equal(artifact.quarantineCaptureCommit, CURRENT, `${artifact.work} current capture drift`);
assert.equal(registry.predecessorR0BaselineCommit, R0);
assert.equal(registry.sourceMirror.libraryFile, 'assets(2).zip');
assert.match(registry.sourceMirror.sha256, /^[a-f0-9]{64}$/);
assert.equal(registry.status, 'LEGACY_PRESENTATION_QUARANTINED');
assert.ok(registry.summary.registeredCustomerPresentations >= 125, 'quarantine registry unexpectedly small');
assert.equal(registry.summary.quarantined, registry.summary.registeredCustomerPresentations);
assert.equal(registry.summary.physicalDeletesPerformed, 0);
assert.equal(registry.rules.legacyMayDefineFutureCxDesign, false);
assert.equal(registry.rules.legacyMayBeImportedIntoCx, false);
assert.equal(registry.rules.legacyMayBeCopiedAsComposition, false);
assert.equal(registry.rules.legacyDefectFixOnly, true);
assert.equal(registry.rules.backendAuthorityAffected, false);
for (const rec of registry.entries) {
  assert.equal(rec.quarantineState, 'LEGACY_QUARANTINED', `presentation not quarantined: ${rec.htmlPath}`);
  assert.equal(rec.importIntoCxAllowed, false, `legacy import accidentally enabled: ${rec.htmlPath}`);
  assert.equal(rec.compositionReuseAllowed, false, `legacy composition reuse enabled: ${rec.htmlPath}`);
  assert.equal(rec.modificationPolicy, 'DEFECT_FIX_ONLY', `legacy page not frozen to defect fix: ${rec.htmlPath}`);
  assert.equal(rec.physicalDeleteAllowedNow, false, `R1 cannot physically delete yet: ${rec.htmlPath}`);
}
assert.ok(registry.successorDrift.newCustomerPresentationPaths.includes('financial-reality.html'), 'Stage 14 Financial Reality successor surface not captured by R1');
assert.ok(registry.successorDrift.modifiedR0PresentationPaths.includes('professional/financial/index.html'), 'Stage 15 financial presentation drift not captured');
assert.ok(registry.successorDrift.modifiedR0PresentationPaths.includes('readings/symbolic/index.html'), 'Stage 15 symbolic presentation drift not captured');

assert.equal(cssFreeze.status, 'LEGACY_CSS_FROZEN_DEFECT_FIX_ONLY');
assert.ok(cssFreeze.summary.frozenCustomerStylesheets >= 60, 'legacy CSS freeze inventory unexpectedly small');
assert.equal(cssFreeze.rules.legacyCssFutureDesignAuthority, false);
assert.equal(cssFreeze.rules.defectFixOnly, true);
assert.equal(cssFreeze.rules.activeCxRouteLegacyCssAllowed, false);
assert.equal(cssFreeze.rules.directDeleteBeforeZeroConsumer, false);
assert.equal(cssFreeze.rules.mandatoryPhysicalDeleteAfterReplacementAcceptance, true);
for (const rec of cssFreeze.entries) {
  assert.equal(rec.freezeState, 'LEGACY_CSS_FROZEN');
  assert.equal(rec.futureCxImportAllowed, false);
  assert.equal(rec.newDesignAllowed, false);
  assert.equal(rec.newComponentAllowed, false);
  assert.equal(rec.newGeneralLayoutAllowed, false);
  assert.equal(rec.physicalDeleteAllowedNow, false);
}
for (const required of ['assets/css/tokens.css','assets/css/public-experience.css','assets/css/phios-public-v2.css','assets/css/wpr-public-production.css','assets/css/financial-runtime-product.css']) {
  assert.ok(cssFreeze.entries.some((x) => x.stylesheet === required), `legacy CSS freeze missing ${required}`);
}

assert.equal(signatures.status, 'LEGACY_COMPONENT_SIGNATURES_FROZEN');
assert.ok(signatures.signatures.length >= 10);
assert.ok(signatures.signatures.every((x) => x.forbiddenOnCx === true && x.requiredTokens.length >= 2));
assert.equal(signatures.rules.renameAndCopyAllowed, false);
assert.equal(signatures.rules.compositionMigrationAllowed, false);
assert.equal(signatures.rules.semanticContentMigrationAllowed, true);

const pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
assert.equal(pkg.scripts['check:cx-no-legacy-css'], 'node scripts/check-cx-no-legacy-css.mjs');
assert.equal(pkg.scripts['check:cx-no-legacy-selectors'], 'node scripts/check-cx-no-legacy-selectors.mjs');
assert.equal(pkg.scripts['check:cx-no-old-component-copy'], 'node scripts/check-cx-no-old-component-copy.mjs');
assert.equal(pkg.scripts['check:cx-r1-quarantine'], 'node scripts/check-cx-r1-quarantine.mjs');
assert.equal(pkg.scripts['check:cx-r1'], 'npm run check:cx-r0 && npm run check:cx-r1-quarantine && npm run check:cx-no-legacy-css && npm run check:cx-no-legacy-selectors && npm run check:cx-no-old-component-copy');
assert.deepEqual(acceptance.requiredExitStates, ['LEGACY_PRESENTATION_QUARANTINED','NEW_CUSTOMER_SURFACES_CLEAN_ROOM_READY']);
assert.equal(acceptance.rules.physicalDeletePerformed, false);
assert.equal(acceptance.rules.newCxImportsLegacyPresentation, false);
assert.equal(acceptance.rules.backendAuthorityTouched, false);

console.log(`✓ CX-R1-W0 quarantine registry passed: ${registry.summary.registeredCustomerPresentations} current customer presentations quarantined; ${registry.summary.discoveredAfterR0} post-R0 surfaces and ${registry.summary.modifiedSinceR0} modified predecessor surfaces reconciled.`);
console.log(`✓ CX-R1-W1 CSS freeze passed: ${cssFreeze.summary.frozenCustomerStylesheets} customer-consumed stylesheets are DEFECT_FIX_ONLY and forbidden from future CX imports.`);
console.log(`✓ CX-R1-W4 component signature registry passed: ${signatures.signatures.length} old composition fingerprints frozen; content may migrate, composition may not.`);
console.log('✓ CX-R1 ACCEPTED: LEGACY_PRESENTATION_QUARANTINED · NEW_CUSTOMER_SURFACES_CLEAN_ROOM_READY');
