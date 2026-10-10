import assert from 'node:assert/strict';
import fs from 'node:fs';
const read=p=>fs.readFileSync(p,'utf8');
const json=p=>JSON.parse(read(p));
const census=json('content/customer-experience-rebuild/cx-r31/audits/cx-r31-w0-current-customer-entry-census-v1.json');
assert.equal(census.status,'COMPLETE');
assert.equal(census.askMandatoryFunnel,false);
for(const row of census.entries){
  const physical=row.path==='/'?'index.html':row.path.endsWith('/')?`${row.path.slice(1)}index.html`:null;
  if(physical)assert.equal(fs.existsSync(physical),true,`missing customer entry ${row.entry}: ${physical}`);
}
for(const required of ['HOME','ASK','REALITY','PERSPECTIVES','PROFILE','RELATIONSHIP','FINANCIAL','PROFESSIONAL','ARTICLE','KNOWLEDGE','DIRECT_SPECIALIST_ICHING','DIRECT_SPECIALIST_TAROT','DIRECT_PERSONAL_METHODS'])assert.ok(census.entries.some(x=>x.entry===required),`missing census entry ${required}`);
console.log('✓ CX-R31-W0 Current Customer Entry Census passed.');
