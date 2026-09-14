import fs from 'node:fs';
import assert from 'node:assert/strict';

const ORIGIN = 'https://getphios.com';
const WWW = 'https://www.getphios.com';
const PAGES = 'https://phios-github.pages.dev';

const read = path => fs.readFileSync(path, 'utf8');
const mustExist = path => assert.ok(fs.existsSync(path), `MISSING:${path}`);

const fetchManual = async (url, timeoutMs = 15000) => {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, {
      redirect: 'manual',
      signal: controller.signal,
      headers: { 'user-agent': 'PHI-OS-POC-B12-ACCEPTANCE/1.0' }
    });
  } finally {
    clearTimeout(timer);
  }
};

const locationOf = res => res.headers.get('location') || '';

const assertRedirect = async (source, expectedPrefix) => {
  const res = await fetchManual(source);
  assert.ok([301, 308].includes(res.status), `${source} expected 301/308, got ${res.status}`);
  const loc = new URL(locationOf(res), source).href;
  assert.ok(loc.startsWith(expectedPrefix), `${source} redirected to unexpected ${loc}`);
  return { source, status: res.status, location: loc };
};

const assert200 = async url => {
  const res = await fetchManual(url);
  assert.equal(res.status, 200, `${url} expected 200, got ${res.status}`);
  return res;
};

const run = async () => {
  console.log('POC-B7–B12 Final Production Successor Acceptance');

  // Static B5 / B8 / B9 boundaries.
  for (const path of [
    'robots.txt',
    'sitemap.xml',
    '_headers',
    '_redirects',
    'articles/why-phi-os-is-needed.html',
    'articles/why-explanation-does-not-equal-understanding.html',
    'articles/why-navigation-begins-with-reality-position.html',
    'content/production/closure/poc-b7-b12-final-production-successor-v1.json'
  ]) mustExist(path);

  const robots = read('robots.txt');
  assert.match(robots, /Sitemap:\s*https:\/\/getphios\.com\/sitemap\.xml/i);

  const sitemap = read('sitemap.xml');
  assert.ok(sitemap.includes('https://getphios.com/'), 'sitemap missing canonical origin');
  assert.ok(!sitemap.includes('phios-github.pages.dev'), 'sitemap still exposes pages.dev');
  assert.ok(!sitemap.includes('www.getphios.com'), 'sitemap must not expose www origin');
  for (const retired of [
    '/knowledge-search',
    '/financial-reality',
    '/professional/personal-runtime/',
    '/services'
  ]) {
    assert.ok(!sitemap.includes(`https://getphios.com${retired}`), `retired route still in sitemap: ${retired}`);
  }

  for (const [path, canonical] of [
    ['articles/why-phi-os-is-needed.html', `${ORIGIN}/articles/why-phi-os-is-needed`],
    ['articles/why-explanation-does-not-equal-understanding.html', `${ORIGIN}/articles/why-explanation-does-not-equal-understanding`],
    ['articles/why-navigation-begins-with-reality-position.html', `${ORIGIN}/articles/why-navigation-begins-with-reality-position`]
  ]) {
    assert.ok(read(path).includes(`rel="canonical" href="${canonical}"`), `wrong canonical: ${path}`);
  }

  const headers = read('_headers');
  for (const required of [
    'X-Content-Type-Options: nosniff',
    'Referrer-Policy: strict-origin-when-cross-origin',
    'Permissions-Policy:',
    'Content-Security-Policy:'
  ]) assert.ok(headers.includes(required), `missing production header: ${required}`);

  // B7 hostname closure.
  const hostnameEvidence = [];
  hostnameEvidence.push(await assertRedirect(`${WWW}/`, `${ORIGIN}/`));
  hostnameEvidence.push(await assertRedirect(`${WWW}/books/reality-formation?probe=poc-b12`, `${ORIGIN}/books/reality-formation`));
  hostnameEvidence.push(await assertRedirect(`${PAGES}/`, `${ORIGIN}/`));
  hostnameEvidence.push(await assertRedirect(`${PAGES}/knowledge/ask/?probe=poc-b12`, `${ORIGIN}/knowledge/ask/`));

  // B9 live robots / sitemap.
  const liveRobots = await assert200(`${ORIGIN}/robots.txt`);
  const liveRobotsText = await liveRobots.text();
  assert.ok(liveRobotsText.includes(`Sitemap: ${ORIGIN}/sitemap.xml`), 'live robots sitemap authority mismatch');

  const liveSitemap = await assert200(`${ORIGIN}/sitemap.xml`);
  const liveSitemapText = await liveSitemap.text();
  assert.ok(liveSitemapText.includes(`${ORIGIN}/`), 'live sitemap missing canonical origin');
  assert.ok(!liveSitemapText.includes('phios-github.pages.dev'), 'live sitemap still exposes pages.dev');

  // B10 public route acceptance.
  const routes = [
    '/',
    '/explore/',
    '/about/',
    '/knowledge/',
    '/knowledge/ask/',
    '/articles',
    '/books',
    '/reality/',
    '/perspectives/',
    '/perspectives/personal/',
    '/perspectives/relationship/',
    '/professional/',
    '/professional/financial/',
    '/academy'
  ];

  const routeEvidence = [];
  for (const route of routes) {
    const res = await assert200(`${ORIGIN}${route}`);
    routeEvidence.push({ route, status: res.status });
  }

  // Explicitly make sure canonical origin is not redirecting away.
  const root = await fetchManual(`${ORIGIN}/`);
  assert.equal(root.status, 200, `canonical origin must serve 200, got ${root.status}`);

  const evidence = JSON.parse(read('content/production/closure/poc-b7-b12-final-production-successor-v1.json'));
  assert.equal(evidence.baselineCommit, '10295c965663e36f397e93c4ed3149a053426614');
  assert.equal(evidence.canonicalOrigin, ORIGIN);

  console.log('✓ POC-B7 Legacy hostname closure passed');
  console.log('✓ POC-B8 Security / headers production boundary passed');
  console.log('✓ POC-B9 Search / canonical acceptance passed');
  console.log(`✓ POC-B10 Production route acceptance passed (${routes.length}/${routes.length})`);
  console.log('✓ POC-B11 Production evidence freeze eligible');
  console.log('✓ POC-B12 FINAL PRODUCTION SUCCESSOR ACCEPTANCE');
  console.log('');
  console.log('GETPHIOS_PRODUCTION_SUCCESSOR=ACCEPTED');
  console.log('CANONICAL_ORIGIN=https://getphios.com');
  console.log('WWW=RETIRED_TO_301_SUCCESSOR');
  console.log('PAGES_DEV=RETIRED_TO_301_SUCCESSOR');
  console.log('WIX=DOMAIN_HISTORY_ONLY');
  console.log('PUBLIC_SEARCH_AUTHORITY=getphios.com');
  console.log('PRODUCTION_RUNTIME=CLOUDFLARE_PAGES');
};

run().catch(error => {
  console.error('POC-B7–B12 FAILED');
  console.error(error?.stack || error);
  process.exit(1);
});
