import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createMemoryZwrVfrCache,zwrVfrCacheIdentity} from '../functions/personal-reading/visual-first/ziwei-vfr-cache.js';

const key=zwrVfrCacheIdentity({authorityDigest:'authority-a',composerVersion:'composer-a'});
const key2=zwrVfrCacheIdentity({authorityDigest:'authority-b',composerVersion:'composer-a'});
assert.notEqual(key,key2);
const cache=createMemoryZwrVfrCache();
assert.equal(await cache.get(key),null);
assert.equal(await cache.put(key,{reportIr:{id:'fixture'},providerCalls:1}),true);
assert.deepEqual(await cache.get(key),{reportIr:{id:'fixture'},providerCalls:1});
assert.equal(await cache.put(key,{reportIr:{id:'fixture'},providerCalls:1}),false);
await assert.rejects(()=>cache.put(key,{reportIr:{id:'changed'},providerCalls:1}),/ZWR_VFR_IMMUTABLE_CACHE_CONFLICT/);

const composer=fs.readFileSync('functions/personal-reading/visual-first/ziwei-vfr-one-call-composer.js','utf8');
assert(composer.includes("if(cache?.get)"));
assert(composer.includes("if(cache?.put)"));
const binding=fs.readFileSync('functions/report-delivery/ziwei-canonical-person-binding.js','utf8');
assert(binding.includes('ziwei-professional-synthesis-r5-generation.js'),'old hot path must remain until human acceptance and cutover');
assert(!binding.includes('ziwei-vfr-one-call-composer.js'),'VFR must not cut over before W10');
console.log('PASS ZWR-VFR cache pre-live: immutable cache conflict guarded; deterministic replay hook present; old customer hot path remains fail-closed pending W8/W9/W10.');
