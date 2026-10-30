import fs from 'node:fs';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import {validatePprPreentryDelta,readPprPreentrySuccessor,PPR_PREENTRY_SUCCESSOR} from './lib/ppr-five-method-preentry-successor.mjs';
const sha=s=>crypto.createHash('sha256').update(s).digest('hex');
const next=JSON.parse(fs.readFileSync(PPR_PREENTRY_SUCCESSOR));
const registry=JSON.parse(fs.readFileSync('content/professional/personal-reality/current/ppr-current-shared-owner-registry-v1.json'));
const current=fs.readFileSync(next.path,'utf8'),previous=fs.readFileSync(next.previousPath,'utf8'),tests=[];
const check=(name,fn)=>{fn();tests.push({name,status:'PASS'});};
check('Actual pinned dependencies and predecessor accepted',()=>readPprPreentrySuccessor(registry.files[next.path]));
check('Six insertion restoration exact',()=>validatePprPreentryDelta(next,current,previous));
for(const [name,change] of [
 ['Unknown byte',s=>s+' '],
 ['Removed original form',s=>s.replace('<form','<div')],
 ['Changed form attribute',s=>s.replace('<form','<form data-unregistered="true"')],
 ['Extra executable script',s=>s+'<script>globalThis.unsafe=true</script>'],
 ['Duplicated pre-entry link',s=>s+next.insertions[0]],
 ['Missing pre-entry link',s=>s.replace(next.insertions[0],'')]
])check(name+' denied beyond hash gate',()=>{const source=change(current);assert.notEqual(source,current);const r={...structuredClone(next),currentSha256:sha(source)};assert.throws(()=>validatePprPreentryDelta(r,source,previous));});
for(const key of ['historicalFreezeRewritten','humanAcceptanceGranted','productionActivated'])check(key+' cannot be escalated',()=>assert.throws(()=>validatePprPreentryDelta({...next,[key]:true},current,previous)));
check('Unregistered URL denied',()=>{const r=structuredClone(next),from=r.insertions[0],to=from.replace('href="/perspectives/','href="/api/');r.insertions[0]=to;const source=current.replace(from,to);r.currentSha256=sha(source);assert.throws(()=>validatePprPreentryDelta(r,source,previous));});
check('Inline link handler denied',()=>{const r=structuredClone(next),from=r.insertions[0],to=from.replace('<a href','<a onclick="unsafe()" href');r.insertions[0]=to;const source=current.replace(from,to);r.currentSha256=sha(source);assert.throws(()=>validatePprPreentryDelta(r,source,previous));});
check('Extra allowed insertion denied',()=>{const r=structuredClone(next);r.insertions.push('unexpected');assert.throws(()=>validatePprPreentryDelta(r,current,previous));});
check('Wrong predecessor denied',()=>assert.throws(()=>validatePprPreentryDelta(next,current,previous+' ')));
const out='content/customer-experience-rebuild/ziwei-cx-r1/review/ziwei-cx-r1-preentry-shared-owner-successor-checks-current.json';
fs.writeFileSync(out,JSON.stringify({status:'PASS_ENGINEERING_SUCCESSOR_ONLY',tests,groups:tests.length,providerCalls:0,costUSD:0,humanAcceptanceGranted:false,productionActivated:false},null,2)+'\n');
console.log(`PASS ${tests.length} pre-entry shared-owner positive/negative checks; providerCalls=0`);
