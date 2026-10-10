import fs from 'node:fs';
import assert from 'node:assert/strict';

const file='scripts/check-pja-w2d-article-renderer-expansion.mjs';
let source=fs.readFileSync(file,'utf8').replace(/\r\n?/g,'\n');

const stale=`assert.equal(book6BilingualRelease.humanDecision,'PENDING_HUMAN_REVIEW');`;
const replacement=`const book6SemanticParity = await readJson(
  'content/books/book-6/articles/semantic-parity-v1.json'
);
const book6HumanReview = await readJson(
  'content/books/book-6/review/b6-web-b-human-review-results-v1.json'
);
assert.equal(
  book6SemanticParity.overallStatus,
  'HUMAN_SEMANTIC_PARITY_ACCEPTED'
);
assert.equal(
  book6SemanticParity.humanDecision,
  'APPROVED_28_OF_28'
);
assert.equal(book6HumanReview.overallStatus,'ALL_APPROVED');
assert.equal(book6HumanReview.decisions.length,28);
assert.ok(book6HumanReview.decisions.every(row=>row.decision==='APPROVED'));
assert.equal(
  book6BilingualRelease.humanDecision,
  book6SemanticParity.humanDecision
);`;

if(source.includes(stale)){
  source=source.replace(stale,replacement);
} else if(!source.includes("book6SemanticParity.overallStatus")){
  throw new Error('PATCH_CONTEXT_MISMATCH:book6 human decision assertion');
}

assert.ok(source.includes("'HUMAN_SEMANTIC_PARITY_ACCEPTED'"));
assert.ok(source.includes("'APPROVED_28_OF_28'"));
assert.ok(source.includes("content/books/book-6/review/b6-web-b-human-review-results-v1.json"));
assert.ok(!source.includes("assert.equal(book6BilingualRelease.humanDecision,'PENDING_HUMAN_REVIEW');"));

fs.writeFileSync(file,source);
console.log('Applied PJA-W2D Book VI human-decision authority reconciliation v3.');
