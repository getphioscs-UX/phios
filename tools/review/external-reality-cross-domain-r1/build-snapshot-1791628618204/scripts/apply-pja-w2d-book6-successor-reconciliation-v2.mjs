import fs from 'node:fs';
import assert from 'node:assert/strict';

const file='scripts/check-pja-w2d-article-renderer-expansion.mjs';
let source=fs.readFileSync(file,'utf8').replace(/\r\n?/g,'\n');

function requireMatch(ok,label){
  assert.ok(ok,`PATCH_CONTEXT_MISMATCH:${label}`);
}

// 1) Add Book VI release manifest declaration if it is not already present.
if(!source.includes('const book6BilingualRelease = await readJson(')){
  const anchor = `const book5BilingualRelease = await readJson(
  'content/knowledge/public/successors/book5-publication-v1/visual-article-release.json'
);
`;
  requireMatch(source.includes(anchor),'book5 declaration');
  const addition = anchor + `const book6BilingualRelease = await readJson(
  'content/knowledge/public/successors/book6-publication-v1/visual-article-release.json'
);
const book6PjaReconciliation = await readJson(
  'content/knowledge/reconciliation/pja-w2d/pja-w2d-book6-publication-successor-v1.json'
);
assert.equal(
  book6PjaReconciliation.status,
  'ACTIVE_SUCCESSOR_AWARE_HISTORICAL_CHECKER_RECONCILIATION'
);
assert.equal(
  book6PjaReconciliation.successorRule.requiredManifestStatus,
  book6BilingualRelease.status
);
assert.equal(book6BilingualRelease.bookCode,'BOOK-6');
assert.equal(book6BilingualRelease.records.length,56);
assert.equal(
  book6BilingualRelease.records.filter(record=>record.locale==='zh-Hans').length,
  28
);
assert.equal(
  book6BilingualRelease.records.filter(record=>record.locale==='en').length,
  28
);
assert.equal(book6BilingualRelease.humanDecision,'PENDING_HUMAN_REVIEW');
`;
  source = source.replace(anchor, addition);
}

// 2) Add Book VI to the exact governed successor release set.
if(!source.includes('...(book6BilingualRelease.records || [])')){
  const anchor = `  ...(book5BilingualRelease.records || [])
].filter(record => record.status === 'published');`;
  requireMatch(source.includes(anchor),'successor release array');
  source = source.replace(
    anchor,
    `  ...(book5BilingualRelease.records || []),
  ...(book6BilingualRelease.records || [])
].filter(record => record.status === 'published');`
  );
}

// 3) Book VI loader rows are publication metadata. Resolve the real body before
// successor body assertions. Use a line-regex so slash escaping in the old
// readJson(release.path.replace(...)) expression cannot break the patch.
if(!source.includes("release.identityClass === 'PUBLICATION_ARTICLE_IDENTITY_NOT_CANONICAL_KNOWLEDGE_NODE'")){
  const publicArticleLine =
    /^  const publicArticle = metadata\.metadataOnly \? .* : metadata;$/m;
  requireMatch(publicArticleLine.test(source),'metadata-only successor body resolution');
  source = source.replace(
    publicArticleLine,
`  const successorMetadataOnly = (
    metadata.metadataOnly === true ||
    release.metadataOnly === true ||
    release.identityClass === 'PUBLICATION_ARTICLE_IDENTITY_NOT_CANONICAL_KNOWLEDGE_NODE'
  );
  const publicArticle = successorMetadataOnly
    ? await readJson(release.path.replace(/^\\//,''))
    : metadata;`
  );
}

// 4) Update only the explanatory console message if the historical wording is present.
source = source.replace(
  `  '  Frozen Registries, six production Articles and KN-PREFACE-001 publication state remain unchanged.'
);`,
  `  '  Frozen predecessor Articles remain unchanged; governed Book IV/V/VI successor releases are validated separately.'
);`
);

// Final structural proof before writing.
requireMatch(
  source.includes("content/knowledge/public/successors/book6-publication-v1/visual-article-release.json"),
  'book6 manifest present'
);
requireMatch(
  source.includes('...(book6BilingualRelease.records || [])'),
  'book6 release set present'
);
requireMatch(
  source.includes("release.identityClass === 'PUBLICATION_ARTICLE_IDENTITY_NOT_CANONICAL_KNOWLEDGE_NODE'"),
  'book6 body resolution present'
);

fs.writeFileSync(file,source);
console.log('Applied PJA-W2D Book VI successor-aware reconciliation v2.');
