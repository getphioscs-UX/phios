import assert from 'node:assert/strict';
import fs from 'node:fs';
import crypto from 'node:crypto';
import {spawnSync} from 'node:child_process';
const j=p=>JSON.parse(fs.readFileSync(p,'utf8'));const sha=p=>crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
const p1Delete='content/customer-experience-rebuild/acceptance/p1-physical-legacy-delete-acceptance-v1.json';
const postP1=fs.existsSync(p1Delete)&&j(p1Delete).status==='MACHINE_ACCEPTED_PHYSICAL_LEGACY_DELETE_COMPLETE';
const v2Path='content/web-production/px2/successors/service-continuity-current-successor-v2.json';
const v2=j(v2Path);
assert.equal(v2.status,'CURRENT_SERVICE_CONTINUITY_PX2_PRESENTATION_SUCCESSOR');
assert.equal(sha(v2.predecessor.contract),v2.predecessor.contractSha256,'historical Service Continuity contract rewritten');
assert.equal(sha(v2.predecessor.checker),v2.predecessor.checkerSha256,'historical Service Continuity checker rewritten');
const old=j(v2.predecessor.contract);
for(const [p,h] of Object.entries(old.authorityPreservation||{})){
  if(p==='assets/js/public-shell.js') continue;
  assert.equal(sha(p),h,`service/runtime authority drift: ${p}`);
}
for(const p of Object.keys(old.surfaces||{}))assert.ok(fs.existsSync(p),`service continuity surface missing: ${p}`);
const audit=j(v2.currentPresentation.px2Audit);
for(const p of v2.currentPresentation.currentPublicSurfaces){
  const row=audit.surfaces.find(x=>x.surface===p);assert.ok(row,`PX2 current service surface missing: ${p}`);assert.equal(row.cssCount,1,`${p} must use consolidated PX2 CSS`);assert.ok(row.jsCount>=1,`${p} must have current PX2 shell consumer`);
}
for(const [k,v] of Object.entries(v2.authority)) if(k.endsWith('TransferredToPX2')) assert.equal(v,false,`${k} must remain false`);
let acceptance=v2.currentPresentation.px2Acceptance;
if(postP1){
  const v3=j('content/web-production/px2/successors/service-continuity-current-successor-v3.json');
  assert.equal(v3.status,'CURRENT_SERVICE_CONTINUITY_P1_PRESENTATION_SUCCESSOR');
  assert.equal(v3.predecessor.path,v2Path);assert.equal(sha(v2Path),v3.predecessor.sha256,'Service Continuity v2 predecessor rewritten');assert.equal(v3.predecessor.mutated,false);
  assert.equal(j(v3.currentPresentation.physicalDeleteAcceptance).status,'MACHINE_ACCEPTED_PHYSICAL_LEGACY_DELETE_COMPLETE');
  for(const p of v3.currentPresentation.currentPublicSurfaces)assert.ok(fs.existsSync(p),`current Service Continuity surface missing after P1 delete: ${p}`);
  for(const [k,v] of Object.entries(v3.authority)) if(k.endsWith('TransferredToPX2')) assert.equal(v,false,`${k} must remain false`);
  acceptance=v3.currentPresentation.currentAcceptance;
}
const r=spawnSync(acceptance,{shell:true,stdio:'inherit'});assert.equal(r.status,0,'current Service Continuity presentation acceptance failed');
console.log(postP1?'✓ Service Continuity current v3 successor passed after P1 physical delete: current PX2/CX-P1 presentation is active while service/runtime/consent/privacy authority remains upstream and v2 remains frozen.':'✓ Service Continuity current v2 successor passed: PX2 owns current presentation while service/runtime/consent/privacy authority remains upstream and historical batch3 stays frozen.');
