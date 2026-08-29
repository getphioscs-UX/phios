import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
const dir='functions/single-method-reading';
const files=fs.readdirSync(dir).filter(name=>name.endsWith('.js')).sort();
const forbiddenImports=[/canonical-projection-runtime/i,/bazi-full-production/i,/zi-wei-dynamic/i,/astrology-runtime/i,/numerology-runtime/i,/embodied-configuration\/ecr-calculation/i,/executeAndProject/i,/astronomy/i];
for(const file of files){const text=fs.readFileSync(path.join(dir,file),'utf8');for(const pattern of forbiddenImports)assert.equal(pattern.test(text),false,`${file} duplicates method runtime authority via ${pattern}`)}
for(const forbiddenName of ['astrology-r2-runtime.js','bazi-r2-runtime.js','ziwei-r2-runtime.js','numerology-r2-runtime.js'])assert.equal(fs.existsSync(path.join(dir,forbiddenName)),false);
console.log('✓ CX-R12R4B SMR-R2 W1 no-duplicate-method-runtime boundary passed.');
