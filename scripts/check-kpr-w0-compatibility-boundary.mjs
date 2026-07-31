import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const root = process.cwd();
const mustNotExist = [
  'content/knowledge/meaning',
  'docs/kmr',
  'scripts/build-kmr-w1-book-i-meaning-inventory.mjs',
  'scripts/check-kmr-w0-meaning-runtime-baseline.mjs',
  'scripts/check-kmr-w1-book-i-meaning-inventory.mjs',
  'PHIOS-KMR-W0-DELTA-MANIFEST.txt',
  'PHIOS-KMR-W1-DELTA-MANIFEST.txt'
];

for (const relativePath of mustNotExist) {
  if (fs.existsSync(path.join(root, relativePath))) {
    throw new Error(`KPR_W0_OBSOLETE_KMR_ARTIFACT_PRESENT: ${relativePath}`);
  }
}

const packageJson = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
for (const scriptName of ['check:kmr-w0', 'knowledge:inventory-book-i', 'check:kmr-w1']) {
  if (Object.hasOwn(packageJson.scripts ?? {}, scriptName)) {
    throw new Error(`KPR_W0_OBSOLETE_KMR_SCRIPT_PRESENT: ${scriptName}`);
  }
}

if (packageJson.scripts?.['check:kpr-w0'] !== 'npm run check:pja-w2f-c3 && node scripts/check-kpr-w0-compatibility-boundary.mjs') {
  throw new Error('KPR_W0_CHECK_CHAIN_INVALID');
}

const boundaryPath = path.join(root, 'docs/kpr/KPR-W0-COMPATIBILITY-RESEARCH-BOUNDARY.md');
const boundary = fs.readFileSync(boundaryPath, 'utf8');
for (const required of [
  'PJA remains the only authoritative',
  'not a production runtime',
  'must not',
  'KPR-W0-v1.0.0-Compatibility-Boundary-Frozen'
]) {
  if (!boundary.includes(required)) throw new Error(`KPR_W0_BOUNDARY_TEXT_MISSING: ${required}`);
}

console.log('✓ KPR-W0 Compatibility Research Boundary passed.');
console.log('  PJA remains the only authoritative Article production, review and publication path.');
console.log('  Experimental KMR Registry, Schema and inventory artifacts are absent.');
console.log('  KPR is non-authoritative, post-review, non-blocking and cannot alter public deployment.');
console.log('  State: KPR-W0-v1.0.0-Compatibility-Boundary-Frozen.');
