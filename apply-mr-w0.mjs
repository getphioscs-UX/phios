import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const expectedRepository = 'getphioscs-UX/phios';
const expectedBranch = 'main';
const expectedBaseline = '38d5f465cdb9a8db140e589f1f41f2e998237ab2';
const expectedScript = 'node scripts/check-mr-w0-method-runtime-constitution.mjs';
const packagePath = 'package.json';
const readmePath = 'README.md';

const newFiles = [
  'docs/method-runtime/MR-W0-METHOD-RUNTIME-CONSTITUTION.md',
  'docs/method-runtime/METHOD-RUNTIME-ARCHITECTURE.md',
  'docs/method-runtime/METHOD-RUNTIME-LAYERS.md',
  'docs/method-runtime/METHOD-RUNTIME-GOVERNANCE.md',
  'docs/method-runtime/METHOD-PLUGIN-CONTRACT.md',
  'content/professional/method-runtime/method-runtime-principles.json',
  'content/professional/method-runtime/method-runtime-boundary.json',
  'content/professional/method-runtime/method-runtime-lifecycle.json',
  'content/professional/method-runtime/method-capability-model.json',
  'content/professional/method-runtime/method-registry.json',
  'content/professional/method-runtime/method-plugin-registry.json',
  'content/professional/method-runtime/method-plugin-contract.schema.json',
  'scripts/check-mr-w0-method-runtime-constitution.mjs',
  'fixtures/mr-w0/valid/human-design.json',
  'fixtures/mr-w0/valid/astrology.json',
  'fixtures/mr-w0/valid/bazi.json',
  'fixtures/mr-w0/invalid/plugin-missing-runtime.json',
  'fixtures/mr-w0/invalid/plugin-ai-calculation.json',
  'fixtures/mr-w0/invalid/plugin-no-authority.json',
  'fixtures/mr-w0/invalid/plugin-no-lifecycle.json'
];

function parseArguments(argv) {
  const result = {
    repositoryRoot: process.cwd(),
    deltaRoot: path.dirname(fileURLToPath(import.meta.url))
  };
  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (argument === '--repository-root' || argument === '--delta-root') {
      const value = argv[index + 1];
      if (!value) throw new Error(`Missing value for ${argument}.`);
      if (argument === '--repository-root') result.repositoryRoot = value;
      else result.deltaRoot = value;
      index += 1;
      continue;
    }
    throw new Error(`Unknown apply argument: ${argument}`);
  }
  result.repositoryRoot = path.resolve(result.repositoryRoot);
  result.deltaRoot = path.resolve(result.deltaRoot);
  return result;
}

function runGit(repositoryRoot, args, allowedStatuses = [0]) {
  const result = spawnSync('git', ['-C', repositoryRoot, ...args], {
    encoding: 'utf8'
  });
  if (result.error) throw result.error;
  if (!allowedStatuses.includes(result.status)) {
    const detail = [result.stdout, result.stderr].filter(Boolean).join('\n').trim();
    throw new Error(
      `Git command failed: git -C "${repositoryRoot}" ${args.join(' ')}` +
        (detail ? `\n${detail}` : '')
    );
  }
  return {
    status: result.status,
    stdout: result.stdout.trim(),
    stderr: result.stderr.trim()
  };
}

function assertInside(root, candidate) {
  const relative = path.relative(root, candidate);
  if (
    relative === '' ||
    relative.startsWith(`..${path.sep}`) ||
    relative === '..' ||
    path.isAbsolute(relative)
  ) {
    if (relative === '') return;
    throw new Error(`Resolved path escapes the approved root: ${candidate}`);
  }
}

function sameFile(first, second) {
  const firstStat = fs.statSync(first);
  const secondStat = fs.statSync(second);
  if (firstStat.size !== secondStat.size) return false;
  return fs.readFileSync(first).equals(fs.readFileSync(second));
}

function controlledReadmeBlock(newLine) {
  return [
    '<!-- MR-W0:BEGIN -->',
    '## MR-W0｜Method Runtime Constitution',
    '',
    'PHASE 30 establishes the single PHI OS Method Runtime Platform at baseline main@38d5f465cdb9a8db140e589f1f41f2e998237ab2.',
    '',
    'All Method implementations register as Plugins and preserve the frozen order:',
    '',
    'Method Definition → Data Authority → Calculation Runtime → Projection Runtime → Interpretation Runtime → Professional Runtime',
    '',
    'Validation:',
    '',
    '    npm run check:mr-w0',
    '',
    'MR-W0 is standalone and is not included in the default check, PJA, Knowledge Runtime, IMR-W0 or HDR-W0 chains.',
    '<!-- MR-W0:END -->'
  ].join(newLine);
}

function buildPackageUpdate(packageText) {
  let packageObject;
  try {
    packageObject = JSON.parse(packageText);
  } catch (error) {
    throw new Error(`package.json is not valid JSON: ${error.message}`);
  }
  if (!packageObject.scripts || typeof packageObject.scripts !== 'object') {
    throw new Error('package.json has no scripts object.');
  }

  const current = packageObject.scripts['check:mr-w0'];
  if (current !== undefined) {
    if (current !== expectedScript) {
      throw new Error(
        `check:mr-w0 already exists with a different command: ${current}`
      );
    }
    return { needsWrite: false, text: packageText, object: packageObject };
  }

  const pattern =
    /(  "scripts": \{[\s\S]*?)(\r?\n  \},\r?\n  "devDependencies": \{)/g;
  const matches = [...packageText.matchAll(pattern)];
  if (matches.length !== 1) {
    throw new Error('The baseline scripts block could not be located uniquely.');
  }
  const match = matches[0];
  const newLine = match[2].startsWith('\r\n') ? '\r\n' : '\n';
  const replacement =
    match[1] +
    ',' +
    newLine +
    '    "check:mr-w0": "node scripts/check-mr-w0-method-runtime-constitution.mjs"' +
    match[2];
  const text =
    packageText.slice(0, match.index) +
    replacement +
    packageText.slice(match.index + match[0].length);

  try {
    packageObject = JSON.parse(text);
  } catch (error) {
    throw new Error(`The package patch produced invalid JSON: ${error.message}`);
  }
  return { needsWrite: true, text, object: packageObject };
}

function assertDefaultChainIsolation(packageObject) {
  for (const scriptName of [
    'check',
    'check:pja',
    'check:knowledge-runtime'
  ]) {
    const command = packageObject.scripts[scriptName];
    if (typeof command !== 'string') {
      throw new Error(`Expected baseline script is missing: ${scriptName}`);
    }
    if (
      command.includes('check:mr-w0') ||
      command.includes('check-mr-w0-method-runtime-constitution.mjs')
    ) {
      throw new Error(`Default-chain conflict: ${scriptName} includes MR-W0.`);
    }
  }
  for (const scriptName of ['check:imr-w0', 'check:hdr-w0']) {
    const command = packageObject.scripts[scriptName];
    if (command === undefined) continue;
    if (typeof command !== 'string') {
      throw new Error(`Invalid optional baseline script: ${scriptName}`);
    }
    if (
      command.includes('check:mr-w0') ||
      command.includes('check-mr-w0-method-runtime-constitution.mjs')
    ) {
      throw new Error(`Default-chain conflict: ${scriptName} includes MR-W0.`);
    }
  }
}

function buildReadmeUpdate(readmeText, newLine) {
  const block = controlledReadmeBlock(newLine);
  const beginMarker = '<!-- MR-W0:BEGIN -->';
  const endMarker = '<!-- MR-W0:END -->';
  const hasBegin = readmeText.includes(beginMarker);
  const hasEnd = readmeText.includes(endMarker);

  if (hasBegin || hasEnd) {
    if (!(hasBegin && hasEnd)) {
      throw new Error('README conflict: only one controlled marker exists.');
    }
    const matches =
      readmeText.match(/<!-- MR-W0:BEGIN -->[\s\S]*?<!-- MR-W0:END -->/g) ?? [];
    if (matches.length !== 1) {
      throw new Error('README conflict: the controlled block is duplicated.');
    }
    if (matches[0] !== block) {
      throw new Error(
        'README conflict: the controlled block exists with different content.'
      );
    }
    return { needsWrite: false, text: readmeText };
  }

  if (readmeText.includes('## MR-W0｜Method Runtime Constitution')) {
    throw new Error('README conflict: an uncontrolled MR-W0 heading already exists.');
  }

  if (readmeText.length === 0) {
    return { needsWrite: true, text: block + newLine };
  }
  const separator = readmeText.endsWith('\n') ? newLine : newLine + newLine;
  return {
    needsWrite: true,
    text: readmeText + separator + block + newLine
  };
}

function main() {
  const { repositoryRoot, deltaRoot } = parseArguments(process.argv.slice(2));
  if (!fs.existsSync(repositoryRoot) || !fs.statSync(repositoryRoot).isDirectory()) {
    throw new Error(`Repository root does not exist: ${repositoryRoot}`);
  }
  if (!fs.existsSync(deltaRoot) || !fs.statSync(deltaRoot).isDirectory()) {
    throw new Error(`Delta root does not exist: ${deltaRoot}`);
  }

  const topLevel = path.resolve(
    runGit(repositoryRoot, ['rev-parse', '--show-toplevel']).stdout
  );
  if (topLevel !== repositoryRoot) {
    throw new Error(
      `Repository root must be the Git top level. Resolved: ${topLevel}`
    );
  }

  const branch = runGit(repositoryRoot, ['branch', '--show-current']).stdout;
  if (branch !== expectedBranch) {
    throw new Error(
      `Baseline conflict: expected branch ${expectedBranch}, found ${branch}.`
    );
  }
  const head = runGit(repositoryRoot, ['rev-parse', 'HEAD']).stdout;
  if (head !== expectedBaseline) {
    throw new Error(
      `Baseline conflict: expected ${expectedBaseline}, found ${head}.`
    );
  }
  const origin = runGit(repositoryRoot, ['remote', 'get-url', 'origin']).stdout;
  if (!/getphioscs-UX[\\/]phios(?:\.git)?$/.test(origin)) {
    throw new Error(
      `Repository conflict: expected ${expectedRepository} origin, found ${origin}.`
    );
  }

  const copyPlan = [];
  for (const relativePath of newFiles) {
    const source = path.resolve(deltaRoot, relativePath);
    const target = path.resolve(repositoryRoot, relativePath);
    assertInside(deltaRoot, source);
    assertInside(repositoryRoot, target);
    if (!fs.existsSync(source) || !fs.statSync(source).isFile()) {
      throw new Error(`Delta is incomplete. Missing source: ${relativePath}`);
    }
    if (fs.existsSync(target)) {
      if (!fs.statSync(target).isFile() || !sameFile(source, target)) {
        throw new Error(`Target conflict: existing file differs: ${relativePath}`);
      }
      continue;
    }
    copyPlan.push({ relativePath, source, target });
  }

  const packageFullPath = path.resolve(repositoryRoot, packagePath);
  assertInside(repositoryRoot, packageFullPath);
  if (!fs.existsSync(packageFullPath) || !fs.statSync(packageFullPath).isFile()) {
    throw new Error('package.json is missing.');
  }
  const packageOriginal = fs.readFileSync(packageFullPath);
  const packageResult = buildPackageUpdate(packageOriginal.toString('utf8'));
  if (packageResult.needsWrite) {
    const diff = runGit(
      repositoryRoot,
      ['diff', '--quiet', '--', packagePath],
      [0, 1]
    );
    if (diff.status === 1) {
      throw new Error('package.json already has uncommitted changes.');
    }
  }
  assertDefaultChainIsolation(packageResult.object);

  const readmeFullPath = path.resolve(repositoryRoot, readmePath);
  assertInside(repositoryRoot, readmeFullPath);
  const readmeOriginalExists =
    fs.existsSync(readmeFullPath) && fs.statSync(readmeFullPath).isFile();
  const readmeOriginal = readmeOriginalExists
    ? fs.readFileSync(readmeFullPath)
    : null;
  const readmeText = readmeOriginal?.toString('utf8') ?? '';
  const detectedNewLine = readmeText.includes('\r\n') ? '\r\n' : os.EOL;
  const readmeResult = buildReadmeUpdate(readmeText, detectedNewLine);

  const createdTargets = [];
  let packageWritten = false;
  let readmeWritten = false;

  try {
    for (const item of copyPlan) {
      fs.mkdirSync(path.dirname(item.target), { recursive: true });
      fs.copyFileSync(item.source, item.target, fs.constants.COPYFILE_EXCL);
      createdTargets.push(item.target);
    }
    if (packageResult.needsWrite) {
      fs.writeFileSync(packageFullPath, packageResult.text, 'utf8');
      packageWritten = true;
    }
    if (readmeResult.needsWrite) {
      fs.writeFileSync(readmeFullPath, readmeResult.text, 'utf8');
      readmeWritten = true;
    }
  } catch (error) {
    for (const target of createdTargets.reverse()) {
      if (fs.existsSync(target)) fs.unlinkSync(target);
    }
    if (packageWritten) fs.writeFileSync(packageFullPath, packageOriginal);
    if (readmeWritten) {
      if (readmeOriginalExists) fs.writeFileSync(readmeFullPath, readmeOriginal);
      else if (fs.existsSync(readmeFullPath)) fs.unlinkSync(readmeFullPath);
    }
    throw error;
  }

  const changeCount =
    copyPlan.length +
    Number(packageResult.needsWrite) +
    Number(readmeResult.needsWrite);
  if (changeCount === 0) {
    console.log('✓ MR-W0 delta already applied; no changes required.');
    return;
  }
  console.log('✓ MR-W0 delta applied safely.');
  console.log(`  Baseline: ${expectedBranch}@${expectedBaseline}`);
  console.log(`  New files: ${copyPlan.length}`);
  console.log(`  package.json updated: ${packageResult.needsWrite}`);
  console.log(`  README.md updated: ${readmeResult.needsWrite}`);
}

try {
  main();
} catch (error) {
  console.error(`MR_W0_APPLY_BLOCKED: ${error.message}`);
  process.exitCode = 1;
}
