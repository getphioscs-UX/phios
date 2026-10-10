import fs from 'node:fs/promises';
import path from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { randomUUID } from 'node:crypto';
import {
  ARTICLE_PACKAGE_ROOT,
  evaluateArticleEligibility,
  parseProductionBrief
} from './lib/knowledge-production/article-package.mjs';
import { validateArticleDraftPackage } from './lib/knowledge-production/article-validator.mjs';
import { latestArticlePackage } from './lib/knowledge-production/article-versioning.mjs';
import { parseArgs, resolveInside } from './lib/knowledge-production/cli.mjs';
import {
  compileReadinessSchema,
  loadKnowledgeInventory,
  readReadiness,
  resolveKnowledgeScope,
  validateReadinessRecord
} from './lib/knowledge-production/readiness-system.mjs';
import {
  formatError,
  ProductionError
} from './lib/knowledge-production/production-errors.mjs';

const execFileAsync = promisify(execFile);
const root = process.cwd();

function select(knowledge, positionals, options) {
  const argument = options.scope || positionals[0];
  if (!argument) {
    throw new ProductionError(
      'NODE_CODE_REQUIRED',
      'A Canonical Node code or knowledge scope is required.'
    );
  }
  if (/^KN-/i.test(argument) && !options.scope) {
    return {
      records: resolveKnowledgeScope(knowledge, {
        nodeCode: argument.toUpperCase()
      }),
      single: true
    };
  }
  return {
    records: resolveKnowledgeScope(knowledge, { scope: argument }),
    single: false
  };
}

async function eligibilityFor(item, locale, schema) {
  try {
    const loaded = await readReadiness(root, item, locale);
    const assessment = validateReadinessRecord(item, loaded, schema);
    return evaluateArticleEligibility(item, loaded, assessment, locale);
  } catch (error) {
    if (error.code !== 'READINESS_FILE_NOT_FOUND') throw error;
    return {
      canonicalNodeCode: item.nodeCode,
      locale,
      registeredState: item.node.registryStatus,
      canonicalThesisState: 'not_ready',
      readinessState: 'locale_not_ready',
      humanEditorialFreeze: false,
      productionState: 'locale_not_ready',
      briefExportState: 'blocked',
      articleProductionEligibility: 'blocked',
      blockingReasons: ['LOCALE_NOT_READY']
    };
  }
}

async function currentBrief(item, locale) {
  const relative = `.tmp/pja-w2f-b2-validation-${randomUUID()}`;
  const directory = path.join(root, relative);
  try {
    await execFileAsync(process.execPath, [
      'scripts/export-knowledge-production-brief.mjs',
      item.nodeCode,
      '--locale',
      locale,
      '--output',
      relative
    ], {
      cwd: root,
      windowsHide: true,
      maxBuffer: 10 * 1024 * 1024
    });
    const suffix = locale === 'zh-Hans' ? '' : `.${locale}`;
    return parseProductionBrief(
      await fs.readFile(
        path.join(
          directory,
          `${item.nodeCode}${suffix}-production-brief.md`
        ),
        'utf8'
      )
    );
  } finally {
    await fs.rm(directory, { recursive: true, force: true });
  }
}

async function main() {
  const { positionals, options } = parseArgs(process.argv.slice(2), 0);
  const locale = options.locale || 'zh-Hans';
  const outputRoot = path.relative(
    root,
    resolveInside(root, options.output || ARTICLE_PACKAGE_ROOT)
  );
  const knowledge = await loadKnowledgeInventory(root);
  const resolved = select(knowledge, positionals, options);
  const schema = await compileReadinessSchema(root);
  const summary = { valid: [], blocked: [], failed: [] };
  for (const item of resolved.records) {
    const eligibility = await eligibilityFor(item, locale, schema);
    if (eligibility.articleProductionEligibility !== 'eligible') {
      console.log(
        `${item.nodeCode} BLOCKED ${eligibility.blockingReasons.join(',')}`
      );
      summary.blocked.push(eligibility);
      continue;
    }
    const packageDirectory = await latestArticlePackage(
      root,
      item.nodeCode,
      locale,
      outputRoot
    );
    if (!packageDirectory) {
      console.log(`${item.nodeCode} FAILED ARTICLE_PACKAGE_NOT_FOUND`);
      summary.failed.push({
        nodeCode: item.nodeCode,
        code: 'ARTICLE_PACKAGE_NOT_FOUND'
      });
      continue;
    }
    const brief = await currentBrief(item, locale);
    const result = await validateArticleDraftPackage({
      packageDirectory,
      nodeCode: item.nodeCode,
      locale,
      brief,
      eligibility
    });
    if (result.valid) {
      console.log(`${item.nodeCode} VALID Awaiting Human Review`);
      summary.valid.push({
        nodeCode: item.nodeCode,
        locale,
        packagePath: path.relative(root, packageDirectory)
      });
    } else {
      console.log(`${item.nodeCode} INVALID ${result.errors.join(',')}`);
      summary.failed.push({
        nodeCode: item.nodeCode,
        code: 'ARTICLE_PACKAGE_INVALID',
        errors: result.errors
      });
    }
  }
  console.log(`Valid: ${summary.valid.length}`);
  console.log(`Blocked: ${summary.blocked.length}`);
  console.log(`Failed: ${summary.failed.length}`);
  if (options['json-report']) console.log(JSON.stringify(summary, null, 2));
  if (summary.failed.length || (resolved.single && summary.blocked.length)) {
    process.exitCode = 1;
  }
}

main().catch(error => {
  console.error(formatError(error));
  process.exitCode = 2;
});

