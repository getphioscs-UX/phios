import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { buildKnowledgeRuntimeIndex } from '../../knowledge-runtime.mjs';
import { loadKnrRegistryAuthority } from '../knowledge-runtime/registry-consumer.mjs';

const readJson = file => JSON.parse(fs.readFileSync(file, 'utf8'));
const stable = value => JSON.stringify(value, null, 2) + '\n';
export const sha256 = source => crypto.createHash('sha256').update(source.replace(/^\uFEFF/, '').replace(/\r\n?/g, '\n'), 'utf8').digest('hex');
const envelope = (type, records, extra = {}) => ({ contract: 'PHI-OS-PUBLIC-KNOWLEDGE-PROJECTION-v1.0.0', authority: 'published-only-rebuildable-read-model', type, recordCount: records.length, ...extra, records });

export function buildPublishedKnowledgeProjection(root = process.cwd()) {
  const authority = loadKnrRegistryAuthority(root);
  const runtime = buildKnowledgeRuntimeIndex();
  const nodes = runtime['nodes-index.json'].records;
  const articles = runtime['publications-index.json'].records;
  const aliases = runtime['aliases-index.json'].records;
  const publishedNodeCodes = [...new Set(nodes.map(x => x.nodeCode))].sort();
  const publishedParts = [...new Set(nodes.map(x => x.publicationPartCode))].sort();
  const publishedBooks = [...new Set(nodes.map(x => x.publicationBookCode))].sort();
  const localeAvailability = publishedNodeCodes.map(nodeCode => {
    const records = nodes.filter(x => x.nodeCode === nodeCode);
    return { nodeCode, locales: [...new Set(records.map(x => x.locale))].sort(), articleCodes: records.map(x => x.articleCode).sort() };
  });
  const bookRecords = [...authority.books.entries()].map(([bookCode, book]) => ({
    bookCode, volume: book.volume, title: book.title, subtitle: book.subtitle, status: book.status,
    hasPublishedKnowledge: publishedBooks.includes(bookCode),
    publishedNodeCount: publishedNodeCodes.filter(code => nodes.some(x => x.nodeCode === code && x.publicationBookCode === bookCode)).length,
    publishedArticleCount: articles.filter(x => x.publicationBookCode === bookCode).length
  }));
  const partRecords = [...authority.parts.entries()].filter(([code]) => code !== 'P0').map(([partCode, part]) => ({
    partCode, number: part.number, bookCode: part.book === 'cross-volume' ? 'CROSS-VOLUME' : String(part.book).replace(/^book-/i, 'BOOK-').toUpperCase(),
    title: part.title, status: part.status, contentStatus: part.content_status || null,
    hasPublishedKnowledge: publishedParts.includes(partCode),
    publishedNodeCount: publishedNodeCodes.filter(code => nodes.some(x => x.nodeCode === code && x.publicationPartCode === partCode)).length,
    publishedArticleCount: articles.filter(x => x.publicationPartCode === partCode).length
  }));
  const readingPathsSource = readJson(path.join(root, 'content/knowledge/registry/learning-paths.json')).learningPaths || [];
  const readingPaths = readingPathsSource.filter(x => x.audience === 'public').map(x => ({ ...x, nodeCodes: x.nodeCodes.filter(code => publishedNodeCodes.includes(code)) })).filter(x => x.nodeCodes.length);
  const catalog = [{
    catalogCode: 'PUBLIC-KNOWLEDGE-CATALOG', version: '1.0.0',
    registeredNodeCount: authority.nodes.size, publishedNodeCount: publishedNodeCodes.length,
    publishedArticleCount: articles.length, publishedBookCount: publishedBooks.length,
    publishedPartCount: publishedParts.length, locales: [...new Set(nodes.map(x => x.locale))].sort(),
    policy: { registryPresenceEqualsPublication: false, requiresContentReviewed: true, requiresApproved: true, requiresPublished: true }
  }];
  return {
    'public-knowledge-catalog.json': envelope('catalog', catalog),
    'published-nodes.json': envelope('published-nodes', nodes),
    'published-articles.json': envelope('published-articles', articles),
    'public-book-metadata.json': envelope('public-book-metadata', bookRecords),
    'public-part-metadata.json': envelope('public-part-metadata', partRecords),
    'public-aliases.json': envelope('public-aliases', aliases),
    'public-reading-paths.json': envelope('public-reading-paths', readingPaths),
    'locale-availability.json': envelope('locale-availability', localeAvailability)
  };
}

export function writePublishedKnowledgeProjection(root = process.cwd()) {
  const output = buildPublishedKnowledgeProjection(root);
  const directory = path.join(root, 'content/knowledge/public');
  fs.mkdirSync(directory, { recursive: true });
  for (const [name, value] of Object.entries(output)) fs.writeFileSync(path.join(directory, name), stable(value));
  return output;
}
