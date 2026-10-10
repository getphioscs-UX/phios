import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const FUNCTIONS_ROOT = path.join(ROOT, 'functions');
const POLICY_PATH = path.join(
  ROOT,
  'content/deployment/cloudflare/cloudflare-function-source-deployability-invariant-v1.json'
);

assert.ok(fs.existsSync(FUNCTIONS_ROOT), 'CLOUDFLARE_FUNCTIONS_DIRECTORY_MISSING');
assert.ok(fs.existsSync(POLICY_PATH), 'CLOUDFLARE_FUNCTION_DEPLOYABILITY_POLICY_MISSING');

const policy = JSON.parse(fs.readFileSync(POLICY_PATH, 'utf8'));
assert.equal(policy.status, 'ACTIVE', 'CLOUDFLARE_FUNCTION_DEPLOYABILITY_POLICY_NOT_ACTIVE');
assert.equal(policy.failureMode, 'FAIL_CLOSED', 'CLOUDFLARE_FUNCTION_DEPLOYABILITY_POLICY_NOT_FAIL_CLOSED');
assert.equal(policy.rules?.unsupportedJsonImportAttributesAllowed, false);
assert.equal(policy.rules?.repositoryValidationEqualsLiveVerification, false);
assert.equal(policy.rules?.deploymentRequiredForLiveVerified, true);

const SOURCE_EXTENSIONS = new Set(['.js', '.mjs', '.cjs']);
const violations = [];

const checks = [
  {
    code: 'UNSUPPORTED_JSON_IMPORT_WITH_ATTRIBUTE',
    description: 'Static JSON imports in Pages Functions must not use `with { type: "json" }`.',
    pattern: /\b(?:import|export)\b[\s\S]*?\bfrom\s*['"][^'"\n]+\.json['"]\s+with\s*\{\s*type\s*:\s*['"]json['"]\s*\}/g,
  },
  {
    code: 'UNSUPPORTED_DYNAMIC_JSON_IMPORT_WITH_ATTRIBUTE',
    description: 'Dynamic JSON imports in Pages Functions must not use an import-attributes options object.',
    pattern: /\bimport\s*\(\s*['"][^'"\n]+\.json['"]\s*,\s*\{\s*with\s*:/g,
  },
];

function walk(directory) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const absolute = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      walk(absolute);
      continue;
    }
    if (!SOURCE_EXTENSIONS.has(path.extname(entry.name))) continue;

    const source = fs.readFileSync(absolute, 'utf8');
    const relative = path.relative(ROOT, absolute).replaceAll('\\', '/');

    for (const check of checks) {
      for (const match of source.matchAll(check.pattern)) {
        const line = source.slice(0, match.index).split('\n').length;
        violations.push({
          code: check.code,
          file: relative,
          line,
          description: check.description,
          excerpt: match[0].replace(/\s+/g, ' ').slice(0, 220),
        });
      }
    }
  }
}

walk(FUNCTIONS_ROOT);

if (violations.length > 0) {
  console.error('\n✗ Cloudflare Pages Functions source deployability invariant failed.\n');
  for (const violation of violations) {
    console.error(`  ${violation.code}`);
    console.error(`  ${violation.file}:${violation.line}`);
    console.error(`  ${violation.description}`);
    console.error(`  ${violation.excerpt}\n`);
  }
  console.error('Use a bundler-compatible JSON import in functions/**, for example:');
  console.error("  import registry from './registry.json';");
  console.error('Do not use:');
  console.error("  import registry from './registry.json' with { type: 'json' };\n");
  process.exit(1);
}

console.log('✓ Cloudflare Pages Functions source deployability invariant passed.');
console.log('  functions/**/*.{js,mjs,cjs} contains no prohibited JSON import attributes.');
console.log('  Repository validation remains distinct from DEPLOYED and LIVE_VERIFIED truth.');
