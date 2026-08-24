import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const BASELINE = '60411a80e0247a99f26d6321ea6a4f6305042b5f';
const base = 'content/customer-experience-rebuild';
const readJson = (rel) => JSON.parse(fs.readFileSync(path.join(root, rel), 'utf8'));
const exists = (rel) => fs.existsSync(path.join(root, rel));
const assertFile = (rel) => assert.equal(exists(rel), true, `missing CX-R0 artifact: ${rel}`);

const files = {
  invariants: `${base}/authority/cx-r-global-invariants-v1.json`,
  baseline: `${base}/authority/cx-r-baseline-v2.json`,
  surfaces: `${base}/audits/surface-inventory-v2.json`,
  css: `${base}/audits/css-dependency-audit-v2.json`,
  cssRetirement: `${base}/migration/legacy-css-retirement-map-v2.json`,
  js: `${base}/audits/js-dependency-audit-v2.json`,
  jsRetirement: `${base}/migration/legacy-js-retirement-map-v2.json`,
  brand: `${base}/authority/customer-brand-asset-authority-v2.json`,
  assets: `${base}/audits/customer-asset-availability-v1.json`,
  projection: `${base}/registries/backend-customer-projection-map-v2.json`,
  deletion: `${base}/migration/legacy-presentation-deletion-manifest-v1.json`,
  acceptance: `${base}/acceptance/cx-r0-acceptance-v1.json`
};
Object.values(files).forEach(assertFile);

const invariants = readJson(files.invariants);
const baseline = readJson(files.baseline);
const surfaces = readJson(files.surfaces);
const css = readJson(files.css);
const cssRetirement = readJson(files.cssRetirement);
const js = readJson(files.js);
const jsRetirement = readJson(files.jsRetirement);
const brand = readJson(files.brand);
const assets = readJson(files.assets);
const projection = readJson(files.projection);
const deletion = readJson(files.deletion);
const acceptance = readJson(files.acceptance);

for (const artifact of [invariants, baseline, surfaces, css, cssRetirement, js, jsRetirement, brand, assets, projection, deletion, acceptance]) {
  assert.equal(artifact.baselineCommit, BASELINE, `${artifact.work ?? artifact.schemaVersion} baseline drift`);
}

// GI-1 / GI-2: CX-R is a consumer only and customer language does not become runtime language.
const expectedBackend = [
  'RDG','RMO','MPA','Method Runtime','CMR','Knowledge Authority','RRE','JR','RNE','PR','RR','CPR','WPR',
  'FDR','FCR','FAR','HFP','PFR','CKA','KAP','KAU','KPP','PJA','KI','CAR','ALR','ORC','MRM-S'
];
const forbiddenAuthorities = [
  'CX Meaning Authority','CX Report Authority','CX Knowledge Authority','CX Reality Authority',
  'CX Navigation Authority','CX Professional Authority','CX Method Authority'
];
assert.deepEqual(invariants.backendAuthorityPolicy.consumeOnly, expectedBackend);
assert.deepEqual(invariants.backendAuthorityPolicy.forbiddenSecondAuthorities, forbiddenAuthorities);
assert.deepEqual(invariants.customerLanguage, ['Understand','My Reality','Perspectives','Navigation','Actions','Review','Continuity','Knowledge','Professional','Reports','History']);
assert.equal(invariants.singleShell, true);
assert.equal(invariants.singleCustomerDesignSystemPath, 'assets/customer-ui/');
assert.equal(invariants.newNamespace, 'cx-');
assert.equal(invariants.physicalDeleteRule.optionalDelete, false);
assert.equal(invariants.physicalDeleteRule.unknownDirectDeleteAllowed, false);
assert.equal(invariants.urlCompatibilityRule.oldHtmlMayRemainAfterCanonicalCutover, false);
assert.equal(invariants.urlCompatibilityRule.inlineJavascriptRedirectAsCompatibilityAuthority, false);

// W0 baseline: one commit + one aligned mirror, no presentation deletion.
assert.equal(baseline.status, 'BASELINE_CAPTURED');
assert.equal(baseline.repository, 'getphioscs-UX/phios');
assert.equal(baseline.sourceMirror.libraryFile, 'db(2).zip');
assert.match(baseline.sourceMirror.sha256, /^[a-f0-9]{64}$/);
assert.equal(baseline.rules.backendAuthorityUntouched, true);
assert.equal(baseline.rules.unknownDeletionAllowed, false);
assert.equal(baseline.rules.presentationDeletionPerformed, false);
assert.equal(baseline.customerRoutes.count, surfaces.summary.surfaceCount);
assert.equal(baseline.currentCSSBundles.totalCssFiles, css.summary.totalCssFiles);
assert.equal(baseline.currentJSBundles.auditedCustomerJsFiles, js.summary.auditedJsFiles);

// W1 surface inventory: all required customer families are explicitly covered and none is silently called CX-migrated.
assert.equal(surfaces.status, 'CURRENT_CUSTOMER_SURFACE_INVENTORY_CAPTURED');
assert.ok(surfaces.summary.surfaceCount >= 100, 'surface inventory unexpectedly small');
for (const [pattern, rec] of Object.entries(surfaces.requiredCoverage)) {
  assert.equal(rec.covered, true, `required customer surface family not covered: ${pattern}`);
  assert.ok(rec.matchingRoutes.length > 0, `required customer surface family has no route: ${pattern}`);
}
for (const s of surfaces.surfaces) {
  for (const key of ['route','htmlPath','surfaceType','customerPurpose','currentHeader','currentFooter','css','js','runtimeDependencies','assetDependencies','authRequirement','localeSupport','productionStatus','migrationState']) {
    assert.ok(Object.hasOwn(s, key), `surface missing ${key}: ${s.htmlPath}`);
  }
  assert.match(s.baselineSha256, /^[a-f0-9]{64}$/);
  assert.equal(s.migrationState, 'LEGACY_ACTIVE', `R0 must not silently promote a customer surface: ${s.route}`);
}

// W2 CSS audit: explicit legacy list is visible and direct deletion is fail-closed.
assert.equal(css.status, 'LEGACY_CSS_DEPENDENCIES_MAPPED');
assert.ok(css.summary.totalCssFiles >= 70, 'CSS audit unexpectedly small');
const cssByPath = new Map(css.stylesheets.map((x) => [x.stylesheet, x]));
for (const rel of invariants.legacyCssForbiddenOnMigratedRoutes) {
  assert.ok(cssByPath.has(rel), `GI-3 legacy stylesheet absent from baseline audit: ${rel}`);
}
assert.equal(cssRetirement.status, 'MAPPED_NOT_DELETED');
assert.equal(cssRetirement.rules.activeCxRouteLegacyCssAllowed, false);
assert.equal(cssRetirement.rules.directDeleteBeforeZeroConsumer, false);
assert.equal(cssRetirement.rules.mandatoryPhysicalDeleteAfterAcceptance, true);
for (const rec of cssRetirement.entries) {
  assert.equal(rec.directDeleteAllowedNow, false, `CSS direct delete accidentally enabled: ${rec.stylesheet}`);
  assert.ok(['DELETE_PRESENTATION','REVIEW_REQUIRED'].includes(rec.classification));
}

// W3 JS audit: both legacy global shells are explicit; runtime JS is protected from presentation deletion.
assert.equal(js.status, 'LEGACY_JS_COMPOSITION_MAPPED');
const jsByPath = new Map(js.javascript.map((x) => [x.javascript, x]));
for (const shell of ['assets/js/public-shell-v2.js','assets/js/public-shell.js']) {
  const rec = jsByPath.get(shell);
  assert.ok(rec, `missing shell from JS audit: ${shell}`);
  assert.ok(rec.compositionRoles.includes('GLOBAL_SHELL'), `shell role not detected: ${shell}`);
}
assert.equal(jsRetirement.status, 'MAPPED_NOT_DELETED');
assert.equal(jsRetirement.rules.runtimeJsMayNotBeDeletedAsPresentationDebt, true);
for (const rec of jsRetirement.entries) {
  assert.equal(rec.directDeleteAllowedNow, false, `JS direct delete accidentally enabled: ${rec.javascript}`);
  if (rec.javascript.startsWith('assets/js/runtime/') || rec.javascript.startsWith('assets/js/modules/') || rec.javascript.startsWith('assets/js/core/')) {
    assert.equal(rec.classification, 'KEEP_SHARED_RUNTIME', `runtime/shared JS misclassified for deletion: ${rec.javascript}`);
  }
}

// W4 brand audit: canonical upstream branding is known; old Φ is recorded as debt, not accepted as new authority.
assert.equal(brand.status, 'CANONICAL_UPSTREAM_BRAND_IDENTIFIED_CX_CONSUMER_NOT_YET_CUT_OVER');
assert.equal(brand.canonicalConsumers.publicHeader, 'LOGO-003');
assert.equal(brand.canonicalConsumers.publicFooterDark, 'LOGO-010');
assert.equal(brand.canonicalConsumers.browserFavicon, 'LOGO-011');
assert.equal(brand.canonicalAssets.length, 12);
assert.ok(brand.canonicalAssets.every((x) => x.canonical === true && x.r2Reachable === true));
assert.equal(brand.hardCodedPhiAudit.targetCount, 0);
assert.ok(brand.hardCodedPhiAudit.baselineConsumerCount > 0, 'R0 should record, not hide, the known old Φ debt');
assert.equal(brand.rules.cxMayCreateSecondLogoAuthority, false);

// W5 asset audit: reuse governed R2 evidence; missing facts remain explicitly unresolved.
assert.equal(assets.status, 'ASSET_AVAILABILITY_RECONCILED_WITH_EXISTING_EVIDENCE');
assert.equal(assets.authorityBoundary.createsNewAssetAuthority, false);
assert.equal(assets.authorityBoundary.networkEvidenceReusedNotReperformed, true);
for (const [label, expected] of [['Hero',23],['Book cover',5],['Figure',57],['Icon',43],['Illustration',10]]) {
  assert.equal(assets.types[label].count, expected, `${label} count drift`);
}
for (const label of ['Hero','Book cover','Figure','Icon']) {
  for (const a of assets.types[label].records) {
    assert.equal(a.exists, true, `${label} missing registry identity: ${a.assetCode}`);
    assert.equal(a.r2Reachable, true, `${label} not remote verified in carried evidence: ${a.assetCode}`);
    assert.equal(a.correctMIME, true, `${label} MIME mismatch: ${a.assetCode}`);
    assert.equal(a.correctPath, true, `${label} path mismatch: ${a.assetCode}`);
    assert.equal(a.correctVersion, true, `${label} version mismatch: ${a.assetCode}`);
  }
}
assert.equal(assets.types.Illustration.reconciliation.remoteVerified, true);
assert.equal(assets.summary.unresolvedDedicatedArticleImageAuthority, true);
assert.match(assets.evidenceBoundary, /rather than inferred/i);

// W6 projection map: every requested customer projection points at existing upstream authority roots and creates no second authority.
assert.equal(projection.status, 'BACKEND_TO_CUSTOMER_PROJECTION_BOUNDARY_CAPTURED');
assert.equal(projection.entries.length, 10);
const projectionIds = new Set(projection.entries.map((x) => x.projectionId));
for (const id of ['ASK','MY_REALITY','PERSPECTIVES','READING_UNDERSTANDING','PROGRESS_CONTINUITY','NAVIGATION','FINANCIAL_REALITY','PROFESSIONAL_REVIEW','REPORT','KNOWLEDGE']) {
  assert.ok(projectionIds.has(id), `projection missing: ${id}`);
}
for (const p of projection.entries) {
  assert.equal(p.createsSecondAuthority, false, `second authority created by projection: ${p.projectionId}`);
  assert.deepEqual(p.unresolvedSuggestedRoots, [], `projection contains unresolved upstream root: ${p.projectionId}`);
  assert.ok(p.existingAuthorityRoots.length > 0, `projection has no upstream authority root: ${p.projectionId}`);
}

// W7 deletion classification: no UNKNOWN, no physical delete, backend/governance explicitly protected.
assert.equal(deletion.status, 'CLASSIFIED_NO_PHYSICAL_DELETE_PERFORMED');
assert.equal(deletion.summary.physicalDeletesPerformed, 0);
assert.equal(deletion.rules.unknownDirectDeleteAllowed, false);
assert.equal(deletion.rules.backendAuthorityDeletionByCxForbidden, true);
assert.ok(deletion.entries.length > 200, 'deletion classification unexpectedly small');
for (const rec of deletion.entries) {
  assert.ok(deletion.allowedClassifications.includes(rec.classification), `invalid deletion classification: ${rec.path}`);
  assert.notEqual(rec.classification, 'UNKNOWN', `UNKNOWN artifact is not allowed in deletion manifest: ${rec.path}`);
  assert.equal(rec.directDeleteAllowedNow, false, `R0 direct delete accidentally enabled: ${rec.path}`);
}
for (const protectedPath of ['functions','runtime','content/runtime','content/professional','content/knowledge','content/governance']) {
  const rec = deletion.entries.find((x) => x.path === protectedPath);
  assert.ok(rec, `protected backend/governance boundary missing from deletion manifest: ${protectedPath}`);
  assert.ok(['KEEP_BACKEND','KEEP_GOVERNANCE'].includes(rec.classification));
}

// Acceptance and package surface.
const pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
assert.equal(pkg.scripts['check:cx-r0'], 'node scripts/check-cx-r0-baseline.mjs');
assert.equal(acceptance.status, 'READY_FOR_CHECKER');
assert.deepEqual(acceptance.requiredExitStates, ['CURRENT_AUTHORITY_RECONCILED','LEGACY_DEPENDENCIES_MAPPED','DELETE_MANIFEST_READY','READY_FOR_QUARANTINE']);
for (const rel of acceptance.evidence) assertFile(rel);

console.log(`✓ CX-R GI-1–GI-12 captured: consume-only backend boundary, one future cx-* customer system, fail-closed deletion.`);
console.log(`✓ CX-R0-W0/W1 baseline + surface inventory passed: ${surfaces.summary.surfaceCount} customer HTML surfaces captured at ${BASELINE.slice(0, 8)}.`);
console.log(`✓ CX-R0-W2/W3 dependency audits passed: ${css.summary.totalCssFiles} CSS files and ${js.summary.auditedJsFiles} customer-linked/shell JS files classified.`);
console.log(`✓ CX-R0-W4/W5 brand + asset audit passed: canonical LOGO-003/010/011 identified; ${assets.summary.publicRemoteVerifiedCount} public assets reuse governed remote verification evidence.`);
console.log(`✓ CX-R0-W6 projection map passed: ${projection.entries.length} backend→customer projections, 0 second authority, 0 unresolved authority roots.`);
console.log(`✓ CX-R0-W7 deletion classification passed: ${deletion.summary.records} records, 0 UNKNOWN, 0 physical deletions, backend/governance protected.`);
console.log('✓ CX-R0 ACCEPTED: CURRENT_AUTHORITY_RECONCILED · LEGACY_DEPENDENCIES_MAPPED · DELETE_MANIFEST_READY · READY_FOR_QUARANTINE');
