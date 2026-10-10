import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { buildApsPublishedKnowledgeAuthoritySuccessor } from './lib/article-simplification/published-authority-successor-v1.mjs';
import { activeEditorialRevisions, shaText } from './lib/article-editorial-revision/article-editorial-revision-v1.mjs';
import { buildPublishedRetrievalIndex } from './lib/knowledge-public/published-retrieval-index-v1.mjs';

const root = process.cwd(), revisions = activeEditorialRevisions(root);
const actualAuthority = JSON.parse(fs.readFileSync(path.join(root, 'content/knowledge/public/authority/published-knowledge-authority.json'), 'utf8'));
const expectedAuthority = buildApsPublishedKnowledgeAuthoritySuccessor(root).registry;
assert.deepEqual(actualAuthority, expectedAuthority, 'Published Knowledge Authority must equal governed successor + editorial revision overlay');
const forbiddenZh = '第二册《世界如何运行》开始把第一册建立的现实形成结构推进到持续运行层。';
const forbiddenEn = 'Volume II, *Reality Runtime*, moves from the formation of reality into the question of how formed reality continues to operate.';
for (const revision of revisions) {
  const authority = actualAuthority.records.find(r => r.nodeCode === revision.nodeCode && r.locale === revision.locale);
  assert(authority, `${revision.revisionCode}: authority missing`);
  assert.equal(shaText(authority.article.bodyMarkdown), revision.replacementBodyDigest);
  assert.equal(authority.editorialRevision?.revisionCode, revision.revisionCode);
  assert.equal(authority.lineage.publicationDigest, revision.sourcePublicationDigest, 'Publication lineage must remain immutable');
  const rel = `content/knowledge/public/visual-articles/${revision.locale}/${authority.article.slug}.json`;
  const article = JSON.parse(fs.readFileSync(path.join(root, rel), 'utf8'));
  const publicText = JSON.stringify(article);
  assert.equal(publicText.includes(forbiddenZh), false, `${revision.revisionCode}: zh internal meta remains public`);
  assert.equal(publicText.includes(forbiddenEn), false, `${revision.revisionCode}: en internal meta remains public`);
  assert.equal(article.contentRevision?.revisionCode, revision.revisionCode);
  assert.equal(article.provenance?.lineage?.publicationDigest, revision.sourcePublicationDigest, 'Visual article publication lineage must remain immutable');
  const localeTag = String(revision.locale).toUpperCase().replace(/[^A-Z0-9]+/g, '-');
  const presentation = JSON.parse(fs.readFileSync(path.join(root, `content/production/cpr/presentations/PRESENTATION-ARTICLE-${revision.nodeCode}-${localeTag}-BFA-v1.json`), 'utf8'));
  assert.equal(presentation.inputs?.publishedArticle?.authorityDigest, authority.authorityDigest, `${revision.revisionCode}: CPR authority digest stale`);
}
const expectedIndex = await buildPublishedRetrievalIndex();
const actualIndex = JSON.parse(fs.readFileSync(path.join(root, 'content/knowledge/public/retrieval/published-retrieval-index.json'), 'utf8'));
assert.deepEqual(actualIndex, expectedIndex.manifest, 'Published retrieval manifest must include editorial revision authority digest');
console.log(`✓ Public Article Editorial Revision lane passed: ${revisions.length} active presentation-only repairs; immutable BFA publication lineage preserved.`);
