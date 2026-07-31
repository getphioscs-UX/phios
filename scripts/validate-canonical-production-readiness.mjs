import { parseArgs } from './lib/knowledge-production/cli.mjs';
import { formatError, ProductionError } from './lib/knowledge-production/production-errors.mjs';
import {
  compileReadinessSchema,
  loadKnowledgeInventory,
  readReadiness,
  resolveKnowledgeScope,
  validateReadinessRecord
} from './lib/knowledge-production/readiness-system.mjs';
import { DEFAULT_LOCALE } from './lib/knowledge-production/production-config.mjs';

const root = process.cwd();

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
      console.log(`${String(scope).toUpperCase()}: NOT REGISTERED`);
      return;
    }
    throw error;
  }
  const schema = await compileReadinessSchema(root);
  let structuralFailures = 0;
  const counts = {
    production_ready: 0,
    ready_for_editorial_review: 0,
    production_blocked: 0,
    other: 0
  };
  for (const item of selection) {
    try {
      const loaded = await readReadiness(root, item, locale);
      const result = validateReadinessRecord(item, loaded, schema);
      if (!result.schemaValid) structuralFailures += 1;
      counts[result.status] = (counts[result.status] ?? counts.other) + 1;
      console.log(
        `${item.nodeCode} ${result.schemaValid ? 'VALID' : 'INVALID'} ` +
        `${result.status} ${result.exportability}` +
        `${result.blockingReason ? ` ${result.blockingReason}` : ''}`
      );
      for (const error of result.errors) console.log(`  ERROR ${error}`);
      for (const missing of result.missingFields) console.log(`  MISSING ${missing}`);
    } catch (error) {
      structuralFailures += 1;
      console.log(`${item.nodeCode} INVALID ${error.code || 'READINESS_FILE_NOT_FOUND'}`);
    }
  }
  console.log(`Production Ready: ${counts.production_ready}`);
  console.log(`Ready for Editorial Review: ${counts.ready_for_editorial_review}`);
  console.log(`Blocked: ${counts.production_blocked}`);
  if (structuralFailures) process.exitCode = 1;
}

main().catch(error => {
  console.error(formatError(
    error instanceof ProductionError
      ? error
      : new ProductionError('READINESS_SCHEMA_INVALID', error.message)
  ));
  process.exitCode = 1;
});
