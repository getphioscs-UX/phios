import assert from 'node:assert/strict';
import fs from 'node:fs';

const shell = fs.readFileSync('assets/js/journey-shell.js', 'utf8');
const css = fs.readFileSync('assets/css/design/journey-shell.css', 'utf8');
const reconciliation = JSON.parse(fs.readFileSync('content/web-production/registries/phios-logo-journey-shell-reconciliation-v1.json', 'utf8'));

assert.match(shell, /resolvePublicAssetForWeb/);
assert.match(shell, /JOURNEY_BRAND_ASSET_CODE = 'LOGO-010'/);
assert.match(shell, /JOURNEY_FAVICON_ASSET_CODE = 'LOGO-011'/);
assert.match(shell, /REALITY_JOURNEY_SHELL/);
assert.match(shell, /MutationObserver/);
assert.match(shell, /data-journey-brand-asset/);
assert.doesNotMatch(shell, /pub-[a-z0-9]+\.r2\.dev/i, 'Journey shell must not hard-code R2 public URLs.');
assert.match(css, /\.journey-brand__logo/);
assert.match(css, /\.runtime-workspace-brand__logo/);
assert.match(css, /is-canonical-logo-ready/);
assert.equal(reconciliation.authority.journeyHeaderLogo, 'LOGO-010');
assert.equal(reconciliation.authority.runtimeSidebarLogo, 'LOGO-010');
assert.equal(reconciliation.authority.browserFavicon, 'LOGO-011');
assert.equal(reconciliation.authority.directR2UrlsForbidden, true);
assert.equal(reconciliation.authority.textPhiOsFallbackRetained, true);
assert.deepEqual(reconciliation.scope, [
  '/reality-entry','/reality-reconstruction','/reality-reading','/reality-navigation','/reality-review','/my-reality'
]);

console.log('✓ LOGO-W2 Journey Shell Reconciliation passed: 6 journey surfaces + runtime sidebar + favicon, resolver-bound and fail-closed.');
