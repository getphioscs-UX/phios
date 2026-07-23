import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const baseUrl = String(
  process.env.PHIOS_SMOKE_BASE_URL || ''
).trim().replace(/\/+$/, '');
const live = Boolean(baseUrl);
if (
  live &&
  !/^https:\/\/[a-z0-9.-]+(?::\d+)?$/i.test(baseUrl) &&
  !/^http:\/\/(?:localhost|127\.0\.0\.1)(?::\d+)?$/i.test(baseUrl)
) {
  throw new Error(
    'PHIOS_SMOKE_BASE_URL must use HTTPS, except for localhost.'
  );
}

const requiredLocalFiles = [
  'index.html',
  'reality-entry.html',
  'reality-reading.html',
  'reality-navigation.html',
  'functions/api/health.js',
  'functions/api/platform-status.js',
  'functions/api/runtime-infrastructure-health.js'
];
for (const file of requiredLocalFiles) {
  assert(
    fs.existsSync(path.join(root, file)),
    `Production smoke prerequisite is missing: ${file}`
  );
}

const healthSource = fs.readFileSync(
  path.join(root, 'functions/api/runtime-infrastructure-health.js'),
  'utf8'
);
for (const token of [
  'RUNTIME_DB',
  'runtime_schema_ready',
  'migration_history_ready',
  "'Cache-Control': 'no-store'"
]) {
  assert(
    healthSource.includes(token),
    `Infrastructure health endpoint is missing: ${token}`
  );
}

if (!live) {
  console.log(
    '✓ M2-W9 Production Smoke structure is ready. ' +
    'Set PHIOS_SMOKE_BASE_URL after deployment for the live read-only run.'
  );
} else {
  async function fetchChecked(route, options = {}) {
    const response = await fetch(`${baseUrl}${route}`, {
      redirect: 'follow',
      signal: AbortSignal.timeout(15000),
      ...options
    });
    const text = await response.text();
    assert(
      response.ok,
      `Production smoke failed: ${route} returned ${response.status}.`
    );
    assert.equal(
      /(?:stack trace|internal server error|uncaught exception)/i.test(text),
      false,
      `Production response exposes an internal error: ${route}`
    );
    return { response, text };
  }

  const health = await fetchChecked('/api/health');
  const healthJson = JSON.parse(health.text);
  assert.equal(healthJson.success, true);
  assert.equal(healthJson.status, 'healthy');

  const platform = await fetchChecked('/api/platform-status');
  const platformJson = JSON.parse(platform.text);
  assert.equal(platformJson.success, true);
  assert.equal(
    platformJson.services?.runtimeDatabaseBound,
    true
  );

  const infrastructure = await fetchChecked(
    '/api/runtime-infrastructure-health'
  );
  const infrastructureJson = JSON.parse(infrastructure.text);
  assert.equal(infrastructureJson.success, true);
  assert.equal(infrastructureJson.status, 'healthy');
  assert.equal(
    infrastructureJson.checks.runtime_database_bound,
    true
  );
  assert.equal(
    infrastructureJson.checks.runtime_database_reachable,
    true
  );
  assert.equal(
    infrastructureJson.checks.runtime_schema_ready,
    true
  );
  assert.equal(
    infrastructureJson.checks.migration_history_ready,
    true
  );
  assert(
    ['runtime_migration_history', 'd1_migrations'].includes(
      infrastructureJson.migration_history_source
    )
  );

  for (const route of [
    '/',
    '/reality-entry',
    '/reality-reading',
    '/reality-navigation'
  ]) {
    const page = await fetchChecked(route);
    assert.match(page.text, /PHI OS/i);
  }

  console.log(
    `✓ M2-W9 live Production Smoke passed: ${baseUrl}`
  );
}
