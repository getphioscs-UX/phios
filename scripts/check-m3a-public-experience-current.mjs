import assert from 'node:assert/strict';
import fs from 'node:fs';
import {parseHTML} from 'linkedom';
import {consolidationSuccessor,assertCurrentConsolidatedSurface} from './lib/page-consolidation-successor-r1.mjs';

const read = file => fs.readFileSync(file, 'utf8').replace(/^\uFEFF/, '').replace(/\r\n?/g, '\n');
const json = file => JSON.parse(read(file));

function exploreAboutDestination(source = read('explore/index.html')) {
  assert(source.includes('href="https://www.getphios.com/about/founder/"'), 'Explore canonical About destination missing');
  assert(source.includes('src="/assets/js/explore-about-compat.js"'), 'Explore compatibility runtime missing');
  const runtime = read('assets/js/explore-about-compat.js');
  assert(runtime.includes("location.replace('/about/founder/'"), 'Explore About routing missing');
  assert(runtime.includes("new Set(['why','how','start','faq'])"));
  assert(runtime.includes("allowed.has(id)?'#'+id:''"), 'Explore bounded anchor routing missing');
  const target = read('about/founder/index.html');
  assert(target.includes('/assets/js/public-shell.js'), 'About destination shell missing');
  assert.equal(target.includes('/assets/js/public-shell-v2.js'), false);
  for (const anchor of ['why', 'how', 'start', 'faq']) assert(target.includes(`id="${anchor}"`), `About destination anchor missing: ${anchor}`);
  return target;
}

const deletePlan = json('content/customer-experience-rebuild/migration/p1-legacy-delete-plan-v2.json');
const homepage = json('content/customer-experience-rebuild/authority/homepage-customer-composition-v1.json');
const explore = json('content/customer-experience-rebuild/authority/explore-customer-experience-v1.json');
const knowledge = json('content/customer-experience-rebuild/authority/knowledge-customer-experience-v1.json');
const redirects = read('_redirects');

assert.equal(deletePlan.status, 'PHYSICAL_LEGACY_PRESENTATION_DELETE_COMPLETE');
assert.equal(homepage.status, 'HOMEPAGE_EIGHT_VOLUME_IDENTITY_ALIGNED');
assert.equal(explore.invariants.singleCustomerShell, true);
assert.equal(knowledge.invariants.singleCustomerShell, true);

const currentPages = [
  'index.html',
  'about/index.html',
  'explore/index.html',
  'explore/why-phios/index.html',
  'explore/how-it-works/index.html',
  'explore/start/index.html',
  'knowledge/index.html',
  'search/index.html',
  'articles/index.html',
  'books/index.html',
  'figures/index.html',
  'knowledge/concepts/index.html',
  'knowledge/ask/index.html',
  'reality/index.html',
  'perspectives/index.html',
  'perspectives/personal/index.html'
];
for (const page of currentPages) {
  assert.equal(fs.existsSync(page), true, `Current customer surface missing: ${page}`);
  const source = read(page);
  if (page === 'explore/index.html') {
    exploreAboutDestination(source);
    assert.equal(source.includes('/assets/js/public-shell-v2.js'), false);
    continue;
  }
  const successor=consolidationSuccessor()?.surfaces.find(s=>s.file===page);
  if(successor?.redirect){
    const {document}=parseHTML(source);
    assertCurrentConsolidatedSurface(document,page);
    assert(source.includes('/assets/customer-ui/js/surfaces/page-consolidation-redirect.js'),`${page}: redirect runtime missing`);
    const [route,anchor]=successor.redirect.split('#');
    const target=route==='/explore/'?exploreAboutDestination():read(route.slice(1)+'index.html');
    if(route!=='/explore/')assert(target.includes('/assets/customer-ui/js/shell.js'),`${page}: destination shell missing`);
    assert(target.includes(`id="${anchor}"`),`${page}: destination anchor missing`);
    assert.equal(source.includes('/assets/js/public-shell-v2.js'),false);
    continue;
  }
  assert.ok(source.includes('/assets/customer-ui/js/shell.js'), `${page} must consume the current customer shell`);
  assert.equal(source.includes('/assets/js/public-shell-v2.js'), false, `${page} reintroduced the predecessor shell`);
}

const retiredFiles = [
  ...deletePlan.candidates.map(candidate => candidate.path),
  'about.html',
  'explore.html',
  'about/why-phios/index.html',
  'articles.html',
  'figures.html',
  'glossary.html',
  'books/reality-maintenance/index.html',
  'readings/symbolic/index.html',
  'professional/human-design/index.html',
  'customer-ui-preview/index.html',
  'customer-shell-preview/index.html',
  'assets/css/atlas.css',
  'assets/css/free-explore.css',
  'assets/css/platform.css',
  'assets/customer-ui/surfaces/preview.css',
  'assets/js/pages/atlas-knowledge-upgrade.js',
  'assets/js/pages/atlas.js',
  'assets/js/pages/figures.js',
  'assets/js/pages/free-explore.js',
  'assets/js/pages/glossary.js',
  'tools/review/ZIWEI-PRO-R2-W16-HUMAN-REVIEW.html'
];
for (const file of new Set(retiredFiles)) {
  assert.equal(fs.existsSync(file), false, `Retired artifact must remain physically absent: ${file}`);
}

for (const rule of [
  '/about.html /about/founder/ 308',
  '/explore.html /about/founder/ 308',
  '/about/ /about/founder/ 308',
  '/explore/ /about/founder/ 308',
  '/explore/why-phios/ /about/founder/#why 308',
  '/explore/how-it-works/ /about/founder/#how 308',
  '/explore/start/ /about/founder/#start 308',
  '/articles.html /articles/ 308',
  '/figures.html /figures/ 308',
  '/glossary.html /knowledge/concepts/ 308',
  '/books/reality-maintenance/ /books/reality-continuity/ 308',
  '/readings/symbolic/ /perspectives/ 308',
  '/professional/human-design /perspectives/personal/ 308'
]) assert.ok(redirects.includes(rule), `Retired route compatibility redirect missing: ${rule}`);

const home = read('index.html');
const consolidatedHome=consolidationSuccessor()?.surfaces.some(s=>s.file==='index.html');
if(consolidatedHome)assertCurrentConsolidatedSurface(parseHTML(home).document,'index.html');
for (const href of ['/articles/', '/figures/', '/knowledge/concepts/', '/knowledge/ask/', '/reality/']) {
  const knowledgeDestination=consolidatedHome&&['/articles/','/figures/','/knowledge/concepts/'].includes(href);
  if(knowledgeDestination){assert(home.includes('href="/knowledge/"'),'Homepage knowledge entry missing');assert(read('knowledge/index.html').includes(`href="${href}"`),`Knowledge is missing canonical destination ${href}`);}
  else assert.ok(home.includes(`href="${href}"`), `Homepage is missing canonical destination ${href}`);
}
for (const retiredHref of ['/figures.html', '/glossary.html', '/ask.html', '/personal-runtime.html', '/my-reality.html']) {
  assert.equal(home.includes(`href="${retiredHref}"`), false, `Homepage retained retired route ${retiredHref}`);
}

assert.equal(read('wrangler.jsonc').includes('"binding": "RUNTIME_DB"'), true, 'Runtime D1 binding changed');
console.log('✓ M3A current public experience passed: canonical CX surfaces are present and retired presentation artifacts remain physically absent.');
console.log('  Compatibility is redirect-only; current pages no longer depend on retired HTML, preview CSS or predecessor page controllers.');
