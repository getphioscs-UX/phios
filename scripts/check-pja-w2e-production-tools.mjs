import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { sha256 } from './lib/knowledge-production/checksum.mjs';
import {
  DEFAULT_BRIEF_OUTPUT,
  DEFAULT_IMPORT_OUTPUT,
  DEFAULT_VALIDATION_OUTPUT,
  PROTECTED_PATHS
} from './lib/knowledge-production/production-config.mjs';
import { ERROR_CODES } from './lib/knowledge-production/production-errors.mjs';
import { validatePackage } from './lib/knowledge-production/package-validator.mjs';

const execFileAsync = promisify(execFile);
const root = process.cwd();
const temporaryParent = path.join(root, '.tmp');
await fs.mkdir(temporaryParent, { recursive: true });
const temporary = await fs.mkdtemp(path.join(temporaryParent, 'pja-w2e-check-'));
const temporaryRelative = path.relative(root, temporary).split(path.sep).join('/');
const fixtureSource = path.join(root, 'tests/fixtures/knowledge/production-tools');
const fixtures = path.join(temporary, 'fixtures');
const run = async (script, args = []) => {
  try {
    const result = await execFileAsync(process.execPath, [script, ...args], {
      cwd: root,
      windowsHide: true
    });
    return { code: 0, stdout: result.stdout, stderr: result.stderr };
  } catch (error) {
    return {
      code: error.code,
      stdout: error.stdout || '',
      stderr: error.stderr || ''
    };
  }
};
const exists = file => fs.access(file).then(() => true, () => false);
const protectedFiles = [
  'content/knowledge/registry/nodes.json',
  'content/knowledge/registry/learning-paths.json',
  'content/knowledge/registry/localized-content.json',
  'content/knowledge/registry/supporting-questions.json',
  'content/knowledge/blueprints/book-1-knowledge-blueprint.json',
  'content/knowledge/editorial/schemas/canonical-article.schema.json',
  'docs/pja/pja-w2a-canonical-article-editorial-contract-v1.json',
  'content/knowledge/schemas/article-v2.schema.json',
  'content/knowledge/schemas/claim.schema.json',
  'content/knowledge/schemas/source.schema.json',
  'content/knowledge/schemas/article-review.schema.json',
  'content/knowledge/governance/policies/pja-w2c-claim-source-review-policy.json',
  'docs/knowledge/PJA-article-renderer-contract.md'
];
const protectedBaseline = new Map(await Promise.all(protectedFiles.map(async file => [
  file,
  sha256(await fs.readFile(path.join(root, file)))
])));

try {
  await fs.cp(fixtureSource, fixtures, { recursive: true });
  await normalizeTextTree(fixtures);
  const packageJson = JSON.parse(await fs.readFile(path.join(root, 'package.json')));
  assert.equal(packageJson.scripts['knowledge:export-brief'], 'node scripts/export-knowledge-production-brief.mjs');
  assert.equal(packageJson.scripts['knowledge:validate-package'], 'node scripts/validate-canonical-article-package.mjs');
  assert.equal(packageJson.scripts['knowledge:import-package'], 'node scripts/import-canonical-article-package.mjs');
  assert(packageJson.scripts.precheck.includes(
    'node scripts/check-pja-w2e-production-tools.mjs'
  ));
  assert.equal(ERROR_CODES.length, 35);
  for (const code of [
    'CANONICAL_THESIS_NOT_READY', 'PACKAGE_PATH_TRAVERSAL',
    'PACKAGE_SYMLINK_NOT_ALLOWED', 'PACKAGE_CHECKSUM_MISMATCH',
    'PACKAGE_STATUS_FORBIDDEN', 'TARGET_PACKAGE_EXISTS',
    'IMPORT_ATOMIC_WRITE_FAILED'
  ]) assert(ERROR_CODES.includes(code));
  assert.equal(DEFAULT_BRIEF_OUTPUT, 'dist/knowledge-production-briefs');
  assert.equal(DEFAULT_VALIDATION_OUTPUT, 'dist/knowledge-package-validation');
  assert.equal(DEFAULT_IMPORT_OUTPUT, 'dist/knowledge-package-imports');
  assert(PROTECTED_PATHS.includes('content/knowledge/registry'));
  assert(PROTECTED_PATHS.includes('content/knowledge/schemas'));

  const briefOutput = `${temporaryRelative}/briefs`;
  let command = await run('scripts/export-knowledge-production-brief.mjs', [
    'KN-PREFACE-001', '--output', briefOutput
  ]);
  assert.equal(command.code, 0, command.stderr);
  const briefFile = path.join(temporary, 'briefs/KN-PREFACE-001-production-brief.md');
  const brief = await fs.readFile(briefFile, 'utf8');
  assert(brief.includes('人工智能不是脱离文明而独立出现的能力'));
  assert(brief.includes('"nextNode": ['));
  assert(brief.includes('KN-PREFACE-002'));
  assert(brief.includes('"supportingQuestions":'));
  assert(brief.includes(await gitHead()));

  command = await run('scripts/export-knowledge-production-brief.mjs', [
    'KN-PREFACE-001', '--output', briefOutput
  ]);
  assert.notEqual(command.code, 0);
  assert(command.stderr.includes('OUTPUT_ALREADY_EXISTS'));
  command = await run('scripts/export-knowledge-production-brief.mjs', [
    'KN-PREFACE-001', '--output', briefOutput, '--force'
  ]);
  assert.equal(command.code, 0, command.stderr);
  assert(command.stdout.includes('OVERWRITE'));

  command = await run('scripts/export-knowledge-production-brief.mjs', [
    'KN-PREFACE-002', '--output', briefOutput
  ]);
  assert.notEqual(command.code, 0);
  assert(command.stderr.includes('CANONICAL_THESIS_NOT_READY'));
  assert.equal(await exists(path.join(temporary, 'briefs/KN-PREFACE-002-production-brief.md')), false);
  const preface002ReadinessPath = path.join(
    root,
    'content/knowledge/editorial/readiness/kn-preface-002-production-readiness.json'
  );
  if (await exists(preface002ReadinessPath)) {
    const preface002Readiness = JSON.parse(
      await fs.readFile(preface002ReadinessPath, 'utf8')
    );
    assert.equal(
      preface002Readiness.readinessSchemaVersion,
      'PHI-OS-CANONICAL-PRODUCTION-READINESS-v1.0.0'
    );
    assert.equal(preface002Readiness.canonicalThesis.statement, null);
    assert.equal(
      preface002Readiness.productionReadiness.status,
      'production_blocked'
    );
    assert.equal(preface002Readiness.review.humanFrozen, false);
  }

  for (const name of [
    'valid-minimal-package',
    'valid-complete-package',
    'valid-package-without-figure',
    'valid-package-with-unresolved-source',
    'valid-ready-for-human-review-package'
  ]) {
    const result = await validatePackage(root, 'KN-PREFACE-001', path.join(fixtures, name));
    assert.equal(result.valid, true, `${name}: ${JSON.stringify(result.errors)}`);
  }
  const invalid = new Map([
    ['invalid-wrong-node', 'PACKAGE_NODE_MISMATCH'],
    ['invalid-kn-preface-002-without-readiness', 'CANONICAL_THESIS_NOT_READY'],
    ['invalid-forbidden-approved-status', 'PACKAGE_MANIFEST_INVALID'],
    ['invalid-forbidden-published-status', 'PACKAGE_MANIFEST_INVALID'],
    ['invalid-checksum-mismatch', 'PACKAGE_CHECKSUM_MISMATCH'],
    ['invalid-cross-reference-mismatch', 'CROSS_REFERENCE_INVALID']
  ]);
  for (const [name, code] of invalid) {
    const nodeCode = name.includes('kn-preface-002') ? 'KN-PREFACE-002' : 'KN-PREFACE-001';
    const result = await validatePackage(root, nodeCode, path.join(fixtures, name));
    assert.equal(result.valid, false, name);
    assert(result.errors.some(error => error.code === code), `${name} missing ${code}`);
  }

  const securityRoot = path.join(temporary, 'security');
  await fs.cp(path.join(fixtures, 'valid-complete-package'), securityRoot, { recursive: true });
  await fs.writeFile(path.join(securityRoot, 'payload.js'), 'throw new Error("must never execute")');
  let result = await validatePackage(root, 'KN-PREFACE-001', securityRoot);
  assert.equal(result.valid, false);
  assert(result.errors.some(error => error.code === 'PACKAGE_UNKNOWN_FILE'));
  await fs.rm(securityRoot, { recursive: true, force: true });
  await fs.mkdir(securityRoot, { recursive: true });
  try {
    await fs.symlink(path.join(fixtures, 'valid-complete-package/article.zh-Hans.json'), path.join(securityRoot, 'article.zh-Hans.json'));
    result = await validatePackage(root, 'KN-PREFACE-001', securityRoot);
    assert.equal(result.valid, false);
    assert(result.errors.some(error => error.code === 'PACKAGE_SYMLINK_NOT_ALLOWED'));
  } catch (error) {
    if (!['EPERM', 'EACCES', 'UNKNOWN'].includes(error.code)) throw error;
    // Windows and OneDrive may deny symlink creation without Developer Mode.
    // The archive-based symlink fixture below remains mandatory on every platform.
  }
  const traversalZip = path.join(temporary, 'path-traversal.zip');
  await fs.writeFile(traversalZip, storedZip('../escape.json', Buffer.from('{}')));
  result = await validatePackage(root, 'KN-PREFACE-001', traversalZip);
  assert.equal(result.valid, false);
  assert(result.errors.some(error => error.code === 'PACKAGE_PATH_TRAVERSAL'));
  const symlinkZip = path.join(temporary, 'symlink.zip');
  await fs.writeFile(symlinkZip, storedZip('article.zh-Hans.json', Buffer.from('target'), 0o120777));
  result = await validatePackage(root, 'KN-PREFACE-001', symlinkZip);
  assert.equal(result.valid, false);
  assert(result.errors.some(error => error.code === 'PACKAGE_SYMLINK_NOT_ALLOWED'));

  const formalTarget = path.join(root, 'content/knowledge/articles/zh-Hans/KN-PREFACE-001');
  assert.equal(await exists(formalTarget), false);
  command = await run('scripts/import-canonical-article-package.mjs', [
    'KN-PREFACE-001',
    `${temporaryRelative}/fixtures/valid-complete-package`,
    '--report-output',
    `${temporaryRelative}/reports`
  ]);
  assert.equal(command.code, 0, command.stderr);
  assert(command.stdout.includes('DRY RUN'));
  assert(command.stdout.includes('applied: false'));
  assert.equal(await exists(formalTarget), false);

  const targetRoot = `${temporaryRelative}/import-root`;
  command = await run('scripts/import-canonical-article-package.mjs', [
    'KN-PREFACE-001',
    `${temporaryRelative}/fixtures/valid-complete-package`,
    '--apply',
    '--target-root',
    targetRoot,
    '--report-output',
    `${temporaryRelative}/reports`
  ]);
  assert.equal(command.code, 0, command.stderr);
  assert(command.stdout.includes('applied: true'));
  const imported = path.join(
    temporary, 'import-root/content/knowledge/articles/zh-Hans/KN-PREFACE-001'
  );
  assert.equal((await fs.readdir(imported)).length, 6);
  command = await run('scripts/import-canonical-article-package.mjs', [
    'KN-PREFACE-001',
    `${temporaryRelative}/fixtures/valid-complete-package`,
    '--apply',
    '--target-root',
    targetRoot,
    '--report-output',
    `${temporaryRelative}/reports`
  ]);
  assert.notEqual(command.code, 0);
  assert(command.stderr.includes('TARGET_PACKAGE_EXISTS'));

  for (const file of protectedFiles) {
    const current = await fs.readFile(path.join(root, file));
    assert.equal(sha256(current), protectedBaseline.get(file), `Protected file changed during PJA-W2E: ${file}`);
  }
  console.log('✓ PJA-W2E Canonical Article Production Tools passed.');
  console.log('  KN-PREFACE-001 exports a governed brief; KN-PREFACE-002 is blocked with CANONICAL_THESIS_NOT_READY.');
  console.log('  Directory/ZIP package security, Schema validation, cross-file checks and status authority boundaries are enforced.');
  console.log('  Import defaults to dry-run; explicit temporary-root apply is atomic and never overwrites an existing package.');
  console.log('  Registry, Blueprint, W2A–W2D contracts and Renderer remain byte-identical throughout this check.');
} finally {
  await fs.rm(temporary, {
    recursive: true,
    force: true,
    maxRetries: 5,
    retryDelay: 100
  });
}

async function normalizeTextTree(directory) {
  for (const entry of await fs.readdir(directory, { withFileTypes: true })) {
    const absolute = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      await normalizeTextTree(absolute);
    } else if (entry.isFile() && /\.(json|md|txt)$/i.test(entry.name)) {
      const content = await fs.readFile(absolute, 'utf8');
      await fs.writeFile(absolute, content.replace(/\r\n?/g, '\n'), 'utf8');
    }
  }
}

async function gitHead() {
  const { stdout } = await execFileAsync('git', ['rev-parse', 'HEAD'], { cwd: root });
  return stdout.trim();
}

async function gitFile(file) {
  const { stdout } = await execFileAsync('git', ['show', `HEAD:${file}`], {
    cwd: root,
    encoding: 'buffer',
    maxBuffer: 20 * 1024 * 1024
  });
  return stdout;
}

function storedZip(name, content, unixMode = 0o100644) {
  const nameBytes = Buffer.from(name);
  const local = Buffer.alloc(30 + nameBytes.length + content.length);
  local.writeUInt32LE(0x04034b50, 0);
  local.writeUInt16LE(20, 4);
  local.writeUInt32LE(content.length, 18);
  local.writeUInt32LE(content.length, 22);
  local.writeUInt16LE(nameBytes.length, 26);
  nameBytes.copy(local, 30);
  content.copy(local, 30 + nameBytes.length);
  const central = Buffer.alloc(46 + nameBytes.length);
  central.writeUInt32LE(0x02014b50, 0);
  central.writeUInt16LE((3 << 8) | 20, 4);
  central.writeUInt16LE(20, 6);
  central.writeUInt32LE(content.length, 20);
  central.writeUInt32LE(content.length, 24);
  central.writeUInt16LE(nameBytes.length, 28);
  central.writeUInt32LE((unixMode << 16) >>> 0, 38);
  nameBytes.copy(central, 46);
  const eocd = Buffer.alloc(22);
  eocd.writeUInt32LE(0x06054b50, 0);
  eocd.writeUInt16LE(1, 8);
  eocd.writeUInt16LE(1, 10);
  eocd.writeUInt32LE(central.length, 12);
  eocd.writeUInt32LE(local.length, 16);
  return Buffer.concat([local, central, eocd]);
}
