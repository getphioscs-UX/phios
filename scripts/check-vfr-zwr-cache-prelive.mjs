import assert from 'node:assert/strict';
import fs from 'node:fs';
import {
 createMemoryZwrVfrCache,
 zwrVfrCacheIdentity,
 zwrVfrDeepPublicationCacheIdentity
} from '../functions/personal-reading/visual-first/ziwei-vfr-cache.js';

const legacy=zwrVfrCacheIdentity({authorityDigest:'authority-a',composerVersion:'composer-a'});
const legacy2=zwrVfrCacheIdentity({authorityDigest:'authority-b',composerVersion:'composer-a'});
assert.notEqual(legacy,legacy2);

const deepBase={
 authorityDigest:'authority-a',
 repairedResultDigest:'repaired-a',
 pagePlanVersion:'plan-v2',
 diagramDataVersion:'diagram-v1',
 diagramDataDigest:'diagram-digest-a',
 visualBindingVersion:'visual-v2',
 rendererVersion:'renderer-v2',
 publicationIrVersion:'publication-v1'
};
const deep=zwrVfrDeepPublicationCacheIdentity(deepBase);
assert.notEqual(deep,zwrVfrDeepPublicationCacheIdentity({...deepBase,repairedResultDigest:'repaired-b'}));
assert.notEqual(deep,zwrVfrDeepPublicationCacheIdentity({...deepBase,rendererVersion:'renderer-v3'}));
assert.notEqual(deep,zwrVfrDeepPublicationCacheIdentity({...deepBase,visualBindingVersion:'visual-v3'}));

const cache=createMemoryZwrVfrCache();
assert.equal(await cache.get(deep),null);
assert.equal(await cache.put(deep,{publicationIrDigest:'ir-a',providerCallsDuringRerender:0}),true);
assert.deepEqual(await cache.get(deep),{publicationIrDigest:'ir-a',providerCallsDuringRerender:0});
assert.equal(await cache.put(deep,{publicationIrDigest:'ir-a',providerCallsDuringRerender:0}),false);
await assert.rejects(
 ()=>cache.put(deep,{publicationIrDigest:'changed',providerCallsDuringRerender:0}),
 /ZWR_VFR_IMMUTABLE_CACHE_CONFLICT/
);

const builder=fs.readFileSync('scripts/build-zwr-vfr-human-review.mjs','utf8');
assert(builder.includes('REPAIRED-RESULT.json'),'W9 rerender must source repaired Deep Manuscript');
assert(builder.includes('DEEP-RENDER-CACHE.json'),'W9 rerender must persist deep cache evidence');
assert(builder.includes('providerCallsDuringRerender:0'),'W9 rerender must explicitly record zero provider calls');
assert(!builder.includes('reportIr:live.reportIr'),'legacy one-call report IR must not own W9 rerender');

const binding=fs.readFileSync('functions/report-delivery/ziwei-canonical-person-binding.js','utf8');
assert(binding.includes('ziwei-professional-synthesis-r5-generation.js'),'old hot path must remain until W9 HUMAN ACCEPT and W10');
assert(!binding.includes('ziwei-vfr-five-call-composer.js'),'Deep Manuscript experiment must not silently cut over production');
assert(!binding.includes('ziwei-vfr-targeted-repair.js'),'targeted repair lane must not silently cut over production');

console.log('PASS ZWR-VFR W7 deep cache: repaired-result + page-plan + diagram + visual + renderer identities guarded; immutable conflict protected; rerender provider calls=0; old production hot path unchanged.');
