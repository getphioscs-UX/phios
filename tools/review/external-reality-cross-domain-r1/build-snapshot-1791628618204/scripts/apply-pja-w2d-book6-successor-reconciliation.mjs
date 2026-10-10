import fs from 'node:fs';
import assert from 'node:assert/strict';

const file='scripts/check-pja-w2d-article-renderer-expansion.mjs';
let source=fs.readFileSync(file,'utf8').replace(/\r\n?/g,'\n');

const replaceOnce=(before,after,label)=>{
  const count=source.split(before).length-1;
  assert.equal(count,1,`PATCH_CONTEXT_MISMATCH:${label}:${count}`);
  source=source.replace(before,after);
};

replaceOnce(
`const book5BilingualRelease = await readJson(
  'content/knowledge/public/successors/book5-publication-v1/visual-article-release.json'
);
const publishedArticleIndex = await readJson(`,
`const book5BilingualRelease = await readJson(
  'content/knowledge/public/successors/book5-publication-v1/visual-article-release.json'
);
const book6BilingualRelease = await readJson(
  'content/knowledge/public/successors/book6-publication-v1/visual-article-release.json'
);
const book6PjaReconciliation = await readJson(
  'content/knowledge/reconciliation/pja-w2d/pja-w2d-book6-publication-successor-v1.json'
);
assert.equal(book6PjaReconciliation.status,'ACTIVE_SUCCESSOR_AWARE_HISTORICAL_CHECKER_RECONCILIATION');
assert.equal(book6PjaReconciliation.successorRule.requiredManifestStatus,book6BilingualRelease.status);
assert.equal(book6BilingualRelease.bookCode,'BOOK-6');
assert.equal(book6BilingualRelease.records.length,56);
assert.equal(book6BilingualRelease.records.filter(record=>record.locale==='zh-Hans').length,28);
assert.equal(book6BilingualRelease.records.filter(record=>record.locale==='en').length,28);
assert.equal(book6BilingualRelease.humanDecision,'PENDING_HUMAN_REVIEW');
const publishedArticleIndex = await readJson(`,
'book6 manifest declaration'
);

replaceOnce(
`  ...(book4BilingualRelease.records || []),
  ...(book5BilingualRelease.records || [])
].filter(record => record.status === 'published');`,
`  ...(book4BilingualRelease.records || []),
  ...(book5BilingualRelease.records || []),
  ...(book6BilingualRelease.records || [])
].filter(record => record.status === 'published');`,
'book6 successor release inclusion'
);

replaceOnce(
`  const publicArticle = metadata.metadataOnly ? await readJson(release.path.replace(/^\//,'')) : metadata;`,
`  const successorMetadataOnly = (
    metadata.metadataOnly === true ||
    release.metadataOnly === true ||
    release.identityClass === 'PUBLICATION_ARTICLE_IDENTITY_NOT_CANONICAL_KNOWLEDGE_NODE'
  );
  const publicArticle = successorMetadataOnly
    ? await readJson(release.path.replace(/^\//,''))
    : metadata;`,
'metadata-only successor body resolution'
);

replaceOnce(
`  '  Frozen Registries, six production Articles and KN-PREFACE-001 publication state remain unchanged.'
);`,
`  '  Frozen predecessor Articles remain unchanged; governed Book IV/V/VI successor releases are validated separately.'
);`,
'final console wording'
);

fs.writeFileSync(file,source);
console.log('Applied PJA-W2D Book VI successor-aware publication reconciliation.');
