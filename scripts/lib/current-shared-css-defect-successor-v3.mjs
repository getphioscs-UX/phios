import fs from 'node:fs';import assert from 'node:assert/strict';import {createHash} from 'node:crypto';
const sha=b=>createHash('sha256').update(b).digest('hex');
export function currentSharedStylesheetPredecessorBytes(file,bytes){
 if(file!=='assets/css/global-visual-r2.css')return bytes;
 const recordBytes=fs.readFileSync("content/customer-experience-rebuild/legacy/current-shared-stylesheet-successor-v3.json");assert.equal(sha(recordBytes),"7c7029697972f92cfb20bc5f97c83ab84da12a14972ca57a140e0a45aa4231ab",'Unregistered shared CSS successor record drift');
 const record=JSON.parse(recordBytes);assert.equal(record.status,'ENGINEERING_DEFECT_FIX_PENDING_CONTROLLED_RELEASE');
 for(const k of ['historicalFreezeRewritten','humanAcceptanceGranted','productionAcceptanceGranted','allowsNewLegacyImports'])assert.equal(record[k],false);
 assert.equal(sha(fs.readFileSync(record.predecessor.path)),record.predecessor.sha256,'Immutable predecessor record drift');
 assert.deepEqual(record.predecessors.map(p=>p.path),['content/customer-experience-rebuild/legacy/current-shared-stylesheet-successor-v1.json','content/customer-experience-rebuild/legacy/current-shared-stylesheet-successor-v2.json']);for(const p of record.predecessors)assert.equal(sha(fs.readFileSync(p.path)),p.sha256,'Immutable CSS predecessor drift: '+p.path);
 assert.deepEqual(record.stylesheets.map(s=>s.path),[file]);const item=record.stylesheets[0];assert.equal(sha(bytes),item.afterSHA,'Current shared stylesheet successor drift: '+file);
 let restored=bytes.toString('utf8');for(const h of [...item.reverseHunks].reverse()){assert.equal(restored.slice(h.newOffset,h.newOffset+h.after.length),h.after,'Shared CSS minimal hunk drift');restored=restored.slice(0,h.newOffset)+h.before+restored.slice(h.newOffset+h.after.length);}
 assert.equal(sha(restored),item.beforeSHA,'Exact immutable CSS predecessor reconstruction failed');return Buffer.from(restored);
}
