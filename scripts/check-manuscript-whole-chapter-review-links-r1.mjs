import fs from'node:fs';import path from'node:path';import assert from'node:assert/strict';
const file='content/production-closure/live-customer-commercial-convergence/MASTER-HUMAN-REVIEW.html';
const section=fs.readFileSync(file,'utf8').match(/<section id="seven-book-current-consumer-reconciliation">[\s\S]*?<\/section>/)?.[0];assert(section);
const missing=[...section.matchAll(/href="([^"]+)"/g)].filter(m=>!fs.existsSync(path.resolve(path.dirname(file),m[1]))).map(m=>m[1]);assert.equal(missing.length,0,JSON.stringify(missing));
console.log(JSON.stringify({canonicalReviewSection:true,brokenLocalLinks:missing,providerCalls:0}));
