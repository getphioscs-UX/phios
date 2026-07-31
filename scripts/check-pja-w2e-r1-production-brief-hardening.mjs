import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);
const root = process.cwd();
const temporaryRelative = '.tmp/pja-w2e-r1-check';
const temporary = path.join(root, temporaryRelative);
const exporterPath = path.join(root, 'scripts/export-knowledge-production-brief.mjs');

await fs.rm(temporary, { recursive: true, force: true });
await fs.mkdir(temporary, { recursive: true });
try {
  const exporter = await fs.readFile(exporterPath, 'utf8');
  assert.equal(exporter.includes("'not_defined'"), false);
  assert.equal(exporter.includes('"externalFactRules": "approved"'), false);
  for (const contractMarker of [
    '### Required Distinctions',
    'externalFactDraftRules',
    'futurePublicationGate',
    'supportingQuestionFieldSemantics',
    'figureProductionContract',
    'packageManifestContract',
    'generatedPackageAllowedState',
    'futureHumanPublicationTarget',
    'futurePublicationTargetIsInformationalOnly',
    'mergeSourceReferences'
  ]) assert(exporter.includes(contractMarker), contractMarker);

  const output = `${temporaryRelative}/briefs`;
  const command = await execFileAsync(process.execPath, [
    'scripts/export-knowledge-production-brief.mjs',
    'KN-PREFACE-001',
    '--output', output,
    '--force'
  ], { cwd: root, windowsHide: true });
  assert(command.stdout.includes('BRIEF EXPORTED'));
  const brief = await fs.readFile(
    path.join(temporary, 'briefs/KN-PREFACE-001-production-brief.md'),
    'utf8'
  );
  assert.equal(brief.includes('not_defined'), false);
  assert(brief.includes('### Must Establish'));
  assert(brief.includes('### Required Distinctions'));
  assert(brief.includes('### Must Not Claim'));
  assert(brief.includes('"externalFactDraftRules"'));
  assert(brief.includes('"futurePublicationGate"'));
  assert(brief.includes('"supportingQuestionFieldSemantics"'));
  assert(brief.includes('"figureProductionContract"'));
  assert(brief.includes('"articleFigureBlockAllowed": false'));
  assert(brief.includes('"packageManifestContract"'));
  assert(brief.includes('"checksumAlgorithm": "sha256"'));
  assert(brief.includes('"generatedPackageAllowedState"'));
  assert(brief.includes('"futurePublicationTargetIsInformationalOnly": true'));

  const sourceCodes = [...brief.matchAll(/"sourceCode":\s*"([^"]+)"/g)]
    .map(match => match[1]);
  const availableSection = brief.split('"availableSourceReferences"')[1]
    ?.split('"knownUnresolvedQuestions"')[0] || '';
  const availableCodes = [...availableSection.matchAll(/"sourceCode":\s*"([^"]+)"/g)]
    .map(match => match[1]);
  assert.equal(
    availableCodes.length,
    new Set(availableCodes).size,
    `Duplicate available Source References: ${sourceCodes.join(', ')}`
  );

  const packageJson = JSON.parse(await fs.readFile(path.join(root, 'package.json')));
  assert.equal(
    packageJson.scripts['check:pja-w2e-r1'],
    'npm run check:pja-w2e && node scripts/check-pja-w2e-r1-production-brief-hardening.mjs'
  );

  console.log('✓ PJA-W2E-R1 Production Brief Contract Hardening passed.');
  console.log('  Sentinel values, boundary separation, source deduplication, figure sequencing, package states and Manifest contract are hardened.');
  console.log('  The generated package remains draft-only; final approval and publication states remain human-authority targets.');
} finally {
  await fs.rm(temporary, { recursive: true, force: true });
}
