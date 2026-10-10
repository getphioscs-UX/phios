import fs from 'node:fs/promises';
import path from 'node:path';
import { createHdrInternalValidationReportRuntime } from '../functions/professional/hdr-internal/hdr-internal-validation-report-runtime.js';

function arg(name) {
  const i = process.argv.indexOf(name);
  return i >= 0 ? process.argv[i + 1] : null;
}
const inputPath = arg('--input');
const outputPath = arg('--output');
if (!inputPath || !outputPath) {
  console.error('Usage: node scripts/generate-hdr-internal-validation-report.mjs --input <request.json> --output <report.json>');
  process.exit(2);
}
const request = JSON.parse(await fs.readFile(path.resolve(inputPath), 'utf8'));
const runtime = createHdrInternalValidationReportRuntime();
const report = await runtime.generate(request);
await fs.mkdir(path.dirname(path.resolve(outputPath)), { recursive: true });
await fs.writeFile(path.resolve(outputPath), `${JSON.stringify(report, null, 2)}\n`, 'utf8');
console.log(`✓ HDR internal validation report generated: ${outputPath}`);
console.log('  INTERNAL_ONLY · professional review required · no client delivery/release authority created.');
