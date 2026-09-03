import assert from 'node:assert/strict';
import fs from 'node:fs';
import { execFileSync } from 'node:child_process';

const BASELINE = '2cffbc97f9a72c3103780e78c3930f9233a41da0';
const R2_FREEZE_BASELINE = 'f6d31dafdc37dcf3d8f2ebd1236bfa500b7dc64c';
const base = 'content/customer-experience-rebuild';
const read = (p) => fs.readFileSync(p, 'utf8');
const json = (p) => JSON.parse(read(p));

execFileSync(process.execPath, ['scripts/generate-cx-r3-successor.mjs', '--check'], { stdio: 'pipe' });

const design = json(`${base}/authority/customer-design-system-v2.json`);
const registry = json(`${base}/registries/customer-component-registry-v1.json`);
const acceptance = json(`${base}/acceptance/cx-r3-acceptance-v2.json`);
const r2 = json(`${base}/acceptance/cx-r2-acceptance-v2.json`);

for (const artifact of [design, registry, acceptance]) assert.equal(artifact.baselineCommit, BASELINE, 'CX-R3 artifact is not aligned to current main 2cffbc9');
assert.equal(r2.baselineCommit, R2_FREEZE_BASELINE, 'CX-R3 must consume the accepted CX-R2 phase freeze rather than rewriting it to the R3 baseline');
assert.equal(r2.status, 'ACCEPTED_CUSTOMER_IA_AND_ROUTE_AUTHORITY');
assert.equal(r2.rules.readyForCxR3, true);
assert.equal(design.status, 'CUSTOMER_UI_SYSTEM_READY');
assert.equal(design.role, 'PDS_CUSTOMER_IMPLEMENTATION_NOT_SECOND_PDS');
assert.equal(design.upstreamAuthority.rule, 'PDS_REMAINS_UPSTREAM_DESIGN_AUTHORITY');
assert.deepEqual(design.principles, ['quiet','editorial','spacious','precise','premium','human','evidence-aware','non-mystical','non-dashboard-heavy','non-SaaS-template']);

const required = ['tokens.css','base.css','typography.css','layout.css','components.css','motion.css','utilities.css','surfaces/preview.css'];
for (const rel of required) assert.equal(fs.existsSync(`assets/customer-ui/${rel}`), true, `missing CX design-system file ${rel}`);
const cssByFile = Object.fromEntries(required.map((x) => [x, read(`assets/customer-ui/${x}`)]));
const css = Object.values(cssByFile).join('\n');

for (const old of ['.puxr-','.public-','.rs-','.pr-','.px2-','.wpr-','.phi-public-']) assert.equal(css.includes(old), false, `legacy selector leaked into CX-R3 core CSS: ${old}`);
assert.equal(css.includes('!important'), false, 'CX-R3 core CSS may not depend on !important');

// W1 — color authority.
for (const role of ['canvas','surface','surface-raised','ink','ink-muted','border','accent','accent-soft','success','warning','critical','unknown','professional']) {
  assert.ok(cssByFile['tokens.css'].includes(`--cx-color-${role}:`), `missing semantic color role ${role}`);
}
for (const alias of ['--cx-bg:','--cx-surface:','--cx-ink:','--cx-muted:','--cx-line:','--cx-positive:','--cx-danger:']) assert.ok(cssByFile['tokens.css'].includes(alias), `missing shipped-CX compatibility alias ${alias}`);

// W2 — typography tokens; clamp belongs in tokens, never page/type classes.
for (const token of ['display-xl','display-lg','heading-1','heading-2','heading-3','body-lg','body','body-sm','label','caption']) assert.ok(cssByFile['tokens.css'].includes(`--cx-type-${token}:`), `missing typography token ${token}`);
for (const cls of ['.cx-display-xl','.cx-display-lg','.cx-heading-1','.cx-heading-2','.cx-heading-3','.cx-body-lg','.cx-body','.cx-body-sm','.cx-label','.cx-caption']) assert.ok(cssByFile['typography.css'].includes(cls), `missing typography class ${cls}`);
assert.equal(/font-size\s*:\s*clamp\(/i.test(cssByFile['typography.css']), false, 'typography classes must consume tokens instead of defining their own clamp() scales');
assert.equal(/font-size\s*:\s*clamp\(/i.test(cssByFile['surfaces/preview.css']), false, 'preview may not invent a page-specific responsive type scale');

// W3-W5 — spacing, layout, shape.
for (let i = 1; i <= 12; i += 1) assert.ok(cssByFile['tokens.css'].includes(`--cx-space-${i}:`), `missing spacing token space-${i}`);
for (const cls of ['.cx-container','.cx-container--wide','.cx-container--reading','.cx-stack','.cx-cluster','.cx-grid','.cx-split','.cx-sidebar-layout']) assert.ok(cssByFile['layout.css'].includes(cls), `missing layout primitive ${cls}`);
for (const token of ['--cx-radius-sm:','--cx-radius-md:','--cx-radius-lg:','--cx-shadow-1:','--cx-shadow-2:','--cx-border-width:']) assert.ok(cssByFile['tokens.css'].includes(token), `missing shape token ${token}`);

// W6 — six button roles + states.
for (const cls of ['.cx-button--primary','.cx-button--secondary','.cx-button--quiet','.cx-button--text','.cx-button--critical','.cx-button--icon']) assert.ok(cssByFile['components.css'].includes(cls), `missing button role ${cls}`);
for (const state of [':hover',':focus-visible',':disabled','[aria-disabled="true"]','[aria-busy="true"]']) assert.ok(css.includes(state), `missing button/control state ${state}`);

// W7 — cards are semantic rather than one generic white rounded card.
for (const cls of ['.cx-card--content','.cx-card--perspective','.cx-card--reality','.cx-card--navigation-option','.cx-card--evidence','.cx-card--unknown','.cx-card--book','.cx-card--professional','.cx-card--report']) assert.ok(cssByFile['components.css'].includes(cls), `missing semantic card ${cls}`);

// W8 — shared forms.
for (const cls of ['.cx-input','.cx-textarea','.cx-select','.cx-date','.cx-time','.cx-segmented','.cx-radio','.cx-checkbox','.cx-consent','.cx-field-error','.cx-field-helper']) assert.ok(cssByFile['components.css'].includes(cls), `missing form primitive ${cls}`);

// W9 — one status system.
for (const cls of ['.cx-status--available','.cx-status--limited','.cx-status--unavailable','.cx-status--in-review','.cx-status--unknown','.cx-status--needs-attention','.cx-status--professional-required']) assert.ok(cssByFile['components.css'].includes(cls), `missing status ${cls}`);
assert.ok(cssByFile['components.css'].includes('.cx-status::before'), 'status must include a non-text shape cue in addition to its visible label');

// W10 — evidence UI.
for (const cls of ['.cx-evidence','.cx-source','.cx-unknown','.cx-confidence','.cx-assumption','.cx-limitation','.cx-professional-note']) assert.ok(cssByFile['components.css'].includes(cls), `missing evidence primitive ${cls}`);

// W11 — runtime results.
for (const cls of design.resultPrimitives.map((x) => `.${x}`)) assert.ok(cssByFile['components.css'].includes(cls), `missing result primitive ${cls}`);

// W12 — workspace primitives.
for (const cls of registry.groups.workspace.map((x) => `.${x}`)) assert.ok(cssByFile['components.css'].includes(cls), `missing workspace primitive ${cls}`);

// W13 — motion is intentionally bounded.
for (const cls of ['.cx-motion-fade','.cx-motion-reveal','.cx-motion-expand','.cx-motion-drawer','.cx-motion-modal','.cx-motion-stage-transition']) assert.ok(cssByFile['motion.css'].includes(cls), `missing allowed motion primitive ${cls}`);
assert.ok(cssByFile['motion.css'].includes('prefers-reduced-motion: reduce'), 'reduced-motion treatment missing');

// W14 — accessibility baseline.
assert.ok(cssByFile['base.css'].includes(':focus-visible'), 'visible keyboard focus missing');
assert.ok(cssByFile['tokens.css'].includes('--cx-size-control-min: 2.75rem'), '44px minimum control target missing');
assert.ok(cssByFile['base.css'].includes('.cx-skip'), 'skip link primitive missing');

// W15 — preview is R3-only: no legacy CSS, no R4 asset binding and no R5 shell activation.
const preview = read('customer-ui-preview/index.html');
assert.match(preview, /data-cx-surface="CUSTOMER_UI_PREVIEW"/);
assert.match(preview, /data-cx-phase="CX-R3"/);
assert.equal(/assets\/css\//.test(preview), false, 'preview imports legacy stylesheet');
assert.equal(/<style[\s>]/i.test(preview), false, 'preview uses page-local style block');
assert.equal(/\sstyle\s*=/i.test(preview), false, 'preview uses inline page-specific style');
assert.equal(/<script\b/i.test(preview), false, 'R3 preview may not activate an R5 shell/runtime script');
assert.equal(/data-cx-header|data-cx-footer|shell\.js/i.test(preview), false, 'R3 preview may not claim R5 global shell authority');
assert.equal(/data-cx-asset|<img\b/i.test(preview), false, 'R3 preview may not claim R4 canonical visual-asset authority');
for (const label of ['Primary','Secondary','Quiet','Text','Critical','Available','Limited','Unavailable','In Review','Unknown','Needs Attention','Professional Required','Source','Confidence','Assumption','Limitation','Professional note']) assert.ok(preview.includes(label), `preview missing component example: ${label}`);
assert.ok(preview.includes('aria-invalid="true"'), 'form accessibility error example missing');
assert.ok(preview.includes('aria-label="Workspace tabs"'), 'workspace navigation accessible label missing');

assert.equal(registry.status, 'SHARED_CUSTOMER_COMPONENT_PRIMITIVES_FROZEN');
assert.equal(registry.rules.allNewCustomerComponentsUseCxNamespace, true);
assert.equal(registry.rules.methodMayCreateOwnGlobalUiArchitecture, false);
assert.equal(design.phaseBoundaries.backendAuthorityTouched, false);
assert.equal(design.phaseBoundaries.routeAuthorityChangedByR3, false);
assert.equal(design.phaseBoundaries.productionRouteCutoverPerformed, false);
assert.equal(design.phaseBoundaries.legacyPhysicalDeletePerformed, false);
assert.equal(design.phaseBoundaries.r4VisualAssetAuthorityPerformed, false);
assert.equal(design.phaseBoundaries.r5GlobalShellAuthorityPerformed, false);
assert.equal(acceptance.status, 'ACCEPTED_CUSTOMER_DESIGN_SYSTEM');
assert.deepEqual(acceptance.requiredExitStates, ['CUSTOMER_UI_SYSTEM_READY','NO_PAGE_SPECIFIC_DESIGN_AUTHORITY']);
assert.equal(acceptance.rules.readyForCxR4, true);

console.log(`✓ CX-R3 Customer Design System passed at 2cffbc9: ${required.length} clean-room CSS layers, 13 semantic color roles, 10 type roles, 12 spacing steps, 6 button roles, 9 card roles, 7 statuses, 7 result primitives and 8 workspace primitives.`);
console.log('✓ CX-R3 ACCEPTED: CUSTOMER_UI_SYSTEM_READY · NO_PAGE_SPECIFIC_DESIGN_AUTHORITY');
console.log('✓ R3 did not perform R4 visual-asset authority, R5 shell activation, production route cutover, legacy physical deletion or backend-authority creation.');
