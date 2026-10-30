import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';

export const NUM_WESTERN_CYCLE_RUNTIME_PATH='functions/core-method-runtime/num-cycle-runtime.js';
export const NUM_WESTERN_SUCCESSOR_PATH='content/professional/num-production/successors/num-western-life-stage-selection-successor-v1.json';
const hash=bytes=>crypto.createHash('sha256').update(bytes).digest('hex');

export function assertNumWesternLifeStageSuccessor(predecessorSha256){
  const r=JSON.parse(fs.readFileSync(NUM_WESTERN_SUCCESSOR_PATH,'utf8'));
  assert.equal(r.changeType,'ADDITIVE_RESTRICTED_SUCCESSOR');
  assert.equal(r.scope,'NUM_WESTERN_LIFE_STAGE_SELECTION');
  assert.equal(r.status,'HUMAN_APPROVED_RESTRICTED_SUCCESSOR');
  assert.equal(r.function,'selectNumWesternLifeStage()');
  assert.equal(r.productionAdmission,'NOT_AUTOMATIC');
  assert.equal(r.historicalMutation,'FORBIDDEN');
  assert.equal(r.crossSchoolMerge,'FORBIDDEN');
  assert.equal(r.runtime.path,NUM_WESTERN_CYCLE_RUNTIME_PATH);
  assert.equal(r.runtime.predecessorSha256,predecessorSha256);
  for(const p of r.predecessors)assert.equal(hash(fs.readFileSync(p.path)),p.sha256,'Frozen predecessor changed: '+p.path);
  const source=fs.readFileSync(r.runtime.path,'utf8');
  assert.equal(hash(source),r.runtime.currentSha256,'Restricted NUM successor drift');
  const start=source.indexOf(r.runtime.additiveStartMarker),end=source.indexOf(r.runtime.additiveEndMarker,start);
  assert(start>=0&&end>start,'Restricted selector boundaries missing');
  assert.equal(source.indexOf(r.runtime.additiveStartMarker,start+1),-1,'Repeated selector boundary');
  assert.equal(hash(source.slice(0,start)+source.slice(end)),predecessorSha256,'Original NUM formulas or other exports changed');
  return r;
}
