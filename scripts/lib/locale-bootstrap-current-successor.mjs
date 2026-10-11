import fs from 'node:fs';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
const sha = file => crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
export function assertLocaleBootstrapCurrent(runtime) {
 if (sha(runtime.path) === runtime.sha256) return;
 const record=JSON.parse(fs.readFileSync('content/web/index-surfaces/locale-bootstrap-entry-handoff-successor-v2.json','utf8'));
 assert.equal(record.status,'ENGINEERING_RECONCILIATION');
 for(const key of ['historicalRecordsRewritten','humanAcceptanceGranted','productionActivated'])assert.equal(record[key],false);
 assert.equal(record.path,runtime.path);assert.equal(record.previousSha256,runtime.sha256);
 assert.equal(sha(record.previousPath),record.previousSha256);
 assert.equal(sha(record.path),record.sha256);
 assert.equal(record.dependency.path,'assets/js/entry-context-handoff.js');
 assert.equal(sha(record.dependency.path),record.dependency.sha256);
 // The locale implementation itself must be byte-preserved after the new hook.
 const before=fs.readFileSync(record.previousPath,'utf8'),after=fs.readFileSync(record.path,'utf8');
 const marker='(()=>{let locale;';
 assert.equal(after.slice(after.indexOf(marker)),before.slice(before.indexOf(marker)));
}
