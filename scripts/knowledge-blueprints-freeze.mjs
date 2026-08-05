import fs from 'node:fs/promises';
import path from 'node:path';
import {
  digestKnowledgeSource,
  loadKnowledgeBlueprintFreeze,
  verifyKnowledgeBlueprintFreeze
} from './lib/knowledge-blueprint/freeze-contract.mjs';

const root = process.cwd();
const mode = process.argv[2] || 'write';
const freezePath =
  'content/knowledge/blueprints/knowledge-blueprint-freeze-v2.json';
const registryPath =
  'content/knowledge/blueprints/blueprint-registry.json';

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

const registrySource = await fs.readFile(path.join(root, registryPath), 'utf8');
const registry = JSON.parse(registrySource);
const current = await loadKnowledgeBlueprintFreeze(root);

const bookFreeze = [];
for (const entry of registry.books || []) {
  const source = await fs.readFile(path.join(root, entry.blueprintPath), 'utf8');
  const blueprint = JSON.parse(source);
  bookFreeze.push({
    bookCode: entry.bookCode,
    blueprintPath: entry.blueprintPath,
    blueprintSHA: digestKnowledgeSource(source),
    schemaVersion: blueprint.schemaVersion,
    contractVersion: blueprint.contract,
    status: blueprint.status
  });
}

const next = {
  ...current,
  registryManifestPath: registryPath,
  registryManifestSHA: digestKnowledgeSource(registrySource),
  bookFreeze
};

await fs.writeFile(
  path.join(root, freezePath),
  `${JSON.stringify(next, null, 2)}\n`,
  'utf8'
);

await verifyKnowledgeBlueprintFreeze(root);
console.log(`✓ Knowledge Blueprint Freeze v2 updated explicitly: ${freezePath}`);
