import fs from 'node:fs';
import assert from 'node:assert/strict';
import {readAtlasVisualBridge,validateAtlasVisualBridgeCurrent,atlasVisualStylePredecessor,atlasWorldHelperPredecessor} from './lib/atlas-visual-w16-source-bridge-r1.mjs';
const r=validateAtlasVisualBridgeCurrent();let negatives=0;
assert.equal(atlasVisualStylePredecessor().length>0,true);
assert.deepEqual(atlasWorldHelperPredecessor(r.helper.path,fs.readFileSync(r.helper.path)),Buffer.from(r.helper.previousBytesBase64,'base64'));
for(const path of [r.helper.path,r.style.path,r.validator.path]){assert.throws(()=>validateAtlasVisualBridgeCurrent(p=>p===path?Buffer.concat([fs.readFileSync(p),Buffer.from('\n')]):fs.readFileSync(p)));negatives++;}
for(const mutate of [x=>x.baseline='0'.repeat(40),x=>x.style.path='assets/css/other.css',x=>x.parents[0].sha256='0'.repeat(64),x=>x.boundaries.paidEnabled=true,x=>x.helper.insertions.push('extra')]){const clone=structuredClone(r);mutate(clone);assert.throws(()=>readAtlasVisualBridge(Buffer.from(JSON.stringify(clone))));negatives++;}
assert.throws(()=>atlasWorldHelperPredecessor(r.helper.path,Buffer.from('unregistered')));negatives++;
const unchanged=Buffer.from('unrelated');assert.equal(atlasWorldHelperPredecessor('assets/css/other.css',unchanged),unchanged);
console.log(`Atlas W16 strict bridge PASS; ${negatives} negative cases; original validator and freezes unchanged`);
