import fs from 'node:fs/promises';
import path from 'node:path';

export const KNOWLEDGE_REGISTRY_AUTHORITY_VERSION =
  'PHI-OS-KNOWLEDGE-REGISTRY-AUTHORITY-v2.0.0';
export const KNOWLEDGE_REGISTRY_AUTHORITY_PATH =
  'content/knowledge/contracts/knowledge-registry-authority-v2.json';

export function normalizeBookCode(value) {
  if (typeof value === 'number' && Number.isInteger(value) && value > 0) {
    return `BOOK-${value}`;
  }
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new TypeError('Knowledge book identity is required.');
  }
  const normalized = value.trim().toUpperCase().replace(/^BOOK\s+/, 'BOOK-');
  const roman = new Map([['I','1'],['II','2'],['III','3'],['IV','4'],['V','5']]);
  const match = /^(?:BOOK-?|)(I{1,3}|IV|V|\d+)$/.exec(normalized);
  if (!match) throw new TypeError(`Invalid Knowledge book identity: ${value}`);
  return `BOOK-${roman.get(match[1]) || String(Number(match[1]))}`;
}
function requireBookCode(value, context = 'Knowledge book identity') {
  const bookCode = normalizeBookCode(value);

  if (!bookCode) {
    throw new TypeError(`${context} is invalid: ${value}`);
  }

  return bookCode;
}
export function normalizePartCode(value) {
  if (typeof value === 'number' && Number.isInteger(value) && value >= 0) {
    return `P${value}`;
  }
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new TypeError('Knowledge part identity is required.');
  }
  const match = /^(?:PART[- ]?|P)(\d+)$/i.exec(value.trim());
  if (!match) throw new TypeError(`Invalid Knowledge part identity: ${value}`);
  return `P${Number(match[1])}`;
}

const readJson = async (root, relative) =>
  JSON.parse(await fs.readFile(path.join(root, relative), 'utf8'));

export async function loadKnowledgeRegistryAuthorities(root) {
  const contract = await readJson(root, KNOWLEDGE_REGISTRY_AUTHORITY_PATH);
  if (contract.contract !== KNOWLEDGE_REGISTRY_AUTHORITY_VERSION) {
    throw new Error(`Unsupported Knowledge Registry Authority: ${contract.contract}`);
  }
  const [books, parts, nodes] = await Promise.all([
    readJson(root, contract.authorities.bookIdentity.path),
    readJson(root, contract.authorities.partIdentityAndPublicationOwnership.path),
    readJson(root, contract.authorities.canonicalKnowledge.path)
  ]);
  const byBookCode = new Map();
  for (const book of books.books || []) {
    const bookCode = requireBookCode(
  book.volume ?? book.book_id,
  'Book Registry identity'
);
    if (byBookCode.has(bookCode)) throw new Error(`Duplicate Book Registry identity: ${bookCode}`);
    const partCodes = [
      ...(book.cross_volume_sections?.includes('part-0-core-language') ? ['P0'] : []),
      ...(book.parts || []).map(normalizePartCode)
    ];
    byBookCode.set(bookCode, { ...book, bookCode, partCodes });
  }
  const byPartCode = new Map();
  if (parts.part_0) {
    byPartCode.set('P0', { ...parts.part_0, partCode: 'P0', bookCode: 'BOOK-1', crossVolume: true });
  }
  for (const part of parts.parts || []) {
    const partCode = normalizePartCode(part.number ?? part.part_id);
    const bookCode = requireBookCode(
  part.book,
  'Part Registry book identity'
);
    if (!byBookCode.has(bookCode)) throw new Error(`Unknown Part Registry book: ${bookCode}`);
    if (byPartCode.has(partCode)) throw new Error(`Duplicate Part Registry identity: ${partCode}`);
    byPartCode.set(partCode, { ...part, partCode, bookCode, crossVolume: false });
  }
  const byNodeCode = new Map();
  for (const node of nodes.nodes || []) {
    if (!node.nodeCode || byNodeCode.has(node.nodeCode)) {
      throw new Error(`Duplicate or missing Canonical Node identity: ${node.nodeCode}`);
    }
    byNodeCode.set(node.nodeCode, node);
  }
  return {
    contract, books, parts, nodes,
    byBookCode, byPartCode, byNodeCode,
    totals: { books: byBookCode.size, parts: byPartCode.size, nodes: byNodeCode.size }
  };
}
