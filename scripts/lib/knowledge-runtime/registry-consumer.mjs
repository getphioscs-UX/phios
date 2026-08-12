import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

const readJson = file => JSON.parse(fs.readFileSync(file, 'utf8'));
const normalized = source => source.replace(/^\uFEFF/, '').replace(/\r\n?/g, '\n');
const digest = source => crypto.createHash('sha256').update(normalized(source), 'utf8').digest('hex');
const bookCode = value => String(value || '').replace(/^book-/i, 'BOOK-').toUpperCase();
const partCode = value => String(value || '').replace(/^part-/i, 'P').toUpperCase();

export function loadKnrRegistryAuthority(root = process.cwd()) {
  const rel = value => path.join(root, value);
  const blueprintRegistryPath = 'content/knowledge/blueprints/blueprint-registry.json';
  const freezePath = 'content/knowledge/blueprints/knowledge-blueprint-freeze-v2.json';
  const nodeRegistryPath = 'content/knowledge/registry/nodes.json';
  const bookRegistryPath = 'content/registry/books.json';
  const partRegistryPath = 'content/registry/parts.json';
  const ownershipPath = 'content/knowledge/migrations/node-publication-ownership-v2.json';
  const localizedPath = 'content/knowledge/registry/localized-content.json';
  const aliasesPath = 'content/knowledge/registry/search-aliases.json';
  const questionsPath = 'content/knowledge/registry/supporting-questions.json';
  const readingPathsPath = 'content/knowledge/registry/learning-paths.json';

  const blueprintSource = fs.readFileSync(rel(blueprintRegistryPath), 'utf8');
  const blueprintRegistry = JSON.parse(blueprintSource);
  const freeze = readJson(rel(freezePath));
  if (digest(blueprintSource) !== freeze.registryManifestSHA) {
    throw new Error('KNR Blueprint Registry digest mismatch.');
  }
  const blueprintNodeContext = new Map();
  for (const entry of blueprintRegistry.books || []) {
    const source = fs.readFileSync(rel(entry.blueprintPath), 'utf8');
    if (digest(source) !== entry.sha256) throw new Error(`KNR Blueprint digest mismatch: ${entry.bookCode}`);
    const blueprint = JSON.parse(source);
    for (const part of blueprint.parts || []) {
      for (const nodeCode of part.nodes || []) blueprintNodeContext.set(nodeCode, { bookCode: entry.bookCode, partCode: part.partCode });
    }
  }

  const nodeRegistry = readJson(rel(nodeRegistryPath));
  const bookRegistry = readJson(rel(bookRegistryPath));
  const partRegistry = readJson(rel(partRegistryPath));
  const ownership = readJson(rel(ownershipPath));
  const localized = readJson(rel(localizedPath));
  const searchAliases = readJson(rel(aliasesPath));
  const supportingQuestions = readJson(rel(questionsPath));
  const learningPaths = readJson(rel(readingPathsPath));

  const books = new Map((bookRegistry.books || []).map(book => [bookCode(book.book_id), book]));
  const allParts = [partRegistry.part_0, ...(partRegistry.parts || [])].filter(Boolean);
  const parts = new Map(allParts.map(part => [partCode(part.part_id), part]));
  const nodes = new Map((nodeRegistry.nodes || []).map(node => [node.nodeCode, node]));
  const migrations = new Map((ownership.nodes || []).map(node => [node.nodeCode, node]));
  const localeByNode = new Map((localized.localizedContent || []).map(item => [item.nodeCode, item.locales || {}]));

  if (books.size !== 5 || nodes.size !== blueprintRegistry.totals.canonicalNodes) {
    throw new Error('KNR Registry Authority coverage mismatch.');
  }

  const resolvePublicationContext = nodeCode => {
    const node = nodes.get(nodeCode);
    if (!node) throw new Error(`KNR Canonical Node not registered: ${nodeCode}`);
    const migration = migrations.get(nodeCode);
    const blueprintContext = blueprintNodeContext.get(nodeCode);
    const publicationPartCode = partCode(migration?.publicationPartCode || blueprintContext?.partCode || node.publicationPartCode || node.partCode);
    const part = parts.get(publicationPartCode);
    const partBookCode = part?.book === 'cross-volume' ? 'CROSS-VOLUME' : bookCode(part?.book);
    const publicationBookCode = bookCode(migration?.publicationBookCode || (partBookCode === 'CROSS-VOLUME' ? blueprintContext?.bookCode : partBookCode) || blueprintContext?.bookCode);
    const sourceBookCode = bookCode(migration?.sourceBookCode || node.sourceBookCode || node.publicationBookCode || blueprintContext?.bookCode || publicationBookCode);
    if (!publicationBookCode || !publicationPartCode || !part || (partBookCode !== 'CROSS-VOLUME' && partBookCode !== publicationBookCode) || (blueprintContext?.bookCode && bookCode(blueprintContext.bookCode) !== publicationBookCode)) {
      throw new Error(`KNR Publication Context invalid: ${nodeCode}`);
    }
    return Object.freeze({
      nodeCode,
      sourceBookCode,
      publicationBookCode,
      publicationPartCode,
      authority: migration ? `${ownership.contract}+part-registry` : 'part-registry'
    });
  };

  return Object.freeze({
    contract: 'PHI-OS-KNR-REGISTRY-CONSUMPTION-v1.0.0',
    blueprintRegistry,
    nodeRegistry,
    books,
    parts,
    nodes,
    localeByNode,
    searchAliases: searchAliases.searchAliases || [],
    supportingQuestions: supportingQuestions.supportingQuestions || [],
    learningPaths: learningPaths.learningPaths || [],
    resolvePublicationContext,
    sourcePaths: Object.freeze({
      blueprintRegistryPath, freezePath, nodeRegistryPath, bookRegistryPath, partRegistryPath,
      ownershipPath, localizedPath, aliasesPath, questionsPath, readingPathsPath
    })
  });
}
