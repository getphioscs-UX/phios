import assert from 'node:assert/strict';
import fs from 'node:fs';
import crypto from 'node:crypto';
import {spawnSync} from 'node:child_process';
const j=p=>JSON.parse(fs.readFileSync(p,'utf8'));const sha=p=>crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
const s=j('content/web-production/successors/service-continuity-current-successor-v2.json');
assert.equal(s.status,'CURRENT_SERVICE_CONTINUITY_PX2_PRESENTATION_SUCCESSOR');
assert.equal(sha(s.predecessor.contract),s.predecessor.contractSha256,'historical Service Continuity contract rewritten');
assert.equal(sha(s.predecessor.checker),s.predecessor.checkerSha256,'historical Service Continuity checker rewritten');
const old=j(s.predecessor.contract);
for(const [p,h] of Object.entries(old.authorityPreservation||{})){
  if(p==='assets/js/public-shell.js') continue;
  assert.equal(sha(p),h,`service/runtime authority drift: ${p}`);
}
for(const p of Object.keys(old.surfaces||{}))assert.ok(fs.existsSync(p),`service continuity surface missing: ${p}`);
const audit=j(s.currentPresentation.px2Audit);
for(const p of s.currentPresentation.currentPublicSurfaces){
  const row=audit.surfaces.find(x=>x.surface===p);assert.ok(row,`PX2 current service surface missing: ${p}`);assert.equal(row.cssCount,1,`${p} must use consolidated PX2 CSS`);assert.ok(row.jsCount>=1,`${p} must have current PX2 shell consumer`);
}
for(const [k,v] of Object.entries(s.authority)) if(k.endsWith('TransferredToPX2')) assert.equal(v,false,`${k} must remain false`);
const r=spawnSync(s.currentPresentation.px2Acceptance,{shell:true,stdio:'inherit'});assert.equal(r.status,0,'PX2 service presentation acceptance failed');
console.log('✓ Service Continuity current v2 successor passed: PX2 owns current presentation while service/runtime/consent/privacy authority remains upstream and historical batch3 stays frozen.');
