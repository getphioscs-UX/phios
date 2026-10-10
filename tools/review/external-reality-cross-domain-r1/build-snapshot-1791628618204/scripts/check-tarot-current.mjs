import {spawnSync} from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';

const ROOT=process.cwd();
const run=name=>{const r=spawnSync('npm',['run',name],{stdio:'inherit',shell:true});if(r.status!==0)process.exit(r.status??1);};
const readJson=p=>JSON.parse(fs.readFileSync(path.join(ROOT,p),'utf8'));
const sha256=p=>crypto.createHash('sha256').update(fs.readFileSync(path.join(ROOT,p))).digest('hex');

run('check:tarot-product-activation-phase-k');
const successorPath='content/production/symbolic-method/reconciliation/tarot-current-checker-successor-v1.json';
assert.ok(fs.existsSync(successorPath),`missing ${successorPath}`);
const s=readJson(successorPath);
assert.equal(s.status,'CURRENT_MACHINE_HUMAN_AND_REAL_BROWSER_SOURCE_ACCEPTED_LIVE_SHA_PERSISTENCE_AND_PROMOTION_PENDING');
assert.equal(s.current.machineAcceptanceComplete,true);
assert.equal(s.current.humanAcceptance.accepted,24);
assert.equal(s.current.humanAcceptance.required,24);
assert.equal(s.current.browserAcceptance.complete,true);
assert.equal(s.current.browserAcceptance.realBrowserEngine,true);
for(const [name,item] of Object.entries(s.checkers)){assert.ok(fs.existsSync(item.path),`missing current checker ${name}`);assert.equal(item.sha256,sha256(item.path),`current checker drift ${name}`);}
assert.equal(s.productionBoundary.verifiedPersistenceProvider,false);
assert.equal(s.productionBoundary.liveProductionShaAlignment,false);
assert.equal(s.productionBoundary.productionCapabilityPromoted,false);
assert.equal(s.productionBoundary.publicRunAllowed,false);
assert.equal(s.productionBoundary.clientMayGrantAuthority,false);
console.log('✓ Tarot current chain passed: machine acceptance + 24/24 real-human acceptance + real-Chromium source-browser acceptance are current.');
console.log('  Live production SHA, verified persistence authority, PCM promotion and public runAllowed remain fail-closed for the next phases.');
