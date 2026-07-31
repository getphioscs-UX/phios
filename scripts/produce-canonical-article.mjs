import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { randomUUID } from 'node:crypto';
import {
  ARTICLE_PACKAGE_ROOT,
  evaluateArticleEligibility,
  parseProductionBrief
} from './lib/knowledge-production/article-package.mjs';
import { buildArticleDraftPackage } from './lib/knowledge-production/article-generator.mjs';
import { validateArticleDraftPackage } from './lib/knowledge-production/article-validator.mjs';
import {
  resolveArticleVersion,
  writeArticlePackage
} from './lib/knowledge-production/article-versioning.mjs';
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

function scopeSelection(knowledge, positionals, options) {
  const argument = options.scope || positionals[0];
  if (!argument) {
    throw new ProductionError(
      'NODE_CODE_REQUIRED',
      'A Canonical Node code or knowledge scope is required.'
    );
  }
  if (/^KN-/i.test(argument) && !options.scope) {
    return {
      selection: resolveKnowledgeScope(knowledge, {
        nodeCode: argument.toUpperCase()
      }),
      single: true
    };
  }
  return {
    selection: resolveKnowledgeScope(knowledge, { scope: argument }),
    single: false
  };
}

async function loadEligibility(item, locale, schema) {
  try {
    const loaded = await readReadiness(root, item, locale);
    const assessment = validateReadinessRecord(item, loaded, schema);
    return {
      loaded,
      assessment,
      eligibility: evaluateArticleEligibility(
        item,
        loaded,
        assessment,
        locale
      )
    };
  } catch (error) {
    if (error.code !== 'READINESS_FILE_NOT_FOUND') throw error;
    return {
      loaded: null,
      assessment: null,
      eligibility: {
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
      }
    };
  }
}

async function exportBrief(item, locale) {
  const outputRelative = `.tmp/pja-w2f-b2-brief-${randomUUID()}`;
  const outputDirectory = path.join(root, outputRelative);
  const args = [
    'scripts/export-knowledge-production-brief.mjs',
    item.nodeCode,
    '--locale',
    locale,
    '--output',
    outputRelative
  ];
  try {
    await execFileAsync(process.execPath, args, {
      cwd: root,
      windowsHide: true,
      maxBuffer: 10 * 1024 * 1024
    });
    const suffix = locale === 'zh-Hans' ? '' : `.${locale}`;
    const file = path.join(
      outputDirectory,
      `${item.nodeCode}${suffix}-production-brief.md`
    );
    return parseProductionBrief(await fs.readFile(file, 'utf8'));
  } finally {
    await fs.rm(outputDirectory, { recursive: true, force: true });
  }
}

async function validateGeneratedInTemporaryDirectory(
  generated,
  item,
  locale,
  brief,
  eligibility
) {
  const temporary = await fs.mkdtemp(
    path.join(os.tmpdir(), 'phios-pja-w2f-b2-package-')
  );
  try {
    for (const [name, content] of generated.files) {
      await fs.writeFile(path.join(temporary, name), content);
    }
    const validation = await validateArticleDraftPackage({
      packageDirectory: temporary,
      nodeCode: item.nodeCode,
      locale,
      brief,
      eligibility
    });
    if (!validation.valid) {
      throw new ProductionError(
        'ARTICLE_PACKAGE_INVALID',
        `Generated Article Package failed validation: ${validation.errors.join('; ')}`
      );
    }
  } finally {
    await fs.rm(temporary, { recursive: true, force: true });
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
  let resolved;
  try {
    resolved = scopeSelection(knowledge, positionals, options);
  } catch (error) {
    const requested = options.scope || positionals[0];
    const planned = knowledge.blueprints.some(blueprint => (
      blueprint.nodes?.some(node => node.nodeCode === requested)
    ));
    if (planned) {
      throw new ProductionError(
        'BLUEPRINT_PLANNED_NOT_REGISTERED',
        `${requested} is Blueprint-planned but is not a registered Canonical Node.`
      );
    }
    throw error;
  }
  const schema = await compileReadinessSchema(root);
  const summary = { produced: [], blocked: [], failed: [] };
  for (const item of resolved.selection) {
    try {
      const state = await loadEligibility(item, locale, schema);
      if (state.eligibility.articleProductionEligibility !== 'eligible') {
        console.log(
          `${item.nodeCode} BLOCKED ` +
          state.eligibility.blockingReasons.join(',')
        );
        summary.blocked.push(state.eligibility);
        continue;
      }
      const brief = await exportBrief(item, locale);
      const version = await resolveArticleVersion({
        root,
        nodeCode: item.nodeCode,
        locale,
        productionBriefHash: brief.productionBriefHash,
        outputRoot
      });
      const generated = buildArticleDraftPackage(brief, {
        articleVersion: version.articleVersion
      });
      await validateGeneratedInTemporaryDirectory(
        generated,
        item,
        locale,
        brief,
        state.eligibility
      );
      await writeArticlePackage(version.targetDirectory, generated.files, {
        force: options.force === true,
        existingSameInput: version.existingSameInput,
        existingArticle: version.existingArticle
      });
      console.log(
        `${item.nodeCode} DRAFT CREATED ${path.relative(root, version.targetDirectory)}`
      );
      console.log('Awaiting Human Review');
      summary.produced.push({
        nodeCode: item.nodeCode,
        locale,
        articleVersion: version.articleVersion,
        packagePath: path.relative(root, version.targetDirectory)
      });
    } catch (error) {
      console.log(`${item.nodeCode} FAILED ${error.code || 'UNKNOWN'}`);
      summary.failed.push({
        nodeCode: item.nodeCode,
        code: error.code || 'UNKNOWN',
        message: error.message
      });
    }
  }
  console.log(`Produced: ${summary.produced.length}`);
  console.log(`Blocked: ${summary.blocked.length}`);
  console.log(`Failed: ${summary.failed.length}`);
  if (options['json-report']) {
    console.log(JSON.stringify(summary, null, 2));
  }
  if (summary.failed.length || (resolved.single && summary.blocked.length)) {
    process.exitCode = 1;
  }
}

main().catch(error => {
  console.error(formatError(error));
  process.exitCode = 2;
});

