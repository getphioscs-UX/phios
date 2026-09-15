import fs from 'node:fs';
import assert from 'node:assert/strict';

// Reuse the book-specific contracts without recursive npm processes or stage recording.
assert.equal(process.argv.includes('--record'),false,'W68_DOES_NOT_REWRITE_EARLIER_STAGE_ACCEPTANCE');
const pkg=JSON.parse(fs.readFileSync('package.json','utf8'));
for(let book=1;book<=4;book++){
 const script=`check-b14-sks-book${book}.mjs`;
 assert.equal(pkg.scripts[`check:b14-sks:book${book}`],`node scripts/${script}`,'BOOK_CHECK_ALIAS_DRIFT');
 await import(`./${script}`);
}
console.log('✓ W68: four canonical book-check commands and all four existing book-specific contracts passed. Human decisions and definition imports remain separate.');
