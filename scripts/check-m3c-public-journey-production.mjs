import assert from 'node:assert/strict';

const configuredBase = (
  process.env.PHIOS_PUBLIC_JOURNEY_BASE_URL ||
  process.env.PHIOS_SMOKE_BASE_URL ||
  ''
).trim();

if (!configuredBase) {
  console.log('✓ M3C-W10 Production Acceptance structure is ready. Set PHIOS_PUBLIC_JOURNEY_BASE_URL after deployment for the live read-only run.');
  process.exit(0);
}

const base = configuredBase.replace(/\/+$/, '');
const routes = [
  { path: '/reality-journey', token: 'id="stage-entry"' },
  { path: '/reality-dashboard', token: 'id="resumeJourney"' },
  { path: '/reality-entry', token: 'id="entryRecoveryGate"' },
  { path: '/reality-reconstruction', token: 'id="reconstructionWorkspace"' },
  { path: '/reality-reading', token: 'id="readingWorkspace"' },
  { path: '/reality-navigation', token: 'id="navigationWorkspace"' },
  { path: '/reality-review', token: 'id="reviewWorkspace"' },
  { path: '/my-reality', token: 'id="memoryWorkspace"' }
];

const assets = [
  '/assets/js/public-shell.js',
  '/assets/js/pages/reality-dashboard.js',
  '/assets/js/reality-entry.js',
  '/assets/js/reconstruction.js',
  '/assets/js/reading.js',
  '/assets/js/navigation.js',
  '/assets/js/review.js',
  '/assets/js/pages/my-reality.js',
  '/assets/css/review-memory-continuity.css'
];

async function fetchText(path) {
  const response = await fetch(`${base}${path}`, {
    redirect: 'follow',
    signal: AbortSignal.timeout(15000),
    headers: { accept: 'text/html,application/javascript,text/css;q=0.9,*/*;q=0.8' }
  });
  assert.equal(
    response.ok,
    true,
    `${path} returned ${response.status}`
  );
  return {
    response,
    text: await response.text()
  };
}

const routeResults = await Promise.all(
  routes.map(async route => ({
    ...route,
    ...(await fetchText(route.path))
  }))
);
for (const result of routeResults) {
  assert.equal(
    result.text.includes(result.token),
    true,
    `${result.path} is missing deployed contract ${result.token}`
  );
  assert.match(
    result.text,
    /name="viewport"/,
    `${result.path} is missing responsive viewport metadata`
  );
}

await Promise.all(assets.map(async asset => {
  const result = await fetchText(asset);
  assert.ok(result.text.length > 100, `${asset} returned an empty asset`);
}));

const status = await fetch(`${base}/api/platform-status`, {
  signal: AbortSignal.timeout(15000),
  headers: { accept: 'application/json' }
});
assert.equal(status.ok, true, `platform-status returned ${status.status}`);
const platform = await status.json();
assert.equal(platform.success, true);
assert.equal(platform.services?.runtimeDatabaseBound, true);

console.log(`✓ M3C-W10 live Public Journey Acceptance passed: ${base}`);
console.log(`  ${routes.length} public Journey routes and ${assets.length} critical assets passed read-only production checks.`);
