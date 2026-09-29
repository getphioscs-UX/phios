import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {acceptedS02,acceptedS03,acceptedS04,acceptedS05} from '../functions/personal-reading/narrative/bazi-owner-acceptance.generated.js';
import {sha256Stable} from '../functions/interpretation-runtime/mir7-utils.js';
for(const [folder,receipt] of [['s02-market-v1',acceptedS02],['s03-market-v1',acceptedS03],['s04-csd-v4',acceptedS04],['s05-market-v1',acceptedS05]]){
 const source=JSON.parse(fs.readFileSync(`docs/acceptance/report-narrative-t2-r1/bazi/${folder}/OWNER-ACCEPTANCE.json`));
 assert.deepEqual(receipt,source,'Bundled owner receipt differs from canonical JSON');
 const {acceptanceDigest,...seed}=receipt;assert.equal(await sha256Stable(seed),acceptanceDigest);
}
function scan(dir){for(const entry of fs.readdirSync(dir,{withFileTypes:true})){const file=path.join(dir,entry.name);if(entry.isDirectory())scan(file);else if(/\.[cm]?js$/.test(file))assert(!/\b(?:import|export)\s[^;]*\bwith\s*\{\s*type\s*:/s.test(fs.readFileSync(file,'utf8')),'Pages legacy bundler does not support import attributes: '+file);}}
scan('functions');
console.log('PASS: bundled receipts equal canonical signed digests; Functions contain no unsupported JSON import attributes.');
