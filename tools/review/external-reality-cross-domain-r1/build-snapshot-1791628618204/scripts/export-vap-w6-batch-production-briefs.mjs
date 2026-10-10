import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import {
  buildVapW6BatchSelection,
  buildVapW6ExportPlan,
  EXISTING_PJA_EXPORTER,
  stableJson,
  VAP_W6_BATCH
} from './lib/visual-article-production/batch-article-selection-production-brief-export-v1.mjs';

const root = process.cwd();

function parseArgs(argv) {
  const result = { locale: 'zh-Hans', jsonReport: true, reportOnly: false };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--locale') result.locale = argv[++i];
    else if (arg === '--no-json-report') result.jsonReport = false;
    else if (arg === '--report-only') result.reportOnly = true;
    else throw new Error(`VAP_W6_UNKNOWN_ARGUMENT:${arg}`);
  }
  return result;
}

function loadJson(relative) {
  return JSON.parse(fs.readFileSync(path.join(root, relative), 'utf8'));
}

const options = parseArgs(process.argv.slice(2));
const storedBatch = loadJson(VAP_W6_BATCH);
const currentBatch = buildVapW6BatchSelection(root);
if (stableJson(storedBatch) !== stableJson(currentBatch)) {
  throw new Error('VAP_W6_BATCH_STALE_RUN_NPM_BUILD_VAP_W6_FIRST');
}

const plan = buildVapW6ExportPlan(root, storedBatch, options.locale);
const report = {
  schemaVersion: 'PHI-OS-VAP-W6-BATCH-PRODUCTION-BRIEF-EXPORT-REPORT-v1.0.0',
  batchCode: plan.batchCode,
  locale: options.locale,
  status: plan.exportReadyNodeCodes.length === 0
    ? 'NO_ELIGIBLE_NODES_NO_BRIEFS_EXPORTED'
    : options.reportOnly
      ? 'REPORT_ONLY_NO_BRIEFS_EXPORTED'
      : 'EXPORT_ATTEMPT_COMPLETED',
  selectedNodeCount: plan.selectedNodeCount,
  eligibleNodeCodes: plan.exportReadyNodeCodes,
  blockedNodeCodes: plan.blockedNodeCodes,
  exporter: EXISTING_PJA_EXPORTER,
  exporterReimplemented: false,
  results: []
};

if (!options.reportOnly) {
  for (const entry of plan.entries) {
    if (!entry.exportReady) {
      report.results.push({
        nodeCode: entry.nodeCode,
        locale: options.locale,
        status: 'SKIPPED_BLOCKED',
        blockers: entry.blockers
      });
      continue;
    }

    const args = [EXISTING_PJA_EXPORTER, entry.nodeCode, '--locale', options.locale];
    if (options.jsonReport) args.push('--json-report');
    const child = spawnSync(process.execPath, args, {
      cwd: root,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe']
    });
    report.results.push({
      nodeCode: entry.nodeCode,
      locale: options.locale,
      status: child.status === 0 ? 'EXPORTED_BY_EXISTING_PJA_EXPORTER' : 'EXPORTER_FAILED',
      exitCode: child.status,
      stdout: child.stdout?.trim() || '',
      stderr: child.stderr?.trim() || ''
    });
    if (child.status !== 0) {
      const outputDir = path.join(root, 'dist/knowledge-production-briefs/batches');
      fs.mkdirSync(outputDir, { recursive: true });
      fs.writeFileSync(path.join(outputDir, `${plan.batchCode}-export-report.json`), stableJson(report), 'utf8');
      process.stderr.write(child.stderr || child.stdout || `Export failed: ${entry.nodeCode}\n`);
      process.exit(child.status || 1);
    }
  }
}

const outputDir = path.join(root, 'dist/knowledge-production-briefs/batches');
fs.mkdirSync(outputDir, { recursive: true });
const reportPath = path.join(outputDir, `${plan.batchCode}-export-report.json`);
fs.writeFileSync(reportPath, stableJson(report), 'utf8');

console.log(`✓ VAP-W6 batch export report: ${path.relative(root, reportPath).replaceAll('\\', '/')}`);
console.log(`✓ Selected: ${plan.selectedNodeCount}; eligible: ${plan.exportReadyNodeCodes.length}; blocked: ${plan.blockedNodeCodes.length}.`);
if (plan.exportReadyNodeCodes.length === 0) {
  console.log('✓ No production briefs were generated because current selected nodes remain governance-blocked.');
}
