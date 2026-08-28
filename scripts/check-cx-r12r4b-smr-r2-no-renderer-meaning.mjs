import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
const root='functions/single-method-reading-r2';
const rendererFiles=fs.readdirSync(root).filter(name=>/render/i.test(name));
assert.deepEqual(rendererFiles,[],`R2 renderer introduced before W9/W10: ${rendererFiles.join(',')}`);
const claimRuntime=fs.readFileSync(path.join(root,'customer-claim-ir.js'),'utf8');assert.match(claimRuntime,/headline:unit\.title/);assert.match(claimRuntime,/structuralMeaning:unit\.summary\|\|unit\.plainLanguageExplanation\|\|unit\.body/);assert.match(claimRuntime,/rendererCreatedClaim:false/);
for(const dir of ['assets/js','functions/customer-projection']){if(!fs.existsSync(dir))continue;for(const name of fs.readdirSync(dir).filter(x=>x.endsWith('.js'))){const text=fs.readFileSync(path.join(dir,name),'utf8');assert.equal(text.includes('SMR2-CLAIM-'),false,`${dir}/${name} creates an R2 claim outside Claim IR`)}}
console.log('✓ CX-R12R4B SMR-R2 W2 no-renderer-created-meaning boundary passed.');
