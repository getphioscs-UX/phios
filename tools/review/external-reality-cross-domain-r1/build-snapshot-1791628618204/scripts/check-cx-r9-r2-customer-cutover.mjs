import assert from 'node:assert/strict';
import fs from 'node:fs';
import crypto from 'node:crypto';
import {onRequestGet} from '../functions/api/customer-contextual-ask.js';
import {contextualAskDisclosure} from '../functions/contextual-ask/contextual-ask-runtime.js';

const read=p=>fs.readFileSync(p,'utf8');
const json=p=>JSON.parse(read(p));
const sha=p=>crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
const exists=p=>fs.existsSync(p);

const reconciliationPath='content/customer-experience-rebuild/contextual-ask/audits/cx-r9-r2-production-cutover-reconciliation-v1.json';
const acceptancePath='content/customer-experience-rebuild/contextual-ask/acceptance/cx-r9-r2-customer-cutover-acceptance-v1.json';
const freezePath='content/customer-experience-rebuild/contextual-ask/freeze/contextual-ask-customer-cutover-freeze-v1.json';
for(const path of [reconciliationPath,acceptancePath,freezePath])assert.ok(exists(path),`CX-R9-R2 cutover successor missing ${path}`);

const reconciliation=json(reconciliationPath);
const acceptance=json(acceptancePath);
const freeze=json(freezePath);
assert.equal(reconciliation.baselineCommit,'429ec91ec8529b45d8c789aae48779344fe2e789');
assert.equal(reconciliation.status,'CURRENT_MAIN_RECONCILED_TO_P1_ACCEPTED_CUTOVER');
assert.equal(acceptance.status,'CUSTOMER_CUTOVER_RECONCILED_P1_BROWSER_ACCEPTED');
assert.equal(acceptance.customerCutoverAccepted,true);
assert.equal(freeze.status,'CURRENT_CUSTOMER_CUTOVER_FROZEN');
assert.equal(freeze.canonicalRoute,'/knowledge/ask/');
assert.equal(freeze.routeCutoverActor,'P1');
assert.equal(freeze.routeCutoverPerformedByR9R2,false);
assert.equal(freeze.customerContract.clientMaySelfAuthorizeProtectedContext,false);
assert.equal(freeze.customerContract.silentAccountContextInjection,false);
assert.equal(freeze.customerContract.genericAiSurface,false);

// Historical W0-W15 evidence must remain exactly preserved. Current cutover truth is recorded only in successor evidence.
const historical={
  contextualAskContractV2:'content/customer-experience-rebuild/contextual-ask/contracts/contextual-ask-contract-v2.json',
  machineAcceptanceV1:'content/customer-experience-rebuild/contextual-ask/acceptance/cx-r9-r2-machine-acceptance-v1.json',
  humanAcceptanceV1:'content/customer-experience-rebuild/contextual-ask/acceptance/cx-r9-r2-human-acceptance-v1.json',
  contextualAskFreezeV2:'content/customer-experience-rebuild/contextual-ask/freeze/contextual-ask-contract-freeze-v2.json'
};
for(const [key,path] of Object.entries(historical))assert.equal(sha(path),reconciliation.historicalEvidenceDigests[key],`historical CX-R9-R2 evidence drift: ${path}`);
assert.equal(json(historical.humanAcceptanceV1).status,'PENDING_PRODUCTION_BROWSER_REVIEW','historical W15 human state must remain historical, not be rewritten');
assert.equal(json(historical.contextualAskFreezeV2).routeCutoverPerformed,false,'historical W15 freeze must remain pre-P1');

// Current route truth is P1 cutover + accepted browser + physical legacy delete.
const p1=json('content/customer-experience-rebuild/migration/priority-route-cutover-registry-v3.json');
const routes=json('content/customer-experience-rebuild/authority/canonical-customer-route-registry-v5.json');
const browser=json('content/customer-experience-rebuild/acceptance/p1-production-browser-acceptance-v1.json');
const askRoute=routes.routes.find(row=>row.routeId==='ASK');
assert.ok(askRoute,'current ASK route missing');
assert.equal(p1.status,'P1_ROUTE_CUTOVER_BROWSER_ACCEPTED_PHYSICAL_LEGACY_DELETE_COMPLETE');
assert.equal(browser.browserAcceptance,true);
assert.equal(browser.status,'HUMAN_ACCEPTED_BY_USER_CONFIRMATION');
assert.equal(askRoute.canonicalPath,'/knowledge/ask/');
assert.equal(askRoute.currentOperationalPath,'/knowledge/ask/');
assert.equal(askRoute.routeCutoverPerformedByP1,true);
assert.equal(askRoute.routeCutoverPerformedByR2,false);
assert.equal(askRoute.productionBrowserAccepted,true);
assert.equal(askRoute.physicalLegacyPresentationDeleted,true);
assert.equal(exists('ask.html'),false,'retired ask.html presentation returned');
assert.equal(exists('knowledge-search.html'),false,'retired knowledge-search.html presentation returned');

const redirects=read('_redirects');
for(const alias of ['/ask','/ask.html','/knowledge-search','/knowledge-search.html'])assert.ok(redirects.includes(`${alias} /knowledge/ask/ 308`),`Ask compatibility redirect drift: ${alias}`);

// Current Ask customer surface must be product language, not lifecycle/governance language.
const html=read('knowledge/ask/index.html');
for(const marker of [
  'data-cx-r9-r2="CURRENT-CUTOVER-ACTIVE"',
  'What should this answer use?',
  'Using for this answer',
  'WHAT I USED',
  'WHAT MAY CHANGE',
  'WHAT REMAINS OPEN',
  'Sources and context',
  'data-cx-contextual-ask-form',
  'data-cx-ask-context-selector'
])assert.ok(html.includes(marker),`refined Ask surface missing ${marker}`);
for(const oldCopy of [
  'Governed PHI OS knowledge',
  'No governed source can answer',
  'Context disclosure',
  'WHAT ASK DOES NOT DO',
  'professional recommendations or entitlement',
  'admitted current-source references',
  'Ask answer itself does not become Reality evidence'
])assert.equal(html.includes(oldCopy),false,`internal/predecessor Ask copy still visible: ${oldCopy}`);

const client=read('assets/customer-ui/js/surfaces/contextual-ask.js');
for(const marker of [
  "GOVERNED_KNOWLEDGE:tr('PHI OS knowledge'",
  'participantLabel',
  'scopeLabel',
  'systemLabel',
  "item.availability==='AVAILABLE_FROM_SOURCE'",
  'Open Ask from the original reading, relationship or profile',
  'errorMessage',
  'selectedKnowledgeContext',
  'knowledgeContext',
  'data-cx-seeded-context'
])assert.ok(client.includes(marker),`refined Ask client missing ${marker}`);
assert.equal(client.includes('<dt>${esc(tr(\'Authority\''),false,'raw Authority label must not be rendered by default');
assert.equal(client.includes('s.sourceAuthority'),false,'raw sourceAuthority must not be rendered by customer client');

// Protected context: client-supplied ref remains unavailable; server-resolved source becomes available.
const unauthResponse=await onRequestGet({request:new Request('https://phios.test/api/customer-contextual-ask?locale=en&contextType=RELATIONSHIP_GOVERNED_READING&contextRef=REL-1'),data:{}});
const unauth=await unauthResponse.json();
const unauthRow=unauth.availability.find(x=>x.contextType==='RELATIONSHIP_GOVERNED_READING');
assert.equal(unauthRow.availability,'REQUIRES_SERVER_AUTHORIZED_CONTEXT');

const authorizedResolved=[{
  contextType:'RELATIONSHIP_GOVERNED_READING',contextRef:'REL-1',serverAuthorized:true,consent:{accepted:true},
  participant:'A_AND_B',caseScope:'RELATIONSHIP:REL-1',label:'This relationship',generatedAt:'2026-09-06T08:00:00Z'
}];
const authResponse=await onRequestGet({request:new Request('https://phios.test/api/customer-contextual-ask?locale=en&contextType=RELATIONSHIP_GOVERNED_READING&contextRef=REL-1'),data:{resolvedAskContexts:authorizedResolved}});
const auth=await authResponse.json();
const authRow=auth.availability.find(x=>x.contextType==='RELATIONSHIP_GOVERNED_READING');
assert.equal(authRow.availability,'AVAILABLE_FROM_SOURCE');
assert.equal(authRow.requestedContextRef,'REL-1');
assert.equal(authRow.participant,'A_AND_B');
assert.equal(authRow.caseScope,'RELATIONSHIP:REL-1');

// Locale refinement: current-fact source label must be customer-readable in zh-Hans.
const facts={state:'AVAILABLE',retrievedAt:'2026-09-06T08:00:00Z',freshness:'CURRENT',limitations:[]};
const zhDisclosure=contextualAskDisclosure([],facts,'zh-Hans');
assert.equal(zhDisclosure.currentVsStable.current[0].label,'当前公共事实');

// Active CX method surfaces should not rely on compatibility /ask redirects.
for(const path of ['perspectives/tarot/index.html','perspectives/iching/consult/index.html','perspectives/iching/run/index.html']){
  const text=read(path);
  assert.ok(text.includes('href="/knowledge/ask/"'),`${path} missing canonical Ask link`);
  assert.equal(/href="\/ask(?:"|\/)/.test(text),false,`${path} still links to compatibility /ask`);
}

assert.equal(acceptance.browserAcceptance.freshPerCellAssertionsInvented,false);
assert.equal(acceptance.browserAcceptance.freshR9R2RefinementVisualReviewClaimed,false);
assert.equal(acceptance.refinementAcceptance.clientSelfAuthorizationBlocked,true);
assert.equal(acceptance.authorityMutation,false);

console.log('✓ CX-R9-R2 customer cutover reconciliation passed.');
console.log('  /knowledge/ask/ is the accepted current route via P1; historical W0-W15 evidence remains byte-preserved and is not rewritten after the fact.');
console.log('  Customer copy is humanized, public Knowledge context remains direct, and protected Reading / Relationship / Profile context remains server-resolved and fail-closed.');
