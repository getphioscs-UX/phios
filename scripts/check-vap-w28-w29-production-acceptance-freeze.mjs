import assert from 'node:assert/strict';
import fs from 'node:fs';
import { acceptancePath, freezePath } from './lib/visual-article-production/production-visual-acceptance-freeze-v1.mjs';
const w28=JSON.parse(fs.readFileSync(acceptancePath,'utf8')); const w29=JSON.parse(fs.readFileSync(freezePath,'utf8'));
assert.equal(w28.work,'VAP-W28'); assert.equal(w28.automatedEvidence.rendererContractValid,true);
assert(['BLOCKED_BY_PRODUCTION_EVIDENCE','AWAITING_TL_INTERACTIVE_BROWSER_ACCEPTANCE','ACCEPTED'].includes(w28.status));
assert.equal(w29.work,'VAP-W29');
if(w28.status==='ACCEPTED'){assert.equal(w29.status,'FROZEN');assert.equal(w29.executionPerformed,true);}else{assert.equal(w29.status,'BLOCKED_BY_W28');assert.equal(w29.executionPerformed,false);}
const checkerSource=fs.readFileSync('scripts/check-vap-w28-w29-production-acceptance-freeze.mjs','utf8');
assert.equal(/fs\.(?:writeFileSync|writeFile|rename|mkdir)\s*\(/.test(checkerSource),false);
console.log(`✓ VAP-W28 ${w28.status}; Renderer contract valid and browser acceptance remains human-controlled.`);
console.log(`✓ VAP-W29 ${w29.status}; freeze cannot precede accepted production visual evidence.`);
