import assert from 'node:assert/strict';
import fs from 'node:fs';
const base='content/customer-experience-rebuild'; const read=(p)=>JSON.parse(fs.readFileSync(p,'utf8'));
const routes=read(`${base}/authority/canonical-customer-route-registry-v2.json`);
const prep=read(`${base}/migration/hard-cutover-preparation-v2.json`);
const shell=read(`${base}/migration/old-shell-decommission-plan-v2.json`);
const acceptance=read(`${base}/acceptance/cx-r1a-acceptance-v2.json`);
assert.equal(routes.authorityBoundary.oneCanonicalDestinationPerPublicIntent,true);
const ids=routes.routes.map(x=>x.routeId), paths=routes.routes.map(x=>x.canonicalPath).filter(Boolean); assert.equal(new Set(ids).size,ids.length,'duplicate routeId'); assert.equal(new Set(paths).size,paths.length,'duplicate canonical path');
const ask=routes.routes.find(x=>x.routeId==='ASK'); assert.ok(ask); assert.equal(ask.canonicalPath,'/knowledge/ask/'); assert.equal(ask.currentOperationalPath,'/ask'); assert.equal(ask.cutoverState,'PREPARED_NOT_CUT_OVER');
for(const p of ['/ask','/ask.html','/knowledge-search','/knowledge-search.html']){const a=routes.legacyAliases.find(x=>x.path===p); assert.ok(a,`missing Ask compatibility alias ${p}`); assert.equal(a.destination,'/knowledge/ask/'); assert.equal(a.redirectStatus,308);}
assert.equal(prep.status,'HARD_CUTOVER_PREPARED_NOT_EXECUTED'); assert.equal(prep.rules.routeCutoverPerformed,false); assert.equal(prep.rules.physicalLegacyDeletePerformed,false); assert.equal(prep.rules.browserAcceptanceRequiredBeforeDelete,true); assert.equal(prep.rules.backendRuntimeDeleteForbidden,true);
assert.ok(prep.currentBlockers.some(x=>x.id==='ASK_SUCCESSOR_SURFACE_MISSING'),'R1A must expose that /knowledge/ask/ replacement is not built yet rather than pretending cutover is complete');
assert.ok(shell.entries.some(x=>x.path==='assets/js/public-shell.js')); assert.equal(shell.rules.deleteOnlyAfterZeroConsumerAndBrowserAcceptance,true);
assert.deepEqual(acceptance.requiredExitStates,['CANONICAL_SUCCESSOR_TARGETS_DECLARED','ASK_CANONICAL_ROUTE_IS_KNOWLEDGE_ASK','COMPATIBILITY_REDIRECT_PLAN_DECLARED','OLD_SHELL_DELETE_PLAN_READY','PHYSICAL_DELETE_DEFERRED_UNTIL_BROWSER_ACCEPTANCE','READY_FOR_CX_R2']);
assert.equal(acceptance.rules.routeCutoverPerformed,false); assert.equal(acceptance.rules.legacyPhysicalDeletePerformed,false);
console.log(`✓ CX-R1A hard-cutover preparation passed: canonical Ask target is /knowledge/ask/; ${prep.currentBlockers.length} current cutover blockers are explicitly recorded, not hidden.`);
console.log('✓ CX-R1A ACCEPTED: preparation complete, no premature route cutover or physical legacy deletion performed.');
