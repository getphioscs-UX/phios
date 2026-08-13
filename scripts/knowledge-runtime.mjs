import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import { loadKnrRegistryAuthority } from './lib/knowledge-runtime/registry-consumer.mjs';
import { searchManuscriptCorpus } from '../functions/knowledge-runtime/manuscript-source-runtime.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const ARTICLES = path.join(ROOT, 'content/knowledge/articles');
const REGISTRY = path.join(ROOT, 'content/knowledge/registry');
const INDEX = path.join(ROOT, 'content/knowledge/runtime/index');
const INDEX_FILES = ['nodes-index.json', 'fragments-index.json', 'aliases-index.json', 'relationships-index.json', 'questions-index.json', 'publications-index.json'];

const readJson = file => JSON.parse(fs.readFileSync(file, 'utf8'));
const stable = value => JSON.stringify(value, null, 2) + '\n';
const sortedFiles = directory => fs.readdirSync(directory, { withFileTypes: true })
  .flatMap(entry => entry.isDirectory() ? sortedFiles(path.join(directory, entry.name)) : [path.join(directory, entry.name)])
  .filter(file => file.endsWith('.json')).sort();
const unique = values => [...new Set(values.filter(value => typeof value === 'string' && value.trim()).map(value => value.trim()))].sort();

export function buildKnowledgeRuntimeIndex() {
  const authority = loadKnrRegistryAuthority(ROOT);
  const nodeByCode = authority.nodes;
  const articles = sortedFiles(ARTICLES).map(file => ({ file, value: readJson(file) }));
  const published = articles.filter(({ value }) => value.publicationStatus === 'published' && value.reviewStatus === 'approved' && value.contentStatus === 'content_reviewed');
  const publishedNodeLocales = new Set(published.map(({ value }) => `${value.nodeCode}:${value.locale}`));
  const nodes = [], fragments = [], aliases = [], questions = [], relationships = [], publications = [];

  for (const { value: article } of published.sort((a, b) => `${a.value.nodeCode}:${a.value.locale}`.localeCompare(`${b.value.nodeCode}:${b.value.locale}`))) {
    const canonical = nodeByCode.get(article.nodeCode);
    if (!canonical) throw new Error(`Published article has no canonical node: ${article.nodeCode}`);
    const articleCode = article.assetCode;
    const articleHref = `/articles/${article.slug}`;
    const publicationContext = authority.resolvePublicationContext(article.nodeCode);
    const publicationBook = authority.books.get(publicationContext.publicationBookCode);
    const publicationPart = authority.parts.get(publicationContext.publicationPartCode);
    nodes.push({
      nodeCode: article.nodeCode, articleCode, locale: article.locale, title: article.title,
      displayQuestion: article.displayQuestion, summary: article.summary, themeCode: canonical.themeCode,
      collectionCode: canonical.collectionCode, nodeType: canonical.nodeType, knowledgeLevel: canonical.knowledgeLevel,
      publicationStatus: article.publicationStatus, href: articleHref,
      publicationBookCode: publicationContext.publicationBookCode, publicationPartCode: publicationContext.publicationPartCode
    });
    publications.push({ articleCode, nodeCode: article.nodeCode, locale: article.locale, slug: article.slug, href: articleHref, publishedAt: article.publishedAt, version: article.version, publicationStatus: article.publicationStatus, publicationBookCode: publicationContext.publicationBookCode, publicationPartCode: publicationContext.publicationPartCode, bookTitle: publicationBook?.title?.[article.locale] || publicationBook?.title?.['zh-Hans'] || null, partTitle: publicationPart?.title?.[article.locale] || publicationPart?.title?.['zh-Hans'] || null });
    questions.push({ questionCode: `${articleCode}-QUESTION`, nodeCode: article.nodeCode, articleCode, locale: article.locale, text: article.displayQuestion, publicStatus: 'published' });
    for (const alias of unique([article.title, article.displayQuestion, ...(article.keyConcepts || []), ...(article.seo?.keywords || [])])) {
      aliases.push({ aliasCode: `${articleCode}-ALIAS-${String(aliases.length + 1).padStart(4, '0')}`, nodeCode: article.nodeCode, articleCode, locale: article.locale, text: alias, publicStatus: 'published' });
    }
    (article.sections || []).forEach((section, sectionIndex) => {
      (section.paragraphs || []).forEach((text, paragraphIndex) => fragments.push({
        fragmentCode: `${articleCode}-S${String(sectionIndex + 1).padStart(2, '0')}-P${String(paragraphIndex + 1).padStart(2, '0')}`,
        nodeCode: article.nodeCode, articleCode, locale: article.locale, heading: section.heading, text,
        sequence: sectionIndex * 100 + paragraphIndex + 1, fragmentType: 'article_paragraph', publicStatus: 'published',
        claimCodes: [], sourceCodes: unique((article.sourceReferences || []).map(source => source.sourceCode)),
        themeCode: canonical.themeCode, collectionCode: canonical.collectionCode,
        previousNode: canonical.relationships?.prerequisiteNodeCodes?.at(-1) || null,
        nextNode: canonical.relationships?.nextNodeCodes?.[0] || null,
        relatedNodes: unique([...(canonical.relationships?.relatedNodeCodes || []), ...(article.connections?.relatedArticles || [])]),
        keywords: unique(article.keyConcepts || []), aliases: []
      }));
    });
    for (const [relationType, targets] of Object.entries(canonical.relationships || {})) {
      for (const targetNodeCode of (targets || []).filter(code => publishedNodeLocales.has(`${code}:${article.locale}`))) relationships.push({
        relationshipCode: `${article.nodeCode}-${relationType}-${targetNodeCode}-${article.locale}`,
        fromNodeCode: article.nodeCode, toNodeCode: targetNodeCode, locale: article.locale,
        relationshipType: relationType.replace(/NodeCodes$/, ''), publicStatus: 'published_both_nodes'
      });
    }
  }

  const publishedNodeCodes = new Set(nodes.map(record => record.nodeCode));
  for (const alias of authority.searchAliases) {
    if (!publishedNodeCodes.has(alias.canonicalNodeCode || alias.nodeCode)) continue;
    for (const [locale, value] of Object.entries(alias.locales || {})) {
      const article = published.find(item => item.value.nodeCode === (alias.canonicalNodeCode || alias.nodeCode) && item.value.locale === locale)?.value;
      if (!article) continue;
      aliases.push({ aliasCode: alias.aliasCode, nodeCode: article.nodeCode, articleCode: article.assetCode, locale, text: value.displayAlias || value.alias || value, publicStatus: 'published' });
    }
  }
  for (const question of authority.supportingQuestions) {
    if (!publishedNodeCodes.has(question.canonicalNodeCode)) continue;
    for (const [locale, value] of Object.entries(question.locales || {})) {
      const article = published.find(item => item.value.nodeCode === question.canonicalNodeCode && item.value.locale === locale)?.value;
      if (!article) continue;
      questions.push({ questionCode: question.questionCode, nodeCode: question.canonicalNodeCode, articleCode: article.assetCode, locale, text: value.displayQuestion, publicStatus: 'published_supporting_question' });
    }
  }
  const readingPaths = authority.learningPaths.filter(path => path.audience === 'public').map(path => ({ ...path, nodeCodes: path.nodeCodes.filter(code => publishedNodeCodes.has(code)) })).filter(path => path.nodeCodes.length);
  const envelope = (type, records) => ({ contract: 'PHI-OS-KNR-INDEX-v1.1.0', generatedFrom: 'published-canonical-articles+universal-registries', authority: 'rebuildable-published-only-read-model', registryContract: authority.contract, type, recordCount: records.length, records });
  return {
    'nodes-index.json': envelope('nodes', nodes),
    'fragments-index.json': envelope('fragments', fragments),
    'aliases-index.json': envelope('aliases', aliases),
    'relationships-index.json': envelope('relationships', relationships),
    'questions-index.json': envelope('questions', questions),
    'publications-index.json': envelope('publications', publications)
  };
}

export function applyKnowledgeRuntimeIndex({ dryRun = true } = {}) {
  const output = buildKnowledgeRuntimeIndex();
  const changes = INDEX_FILES.filter(name => {
    const file = path.join(INDEX, name);
    return !fs.existsSync(file) || fs.readFileSync(file, 'utf8') !== stable(output[name]);
  });
  if (!dryRun && changes.length) {
    fs.mkdirSync(INDEX, { recursive: true });
    for (const name of changes) {
      const target = path.join(INDEX, name);
      const temporary = `${target}.tmp-${process.pid}`;
      fs.writeFileSync(temporary, stable(output[name]), 'utf8');
      fs.renameSync(temporary, target);
    }
  }
  return { mode: dryRun ? 'dry-run' : 'apply', changed: changes, counts: Object.fromEntries(INDEX_FILES.map(name => [name.replace('-index.json', ''), output[name].recordCount])) };
}

function option(args, name, fallback = null) {
  const index = args.indexOf(name);
  return index >= 0 && args[index + 1] ? args[index + 1] : fallback;
}

function resolvePrivateCorpus(corpusRoot, objectKey) {
  const candidates = [
    path.join(corpusRoot, objectKey),
    path.join(corpusRoot, objectKey.replace(/^books[\\/]/, ''))
  ];
  return candidates.find(fs.existsSync) || null;
}

export function queryLocalManuscriptKnowledge({ query, locale = 'zh-Hans', corpusRoot }) {
  if (!query?.trim()) throw new Error('Knowledge query requires --q <question>.');
  if (!corpusRoot || !fs.existsSync(corpusRoot)) throw new Error('Knowledge query requires --corpus-dir <private corpus directory> or KSAR_PRIVATE_CORPUS_DIR.');
  const sources = readJson(path.join(ROOT, 'content/knowledge/source-access/registries/manuscript-knowledge-source-registry-v1.json'));
  const bindings = readJson(path.join(ROOT, 'content/knowledge/source-access/registries/manuscript-section-canonical-binding-v1.json'));
  const readability = readJson(path.join(ROOT, 'content/knowledge/source-access/registries/manuscript-readability-review-v1.json'));
  const records = [];
  for (const source of sources.records.filter(record => record.locale === locale)) {
    const file = resolvePrivateCorpus(corpusRoot, source.r2ObjectKey);
    if (!file) throw new Error(`Private corpus missing: ${source.r2ObjectKey}`);
    const corpus = readJson(file);
    records.push(...searchManuscriptCorpus({ corpus, source, bindings, readability, query }));
  }
  records.sort((a,b) => b.score-a.score || a.sectionCode.localeCompare(b.sectionCode));
  return {
    runtime: 'KSAR_LOCAL_MANUSCRIPT_QUERY',
    query: { text: query, locale },
    coverage: records.length ? 'manuscript' : 'none',
    records: records.slice(0, 4)
  };
}

function runFixtures() {
  const source = { sourceCode:'FIXTURE',bookCode:'BOOK-2',title:'Fixture',titleEn:'Fixture',bookRoute:'/books/fixture/' };
  const corpus = { records:[
    {sectionCode:'FIX-P5-001',segmentType:'SECTION',partCode:'P5',sequence:1,heading:'Runtime Visibility',startPage:1,endPage:2,textSha256:'a'.repeat(64),text:'运行并不等于体验。意识可以被理解为运行中形成的可见层。'},
    {sectionCode:'FIX-P5-002',segmentType:'SECTION',partCode:'P5',sequence:2,heading:'Experience Emergence',startPage:3,endPage:4,textSha256:'b'.repeat(64),text:'现实进入体验之前，会经过筛选、组织与投影。'}
  ]};
  const records = searchManuscriptCorpus({ corpus, source, query:'意识如何形成体验' });
  if (!records.length) throw new Error('KSAR fixture query returned no result.');
  return { runtime:'KSAR_FIXTURES', passed:true, resultCount:records.length, firstSectionCode:records[0].sectionCode };
}

function main() {
  const [operation, ...args] = process.argv.slice(2);
  if (operation === 'index') {
    const apply = args.includes('--apply');
    if (apply && args.includes('--dry-run')) throw new Error('Choose either --apply or --dry-run.');
    console.log(JSON.stringify(applyKnowledgeRuntimeIndex({ dryRun: !apply }), null, 2));
    return;
  }
  if (operation === 'fixtures') {
    console.log(JSON.stringify(runFixtures(), null, 2));
    return;
  }
  if (operation === 'query' || operation === 'evaluate') {
    const query = option(args, '--q');
    const locale = option(args, '--locale', 'zh-Hans');
    const corpusRoot = path.resolve(option(args, '--corpus-dir', process.env.KSAR_PRIVATE_CORPUS_DIR || ''));
    const result = queryLocalManuscriptKnowledge({ query, locale, corpusRoot });
    console.log(JSON.stringify(operation === 'evaluate' ? {
      ...result,
      evaluation: {
        sourceCount: result.records.length,
        approvedCanonicalBindings: result.records.filter(record => record.canonicalBinding.status === 'APPROVED').length,
        pendingCanonicalBindings: result.records.filter(record => record.canonicalBinding.status !== 'APPROVED').length,
        cautionSources: result.records.filter(record => record.readability?.runtimeEligibility === 'SOURCE_ONLY_WITH_CAUTION').length
      }
    } : result, null, 2));
    return;
  }
  console.error(`Unknown knowledge runtime operation: ${operation || 'missing operation'}. Supported: index, query, evaluate, fixtures.`);
  process.exitCode = 2;
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main();
