import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

const root = process.cwd();
const registryPath = path.join(
  root,
  'content/registry/pds-w0-post-freeze-protected-path-additions-v1.json'
);

assert.ok(fs.existsSync(registryPath), 'PDS_W0_POST_FREEZE_REGISTRY_MISSING');

function git(args) {
  return execFileSync('git', args, {
    cwd: root,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe']
  }).trim();
}

function gitObjectExists(spec) {
  try {
    execFileSync('git', ['cat-file', '-e', spec], {
      cwd: root,
      stdio: 'ignore'
    });
    return true;
  } catch {
    return false;
  }
}

const registry = JSON.parse(fs.readFileSync(registryPath, 'utf8'));
assert.equal(registry.status, 'canonical');
assert.equal(registry.authorizationMode, 'ADD_ONLY_EXACT_GIT_BLOB');
assert.equal(
  registry.pdsBaseline?.commit,
  '3311262b377fb1e936fe39cfdd0528e6f3ce3e2e'
);

const sourceCommit = 'a79af8f24608965c9323bd38c4c3ef948c9ce571';
assert.equal(
  git(['rev-parse', `${sourceCommit}^{commit}`]),
  sourceCommit,
  'WPR_C_SOURCE_COMMIT_NOT_AVAILABLE'
);

const additions = [
  {
    path: 'assets/js/runtime/web-production/composition-resolver.js',
    protectedPath: 'assets/js/runtime',
    introducedByRuntime: 'WPR',
    introducedByPhase: 'WPR-C_COMPOSITION_INFRASTRUCTURE',
    introducedByWorks: ['WPR-W11'],
    introducedByCommit: sourceCommit,
    gitBlobSha: '8ec22b86c38fed83aa30fb09a7f427c89bf6de26',
    immutable: true,
    authorityEvidence: [
      'content/web-production/contracts/wpr-canonical-composition-resolution-v1.json',
      'content/web-production/acceptance/wpr-w11-w13-composition-infrastructure-acceptance-v1.json',
      'docs/runtime/WPR-C-W11-W13-COMPOSITION-INFRASTRUCTURE.md'
    ],
    pdsMutationAuthorityGranted: false,
    runtimeAdditionAuthority: 'INDEPENDENT_WPR_RUNTIME_PHASE'
  },
  {
    path: 'assets/js/runtime/web-production/locale-resolver.js',
    protectedPath: 'assets/js/runtime',
    introducedByRuntime: 'WPR',
    introducedByPhase: 'WPR-C_COMPOSITION_INFRASTRUCTURE',
    introducedByWorks: ['WPR-W12'],
    introducedByCommit: sourceCommit,
    gitBlobSha: 'e21aa7ae47883b730557cbc21d831dbf4ba829c4',
    immutable: true,
    authorityEvidence: [
      'content/web-production/contracts/wpr-locale-projection-v1.json',
      'content/web-production/acceptance/wpr-w11-w13-composition-infrastructure-acceptance-v1.json',
      'docs/runtime/WPR-C-W11-W13-COMPOSITION-INFRASTRUCTURE.md'
    ],
    pdsMutationAuthorityGranted: false,
    runtimeAdditionAuthority: 'INDEPENDENT_WPR_RUNTIME_PHASE'
  },
  {
    path: 'assets/js/runtime/web-production/vocabulary-resolver.js',
    protectedPath: 'assets/js/runtime',
    introducedByRuntime: 'WPR',
    introducedByPhase: 'WPR-C_COMPOSITION_INFRASTRUCTURE',
    introducedByWorks: ['WPR-W13'],
    introducedByCommit: sourceCommit,
    gitBlobSha: '63eae597812259925d1a8151819671cdad683549',
    immutable: true,
    authorityEvidence: [
      'content/web-production/contracts/wpr-public-vocabulary-resolution-v1.json',
      'content/web-production/acceptance/wpr-w11-w13-composition-infrastructure-acceptance-v1.json',
      'docs/runtime/WPR-C-W11-W13-COMPOSITION-INFRASTRUCTURE.md'
    ],
    pdsMutationAuthorityGranted: false,
    runtimeAdditionAuthority: 'INDEPENDENT_WPR_RUNTIME_PHASE'
  }
];

for (const entry of additions) {
  const fullPath = path.join(root, entry.path);
  assert.ok(fs.existsSync(fullPath), `WPR_C_AUTHORISED_FILE_MISSING:${entry.path}`);

  assert.equal(
    gitObjectExists(`${registry.pdsBaseline.commit}:${entry.path}`),
    false,
    `WPR_C_FILE_ALREADY_EXISTED_IN_PDS_BASELINE:${entry.path}`
  );

  assert.equal(
    git(['rev-parse', `${sourceCommit}:${entry.path}`]),
    entry.gitBlobSha,
    `WPR_C_SOURCE_BLOB_MISMATCH:${entry.path}`
  );

  assert.equal(
    git(['hash-object', entry.path]),
    entry.gitBlobSha,
    `WPR_C_WORKTREE_BLOB_MISMATCH:${entry.path}`
  );

  for (const evidence of entry.authorityEvidence) {
    assert.ok(
      fs.existsSync(path.join(root, evidence)),
      `WPR_C_AUTHORITY_EVIDENCE_MISSING:${evidence}`
    );
  }
}

registry.entries ??= [];
for (const addition of additions) {
  const existing = registry.entries.find(entry => entry.path === addition.path);
  if (existing) {
    assert.equal(
      JSON.stringify(existing),
      JSON.stringify(addition),
      `WPR_C_EXISTING_AUTHORIZATION_CONFLICT:${addition.path}`
    );
  } else {
    registry.entries.push(addition);
  }
}

registry.entries.sort((a, b) => a.path.localeCompare(b.path));
fs.writeFileSync(
  registryPath,
  JSON.stringify(registry, null, 2) + '\n',
  'utf8'
);

console.log('✓ PDS-W0/WPR-C protected-path reconciliation applied.');
console.log('✓ WPR-W11 composition-resolver exact blob authorised.');
console.log('✓ WPR-W12 locale-resolver exact blob authorised.');
console.log('✓ WPR-W13 vocabulary-resolver exact blob authorised.');
console.log('✓ PDS frozen baseline and existing protected files remain immutable.');
