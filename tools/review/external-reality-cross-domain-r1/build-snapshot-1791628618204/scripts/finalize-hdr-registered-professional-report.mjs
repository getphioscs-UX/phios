import fs from 'node:fs/promises';
import path from 'node:path';
import { createHdrRegisteredProfessionalFinalReportRuntime } from '../functions/professional/hdr-internal/hdr-registered-professional-final-report-runtime.js';

function arg(name) {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : null;
}
async function readJson(file, label) {
  if (!file) throw new Error(`${label} path is required.`);
  return JSON.parse(await fs.readFile(path.resolve(file), 'utf8'));
}

const internalPath = arg('--internal');
const completionPath = arg('--completion');
const accessPath = arg('--access');
const outputPath = arg('--output');
if (!outputPath) throw new Error('--output is required.');

const [internalReport, completion, professionalAccess] = await Promise.all([
  readJson(internalPath, '--internal'),
  readJson(completionPath, '--completion'),
  readJson(accessPath, '--access')
]);
const runtime = createHdrRegisteredProfessionalFinalReportRuntime();
const bundle = runtime.finalize({
  internalReport,
  professionalAccess,
  loginAssertion: completion.loginAssertion,
  manualCompletion: completion.manualCompletion,
  finalisation: completion.finalisation
}, { now: completion.finalisation?.signedAt });
await fs.mkdir(path.dirname(path.resolve(outputPath)), { recursive: true });
await fs.writeFile(path.resolve(outputPath), `${JSON.stringify(bundle, null, 2)}\n`, 'utf8');
console.log(`✓ HDR registered Professional final report generated: ${outputPath}`);
console.log('  Registered Professional only · manual HDR completion preserved · no public self-service or automatic client release created.');
