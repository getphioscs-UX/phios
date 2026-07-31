import fs from 'node:fs/promises';
import path from 'node:path';
import { parseArgs } from './lib/knowledge-production/cli.mjs';
import { formatError, ProductionError } from './lib/knowledge-production/production-errors.mjs';
import {
  compileReadinessSchema,
  initializeReadinessRecord,
  loadKnowledgeInventory,
  READINESS_INDEX_PATH,
  readReadiness,
  readinessPath,
  resolveKnowledgeScope,
  validateReadinessRecord
} from './lib/knowledge-production/readiness-system.mjs';
import { DEFAULT_LOCALE } from './lib/knowledge-production/production-config.mjs';

const root = process.cwd();
const inventoryDocument = 'docs/pja/PJA-W2F-A-CANONICAL-READINESS-INVENTORY.md';
const exists = file => fs.access(file).then(() => true, () => false);

async function main() {
  const { positionals, options } = parseArgs(process.argv.slice(2), 0);
  const nodeCode = positionals[0] || null;
  const scope = options.scope || (nodeCode ? null : 'ALL');
  const locale = options.locale || DEFAULT_LOCALE;
  const knowledge = await loadKnowledgeInventory(root);
  let selection;
  try {
    selection = resolveKnowledgeScope(knowledge, { nodeCode, scope });
  } catch (error) {
    if (
      error.code === 'KNOWLEDGE_SCOPE_EMPTY' &&
      /^(?:PART|BOOK)-\d+$/i.test(scope || '')
    ) {
      console.log(`${String(scope).toUpperCase()}: NOT REGISTERED — no readiness created.`);
      return;
    }
    throw error;
  }
  const created = [];
  const preserved = [];
  for (const item of selection) {
    const relative = readinessPath(item, locale);
    if (await exists(path.join(root, relative))) {
      preserved.push(relative);
      console.log(`PRESERVED ${item.nodeCode}: ${relative}`);
      continue;
    }
    const record = initializeReadinessRecord(item, knowledge, locale);
    await fs.mkdir(path.dirname(path.join(root, relative)), { recursive: true });
    await fs.writeFile(
      path.join(root, relative),
      `${JSON.stringify(record, null, 2)}\n`,
      { flag: 'wx' }
    );
    created.push(relative);
    console.log(`CREATED ${item.nodeCode}: ${relative}`);
  }
  if ((scope || '').toUpperCase() === 'ALL' && locale === DEFAULT_LOCALE) {
    await writeInventory(knowledge);
  }
  console.log(`Created: ${created.length}`);
  console.log(`Existing preserved: ${preserved.length}`);
}

async function writeInventory(knowledge) {
  const validator = await compileReadinessSchema(root);
  const rows = [];
  for (const item of knowledge.inventory) {
    let assessment;
    let fileStatus = 'missing';
    try {
      const loaded = await readReadiness(root, item);
      assessment = validateReadinessRecord(item, loaded, validator);
      fileStatus = loaded.legacy ? 'existing_legacy_preserved' : 'present';
    } catch {
      assessment = {
        status: 'production_blocked',
        thesisStatus: 'not_ready',
        boundaryStatus: 'not_ready',
        exportability: 'blocked',
        blockingReason: 'READINESS_FILE_NOT_FOUND',
        missingFields: ['readinessRecord']
      };
    }
    const localized = item.localizedRecord?.locales?.[DEFAULT_LOCALE];
    rows.push({
      bookCode: item.bookCode,
      partCode: item.partCode,
      partTitle: item.part?.title || null,
      nodeCode: item.nodeCode,
      canonicalTitle: item.blueprintNode?.titleZhHans || null,
      canonicalQuestion: localized?.displayQuestion || null,
      nodeType: item.node.nodeType,
      registryStatus: item.node.registryStatus,
      productionPriority: item.blueprintNode?.productionPriority || item.node.productionQueue,
      previousNode: item.previousNode,
      nextNode: item.nextNode,
      supportingQuestionCount: item.supportingQuestions.length,
      localizedContentStatus: localized?.contentStatus || 'not_ready',
      canonicalThesisStatus: assessment.thesisStatus,
      boundaryStatus: assessment.boundaryStatus,
      readinessFileStatus: fileStatus,
      reviewStatus: assessment.status === 'production_ready'
        ? 'human_frozen'
        : 'human_review_required',
      productionStatus: assessment.status,
      exportability: assessment.exportability,
      blockingReason: assessment.blockingReason,
      missingFields: assessment.missingFields
    });
  }
  const index = {
    recordType: 'canonical_production_readiness_index',
    schemaVersion: 'PHI-OS-CANONICAL-PRODUCTION-READINESS-INDEX-v1.0.0',
    generatedFrom: {
      registryVersion: knowledge.nodes.version,
      registeredCanonicalNodeCount: knowledge.inventory.length,
      blueprintFiles: knowledge.blueprints.map(blueprint => blueprint.contract)
    },
    sourceOfTruth: false,
    entries: rows
  };
  await fs.writeFile(
    path.join(root, READINESS_INDEX_PATH),
    `${JSON.stringify(index, null, 2)}\n`
  );
  const header = `# PJA-W2F-A Canonical Readiness Inventory

Generated projection only. Registry, Blueprint, Localized Content and node
Readiness records remain authoritative. Blueprint-planned nodes without a
Registry identity are reported as not registered and never receive readiness.

| Book | Part | Node | Question | Thesis | Boundary | Questions | Review | Production | Exportability | Blocking reason |
| --- | --- | --- | --- | --- | --- | ---: | --- | --- | --- | --- |
`;
  const table = rows.map(row => (
    `| ${row.bookCode || 'not_defined'} | ${row.partCode || 'not_defined'} | ${row.nodeCode} | ${row.canonicalQuestion || 'not_defined'} | ${row.canonicalThesisStatus} | ${row.boundaryStatus} | ${row.supportingQuestionCount} | ${row.reviewStatus} | ${row.productionStatus} | ${row.exportability} | ${row.blockingReason || 'none'} |`
  )).join('\n');
  const planned = knowledge.blueprints.flatMap(blueprint => (
    (blueprint.nodes || []).filter(node => (
      !knowledge.inventory.some(item => item.nodeCode === node.nodeCode)
    ))
  ));
  const footer = `

## Registry and Blueprint Coverage

- Registered Canonical Nodes: ${rows.length}
- Blueprint-planned, not registered: ${planned.length}
- Part 1–14 readiness is created only after Registry identity exists.
- Future Book/Part patterns are supported by the same resolver and Schema.
`;
  await fs.writeFile(path.join(root, inventoryDocument), `${header}${table}${footer}`);
}

main().catch(error => {
  console.error(formatError(
    error instanceof ProductionError
      ? error
      : new ProductionError('READINESS_SCHEMA_INVALID', error.message)
  ));
  process.exitCode = 1;
});
