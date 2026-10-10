import fs from 'node:fs/promises';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { parseArgs, resolveInside } from './lib/knowledge-production/cli.mjs';
import { compileReadinessSchema, readReadiness, validateReadinessRecord } from './lib/knowledge-production/readiness-system.mjs';
import { loadProductionRepository } from './lib/knowledge-production/production-repository.mjs';
import { evaluateArticleEligibility, ARTICLE_PACKAGE_ROOT } from './lib/knowledge-production/article-package.mjs';
import { latestArticlePackage } from './lib/knowledge-production/article-versioning.mjs';
import { ProductionError, formatError } from './lib/knowledge-production/production-errors.mjs';

const root = process.cwd();

function normalizeScope(positionals, options) {
  const raw = options.scope || positionals[0] || 'ALL';
  return String(raw).toUpperCase();
}

async function assess(item, locale, schema, outputRoot) {
  try {
    const loaded = await readReadiness(root, item, locale);
    const assessment = validateReadinessRecord(item, loaded, schema);
    const eligibility = evaluateArticleEligibility(item, loaded, assessment, locale);
    const existing = await latestArticlePackage(root, item.nodeCode, locale, outputRoot);
    return { item, eligibility, existing: existing ? path.relative(root, existing) : null };
  } catch (error) {
    if (error.code !== 'READINESS_FILE_NOT_FOUND') throw error;
    return {
      item,
      eligibility: {
        canonicalNodeCode: item.nodeCode,
        locale,
        articleProductionEligibility: 'blocked',
        blockingReasons: ['LOCALE_NOT_READY']
      },
      existing: null
    };
  }
}

async function main() {
  const { positionals, options } = parseArgs(process.argv.slice(2), 0);
  const scope = normalizeScope(positionals, options);
  const locale = options.locale || 'zh-Hans';
  const outputRoot = path.relative(root, resolveInside(root, options.output || ARTICLE_PACKAGE_ROOT));
  const repository = await loadProductionRepository(root);
  const records = /^KN-/i.test(scope) && !options.scope
    ? [repository.resolveNode(scope)].filter(Boolean)
    : repository.resolveScope(scope);
  const schema = await compileReadinessSchema(root);
  const assessed = [];
  for (const item of records) assessed.push(await assess(item, locale, schema, outputRoot));

  const eligible = assessed.filter(entry => entry.eligibility.articleProductionEligibility === 'eligible');
  const blocked = assessed.filter(entry => entry.eligibility.articleProductionEligibility !== 'eligible');
  const pending = eligible.filter(entry => !entry.existing);
  const existing = eligible.filter(entry => entry.existing);

  const report = {
    contract: 'PHI-OS-PJA-W2F-C2-BATCH-PRODUCTION-v1.0.0',
    mode: options.apply ? 'apply' : 'plan',
    scope,
    locale,
    selected: records.length,
    eligible: eligible.length,
    pending: pending.length,
    existing: existing.length,
    blocked: blocked.length,
    failed: 0,
    nodes: assessed.map(entry => ({
      nodeCode: entry.item.nodeCode,
      eligibility: entry.eligibility.articleProductionEligibility,
      existingPackage: entry.existing,
      blockingReasons: entry.eligibility.blockingReasons || []
    }))
  };

  if (options.apply) {
    const args = ['scripts/produce-canonical-article.mjs', '--scope', scope, '--locale', locale, '--output', outputRoot];
    if (options.force) args.push('--force');
    const result = spawnSync(process.execPath, args, { cwd: root, encoding: 'utf8', windowsHide: true });
    process.stdout.write(result.stdout || '');
    process.stderr.write(result.stderr || '');
    if (result.status !== 0) {
      report.failed = 1;
      if (options['json-report']) console.log(JSON.stringify(report, null, 2));
      process.exitCode = result.status || 1;
      return;
    }
  }

  console.log(`Scope: ${scope}`);
  console.log(`Mode: ${report.mode}`);
  console.log(`Selected: ${report.selected}`);
  console.log(`Eligible: ${report.eligible}`);
  console.log(`Pending: ${report.pending}`);
  console.log(`Existing: ${report.existing}`);
  console.log(`Blocked: ${report.blocked}`);
  console.log(`Failed: ${report.failed}`);
  if (options['json-report']) console.log(JSON.stringify(report, null, 2));
}

main().catch(error => {
  console.error(formatError(error instanceof ProductionError ? error : error));
  process.exitCode = 2;
});
