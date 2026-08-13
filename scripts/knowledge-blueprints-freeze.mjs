import fs from 'node:fs/promises';
import path from 'node:path';
import {
  digestKnowledgeSource,
  KNOWLEDGE_BLUEPRINT_FREEZE_PATH,
  KNOWLEDGE_BLUEPRINT_REGISTRY_PATH,
  loadKnowledgeBlueprintFreeze,
  verifyKnowledgeBlueprintFreeze
} from './lib/knowledge-blueprint/freeze-contract.mjs';

const root = process.cwd();
const mode = process.argv[2] || 'write';
const freezePath = KNOWLEDGE_BLUEPRINT_FREEZE_PATH;
const registryPath = KNOWLEDGE_BLUEPRINT_REGISTRY_PATH;

const readSource = relative =>
  fs.readFile(path.join(root, relative), 'utf8');

const writeJson = (relative, value) =>
  fs.writeFile(
    path.join(root, relative),
    `${JSON.stringify(value, null, 2)}\n`,
    'utf8'
  );

if (mode === 'status') {
  const result = await verifyKnowledgeBlueprintFreeze(root);
  console.log(JSON.stringify({
    status: 'valid',
    contract: result.freeze.contract,
    registryManifestSHA: result.registryManifestSHA,
    books: result.books.map(({ entry, actualSHA }) => ({
      bookCode: entry.bookCode,
      blueprintSHA: actualSHA
    }))
  }, null, 2));
  process.exit(0);
}

if (mode !== 'write') {
  throw new Error(`Unsupported knowledge freeze mode: ${mode}`);
}

const registry = JSON.parse(await readSource(registryPath));
const current = await loadKnowledgeBlueprintFreeze(root);

const refreshedEntries = [];
for (const entry of registry.books || []) {
  const source = await readSource(entry.blueprintPath);
  const blueprint = JSON.parse(source);
  const partCodes = (blueprint.parts || []).map(part => part.partCode);
  const canonicalNodeCount = Array.isArray(blueprint.nodes)
    ? blueprint.nodes.length
    : (blueprint.parts || []).reduce(
        (total, part) => total + Number(part.canonicalNodeCount || 0),
        0
      );

  refreshedEntries.push({
    ...entry,
    contract: blueprint.contract,
    schemaVersion: blueprint.schemaVersion,
    status: blueprint.status,
    canonicalLanguage:
      blueprint.canonicalLanguage || entry.canonicalLanguage || 'zh-Hans',
    partCodes,
    canonicalNodeCount,
    sha256: digestKnowledgeSource(source),
    productionEligibility:
      canonicalNodeCount > 0
        ? 'registered_nodes_only'
        : 'architecture_only'
  });
}

registry.books = refreshedEntries;
registry.totals = {
  books: refreshedEntries.length,
  parts: new Set(refreshedEntries.flatMap(entry => entry.partCodes)).size,
  canonicalNodes: refreshedEntries.reduce(
    (total, entry) => total + entry.canonicalNodeCount,
    0
  )
};

await writeJson(registryPath, registry);

const registrySource = await readSource(registryPath);
const bookFreeze = refreshedEntries.map(entry => ({
  bookCode: entry.bookCode,
  blueprintPath: entry.blueprintPath,
  blueprintSHA: entry.sha256,
  schemaVersion: entry.schemaVersion,
  contractVersion: entry.contract,
  status: entry.status
}));

const next = {
  ...current,
  registryManifestPath: registryPath,
  registryManifestSHA: digestKnowledgeSource(registrySource),
  bookFreeze
};

await writeJson(freezePath, next);
await verifyKnowledgeBlueprintFreeze(root);

console.log('✓ Blueprint Registry Authority refreshed from all registered Blueprints.');
console.log(`✓ Registry totals: ${registry.totals.books} books / ${registry.totals.parts} parts / ${registry.totals.canonicalNodes} nodes.`);
console.log(`✓ Active Knowledge Blueprint Freeze updated explicitly: ${freezePath}`);
