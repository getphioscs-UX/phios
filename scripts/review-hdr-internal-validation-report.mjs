import fs from 'node:fs/promises';
import path from 'node:path';
import { createHdrInternalValidationReportRuntime } from '../functions/professional/hdr-internal/hdr-internal-validation-report-runtime.js';

function arg(name) {
  const i = process.argv.indexOf(name);
  return i >= 0 ? process.argv[i + 1] : null;
}
const reportPath = arg('--report');
const reviewPath = arg('--review');
const outputPath = arg('--output');
if (!reportPath || !reviewPath || !outputPath) {
  console.error('Usage: node scripts/review-hdr-internal-validation-report.mjs --report <report.json> --review <review.json> --output <reviewed-report.json>');
  process.exit(2);
}
const report = JSON.parse(await fs.readFile(path.resolve(reportPath), 'utf8'));
const review = JSON.parse(await fs.readFile(path.resolve(reviewPath), 'utf8'));
const runtime = createHdrInternalValidationReportRuntime({
  astronomyAdapter: {
    adapterCode: 'HDR_INTERNAL_SHARED_AST_ASTRONOMY_ADAPTER', adapterVersion: '1.0.0',
    engineCode: 'ASTRONOMY_ENGINE_JS', engineVersion: '2.1.19', licenseCode: 'MIT',
    nodeConvention: 'TRUE_NODE.V1', providerUsed: false, aiUsed: false,
    async calculateLongitudesAt() { throw new Error('REVIEW_MODE_CALCULATION_FORBIDDEN'); },
    async sunLongitudeAt() { throw new Error('REVIEW_MODE_CALCULATION_FORBIDDEN'); }
  }
});
const reviewed = runtime.review(report, review);
await fs.mkdir(path.dirname(path.resolve(outputPath)), { recursive: true });
await fs.writeFile(path.resolve(outputPath), `${JSON.stringify(reviewed, null, 2)}\n`, 'utf8');
console.log(`✓ HDR internal validation report reviewed: ${outputPath}`);
console.log(`  Decision: ${reviewed.review.decision} · still INTERNAL_ONLY · no release authority.`);
