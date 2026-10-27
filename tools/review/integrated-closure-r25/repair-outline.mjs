import fs from 'node:fs';import assert from 'node:assert/strict';
const d='tools/review/integrated-closure-r25',source='.worktrees/pr6-ebook-closure/tools/review/knowledge-answer-quality-r1/book-pdf-delivery/pdf-fixture.py';
let py=fs.readFileSync(source,'utf8');assert(py.includes('for page in reader.pages:')&&py.includes('writer.add_page(page)'));
py=py.replace(" for page in reader.pages:"," writer.append(reader,import_outline=True)\n for page in writer.pages:").replace(';writer.add_page(page)','');
fs.writeFileSync(d+'/pdf-watermark-candidate.py',py);
const old='tools/review/knowledge-answer-quality-r1/book-pdf-delivery/pdf-fixture.py',fresh='C:/phios/'+d+'/pdf-watermark-candidate.py';let runner=fs.readFileSync(d+'/pr6-full-size-local.mjs','utf8');runner=runner.replaceAll(old,fresh);fs.writeFileSync(d+'/pr6-full-size-local.mjs',runner);
for(const name of ['TRUSTED-METADATA-LOCAL-QA.json','EBOOK-PDF-INTEGRITY.json','pr6-full-size-local.log']){const folder=d+'/before-outline-repair';fs.mkdirSync(folder,{recursive:true});fs.copyFileSync(d+'/'+name,folder+'/'+name);}
