import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';

export const KNOWLEDGE_BLUEPRINT_FREEZE_CONTRACT =
  'PHI-OS-KNOWLEDGE-BLUEPRINT-FREEZE-v2.0.0';
export const KNOWLEDGE_BLUEPRINT_FREEZE_PATH =
  'content/knowledge/blueprints/successors/book-w1d/knowledge-blueprint-freeze-v1.json';
export const KNOWLEDGE_BLUEPRINT_REGISTRY_PATH =
  'content/knowledge/blueprints/blueprint-registry.json';
export const NODE_PUBLICATION_OWNERSHIP_PATH =
  'content/knowledge/migrations/node-publication-ownership-v2.json';

const normalizeSource = source =>
  source.replace(/^\uFEFF/, '').replace(/\r\n?/g, '\n');

const digest = source => crypto
  .createHash('sha256')
  .update(normalizeSource(source), 'utf8')
  .digest('hex');

const readSource = (root, relativePath) =>
  fs.readFile(path.join(root, relativePath), 'utf8');

const readJson = async (root, relativePath) =>
  JSON.parse(await readSource(root, relativePath));

export async function loadKnowledgeBlueprintFreeze(root = process.cwd()) {
  const freeze = await readJson(root, KNOWLEDGE_BLUEPRINT_FREEZE_PATH);
  if (freeze.contract !== KNOWLEDGE_BLUEPRINT_FREEZE_CONTRACT) {
    throw new Error(`Unsupported Knowledge Blueprint Freeze: ${freeze.contract}`);
  }
  if (!Array.isArray(freeze.bookFreeze) || freeze.bookFreeze.length === 0) {
    throw new Error('Knowledge Blueprint Freeze must contain bookFreeze[].');
  }
  return freeze;
}

export async function verifyRegistryManifest(root, freeze) {
  const source = await readSource(
    root,
    freeze.registryManifestPath || KNOWLEDGE_BLUEPRINT_REGISTRY_PATH
  );
  const actualSHA = digest(source);
  if (actualSHA !== freeze.registryManifestSHA) {
    throw new Error(
      `Knowledge Blueprint Registry digest mismatch: expected ${freeze.registryManifestSHA}, received ${actualSHA}`
    );
  }
  const registry = JSON.parse(source);
  if (registry.contract !== 'PHI-OS-KNOWLEDGE-BLUEPRINT-REGISTRY-v2.0.0') {
    throw new Error(`Unsupported Blueprint Registry contract: ${registry.contract}`);
  }
  return { registry, actualSHA };
}

export async function verifyBookFreeze(root, registry, bookFreeze) {
  const entry = (registry.books || []).find(
    candidate => candidate.bookCode === bookFreeze.bookCode
  );
  if (!entry) throw new Error(`Missing Blueprint Registry entry: ${bookFreeze.bookCode}`);
  if (entry.blueprintPath !== bookFreeze.blueprintPath) {
    throw new Error(`Blueprint path mismatch: ${bookFreeze.bookCode}`);
  }
  if (entry.schemaVersion !== bookFreeze.schemaVersion) {
    throw new Error(`Blueprint schema mismatch: ${bookFreeze.bookCode}`);
  }
  if (entry.contract !== bookFreeze.contractVersion) {
    throw new Error(`Blueprint contract mismatch: ${bookFreeze.bookCode}`);
  }
  if (entry.status !== bookFreeze.status) {
    throw new Error(`Blueprint status mismatch: ${bookFreeze.bookCode}`);
  }

  const source = await readSource(root, bookFreeze.blueprintPath);
  const actualSHA = digest(source);
  if (actualSHA !== bookFreeze.blueprintSHA || entry.sha256 !== bookFreeze.blueprintSHA) {
    throw new Error(
      `Blueprint digest mismatch for ${bookFreeze.bookCode}: expected ${bookFreeze.blueprintSHA}, received ${actualSHA}`
    );
  }

  const blueprint = JSON.parse(source);
  if (blueprint.bookCode !== bookFreeze.bookCode) {
    throw new Error(`Blueprint identity mismatch: ${bookFreeze.bookCode}`);
  }
  if (blueprint.schemaVersion !== bookFreeze.schemaVersion) {
    throw new Error(`Blueprint payload schema mismatch: ${bookFreeze.bookCode}`);
  }
  if (blueprint.contract !== bookFreeze.contractVersion) {
    throw new Error(`Blueprint payload contract mismatch: ${bookFreeze.bookCode}`);
  }
  return { entry, blueprint, actualSHA };
}

export async function verifyKnowledgeBlueprintFreeze(root = process.cwd()) {
  const freeze = await loadKnowledgeBlueprintFreeze(root);
  const { registry, actualSHA: registryManifestSHA } =
    await verifyRegistryManifest(root, freeze);

  const books = [];
  for (const bookFreeze of freeze.bookFreeze) {
    books.push(await verifyBookFreeze(root, registry, bookFreeze));
  }

  const frozenCodes = new Set(freeze.bookFreeze.map(entry => entry.bookCode));
  const registryCodes = new Set((registry.books || []).map(entry => entry.bookCode));
  if (frozenCodes.size !== registryCodes.size ||
      [...registryCodes].some(code => !frozenCodes.has(code))) {
    throw new Error('Per-book Freeze coverage does not match Blueprint Registry.');
  }

  return { freeze, registry, registryManifestSHA, books };
}

async function loadOwnership(root = process.cwd()) {
  const migration = await readJson(root, NODE_PUBLICATION_OWNERSHIP_PATH);
  if (migration.contract !== 'PHI-OS-NODE-PUBLICATION-OWNERSHIP-v2.0.0') {
    throw new Error(`Unsupported publication ownership contract: ${migration.contract}`);
  }
  return migration;
}

export async function resolvePublicationContext(nodeCode, root = process.cwd()) {
  const migration = await loadOwnership(root);
  const node = (migration.nodes || []).find(candidate => candidate.nodeCode === nodeCode);
  if (!node) return null;
  return {
    nodeCode,
    publicationBookCode: node.publicationBookCode,
    publicationPartCode: node.publicationPartCode,
    ownershipContract: migration.contract
  };
}

export async function resolveSourceLineage(nodeCode, root = process.cwd()) {
  const migration = await loadOwnership(root);
  const node = (migration.nodes || []).find(candidate => candidate.nodeCode === nodeCode);
  if (!node) return null;
  return {
    nodeCode,
    sourceBookCode: node.sourceBookCode,
    sourcePartCode: migration.partCode,
    canonicalIdentityRetained: true,
    legacyIdentityRetained: true
  };
}

export { digest as digestKnowledgeSource };
