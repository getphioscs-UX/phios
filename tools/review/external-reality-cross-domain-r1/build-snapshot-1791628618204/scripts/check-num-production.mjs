import assert from 'node:assert/strict';
import fs from 'node:fs';
import crypto from 'node:crypto';
import {executeAndProjectMcd5CurrentRequest} from '../functions/method-client-delivery/canonical-projection-runtime-current.js';
import {onRequestPost as meaningPost} from '../functions/api/method-meaning.js';
const json=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const text=p=>fs.readFileSync(p,'utf8');
const sha=p=>crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
const scope=json('content/professional/num-production/contracts/num-production-scope-v1.json');
const calc=json('content/professional/num-production/authority/num-calculation-authority-v1.json');
const fixtures=json('content/professional/num-production/fixtures/num-production-determinism-fixtures-v1.json');
const detAcc=json('content/professional/num-production/acceptance/num-production-determinism-acceptance-v1.json');
const projection=json('content/professional/num-production/registries/num-projection-coverage-v1.json');
const meaning=json('content/professional/num-production/registries/num-meaning-coverage-v1.json');
const reading=json('content/professional/num-production/contracts/num-runtime-reading-ir-v1.json');
const frontend=json('content/professional/num-production/registries/num-frontend-availability-v1.json');
const persistence=json('content/professional/num-production/contracts/num-persistence-governance-v1.json');
const acceptance=json('content/professional/num-production/acceptance/num-production-acceptance-v1.json');
const version=json('content/professional/num-production/successors/num-production-version-successor-v1.json');
const pcm1=json('content/governance/production-capability-matrix/registries/production-capability-registry-v1.json');
const pcm2=json('content/governance/production-capability-matrix/registries/production-capability-registry-v2.json');
const pcmCurrent=json('content/governance/production-capability-matrix/reconciliation/production-capability-current-successor-v2.json');
const pcmAccept=json('content/governance/production-capability-matrix/acceptance/pcm-v2-num-promotion-acceptance-v1.json');

assert.equal(scope.scopeCode,'NUMERIC_RUNTIME_V1');assert.equal(scope.capabilityVersion,'1.0.0');assert.equal(scope.executionAuthorityMethodVersion,'0.1.0-candidate');
assert.equal(calc.status,'CURRENT_PRODUCTION_AUTHORITY_RESOLVED_THROUGH_MPA');
assert.equal(detAcc.status,'ACCEPTED_BY_EXECUTABLE_CHECKER'); assert.equal(projection.status,'PRODUCTION_SCOPE_COVERED');assert.equal(meaning.status,'PRODUCTION_COMPLETE_FOR_DECLARED_SEMANTIC_ROLES');
assert.equal(reading.status,'ACTIVE_PRODUCTION_SELF_SERVICE_READING_IR');assert.equal(frontend.capabilityAvailability,'AVAILABLE');assert.equal(frontend.rules.meaningEndpointMayRecalculate,false);assert.equal(persistence.persistenceMode,'NONE');
assert.equal(version.capabilityVersion,'1.0.0');assert.equal(version.executionAuthorityMethodVersion,'0.1.0-candidate');assert.equal(version.predecessorsMutated,false);
for(const v of Object.values(acceptance.gates))assert.equal(v,true,'NUM production acceptance gate not true');assert.equal(acceptance.deployment.liveProductionProbePerformed,false);assert.equal(acceptance.deployment.state,'PENDING_EXTERNAL_DEPLOYMENT_VERIFICATION');
assert.equal(acceptance.finalCapabilityAvailability,'AVAILABLE');

const common={birthTime:'12:00:00',birthPlace:{displayName:'Singapore',countryCode:'SG',latitude:1.3521,longitude:103.8198},timezone:{iana:'Asia/Singapore',utcOffsetAtBirth:'+08:00',source:'PINNED_IANA_TZDB',confidence:'HIGH'},timeAccuracy:'EXACT',locale:'en',consent:{recordId:'CONSENT-NUMA',granted:true},inputVersion:'MCD-3-CANONICAL-BIRTH-INPUT-v1.0.0'};
const request=(f,id=f.fixtureId)=>({schemaVersion:'PHI-OS-MCD-METHOD-EXECUTION-REQUEST-v1.0.0',methodCode:'NUMEROLOGY',methodVersion:'0.1.0-candidate',capability:'CALCULATION',purposeCode:'NUMA_PRODUCTION_ACCEPTANCE',canonicalInput:{...common,birthDate:f.birthDate},executionParameters:{targetDate:f.targetDate},consentRecordId:'CONSENT-NUMA',requestId:id});
for(const f of fixtures.fixtures){
 const a=await executeAndProjectMcd5CurrentRequest(request(f)); const b=await executeAndProjectMcd5CurrentRequest(request(f));
 assert.equal(a.execution.executionStatus,'EXECUTED_BOUND_SCOPE');assert.equal(a.canonicalProjection.projection.status,'COMPLETE');
 assert.equal(a.canonicalProjection.calculation.values.find(x=>x.code==='LIFE_PATH').value,f.expectedLifePath);
 assert.equal(a.canonicalProjection.projectionId,b.canonicalProjection.projectionId,'NUM projection not deterministic');
 const call=async locale=>{const r=new Request('https://phios.local/api/method-meaning',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({schemaVersion:'PHI-OS-CMP-METHOD-MEANING-REQUEST-v1.0.0',locale,canonicalProjection:a.canonicalProjection})});const res=await meaningPost({request:r});const body=await res.json();return {res,body};};
 const en=await call('en');const zh=await call('zh-Hans');assert.equal(en.res.status,200);assert.equal(en.body.ok,true);assert.equal(en.body.capabilityAvailability,'AVAILABLE');assert.equal(en.body.capabilityVersion,'1.0.0');assert.equal(en.body.meaningBundle.status,'PRODUCTION');assert.equal(en.body.meaningBundle.bundleDigest,zh.body.meaningBundle.bundleDigest);assert.equal(en.body.reading.boundaries.recalculated,false);assert.equal(en.body.reading.boundaries.professionalJudgmentCreated,false);
}

const partial=(await executeAndProjectMcd5CurrentRequest({...request(fixtures.fixtures[0],'NUMA-PARTIAL'),executionParameters:{}})).canonicalProjection;
assert.equal(partial.projection.status,'PARTIAL'); assert(partial.unknown.some(x=>x.code==='NUM_CYCLE_TARGET_DATE_NOT_SUPPLIED'));
const partialReq=new Request('https://phios.local/api/method-meaning',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({schemaVersion:'PHI-OS-CMP-METHOD-MEANING-REQUEST-v1.0.0',locale:'en',canonicalProjection:partial})});
const partialRes=await meaningPost({request:partialReq});const partialBody=await partialRes.json();assert.equal(partialRes.status,200);assert.equal(partialBody.capabilityAvailability,'AVAILABLE');assert.equal(partialBody.executionCompleteness,'PARTIAL');

const html=text('personal-runtime.html');assert.match(html,/data-num-production-meaning/);assert.match(html,/\/assets\/js\/pages\/num-production-meaning\.js/);assert.match(html,/\/assets\/css\/num-production-meaning\.css/);
const bridge=text('assets/js/pages/num-production-meaning.js');assert.match(bridge,/\/api\/method-meaning/);assert.match(bridge,/method-execute/);assert.doesNotMatch(bridge,/core-method-runtime/);
const frozen=json('content/professional/method-client-delivery/reconciliation/mcd-7-personal-runtime-result-surface-current-successor-v3.json');for(const a of frozen.exactAuthorityArtifacts)assert.equal(sha(a.path),a.sha256,`frozen MCD7 authority drift: ${a.path}`);

const oldNum=pcm1.capabilities.find(x=>x.methodRuntime.pluginCode==='NUM');assert.equal(oldNum.classification,'LIMITED_SCOPED');assert.equal(oldNum.statusProjection,'Limited');
const num=pcm2.capabilities.find(x=>x.methodRuntime.pluginCode==='NUM');assert.equal(num.classification,'AVAILABLE');assert.equal(num.statusProjection,'Available');assert.equal(num.capabilityAvailability,'AVAILABLE');assert.equal(num.meaningReady,true);assert.equal(num.readingReady,true);assert.equal(num.methodRuntime.methodVersion,'1.0.0');assert.equal(num.methodRuntime.executionAuthorityMethodVersion,'0.1.0-candidate');
for(const [code,state] of [['AST','LIMITED_SCOPED'],['BZR','LIMITED_SCOPED'],['HDR','BLOCKED']])assert.equal(pcm2.capabilities.find(x=>x.methodRuntime.pluginCode===code).classification,state);
assert.equal(pcmCurrent.currentMethodState.NUM,'AVAILABLE');assert.equal(pcmAccept.promotion.to,'AVAILABLE');assert.equal(pcmAccept.predecessorMutated,false);
console.log('✓ NUMA-W0–W10 NUM Production Availability passed.');
console.log('  NUM v1.0.0 capability is Available over the existing 0.1.0-candidate execution authority; deterministic projection, governed meaning, reading, frontend and PCM v2 successor are all bound.');
