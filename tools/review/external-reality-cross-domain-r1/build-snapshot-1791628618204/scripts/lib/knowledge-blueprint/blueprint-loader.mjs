import fs from 'node:fs/promises';
import path from 'node:path';

export const BLUEPRINT_SCHEMA_VERSION = 'PHI-OS-KNOWLEDGE-BLUEPRINT-v2.0.0';

export { normalizeBookCode } from './registry-authority.mjs';
import { normalizeBookCode } from './registry-authority.mjs';

export function deriveBlueprintCardinality(blueprint) {
  const parts = Array.isArray(blueprint.parts) ? blueprint.parts : [];
  const nodes = Array.isArray(blueprint.nodes) ? blueprint.nodes : [];
  const nodesByPart = Object.fromEntries(parts.map(part => [
    part.partCode,
    Array.isArray(part.nodes) ? part.nodes.length : 0
  ]));
  return {
    partCount: parts.length,
    canonicalNodeCount: nodes.length,
    nodesByPart,
    registeredNodeCount: nodes.filter(node => node.status === 'registered').length,
    plannedNodeCount: nodes.filter(node => node.status === 'planned').length,
    productionRequiredCount: nodes.filter(node => node.articleRequiredNow === true).length
  };
}

export function normalizeKnowledgeBlueprint(raw, sourcePath = null) {
  if (!raw || typeof raw !== 'object') {
    throw new TypeError('Knowledge Blueprint must be an object.');
  }
  const bookCode = normalizeBookCode(raw.bookCode);
  const parts = (raw.parts || []).map(part => ({
    ...part,
    canonicalNodeCount: Array.isArray(part.nodes)
      ? part.nodes.length
      : part.canonicalNodeCount
  }));
  const nodes = raw.nodes || [];
  const normalized = {
    ...raw,
    schemaVersion: BLUEPRINT_SCHEMA_VERSION,
    bookCode,
    parts,
    nodes,
    sourcePath
  };
  normalized.cardinality = deriveBlueprintCardinality(normalized);
  return normalized;
}

export async function loadKnowledgeBlueprint(file) {
  const raw = JSON.parse(await fs.readFile(file, 'utf8'));
  return normalizeKnowledgeBlueprint(raw, file);
}

export async function loadKnowledgeBlueprintDirectory(root) {
  const directory = path.join(root, 'content/knowledge/blueprints');
  const entries = await fs.readdir(directory, { withFileTypes: true });
  const files = entries
    .filter(entry => entry.isFile() && /^book-\d+-knowledge-blueprint\.json$/.test(entry.name))
    .map(entry => path.join(directory, entry.name))
    .sort();
  const books = await Promise.all(files.map(loadKnowledgeBlueprint));
  const byBookCode = new Map(books.map(book => [book.bookCode, book]));
  const byPartCode = new Map();
  const byNodeCode = new Map();
  for (const book of books) {
    for (const part of book.parts) {
      const key = `${book.bookCode}:${part.partCode}`;
      if (byPartCode.has(key)) throw new Error(`Duplicate Blueprint Part ${key}`);
      byPartCode.set(key, part);
    }
    for (const node of book.nodes) {
      if (byNodeCode.has(node.nodeCode)) throw new Error(`Duplicate Blueprint Node ${node.nodeCode}`);
      byNodeCode.set(node.nodeCode, { ...node, bookCode: book.bookCode });
    }
  }
  return {
    books,
    parts: [...byPartCode.values()],
    nodes: [...byNodeCode.values()],
    totals: {
      books: books.length,
      parts: books.reduce((sum, book) => sum + book.cardinality.partCount, 0),
      nodes: books.reduce((sum, book) => sum + book.cardinality.canonicalNodeCount, 0)
    },
    byBookCode,
    byPartCode,
    byNodeCode
  };
}

export function deriveFrozenBlueprintCardinality(freeze) {
  const plan = Array.isArray(freeze?.canonicalNodePlan)
    ? freeze.canonicalNodePlan
    : [];
  return {
    partCount: plan.length,
    canonicalNodeCount: plan.reduce(
      (sum, part) => sum + Number(part.canonicalNodes || 0),
      0
    ),
    nodesByPart: Object.fromEntries(plan.map(part => [
      part.partCode,
      Number(part.canonicalNodes || 0)
    ]))
  };
}
