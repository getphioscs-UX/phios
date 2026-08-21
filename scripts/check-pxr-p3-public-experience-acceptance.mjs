import assert from 'node:assert/strict';
import fs from 'node:fs';

const text = path => fs.readFileSync(path, 'utf8');
const json = path => JSON.parse(text(path));
const contract = json('content/web-production/pxr/contracts/pxr-public-experience-contract-v1.json');
const registry = json('content/web-production/pxr/registries/pxr-public-surface-registry-v1.json');
const acceptance = json('content/web-production/pxr/acceptance/pxr-public-experience-acceptance-v1.json');
const css = text('assets/css/pxr-public-experience.css');
const pkg = json('package.json');

assert.deepEqual(contract.p3.breakpoints, [360,768,1440]);
assert.equal(contract.p3.bfrHIntegrationRequired, true);
assert.equal(contract.p3.globalProductionAcceptanceGranted, false);
assert.equal(acceptance.status, 'PXR_PUBLIC_EXPERIENCE_REPOSITORY_ACCEPTED_BROWSER_REVALIDATION_REQUIRED');
assert.equal(acceptance.gates.internalTerminologyGuard, true);
assert.equal(acceptance.gates.bookPreviewNoNativeBrokenImage, true);
assert.equal(acceptance.gates.reviewOnlyRealityRouteShielded, true);
assert.equal(acceptance.gates.fullSurfaceHero, true);
assert.equal(acceptance.gates.transitionalIconRailSuppressed, true);
assert.equal(acceptance.gates.coreSurfaceRecomposition, true);
assert.equal(acceptance.gates.breakpointsDeclared360_768_1440, true);
assert.equal(acceptance.browserRevalidationRequired, true);
assert.equal(acceptance.globalProductionAccepted, false);

assert.match(css, /@media \(max-width: 900px\)/);
assert.match(css, /@media \(max-width: 600px\)/);
assert.match(css, /prefers-reduced-motion/);
assert.ok(registry.surfaces.length >= 13);

for (const script of ['check:pxr-p0','check:pxr-p1','check:pxr-p2','check:pxr-p3','check:pxr']) {
  assert.ok(typeof pkg.scripts[script] === 'string' && pkg.scripts[script].length > 0, `Missing npm script ${script}`);
}
assert.match(pkg.scripts['postcheck:bfr-h'], /check:pxr/);
assert.match(pkg.scripts['postcheck:bfr-h'], /check:bfr-h16/);
assert.ok(pkg.scripts['postcheck:bfr-h'].indexOf('check:pxr') < pkg.scripts['postcheck:bfr-h'].indexOf('check:bfr-h16'), 'PXR must pass before BFR-H16 final acceptance');

console.log('✓ PXR-P3 Public Experience Acceptance passed: repository acceptance complete for 360/768/1440 constraints; browser/live visual revalidation remains explicit and no global deployment acceptance is fabricated.');
