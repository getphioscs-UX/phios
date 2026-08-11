import assert from 'node:assert/strict';
import {BASELINE,readJson,readText,exists} from './lib/web-production/wpr-integrity-v1.mjs';
const c=readJson('content/web-production/contracts/wpr-hydration-runtime-v1.json');
assert.equal(c.baselineCommit,BASELINE);assert.equal(c.work,'WPR-W24');assert.equal(c.status,'ACTIVE_LIMITED_PRODUCTION_HYDRATION_INTEGRITY');assert.equal(c.authority,'WEB_HYDRATION_EXECUTION_ONLY');
assert.equal(c.rules.hydrationDoesNotCreateAuthority,true);assert.equal(c.rules.hydrationDoesNotElevateAccess,true);assert.equal(c.rules.publicSurfaceMayNotHydratePrivatePayload,true);assert.equal(c.rules.postMutationForbiddenByWprHydration,true);
const reg=readJson('content/web-production/registries/wpr-hydration-policy-registry-v1.json');assert.equal(reg.baselineCommit,BASELINE);assert.equal(reg.rules.everyProductionRecordMustResolveExactlyOneMode,true);
const web=readJson('content/web-production/registries/canonical-web-production-registry-v1.json');assert.equal(web.productionRecords.length,38);
const resolve=record=>reg.entries.filter(e=>e.surfaceCodes.includes(record.surfaceCode)&&e.accessClasses.includes(record.accessMode));
for(const record of web.productionRecords){const matches=resolve(record);assert.equal(matches.length,1,`WPR_W24_POLICY_RESOLUTION:${record.productionCode}`);const mode=matches[0].mode;
  if(record.seoPolicy?.indexable===true){assert.equal(record.audience,'PUBLIC');assert.notEqual(mode,'PROFESSIONAL_AUTHORIZED_EXTERNAL_PAYLOAD');}
  if((record.cachePolicy?.class??record.cachePolicy?.mode)==='PRIVATE_NO_STORE'){assert.notEqual(mode,'PUBLIC_CANONICAL_READ');}
  if(record.surfaceCode==='PERSONAL_RUNTIME_SETUP'){assert.equal(mode,'BROWSER_EPHEMERAL_INPUT_READINESS');assert.equal(record.hydrationPolicy.localStorageAllowed,false);assert.equal(record.hydrationPolicy.sessionStorageAllowed,false);}
  if(['PROFESSIONAL_WORKSPACE','PROFESSIONAL_REPORT_VIEWER'].includes(record.surfaceCode)){assert.equal(mode,'PROFESSIONAL_AUTHORIZED_EXTERNAL_PAYLOAD');assert.equal(record.hydrationPolicy.wprPrivatePayloadFetchAllowed,false);}
}
const runtime=readText('assets/js/web-production/hydration-runtime.js');for(const marker of ['PUBLIC_CANONICAL_READ','WPR_HYDRATION_MUTATION_FORBIDDEN','WPR_HYDRATION_CROSS_ORIGIN_FORBIDDEN',"credentials:'same-origin'"])assert.ok(runtime.includes(marker),marker);for(const bad of ['localStorage','sessionStorage',"method:'POST'","method: 'POST'"])assert.equal(runtime.includes(bad),false,bad);
const audit=readJson('content/web-production/audits/wpr-w24-hydration-integrity-audit-v1.json');assert.equal(audit.productionRecordCount,38);assert.equal(audit.authorityExpansionGranted,false);
const a=readJson('content/web-production/acceptance/wpr-w24-hydration-runtime-acceptance-v1.json');assert.equal(a.baselineCommit,BASELINE);for(const v of Object.values(a.nonActivation))assert.equal(v,false);
const pkg=readJson('package.json');assert.equal(pkg.scripts['check:wpr-w24'],'node scripts/check-wpr-w24-hydration-runtime.mjs');assert.equal(pkg.scripts['check:wpr-hydration'],'npm run check:wpr-w24');assert.ok(pkg.scripts['check:wpr'].includes('npm run check:wpr-hydration'));assert.equal(pkg.scripts.postcheck.includes('check:wpr'),false);
for(const f of ['content/web-production/contracts/wpr-hydration-runtime-v1.json','content/web-production/registries/wpr-hydration-policy-registry-v1.json','assets/js/web-production/hydration-runtime.js'])assert.ok(exists(f),f);
console.log('✓ WPR-W24 Hydration Runtime passed.');console.log('  Hydration is access-preserving, GET/same-origin bounded, private fail-closed and non-persistent.');
