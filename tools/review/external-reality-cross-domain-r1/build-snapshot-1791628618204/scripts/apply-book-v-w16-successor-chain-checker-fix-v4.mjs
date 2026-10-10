import fs from 'node:fs';
import assert from 'node:assert/strict';

const file='scripts/check-book-v-civ-atlas-r1-w16-production-freeze.mjs';
let source=fs.readFileSync(file,'utf8').replace(/\r\n?/g,'\n');

const stale=`assert.equal(digest(bookViDataSuccessorV2.change.path),bookViDataSuccessorV2.change.successorSha256,'Book VI atlas-data successor v2 digest drift');`;
const replacement=`assert.match(
  bookViDataSuccessorV2.change.successorSha256,
  /^[0-9a-f]{64}$/,
  'Book VI atlas-data successor v2 must retain a valid historical digest'
);`;

if(source.includes(stale)){
  source=source.replace(stale,replacement);
} else if(!source.includes("successor v2 must retain a valid historical digest")){
  throw new Error('PATCH_CONTEXT_MISMATCH:BOOK_VI_V2_HISTORICAL_DIGEST_ASSERTION');
}

// Guard against the same category of bug being reintroduced for v1/v2.
assert.ok(
  !source.includes("digest(bookViDataSuccessorV2.change.path),bookViDataSuccessorV2.change.successorSha256"),
  'Intermediate successor v2 must not be compared to the current file digest'
);

// The latest successor remains the only current-file digest assertion.
assert.ok(
  source.includes("digest(bookViDataSuccessorV3.change.path),bookViDataSuccessorV3.change.successorSha256"),
  'Final successor v3 must still bind the current file digest'
);

fs.writeFileSync(file,source);
console.log('Applied W16 successor-chain checker fix: intermediate v2 is historical; current file remains bound to v3.');
