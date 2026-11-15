import fs from 'node:fs';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readVisualV14Record,validateVisualV14Current,visualV14PredecessorBytes} from './lib/public-visual-v14r2-reception-r1.mjs';
const hash=b=>createHash('sha256').update(b).digest('hex');
const record=validateVisualV14Current();let predecessors=0,rejected=0;
for(const row of record.paths){
  const current=fs.readFileSync(row.path);
  assert.throws(()=>validateVisualV14Current(p=>p===row.path?Buffer.concat([current,Buffer.from('drift')]):fs.readFileSync(p)));rejected++;
  assert.throws(()=>visualV14PredecessorBytes(row.path,Buffer.from('unregistered bytes')));rejected++;
  if(row.previousSHA256===null){assert.throws(()=>visualV14PredecessorBytes(row.path,current));rejected++;continue;}
  assert.equal(hash(visualV14PredecessorBytes(row.path,current)),row.previousSHA256);
  const previous=Buffer.from(row.previousBytesBase64,'base64');
  assert.deepEqual(visualV14PredecessorBytes(row.path,previous),previous);predecessors++;
}
for(const mutate of [r=>r.paths.push({path:'extra.js'}),r=>r.paths[0].sha256='0'.repeat(64),r=>r.parents[0].sha256='0'.repeat(64),r=>r.boundaries.extraAdmission=true,r=>r.ownerSourceSet='0'.repeat(64)]){
  const changed=structuredClone(record);mutate(changed);assert.throws(()=>readVisualV14Record(Buffer.from(JSON.stringify(changed))));rejected++;
}
const outside=Buffer.from('outside the registered source set');assert.deepEqual(visualV14PredecessorBytes('unregistered.js',outside),outside);
console.log(`V14R2 strict reception PASS: ${record.paths.length} exact current paths, ${predecessors} immutable predecessor views, ${rejected} refusals; no release or commercial authority inherited`);
