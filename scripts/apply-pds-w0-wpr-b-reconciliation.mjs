import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const checkerPath = path.join(root, 'scripts/check-pds-w0-baseline-boundary.mjs');
const registryPath = path.join(root, 'content/registry/pds-w0-post-freeze-protected-path-additions-v1.json');

assert.ok(fs.existsSync(checkerPath), 'PDS-W0 checker not found.');
assert.ok(fs.existsSync(registryPath), 'PDS-W0 post-freeze authorization registry not found.');

let source = fs.readFileSync(checkerPath, 'utf8').replace(/^\uFEFF/, '').replace(/\r\n?/g, '\n');

const marker = "pds-w0-post-freeze-protected-path-additions-v1.json";
if (source.includes(marker)) {
  console.log('✓ PDS-W0/WPR-B reconciliation already applied.');
  process.exit(0);
}

const anchor1 = "const fixture = await readJson(deliverables[1]);\n";
assert.ok(source.includes(anchor1), 'PDS_W0_RECONCILIATION_ANCHOR_1_NOT_FOUND');

const insert1 = `${anchor1}const postFreezeAdditions = await readJson(\n  'content/registry/pds-w0-post-freeze-protected-path-additions-v1.json'\n);\nassert.equal(postFreezeAdditions.status, 'canonical');\nassert.equal(postFreezeAdditions.authorizationMode, 'ADD_ONLY_EXACT_GIT_BLOB');\nassert.equal(postFreezeAdditions.pdsBaseline.commit, contract.baseline.commit);\n`;

source = source.replace(anchor1, insert1);

const anchor2 = `      if (authorisedAdditions) changed = '';\n    }\n  }\n  assert.equal(changed, '', \`Protected PDS-W0 path changed: \${protectedPath}\`);\n`;

assert.ok(source.includes(anchor2), 'PDS_W0_RECONCILIATION_ANCHOR_2_NOT_FOUND');

const replacement2 = `      if (authorisedAdditions) changed = '';\n    }\n\n    // Independent post-PDS Runtime phases may add new files inside a protected\n    // path only when the addition is explicitly registered and the current Git\n    // blob is byte-identical to the authorised blob. This does not reopen the\n    // frozen PDS baseline and never permits modification/deletion of baseline files.\n    if (changed) {\n      const changedFiles = changed.split('\\n').filter(Boolean);\n      const authorisedEntries = new Map(\n        postFreezeAdditions.entries\n          .filter(entry => entry.protectedPath === protectedPath && entry.immutable === true)\n          .map(entry => [entry.path, entry])\n      );\n      const authorisedRuntimeAdditions = changedFiles.length > 0 &&\n        changedFiles.every(file => {\n          if (baselineFiles.includes(file)) return false;\n          const entry = authorisedEntries.get(file);\n          if (!entry) return false;\n          try {\n            return git(['hash-object', file]) === entry.gitBlobSha;\n          } catch {\n            return false;\n          }\n        });\n      if (authorisedRuntimeAdditions) changed = '';\n    }\n  }\n  assert.equal(changed, '', \`Protected PDS-W0 path changed: \${protectedPath}\`);\n`;

source = source.replace(anchor2, replacement2);

fs.writeFileSync(checkerPath, source, 'utf8');

console.log('✓ PDS-W0/WPR-B protected-path reconciliation applied.');
console.log('✓ Frozen PDS baseline remains unchanged.');
console.log('✓ Only registered add-only exact-blob Runtime additions may pass.');
console.log('✓ WPR-B asset-resolver.js is authorised by exact Git blob SHA.');
