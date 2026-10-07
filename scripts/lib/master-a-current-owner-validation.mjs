// Current review validation only. Historical receipts remain byte-preserved.
import fs from 'node:fs';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
export function assertMasterAOwnerDigest(path, expected, message=path) {
  const actual=crypto.createHash('sha256').update(fs.readFileSync(path)).digest('hex');
  if(actual===expected)return;
  assert.equal(process.env.MASTER_A_A6_VALIDATION,'true',message);
  const approval=JSON.parse(fs.readFileSync('content/knowledge/structured/successors/master-a-v2-batch6/authorized-owner-successor-v1.json','utf8'));
  assert.equal(approval.status,'EXPLICIT_USER_AUTHORIZED_CURRENT_OWNER_REPAIR');
  assert.equal(approval.classification,'INTENTIONALLY_WITHHELD');
  assert.equal(path,'functions/api/ask-phios.js','No other protected owner may change');
  const change=approval.approvedChanges.find(r=>r.path===path);
  assert.ok(change,'Missing authorized current owner successor');
  assert.equal(expected,change.predecessorSha256,'Unknown predecessor digest');
  assert.equal(actual,change.currentSha256,'Unreviewed current owner bytes');
}
