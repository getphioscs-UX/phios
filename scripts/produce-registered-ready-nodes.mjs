import fs from 'node:fs/promises';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { parseArgs, resolveInside } from './lib/knowledge-production/cli.mjs';
import { compileReadinessSchema, loadKnowledgeInventory, readReadiness, resolveKnowledgeScope, validateReadinessRecord } from './lib/knowledge-production/readiness-system.mjs';
import { evaluateArticleEligibility, ARTICLE_PACKAGE_ROOT } from './lib/knowledge-production/article-package.mjs';
import { latestArticlePackage } from './lib/knowledge-production/article-versioning.mjs';
import { ProductionError, formatError } from './lib/knowledge-production/production-errors.mjs';

const root = process.cwd();
const CONTRACT = 'PHI-OS-PJA-W2F-C3-REGISTERED-READY-PRODUCTION-v1.0.0';

function stableHash(value) {
  return createHash('sha256').update(JSON.stringify(value)).digest('hex');
}

function normalizeScope(positionals, options) {
  return String(options.scope || positionals[0] || 'ALL').toUpperCase();
}

function isRegistered(item) {
  const planned = item.membership?.blueprint?.nodes?.find(node => node.nodeCode === item.nodeCode);
  return planned?.status === 'registered' && item.node?.registryStatus === 'frozen';
}

async function assess(item, locale, schema, outputRoot) {
  try {
    const loaded = await readReadiness(root, item, locale);
    const validation = validateReadinessRecord(item, loaded, schema);
    const eligibility = evaluateArticleEligibility(item, loaded, validation, locale);
    const existing = await latestArticlePackage(root, item.nodeCode, locale, outputRoot);
    return {
      nodeCode: item.nodeCode,
      registered: isRegistered(item),
      eligibility: eligibility.articleProductionEligibility,
      blockingReasons: eligibility.blockingReasons || [],
      existingPackage: existing ? path.relative(root, existing) : null
    };
  } catch (error) {
    if (error.code !== 'READINESS_FILE_NOT_FOUND') throw error;
    return {
      nodeCode: item.nodeCode,
      registered: isRegistered(item),
      eligibility: 'blocked',
      blockingReasons: ['LOCALE_NOT_READY'],
      existingPackage: null
    };
  }
}

async function writeReport(report, reportPath) {
  const target = resolveInside(root, reportPath);
  await fs.mkdir(path.dirname(target), { recursive: true });
  await fs.writeFile(target, `${JSON.stringify(report, null, 2)}\n`, { flag: 'wx' });
  return path.relative(root, target);
}

async function main() {
  const { positionals, options } = parseArgs(process.argv.slice(2), 0);
  if (options.force) {
    throw new ProductionError('FORCE_NOT_ALLOWED', 'C3 production never overwrites an existing governed Draft Package.');
  }
  const scope = normalizeScope(positionals, options);
  const locale = options.locale || 'zh-Hans';
  const outputRoot = path.relative(root, resolveInside(root, options.output || ARTICLE_PACKAGE_ROOT));
  const knowledge = await loadKnowledgeInventory(root);
  const records = /^KN-/i.test(scope) && !options.scope
    ? resolveKnowledgeScope(knowledge, { nodeCode: scope })
    : resolveKnowledgeScope(knowledge, { scope });
  const schema = await compileReadinessSchema(root);
  const nodes = [];
  for (const item of records) nodes.push(await assess(item, locale, schema, outputRoot));

  const registered = nodes.filter(node => node.registered);
  const ready = registered.filter(node => node.eligibility === 'eligible');
  const pending = ready.filter(node => !node.existingPackage);
  const existing = ready.filter(node => node.existingPackage);
  const blocked = registered.filter(node => node.eligibility !== 'eligible');
  const report = {
    contract: CONTRACT,
    mode: options.apply ? 'apply' : 'plan',
    scope,
    locale,
    inventoryHash: stableHash(nodes),
    selected: nodes.length,
    registered: registered.length,
    productionReady: ready.length,
    pending: pending.length,
    existing: existing.length,
    blocked: blocked.length,
    produced: 0,
    failed: 0,
    nodes
  };

  if (options.apply) {
    for (const node of pending) {
      const args = ['scripts/produce-canonical-article.mjs', node.nodeCode, '--locale', locale, '--output', outputRoot, '--json-report'];
      const result = spawnSync(process.execPath, args, { cwd: root, encoding: 'utf8', windowsHide: true });
      process.stdout.write(result.stdout || '');
      process.stderr.write(result.stderr || '');
      if (result.status === 0) report.produced += 1;
      else report.failed += 1;
    }
    if (options.report) {
      report.reportPath = await writeReport(report, options.report);
    }
  }

  console.log(`Scope: ${scope}`);
  console.log(`Mode: ${report.mode}`);
  console.log(`Selected: ${report.selected}`);
  console.log(`Registered: ${report.registered}`);
  console.log(`Production Ready: ${report.productionReady}`);
  console.log(`Pending: ${report.pending}`);
  console.log(`Existing: ${report.existing}`);
  console.log(`Blocked: ${report.blocked}`);
  console.log(`Produced: ${report.produced}`);
  console.log(`Failed: ${report.failed}`);
  if (report.reportPath) console.log(`Report: ${report.reportPath}`);
  if (options['json-report']) console.log(JSON.stringify(report, null, 2));
  if (report.failed) process.exitCode = 1;
}

main().catch(error => {
  console.error(formatError(error instanceof ProductionError ? error : error));
  process.exitCode = 2;
});
