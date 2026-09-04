import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const readText = rel => fs.readFileSync(path.join(root, rel), 'utf8');
const readJson = rel => JSON.parse(readText(rel));
const exists = rel => fs.existsSync(path.join(root, rel));
const BASE = 'content/customer-experience-rebuild';
const BASELINE = 'e7a0e054591cc201b4837a09430890cbd4437415';

const modules = [
  'assets/customer-ui/js/shell.js',
  'assets/customer-ui/js/navigation.js',
  'assets/customer-ui/js/locale.js',
  'assets/customer-ui/js/assets.js',
  'assets/customer-ui/js/dialog.js'
];
for (const rel of modules) assert.equal(exists(rel), true, `missing CX-R5 shell module: ${rel}`);

const shell = readText(modules[0]);
const navigation = readText(modules[1]);
const locale = readText(modules[2]);
const assets = readText(modules[3]);
const dialog = readText(modules[4]);
const components = readText('assets/customer-ui/components.css');
const allShellSources = [shell, navigation, locale, assets, dialog, components].join('\n');

const authority = readJson(`${BASE}/authority/customer-shell-authority-v1.json`);
const contract = readJson(`${BASE}/contracts/customer-shell-interaction-contract-v1.json`);
const acceptance = readJson(`${BASE}/acceptance/cx-r5-acceptance-v2.json`);
const p1CutoverPath = `${BASE}/migration/priority-route-cutover-registry-v2.json`;
const p1Cutover = exists(p1CutoverPath) ? readJson(p1CutoverPath) : null;
const currentAskPath = p1Cutover?.status === 'P1_ROUTE_CUTOVER_COMPLETE_PRODUCTION_BROWSER_ACCEPTANCE_PENDING' ? '/knowledge/ask/' : '/ask';
const ia = readJson(`${BASE}/authority/customer-information-architecture-v1.json`);
const visual = readJson(`${BASE}/authority/customer-visual-asset-registry-v3.json`);

assert.equal(authority.baselineCommit, BASELINE);
assert.equal(contract.baselineCommit, BASELINE);
assert.equal(acceptance.baselineCommit, BASELINE);
assert.equal(authority.status, 'ONE_GLOBAL_CUSTOMER_SHELL_READY');
assert.deepEqual(acceptance.requiredExitStates, ['ONE_GLOBAL_CUSTOMER_SHELL']);
assert.equal(acceptance.rules.readyForCxR6Homepage, true);

// W0/W1 — one shared implementation and the R2-frozen global IA.
assert.deepEqual(authority.primaryNavigation, ia.primaryNavigation);
assert.deepEqual(authority.utilities, ia.utilities);
for (const label of ['Explore', 'My Reality', 'Perspectives', 'Knowledge', 'Professional']) {
  assert.ok(navigation.includes(label), `primary navigation missing ${label}`);
}
for (const label of ['Search', 'Ask PHI OS', 'Account']) assert.ok(navigation.includes(label), `utility navigation missing ${label}`);
for (const forbidden of ['REALITY_JOURNEY', 'READINGS', 'SERVICES', 'ACADEMY', 'REPORTS', 'FINANCIAL', 'BOOKS']) {
  assert.equal(new RegExp(`id:\\s*['\"]${forbidden}['\"]`).test(navigation), false, `forbidden top-level navigation returned: ${forbidden}`);
}

// Canonical brand assets from R4, not a text/legacy brand authority.
for (const assetId of ['LOGO-003', 'LOGO-010']) {
  assert.ok(visual.entries.some(entry => entry.assetId === assetId && entry.available === true), `R4 visual registry missing ${assetId}`);
  assert.ok(shell.includes(`data-cx-asset=\"${assetId}\"`), `shell missing canonical ${assetId}`);
}
assert.equal(allShellSources.includes('public-shell-v2'), false, 'R5 shell references public-shell-v2');
assert.equal(allShellSources.includes('data-puxr-header'), false, 'R5 shell references legacy header injection');
assert.equal(allShellSources.includes('data-puxr-footer'), false, 'R5 shell references legacy footer injection');
assert.equal(allShellSources.includes('Φ'), false, 'R5 shell hard-codes the retired brand mark');

// W2 — a real mobile drawer using the same navigation data and one dialog implementation.
assert.match(shell, /<dialog class=\"cx-shell-drawer cx-shell-drawer--navigation\" id=\"cx-shell-navigation\"/);
assert.match(shell, /data-cx-menu[^>]+data-cx-dialog-open=\"cx-shell-navigation\"[^>]+aria-controls=\"cx-shell-navigation\"/);
assert.match(dialog, /showModal\(\)/);
assert.match(dialog, /opener\.focus\(\{ preventScroll: true \}\)/);
assert.match(dialog, /aria-expanded/);
assert.match(dialog, /phios:dialogopen/);
assert.match(dialog, /phios:dialogclose/);
assert.match(components, /\.cx-shell-drawer::backdrop/);
assert.equal(authority.mobileNavigation.separateMobileNavigationAuthorityCreated, false);

// W3 — Search is a shell entry into the existing operational Search surface, never a second runtime.
assert.match(shell, /action=\"\/search\/\" method=\"get\" role=\"search\"/);
assert.match(shell, /type=\"search\" name=\"q\"/);
assert.equal(/fetch\([^)]*search/i.test(shell), false, 'shell must not fetch or recreate Search');
assert.equal(authority.search.secondSearchAuthorityCreated, false);
assert.equal(contract.rules.shellMayExecuteSearchRuntime, false);

// W4 — Ask is global but hands off to the existing Ask surface/runtime.
assert.match(shell, /id=\"cx-shell-ask\"/);
assert.ok(shell.includes(`action="${currentAskPath}" method="get"`), `shared shell Ask action must use current route ${currentAskPath}`);
assert.match(shell, /textarea[^>]+name=\"q\"/);
assert.equal(shell.includes('/api/customer-ask'), false, 'shell must not execute Ask runtime');
assert.equal(authority.ask.secondAskAuthorityCreated, false);
assert.equal(contract.rules.shellMayExecuteAskRuntime, false);

// W5 — these are presentation states only; they never grant auth/professional capability.
for (const state of ['GUEST', 'AUTHENTICATED', 'PROFESSIONAL']) assert.ok(shell.includes(`${state}:`), `missing account presentation state ${state}`);
assert.equal(authority.accountPresentation.securityDecisionAuthority, false);
assert.equal(authority.accountPresentation.capabilityGrantAuthority, false);
assert.equal(contract.rules.accountStateIsPresentationOnly, true);

// W6 — one meaningful footer uses the R4 footer logo and continuation destinations.
assert.match(shell, /data-cx-shell-region=\"footer\"/);
for (const href of ['/explore/', '/reality/', '/perspectives/', '/knowledge/', '/search/', currentAskPath, '/professional/', '/account/']) {
  const literalHref = `href=\"${href}\"`;
  const footerBinding = `footerLink('${href}'`;
  assert.ok(shell.includes(literalHref) || shell.includes(footerBinding), `shared footer/shell missing continuation destination ${href}`);
}

// W7 — EN/zh-Hans are owned by the single locale module. No page-local toggle is allowed.
assert.match(locale, /zh-Hans/);
assert.match(locale, /phios:localechange/);
assert.equal(authority.locale.pageLocalLocaleToggleAllowed, false);
assert.equal(contract.rules.oneLocaleImplementation, true);
assert.equal(shell.includes('data-cx-locale=\"en\"'), true);
assert.equal(shell.includes('data-cx-locale=\"zh-Hans\"'), true);

// W8 — every current clean-room shell consumer uses the same placeholders/module and no predecessor shell.
const htmlFiles = [];
const walk = dir => {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (['node_modules', '.git', '.wrangler', '.cache'].includes(entry.name)) continue;
    const abs = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(abs);
    else if (entry.name.endsWith('.html')) htmlFiles.push(path.relative(root, abs).replaceAll(path.sep, '/'));
  }
};
walk(root);
const consumers = htmlFiles.filter(rel => readText(rel).includes('/assets/customer-ui/js/shell.js'));
assert.ok(consumers.length >= 10, `unexpectedly small CX shell consumer set: ${consumers.length}`);
for (const rel of consumers) {
  const html = readText(rel);
  assert.match(html, /data-cx-header/, `${rel} missing shared CX header placeholder`);
  assert.match(html, /data-cx-footer/, `${rel} missing shared CX footer placeholder`);
  assert.equal(html.includes('data-puxr-header'), false, `${rel} consumes legacy header injection`);
  assert.equal(html.includes('data-puxr-footer'), false, `${rel} consumes legacy footer injection`);
  assert.equal(html.includes('public-shell-v2'), false, `${rel} imports predecessor public shell`);
  assert.equal(html.includes('data-cx-locale='), false, `${rel} contains page-local locale controls`);
}

const preview = readText('customer-shell-preview/index.html');
assert.match(preview, /data-cx-surface=\"CUSTOMER_SHELL_PREVIEW\"/);
assert.match(preview, /data-cx-phase=\"CX-R5\"/);
assert.match(preview, /data-cx-header/);
assert.match(preview, /data-cx-footer/);
assert.match(preview, /\/assets\/customer-ui\/js\/shell\.js/);
assert.equal(preview.includes('data-puxr-header'), false);
assert.equal(preview.includes('public-shell-v2'), false);

assert.equal(authority.boundaries.backendAuthorityTouched, false);
assert.equal(authority.boundaries.routeCutoverPerformed, false);
assert.equal(authority.boundaries.legacyPhysicalDeletePerformed, false);
assert.equal(acceptance.rules.secondAuthorityCreated, false);

console.log(`✓ CX-R5 Single Customer Shell passed at e7a0e05: ${consumers.length} clean-room shell consumers share one header, primary navigation authority, mobile drawer, Search entry, Ask entry, account presentation, locale implementation and footer.`);
console.log(`✓ Search and Ask remain handoffs to governed surfaces; current Ask destination is ${currentAskPath}; account state is presentation-only and shell still creates no backend or answer authority.`);
console.log('✓ CX-R5 ACCEPTED: ONE_GLOBAL_CUSTOMER_SHELL · READY_FOR_CX_R6_HOMEPAGE');
