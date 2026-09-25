import fs from 'node:fs';
import assert from 'node:assert/strict';

const file='books/reality-configuration/index.html';
let source=fs.readFileSync(file,'utf8').replace(/\r\n?/g,'\n');

const startMarker='<!-- PIS BOOK CONTEXT START -->';
const endMarker='<!-- PIS BOOK CONTEXT END -->';
const sectionStart='<section class="pis-editorial"';

const starts=(source.match(/<section class="pis-editorial"/g)||[]).length;
assert.equal(starts,1,'BOOK6_PIS_EDITORIAL_SECTION_COUNT');

const originalSectionStart=source.indexOf(sectionStart);
assert.ok(originalSectionStart>=0,'BOOK6_PIS_EDITORIAL_SECTION_MISSING');
const originalSectionEnd=source.indexOf('</section>',originalSectionStart);
assert.ok(originalSectionEnd>=0,'BOOK6_PIS_EDITORIAL_SECTION_UNCLOSED');
const originalSection=source.slice(originalSectionStart,originalSectionEnd+'</section>'.length);

if(!source.includes(startMarker)){
  source=source.slice(0,originalSectionStart)+startMarker+source.slice(originalSectionStart);
}

if(!source.includes(endMarker)){
  const newSectionStart=source.indexOf(sectionStart);
  const newSectionEnd=source.indexOf('</section>',newSectionStart);
  const insertAt=newSectionEnd+'</section>'.length;
  source=source.slice(0,insertAt)+endMarker+source.slice(insertAt);
}

assert.equal((source.match(/PIS BOOK CONTEXT START/g)||[]).length,1);
assert.equal((source.match(/PIS BOOK CONTEXT END/g)||[]).length,1);

const finalSectionStart=source.indexOf(sectionStart);
const finalSectionEnd=source.indexOf('</section>',finalSectionStart);
const finalSection=source.slice(finalSectionStart,finalSectionEnd+'</section>'.length);
assert.equal(finalSection,originalSection,'BOOK6_PIS_EDITORIAL_CONTENT_CHANGED');

fs.writeFileSync(file,source);
console.log('Applied Book VI PIS context marker repair; editorial content unchanged.');
