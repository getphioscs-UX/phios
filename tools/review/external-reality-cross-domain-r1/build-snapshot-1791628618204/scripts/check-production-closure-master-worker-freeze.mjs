// Reproduce the unchanged owner-preservation assertion directly, without generating fixtures/manuscripts.
import fs from 'node:fs';import assert from 'node:assert/strict';import crypto from 'node:crypto';
const p='docs/acceptance/bazi-paid-report/deep-manuscript-r2/REPOSITORY-AUDIT.json',audit=JSON.parse(fs.readFileSync(p));
const sha=p=>crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
for(const o of audit.owners.filter(o=>!o.classification.startsWith('NEW_'))){assert(o.exists,o.path);assert.equal(sha(o.path),o.sha256,o.path);}
console.log('PASS unchanged BDM repository owner preservation assertion; no manuscript generation.');
