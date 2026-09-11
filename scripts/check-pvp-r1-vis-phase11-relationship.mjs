import assert from 'node:assert/strict';import {spawnSync} from 'node:child_process';import fs from 'node:fs';
const r=spawnSync(process.execPath,['scripts/check-pvp-r1-vis-phase11-relationship-visual.mjs'],{stdio:'inherit',cwd:process.cwd(),env:process.env});assert.equal(r.status,0,'relationship visual checker failed');
const j=p=>JSON.parse(fs.readFileSync(p,'utf8'));const acc=j('content/product-visual-platform-r1/acceptance/successors/phase11/pvp-r1-vis-relationship-current-acceptance-v1.json');const freeze=j('content/product-visual-platform-r1/freeze/pvp-r1-vis-relationship-phase11-freeze-v1.json');
assert.equal(acc.status,'MACHINE_ACCEPTED_CURRENT_RELATIONSHIP_VISUAL_PROJECTION');assert.equal(acc.phase12Authorized,true);assert.equal(freeze.status,'PVP_R1_VIS_RELATIONSHIP_PHASE11_FROZEN');assert.equal(freeze.nextWork,'PHASE12_PVP_R1_VIS_W29_W31_STATIC_PRODUCTION_ASSETS');
console.log('✓ PVP Phase 11 Relationship Visual aggregate passed.');
