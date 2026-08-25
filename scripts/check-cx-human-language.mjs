import assert from 'node:assert/strict';import fs from 'node:fs';
const html=fs.readFileSync('perspectives/personal/index.html','utf8');
const visible=[...html.matchAll(/data-cx-(?:en|zh)="([^"]*)"/g)].map(m=>m[1]).join('\n')+'\n'+html.replace(/<script[\s\S]*?<\/script>/gi,'').replace(/<style[\s\S]*?<\/style>/gi,'').replace(/<[^>]+>/g,' ');
const forbidden=[/CanonicalMethodProjection/i,/projection contract/i,/execution authority/i,/production eligible/i,/reasonCodes?/i,/successor/i,/fail[- ]closed/i,/runtime version/i,/projection version/i,/\bMPA\b/,/\bMCD\b/,/\bCMR\b/];
for(const pattern of forbidden)assert.equal(pattern.test(visible),false,`customer-visible internal language leaked: ${pattern}`);
assert.match(visible,/现实|life/i);assert.match(visible,/观察|observe/i);assert.match(visible,/不知道|unknown|open/i);
console.log('✓ CX human-language gate passed: Personal Reality visible copy is written for people, not internal system operators.');
