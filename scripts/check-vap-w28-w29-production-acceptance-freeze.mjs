import assert from 'node:assert/strict';import fs from 'node:fs';
import {W28_PATH,W29_PATH,buildW29,validateRecord} from './lib/visual-article-production/production-visual-acceptance-freeze-v1.mjs';
const w25=JSON.parse(fs.readFileSync('content/production/visual-article/release/candidates/VAC-KN-PREFACE-001-ZH-HANS-v1.json','utf8'));assert.equal(w25.status,'READY_FOR_RELEASE');assert(Object.values(w25.gates).every(Boolean));
const w26=JSON.parse(fs.readFileSync('content/production/visual-article/release/authority/VAP-W26-KN-PREFACE-001-ZH-HANS.json','utf8'));assert.equal(w26.status,'EXECUTED');assert.equal(w26.executionPerformed,true);for(const key of ['title','summary','body','figureReferences','href','slug','version','lineage'])assert(w26[key],key);
const w27=JSON.parse(fs.readFileSync('content/production/visual-article/release/website/VAP-W27-KN-PREFACE-001-ZH-HANS.json','utf8'));assert.equal(w27.status,'EXECUTED');assert.equal(w27.executionPerformed,true);
const w28=validateRecord(JSON.parse(fs.readFileSync(W28_PATH,'utf8')),'acceptanceDigest');
assert.equal(w28.executionPerformed,true);assert.equal(w28.automatedEvidence.allAutomatedPassed,true);assert(Object.values(w28.automatedEvidence.automated).every(Boolean));
const w29=validateRecord(JSON.parse(fs.readFileSync(W29_PATH,'utf8')),'freezeDigest');assert.deepEqual(w29,buildW29({w28}));
if(w28.status==='ACCEPTED'){assert.equal(w29.status,'FROZEN');assert.equal(w29.executionPerformed,true);}else{assert.equal(w28.status,'AWAITING_TL_INTERACTIVE_BROWSER_ACCEPTANCE');assert.equal(w29.status,'BLOCKED_BY_W28_INTERACTIVE_ACCEPTANCE');assert.equal(w29.executionPerformed,false);}
const source=fs.readFileSync('scripts/check-vap-w28-w29-production-acceptance-freeze.mjs','utf8');for(const name of ['writeFileSync','writeFile','rename','mkdir','fetch'])assert.equal(new RegExp(`(?:fs\\.)?${name}\\s*\\(`).test(source),false);
console.log('✓ VAP-W25 READY, VAP-W26 authority projected and VAP-W27 website release executed.');console.log(`✓ VAP-W28 automated production acceptance passed; interactive state=${w28.status}.`);console.log(`✓ VAP-W29 freeze gate=${w29.status}; checker remains read-only.`);
