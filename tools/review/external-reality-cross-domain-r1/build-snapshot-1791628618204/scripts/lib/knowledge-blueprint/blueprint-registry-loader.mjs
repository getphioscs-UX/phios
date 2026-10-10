import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import {
  BLUEPRINT_SCHEMA_VERSION,
  loadKnowledgeBlueprint,
  normalizeBookCode
} from './blueprint-loader.mjs';
import {
  KNOWLEDGE_REGISTRY_AUTHORITY_PATH,
  loadKnowledgeRegistryAuthorities,
  normalizePartCode
} from './registry-authority.mjs';

export const BLUEPRINT_REGISTRY_VERSION = 'PHI-OS-KNOWLEDGE-BLUEPRINT-REGISTRY-v2.0.0';
export const DEFAULT_BLUEPRINT_REGISTRY_PATH = 'content/knowledge/blueprints/blueprint-registry.json';

const normalizedDigest = value => crypto.createHash('sha256')
  .update(value.replace(/\r\n?/g, '\n')).digest('hex');

export async function loadKnowledgeBlueprintRegistry(root, options = {}) {
  const registryPath = options.registryPath || DEFAULT_BLUEPRINT_REGISTRY_PATH;
  const [registry, authorities] = await Promise.all([
    fs.readFile(path.join(root, registryPath), 'utf8').then(JSON.parse),
    loadKnowledgeRegistryAuthorities(root)
  ]);
  if (registry.schemaVersion !== BLUEPRINT_REGISTRY_VERSION) {
    throw new Error(`Unsupported Knowledge Blueprint Registry version: ${registry.schemaVersion}`);
  }
  if (!Array.isArray(registry.books) || registry.books.length === 0) {
    throw new Error('Knowledge Blueprint Registry contains no books.');
  }
  const expectedAuthority = authorities.contract.authorities;
  if (registry.authority?.canonicalKnowledge !== expectedAuthority.canonicalKnowledge.path ||
      registry.authority?.bookIdentity !== expectedAuthority.bookIdentity.path ||
      registry.authority?.partIdentity !== expectedAuthority.partIdentityAndPublicationOwnership.path ||
      registry.authority?.publicationOwnership !== expectedAuthority.partIdentityAndPublicationOwnership.path) {
    throw new Error('Knowledge Blueprint Registry authority conflicts with the canonical authority contract.');
  }

  const books = [];
  const byBookCode = new Map();
  const byPartCode = new Map();
  const byNodeCode = new Map();
  for (const entry of registry.books) {
    const bookCode = normalizeBookCode(entry.bookCode);
    if (byBookCode.has(bookCode)) throw new Error(`Duplicate Blueprint Registry book: ${bookCode}`);
    const authorityBook = authorities.byBookCode.get(bookCode);
    if (!authorityBook) throw new Error(`Blueprint Registry references unknown Book: ${bookCode}`);
    const raw = await fs.readFile(path.join(root, entry.blueprintPath), 'utf8');
    const digest = normalizedDigest(raw);
    if (registry.policies?.failClosedOnDigestMismatch !== false && digest !== entry.sha256) {
      throw new Error(`Knowledge Blueprint digest mismatch: ${entry.blueprintPath}`);
    }
    const blueprint = await loadKnowledgeBlueprint(path.join(root, entry.blueprintPath));
    if (blueprint.schemaVersion !== BLUEPRINT_SCHEMA_VERSION || blueprint.bookCode !== bookCode) {
      throw new Error(`Blueprint identity or schema mismatch: ${entry.blueprintPath}`);
    }
    const projectedParts = blueprint.parts.map(part => normalizePartCode(part.partCode));
    if (JSON.stringify(projectedParts) !== JSON.stringify(authorityBook.partCodes) ||
        JSON.stringify(entry.partCodes) !== JSON.stringify(authorityBook.partCodes)) {
      throw new Error(`Blueprint Part projection conflicts with Book/Part Registry: ${bookCode}`);
    }
    if (blueprint.cardinality.canonicalNodeCount !== entry.canonicalNodeCount) {
      throw new Error(`Blueprint node count mismatch: ${entry.blueprintPath}`);
    }
    const projectedBook = { ...blueprint, registryEntry: entry, authorityBook };
    books.push(projectedBook);
    byBookCode.set(bookCode, projectedBook);
    for (const part of blueprint.parts) {
      const partCode = normalizePartCode(part.partCode);
      const authorityPart = authorities.byPartCode.get(partCode);
      if (!authorityPart || authorityPart.bookCode !== bookCode) {
        throw new Error(`Blueprint Part ownership conflict: ${partCode}`);
      }
      if (byPartCode.has(partCode)) throw new Error(`Duplicate Blueprint Part: ${partCode}`);
      byPartCode.set(partCode, { ...part, partCode, bookCode, authorityPart });
    }
    for (const node of blueprint.nodes) {
      if (!authorities.byNodeCode.has(node.nodeCode)) {
        throw new Error(`Blueprint references unknown Canonical Node: ${node.nodeCode}`);
      }
      if (byNodeCode.has(node.nodeCode)) throw new Error(`Duplicate Blueprint Node: ${node.nodeCode}`);
      byNodeCode.set(node.nodeCode, { ...node, bookCode });
    }
  }
  if (byBookCode.size !== authorities.byBookCode.size ||
      byPartCode.size !== authorities.byPartCode.size ||
      byNodeCode.size !== authorities.byNodeCode.size) {
    throw new Error('Blueprint Registry coverage conflicts with canonical registries.');
  }
  return {
    registry, authorities, authorityContractPath: KNOWLEDGE_REGISTRY_AUTHORITY_PATH,
    books, parts: [...byPartCode.values()], nodes: [...byNodeCode.values()],
    byBookCode, byPartCode, byNodeCode,
    totals: { books: books.length, parts: byPartCode.size, nodes: byNodeCode.size }
  };
}

export async function loadKnowledgeBlueprints(root, options = {}) {
  return (await loadKnowledgeBlueprintRegistry(root, options)).books;
}
export async function loadKnowledgeBlueprintByBook(root, bookCode, options = {}) {
  const knowledge = options.knowledge || await loadKnowledgeBlueprintRegistry(root, options);
  return knowledge.byBookCode.get(normalizeBookCode(bookCode)) || null;
}
export async function resolveKnowledgeBlueprintForNode(root, nodeCode, options = {}) {
  const knowledge = options.knowledge || await loadKnowledgeBlueprintRegistry(root, options);
  return knowledge.byNodeCode.get(nodeCode) || null;
}
export async function resolveKnowledgeBlueprintForPart(root, partCode, options = {}) {
  const knowledge = options.knowledge || await loadKnowledgeBlueprintRegistry(root, options);
  return knowledge.byPartCode.get(normalizePartCode(partCode)) || null;
}
