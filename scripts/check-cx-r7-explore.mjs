import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const json = file => JSON.parse(read(file));
const assert = (condition, message) => { if (!condition) throw new Error(`CX_R7_EXPLORE_CHECK_FAILED:${message}`); };
const count = (text, pattern) => (text.match(pattern) || []).length;

const contract = json('content/customer-experience-rebuild/authority/explore-customer-experience-v1.json');
const visual = json('content/customer-experience-rebuild/authority/customer-visual-asset-registry-v3.json');
const redirectRules = read('_redirects').split(/\r?\n/).map(line => line.trim()).filter(line => line && !line.startsWith('#'));
const css = read('assets/customer-ui/surfaces/explore.css');

assert(contract.phase === 'CX-R7', 'PHASE_MISMATCH');
assert(contract.baselineCommit === 'bc6e1591abfecf7baf86488810a5f869b76a392f', 'BASELINE_COMMIT_DRIFT');
assert(contract.invariants.singleCustomerShell === true, 'SINGLE_SHELL_CONTRACT_REQUIRED');
assert(contract.invariants.legacyStylesheets === 0, 'LEGACY_STYLESHEET_CONTRACT_REQUIRED');
assert(contract.invariants.backendAuthorityRebuilt === false, 'SECOND_BACKEND_AUTHORITY_FORBIDDEN');
assert(JSON.stringify(contract.howItWorks) === JSON.stringify(['Understand','Read','Navigate','Act','Review','Continue']), 'HOW_IT_WORKS_CONTRACT_DRIFT');
assert(JSON.stringify(contract.startIntents) === JSON.stringify(['Question','Perspective','Reality','Professional','Learning']), 'START_INTENT_CONTRACT_DRIFT');

const pages = [
  ['explore/index.html', 'EXPLORE'],
  ['explore/why-phios/index.html', 'EXPLORE_WHY'],
  ['explore/how-it-works/index.html', 'EXPLORE_HOW'],
  ['explore/start/index.html', 'EXPLORE_START'],
  ['about/index.html', 'ABOUT']
];
const legacyStyles = [
  '/assets/css/tokens.css', '/assets/css/design/foundation.css', '/assets/css/design/typography.css',
  '/assets/css/design/layout.css', '/assets/css/design/components.css', '/assets/css/public-experience.css',
  '/assets/css/runtime-spine.css', '/assets/css/client-production-surfaces.css', '/assets/css/wpr-public-production.css',
  '/assets/css/free-explore.css', '/assets/css/atlas.css', '/assets/css/phios-public-v2.css'
];
const legacyPrefixes = ['puxr-','public-','rs-','pr-','px2-','wpr-','phi-public-','atlas-','free-explore'];

for (const [file, surface] of pages) {
  const html = read(file);
  assert(html.includes(`data-cx-surface="${surface}"`), `${file}:SURFACE_MARKER_MISSING`);
  assert(count(html, /data-cx-header/g) === 1, `${file}:ONE_HEADER_MOUNT_REQUIRED`);
  assert(count(html, /data-cx-footer/g) === 1, `${file}:ONE_FOOTER_MOUNT_REQUIRED`);
  assert(count(html, /\/assets\/customer-ui\/js\/shell\.js/g) === 1, `${file}:ONE_CUSTOMER_SHELL_REQUIRED`);
  assert(html.includes('/assets/customer-ui/surfaces/explore.css'), `${file}:EXPLORE_STYLESHEET_MISSING`);
  for (const stylesheet of legacyStyles) assert(!html.includes(stylesheet), `${file}:LEGACY_STYLESHEET:${stylesheet}`);
  for (const prefix of legacyPrefixes) assert(!html.includes(`class="${prefix}`) && !html.includes(` ${prefix}`), `${file}:LEGACY_CLASS_NAMESPACE:${prefix}`);
  assert(!/data-i18n=|data-public-|data-puxr-|data-rule-engine=|data-storage-boundary=/.test(html), `${file}:LEGACY_RUNTIME_PRESENTATION_MARKER`);
  assert(count(html, /data-cx-en=/g) >= 10 && count(html, /data-cx-zh=/g) >= 10, `${file}:BILINGUAL_COPY_COVERAGE_TOO_LOW`);
  const visible = html.replace(/<script[\s\S]*?<\/script>/gi,'').replace(/<[^>]+>/g,' ');
  for (const token of ['PJA-W2','PWS-I9','production runtime','canonical registry','governance surface']) assert(!visible.includes(token), `${file}:INTERNAL_COPY:${token}`);
}

const landing = read('explore/index.html');
for (const phrase of ['What is PHI OS?','Why does it exist?','How is it different?','Where do I start?']) assert(landing.includes(phrase), `LANDING_QUESTION_MISSING:${phrase}`);
for (const href of ['/explore/why-phios/','/explore/how-it-works/','/explore/start/','/books/','/articles/','/about/']) assert(landing.includes(`href="${href}"`), `LANDING_ROUTE_MISSING:${href}`);
assert(landing.includes('data-cx-asset="HERO-003"'), 'LANDING_CANONICAL_VISUAL_MISSING');

const why = read('explore/why-phios/index.html');
for (const phrase of ['AI can answer. Reality still has to be navigated.','The gap is not a shortage of answers. It is fragmentation.','FROM SELF-DISCOVERY TO REALITY NAVIGATION']) assert(why.includes(phrase), `WHY_CONTENT_MISSING:${phrase}`);
assert(why.includes('data-cx-asset="ILL-002"'), 'WHY_CANONICAL_VISUAL_MISSING');

const how = read('explore/how-it-works/index.html');
for (const step of ['Understand','Read','Navigate','Act','Review','Continue']) assert(how.includes(`data-cx-en="${step}"`), `HOW_STEP_MISSING:${step}`);
assert(!how.includes('Observe</strong>'), 'HOW_FLOW_MUST_MATCH_R7_CONTRACT');

const start = read('explore/start/index.html');
for (const phrase of ['I have a question','I want another perspective','I need to work through something real','I need professional help','I want to learn the framework']) assert(start.includes(phrase), `START_INTENT_MISSING:${phrase}`);
for (const href of ['/knowledge/ask/','/perspectives/','/reality/','/professional/','/knowledge/']) assert(start.includes(`href="${href}"`), `START_ROUTE_MISSING:${href}`);

const about = read('about/index.html');
for (const phrase of ['Reality first. Understanding before intervention.','Books explain the model. The platform applies it. Academy builds capability.']) assert(about.includes(phrase), `ABOUT_CONTENT_MISSING:${phrase}`);

for (const rule of [
  '/explore /explore/ 308', '/explore.html /explore/ 308',
  '/about/why-phios /explore/why-phios/ 308', '/about/why-phios/ /explore/why-phios/ 308',
  '/about /about/ 308', '/about.html /about/ 308'
]) assert(redirectRules.includes(rule), `COMPATIBILITY_REDIRECT_MISSING:${rule}`);

for (const id of ['HERO-003','ILL-002','HERO-001']) {
  const entry = (visual.entries || []).find(item => item.assetId === id);
  assert(entry?.available === true && entry?.publicUrl, `CANONICAL_ASSET_UNAVAILABLE:${id}`);
}

for (const prefix of legacyPrefixes) assert(!css.includes(`.${prefix}`), `EXPLORE_CSS_LEGACY_NAMESPACE:${prefix}`);
assert(!css.includes('!important'), 'EXPLORE_CSS_IMPORTANT_FORBIDDEN');
assert(!/font-size\s*:\s*clamp\(/i.test(css), 'EXPLORE_PAGE_SPECIFIC_CLAMP_FORBIDDEN');
for (const breakpoint of ['72rem','52rem','30rem']) assert(css.includes(`max-width:${breakpoint}`), `RESPONSIVE_BREAKPOINT_MISSING:${breakpoint}`);
assert(css.includes('prefers-reduced-motion:reduce'), 'REDUCED_MOTION_MISSING');

console.log('✓ CX-R7 Explore Experience passed.');
console.log('  Explore landing + Why PHI OS + How It Works + Start Here + About use the single CX shell and customer design system.');
console.log('  V8 positioning migrated semantically; legacy Explore composition remains compatibility-only behind 308 cutover.');
