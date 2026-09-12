import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
const PATH='content/knowledge/answer-projection/maintenance/kap-m1-ask-retrieval-successor-v1.json';
const digest=path=>crypto.createHash('sha256').update(fs.readFileSync(path)).digest('hex');
export function kapMaintenanceSuccessorSha(path,fallback=null){
  if(!fs.existsSync(PATH))return fallback;
  const maintenance=JSON.parse(fs.readFileSync(PATH,'utf8'));
  return (maintenance.changes||[]).find(item=>item.path===path)?.successorSha256||fallback;
}
export function assertKapEvidenceOrMaintenance(entry){
  assert.ok(fs.existsSync(entry.path),`MISSING_FILE:${entry.path}`);
  const actual=digest(entry.path);
  if(actual===entry.sha256)return;
  assert.ok(fs.existsSync(PATH),`DIGEST_DRIFT:${entry.path}`);
  const maintenance=JSON.parse(fs.readFileSync(PATH,'utf8'));
  const successor=(maintenance.changes||[]).find(item=>item.path===entry.path);
  assert.ok(successor,`DIGEST_DRIFT:${entry.path}`);
  assert.equal(successor.frozenSha256,entry.sha256,`MAINTENANCE_FROZEN_DIGEST_MISMATCH:${entry.path}`);
  assert.equal(successor.successorSha256,actual,`MAINTENANCE_SUCCESSOR_DIGEST_MISMATCH:${entry.path}`);
  assert.equal(maintenance.boundaries?.canonicalKnowledgeCreated,false);
  assert.equal(maintenance.boundaries?.secondAskRuntimeCreated,false);
}
