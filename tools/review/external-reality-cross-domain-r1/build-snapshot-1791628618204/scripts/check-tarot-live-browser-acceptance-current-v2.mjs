import assert from 'node:assert/strict';
import fs from 'node:fs';
import crypto from 'node:crypto';
import {inspectTarotExecutionAuthority} from '../functions/tarot-product-runtime/tarot-production-authority-v2.js';
const j=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const sha=p=>crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
const exists=p=>assert.ok(fs.existsSync(p),`missing ${p}`);
const P={
 evidence:'content/production/symbolic-method/browser/tarot-live-browser-evidence-v1.json',
 freeze:'content/production/symbolic-method/freeze/tarot-live-browser-acceptance-freeze-v1.json',
 acceptance:'content/production/symbolic-method/acceptance/tarot-live-browser-acceptance-v1.json',
 human:'content/production/symbolic-method/freeze/tarot-human-acceptance-freeze-v3.json',
 oldChecker:'scripts/check-tarot-live-browser-acceptance.mjs',
 oldAuthority:'functions/tarot-product-runtime/tarot-execution-authority-v1.js',
 currentAuthority:'functions/tarot-product-runtime/tarot-production-authority-v2.js',
 currentContext:'functions/api/symbolic-method-context.js',
 currentExecute:'functions/api/symbolic-method-execute.js',
 status:'functions/api/tarot-production-status.js',
 pcm:'content/governance/production-capability-matrix/registries/production-capability-registry-v7.json',
 catalog:'content/web-production/px2/successors/public-method-catalog-v3.json'
};
Object.values(P).forEach(exists);
const freeze=j(P.freeze),e=j(P.evidence),a=j(P.acceptance),h=j(P.human);
assert.equal(sha(P.freeze),'4cddf9cfc4a4a3efdba677e56d5cce3f118cad1de3dd80182e21d1fb5b7dea8b','Phase-K freeze must remain byte-stable');
for(const item of ['humanAcceptanceFreeze','browserFixtures','browserEvidence','contract','acceptance','publicHtml','publicClient','publicCss','executionAuthority']){
 const ref=freeze.artifacts[item];assert(ref?.path&&ref?.sha256,`K freeze artifact ${item}`);assert.equal(sha(ref.path),ref.sha256,`historical K artifact drift ${ref.path}`);
}
// contextApi is intentionally NOT re-hashed here: Phase M legitimately advances the current server authority.
assert.equal(e.aggregate.realBrowserEngineUsed,true);assert.equal(e.aggregate.humanAcceptance24Preserved,true);
assert.equal(e.results.KW44.cardCount,1);assert.equal(e.results.KW45.cardCount,3);assert.equal(e.results.KW46.enDynamic,true);assert.equal(e.results.KW46.zhHansDynamic,true);
assert.equal(e.results.KW48.sensitive.length,8);assert(e.results.KW48.sensitive.every(x=>x.passed===true));assert.equal(e.results.KW48.adversarial.length,8);assert(e.results.KW48.adversarial.every(x=>x.passed===true));
assert.equal(e.results.KW49.mobileViewport.noHorizontalOverflow,true);assert.equal(e.results.KW49.mobileViewport.resultsFocused,true);assert.equal(a.accepted.K_W50,true);
assert.equal(h.humanAcceptanceComplete,true);assert.equal(h.current.humanReviewed,24);assert.equal(h.current.accepted,24);
const context=fs.readFileSync(P.currentContext,'utf8'),execute=fs.readFileSync(P.currentExecute,'utf8');
assert(context.includes("tarot-production-authority-v2.js"));assert(context.includes('await resolveTarotExecutionAuthority(context)'));
assert(execute.includes("tarot-product-runtime-v1.js"));assert(execute.includes("method==='TAROT'"));assert(execute.includes('await resolveTarotExecutionAuthority(context)'));
const fake='a'.repeat(40),other='b'.repeat(40);
const trusted={methodCode:'TAROT',state:'LIMITED_PRODUCTION',runAllowed:true,productionCapabilityPromoted:true,humanAcceptance:true,liveBrowserAcceptance:true,liveProductionShaVerified:true,verifiedPersistenceProvider:true,approvedCommitSha:fake};
assert.equal(inspectTarotExecutionAuthority({data:{symbolicExecutionAuthority:{TAROT:trusted}},env:{CF_PAGES_COMMIT_SHA:other}}).authorized,false);
assert.equal(inspectTarotExecutionAuthority({data:{symbolicExecutionAuthority:{TAROT:trusted}},env:{CF_PAGES_COMMIT_SHA:fake}}).authorized,true);
const tar=j(P.pcm).capabilities.find(x=>x.methodRuntime?.pluginCode==='TAR');assert(tar);assert.equal(tar.capabilityAvailability,'LIMITED');assert.equal(tar.executionAuthority.runAllowedIsDynamic,true);assert.equal(tar.executionAuthority.staticRegistryMayGrantRunAllowed,false);
const pub=j(P.catalog).methods.find(x=>x.methodCode==='TAROT');assert(pub);assert.equal(pub.runAllowed,false);assert.equal(pub.staticCatalogMayGrantRunAllowed,false);assert.equal(pub.runtimeAuthorityEndpoint,'/api/tarot-production-status');
console.log('✓ TPA-K current compatibility passed: immutable real-browser/human evidence remains frozen while Phase-M server authority legitimately succeeds the old context source.');
console.log('  Historical K checker/artifacts are preserved; current Tarot execution remains dynamic, commit-pinned and server-only.');
