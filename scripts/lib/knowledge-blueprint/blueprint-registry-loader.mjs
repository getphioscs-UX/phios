import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import {
  BLUEPRINT_SCHEMA_VERSION,
  loadKnowledgeBlueprint,
  normalizeBookCode
} from './blueprint-loader.mjs';

export const BLUEPRINT_REGISTRY_VERSION = 'PHI-OS-KNOWLEDGE-BLUEPRINT-REGISTRY-v2.0.0';
export const DEFAULT_BLUEPRINT_REGISTRY_PATH = 'content/knowledge/blueprints/blueprint-registry.json';

const normalizedDigest = value => crypto
  .createHash('sha256')
  .update(value.replace(/\r\n?/g, '\n'))
  .digest('hex');

export async function loadKnowledgeBlueprintRegistry(root, options = {}) {
  const registryPath = options.registryPath || DEFAULT_BLUEPRINT_REGISTRY_PATH;
  const absoluteRegistryPath = path.join(root, registryPath);
  const registry = JSON.parse(await fs.readFile(absoluteRegistryPath, 'utf8'));

  if (registry.schemaVersion !== BLUEPRINT_REGISTRY_VERSION) {
    throw new Error(`Unsupported Knowledge Blueprint Registry version: ${registry.schemaVersion}`);
  }
  if (!Array.isArray(registry.books) || registry.books.length === 0) {
    throw new Error('Knowledge Blueprint Registry contains no books.');
  }

  const books = [];
  const byBookCode = new Map();
  const byPartCode = new Map();
  const byNodeCode = new Map();

  for (const entry of registry.books) {
    const bookCode = normalizeBookCode(entry.bookCode);
    if (byBookCode.has(bookCode)) throw new Error(`Duplicate Blueprint Registry book: ${bookCode}`);

    const absoluteBlueprintPath = path.join(root, entry.blueprintPath);
    const raw = await fs.readFile(absoluteBlueprintPath, 'utf8');
    const digest = normalizedDigest(raw);
    if (registry.policies?.failClosedOnDigestMismatch !== false && digest !== entry.sha256) {
      throw new Error(`Knowledge Blueprint digest mismatch: ${entry.blueprintPath}`);
    }

    const blueprint = await loadKnowledgeBlueprint(absoluteBlueprintPath);
    if (blueprint.schemaVersion !== BLUEPRINT_SCHEMA_VERSION) {
      throw new Error(`Unsupported Blueprint version in ${entry.blueprintPath}`);
    }
    if (blueprint.bookCode !== bookCode) {
      throw new Error(`Blueprint bookCode mismatch: ${entry.blueprintPath}`);
    }
    if (blueprint.cardinality.canonicalNodeCount !== entry.canonicalNodeCount) {
      throw new Error(`Blueprint node count mismatch: ${entry.blueprintPath}`);
    }

    const projectedBook = { ...blueprint, registryEntry: entry };
    books.push(projectedBook);
    byBookCode.set(bookCode, projectedBook);

    for (const part of blueprint.parts) {
      if (byPartCode.has(part.partCode)) throw new Error(`Duplicate Blueprint Part: ${part.partCode}`);
      byPartCode.set(part.partCode, { ...part, bookCode });
    }
    for (const node of blueprint.nodes) {
      if (byNodeCode.has(node.nodeCode)) throw new Error(`Duplicate Blueprint Node: ${node.nodeCode}`);
      byNodeCode.set(node.nodeCode, { ...node, bookCode });
    }
  }

  return {
    registry,
    books,
    parts: [...byPartCode.values()],
    nodes: [...byNodeCode.values()],
    byBookCode,
    byPartCode,
    byNodeCode,
    totals: {
      books: books.length,
      parts: byPartCode.size,
      nodes: byNodeCode.size
    }
  };
}

export async function resolveKnowledgeBlueprintForNode(root, nodeCode, options = {}) {
  const knowledge = options.knowledge || await loadKnowledgeBlueprintRegistry(root, options);
  return knowledge.byNodeCode.get(nodeCode) || null;
}

export async function resolveKnowledgeBlueprintForPart(root, partCode, options = {}) {
  const knowledge = options.knowledge || await loadKnowledgeBlueprintRegistry(root, options);
  return knowledge.byPartCode.get(partCode) || null;
}
