import assert from 'node:assert/strict';
import fs from 'node:fs';
import { execFileSync } from 'node:child_process';

const base = 'content/customer-experience-rebuild';
const read = (p) => JSON.parse(fs.readFileSync(p, 'utf8'));
const BASELINE = 'f6d31dafdc37dcf3d8f2ebd1236bfa500b7dc64c';

execFileSync(process.execPath, ['scripts/generate-cx-r2-successor.mjs', '--check'], { stdio: 'pipe' });

const spine = read(`${base}/registries/customer-experience-spine-v2.json`);
const intents = read(`${base}/registries/customer-intent-model-v1.json`);
const ia = read(`${base}/authority/customer-information-architecture-v1.json`);
const routes = read(`${base}/authority/canonical-customer-route-registry-v3.json`);
const journey = read(`${base}/contracts/reality-journey-depromotion-contract-v1.json`);
const surfaces = read(`${base}/registries/customer-surface-registry-v3.json`);
const acceptance = read(`${base}/acceptance/cx-r2-acceptance-v2.json`);
const r1a = read(`${base}/acceptance/cx-r1a-acceptance-v2.json`);

for (const artifact of [spine, intents, ia, routes, journey, surfaces, acceptance]) {
  assert.equal(artifact.baselineCommit, BASELINE, `${artifact.schemaVersion} is not aligned to current main f6d31da`);
}
assert.equal(r1a.baselineCommit, BASELINE, 'CX-R2 may not run on a stale CX-R1A reconciliation');
assert.equal(r1a.status, 'ACCEPTED_HARD_CUTOVER_PREPARATION');

assert.equal(spine.status, 'CUSTOMER_MAIN_CHAIN_FROZEN');
assert.deepEqual(spine.canonicalSequence, ['UNDERSTAND', 'ESTABLISH', 'READ', 'NAVIGATE', 'ACT', 'OBSERVE', 'REVIEW', 'CONTINUE']);
assert.deepEqual(spine.customerDisplaySequence, ['Understand', 'Read', 'Choose', 'Act', 'Observe', 'Review', 'Continue']);
assert.equal(spine.compressionRule.internalCanonicalSequenceMustRemainEightSteps, true);
assert.equal(spine.rules.backendAuthorityCreatedByCx, false);

assert.equal(intents.status, 'PRIMARY_CUSTOMER_INTENTS_FROZEN');
assert.equal(intents.principle, 'ENTRY_BY_CUSTOMER_INTENT_NOT_PRODUCT_CATALOG');
assert.deepEqual(intents.primaryIntents.map((x) => x.intentId), ['QUESTION', 'PERSPECTIVE', 'REALITY_WORK']);
assert.deepEqual(intents.primaryIntents.map((x) => x.customerLanguage), [
  'I have a question',
  'I want another perspective',
  'I need to work through something real'
]);
assert.deepEqual(intents.primaryIntents.map((x) => x.primaryRouteId), ['ASK', 'PERSPECTIVES', 'MY_REALITY']);
assert.equal(new Set(intents.primaryIntents.map((x) => x.canonicalPath)).size, 3, 'primary intents must resolve to three distinct primary destinations');
assert.equal(intents.rules.productGridAsPrimaryEntryForbidden, true);

assert.equal(ia.status, 'GLOBAL_IA_FROZEN_PRE_CUTOVER');
assert.deepEqual(ia.primaryNavigation, ['EXPLORE', 'MY_REALITY', 'PERSPECTIVES', 'KNOWLEDGE', 'PROFESSIONAL']);
assert.deepEqual(ia.utilities, ['SEARCH', 'ASK', 'ACCOUNT', 'LOCALE']);
for (const forbidden of ['REALITY_JOURNEY', 'READINGS', 'SERVICES', 'ACADEMY', 'REPORTS', 'FINANCIAL', 'BOOKS']) {
  assert.ok(ia.forbiddenTopLevel.includes(forbidden), `missing forbidden first-level navigation: ${forbidden}`);
  assert.equal(ia.primaryNavigation.includes(forbidden), false, `${forbidden} may not be first-level navigation`);
}

assert.deepEqual(ia.domains.EXPLORE.items.map((x) => x.label), ['What is PHI OS', 'How it works', 'Start here', 'Five Books', 'Articles', 'About']);
assert.deepEqual(ia.domains.MY_REALITY.items.map((x) => x.label), ['Overview', 'Current Reality', 'Perspectives', 'Navigation', 'Actions', 'Review', 'History', 'Reports']);
const history = ia.domains.MY_REALITY.items.find((x) => x.itemId === 'HISTORY');
assert.equal(history.state, 'FUTURE_GATED');
assert.equal(history.futureDependency, 'LRM');
assert.deepEqual(ia.domains.PERSPECTIVES.items.map((x) => x.label), ['Personal Reality', 'Relationship', 'Current Context', 'Astrology', 'BaZi', 'Zi Wei', 'Human Design', 'Numerology', 'I Ching', 'Tarot']);
assert.ok(ia.domains.PERSPECTIVES.items.every((x) => x.availability === 'UPSTREAM_CONTROLLED'));
assert.equal(ia.domains.PERSPECTIVES.successorReservedItems[0].itemId, 'PROFILE_ASSESSMENT');
assert.equal(ia.domains.PERSPECTIVES.successorReservedItems[0].state, 'RESERVED_NOT_R2_ACTIVATED');
assert.deepEqual(ia.domains.KNOWLEDGE.items.map((x) => x.label), ['Ask PHI OS', 'Search', 'Articles', 'Five Books', 'Figures', 'Concepts / Glossary', 'Academy']);
assert.deepEqual(ia.domains.PROFESSIONAL.items.map((x) => x.label), ['Financial Reality', 'Professional Review', 'Reports', 'Services', 'Appointments']);
assert.deepEqual(ia.domains.ACCOUNT.sections.map((x) => x.label), ['Continue', 'My Reality', 'Recent Perspectives', 'Reports', 'Saved Knowledge', 'Settings']);
assert.ok(ia.domains.ACCOUNT.futureLrmSections.every((x) => x.state === 'FUTURE_GATED' && x.futureDependency === 'LRM'));
assert.equal(ia.rules.routeCutoverPerformedByR2, false);
assert.equal(ia.rules.availabilityMayNotBeHardCodedByCx, true);

assert.equal(routes.status, 'CUSTOMER_ROUTE_AUTHORITY_FROZEN_PRE_CUTOVER');
assert.deepEqual(routes.primaryNavigation, ia.primaryNavigation);
assert.deepEqual(routes.utilities, ia.utilities);
assert.equal(routes.authorityBoundary.routeCutoverPerformed, false);
assert.equal(routes.authorityBoundary.redirectsMutatedByR2, false);
assert.equal(routes.authorityBoundary.physicalLegacyDeletePerformed, false);
const routeIds = routes.routes.map((x) => x.routeId);
const canonicalPaths = routes.routes.map((x) => x.canonicalPath);
assert.equal(new Set(routeIds).size, routeIds.length, 'duplicate canonical route ID');
assert.equal(new Set(canonicalPaths).size, canonicalPaths.length, 'duplicate canonical route path');
for (const routeId of ['EXPLORE', 'MY_REALITY', 'PERSPECTIVES', 'KNOWLEDGE', 'PROFESSIONAL', 'SEARCH', 'ASK', 'ACCOUNT', 'PERSONAL_REALITY', 'FINANCIAL_REALITY', 'RELATIONSHIP', 'PROFILE', 'I_CHING', 'TAROT']) {
  assert.ok(routeIds.includes(routeId), `missing canonical route target ${routeId}`);
}
const ask = routes.routes.find((x) => x.routeId === 'ASK');
assert.equal(ask.canonicalPath, '/knowledge/ask/');
assert.equal(ask.currentOperationalPath, '/ask');
assert.equal(ask.successorPresentationAccepted, false);
assert.equal(ask.routeCutoverPerformedByR2, false);
const iChing = routes.routes.find((x) => x.routeId === 'I_CHING');
assert.equal(iChing.canonicalPath, '/perspectives/i-ching/');
assert.equal(iChing.currentOperationalPath, '/perspectives/iching/');
for (const p of ['/ask', '/ask.html', '/knowledge-search', '/knowledge-search.html']) {
  const alias = routes.compatibilityAliases.find((x) => x.path === p && x.canonicalRouteId === 'ASK');
  assert.ok(alias, `missing Ask compatibility plan ${p}`);
  assert.equal(alias.destination, '/knowledge/ask/');
  assert.equal(alias.redirectStatus, 308);
  assert.equal(alias.activation, 'PLANNED_COMPATIBILITY_NOT_R2_CUTOVER');
}
assert.ok(routes.routes.every((x) => x.routeCutoverPerformedByR2 === false));
assert.ok(routes.routes.every((x) => x.successorPresentationAccepted === false));
assert.equal(routes.rules.routeTargetDoesNotImplyCapabilityAvailable, true);

const iaRouteRefs = [];
for (const domain of ['EXPLORE', 'MY_REALITY', 'PERSPECTIVES', 'KNOWLEDGE', 'PROFESSIONAL']) {
  for (const item of ia.domains[domain].items) iaRouteRefs.push(item.routeId);
}
for (const item of ia.domains.PERSPECTIVES.successorReservedItems) iaRouteRefs.push(item.routeId);
for (const routeId of iaRouteRefs) assert.ok(routeIds.includes(routeId), `IA references missing route authority ${routeId}`);

assert.equal(journey.status, 'REALITY_JOURNEY_DEMOTED');
assert.equal(journey.customerPosition, 'WORKSPACE_PROGRESSION_NOT_FIRST_LEVEL_PRODUCT');
assert.deepEqual(journey.jrCustomerProjectionRoles, ['WORKSPACE_PROGRESS', 'STAGE', 'CONTINUATION', 'HANDOFF']);
assert.equal(journey.compatibility.currentRouteMayRemainTemporarily, true);
assert.equal(journey.compatibility.topNavigationAllowed, false);
assert.equal(journey.compatibility.primaryHomepageProductAllowed, false);
assert.equal(journey.compatibility.newStandaloneProductAuthorityAllowed, false);
assert.equal(journey.rules.jrBackendAuthorityUntouched, true);
assert.equal(journey.rules.physicalLegacyDeletePerformedByR2, false);

assert.equal(surfaces.status, 'CUSTOMER_SURFACE_AUTHORITY_FROZEN_PRE_PRESENTATION_CUTOVER');
assert.equal(surfaces.surfaceCount, surfaces.surfaces.length);
assert.equal(new Set(surfaces.surfaces.map((x) => x.surfaceId)).size, surfaces.surfaceCount, 'duplicate customer surface ID');
assert.equal(new Set(surfaces.surfaces.map((x) => x.route)).size, surfaces.surfaceCount, 'duplicate customer surface route');
const requiredSurfaceFields = ['surfaceId', 'route', 'customerPurpose', 'runtimeConsumers', 'authRequirement', 'primaryAction', 'secondaryAction', 'futureDependencies'];
for (const surface of surfaces.surfaces) {
  for (const field of requiredSurfaceFields) assert.ok(Object.hasOwn(surface, field), `${surface.surfaceId} missing ${field}`);
  assert.equal(surface.namespace, 'cx-');
  assert.equal(surface.shellAuthority, 'ONE_GLOBAL_CUSTOMER_SHELL_TARGET');
  assert.equal(surface.availabilityHardCodedByCx, false);
  assert.equal(surface.successorAuthorityState, 'R2_ROUTE_AND_PURPOSE_FROZEN_PRESENTATION_NOT_ACTIVATED_BY_R2');
}
assert.ok(surfaces.surfaces.some((x) => x.surfaceId === 'ASK' && x.route === '/knowledge/ask/'));
assert.ok(surfaces.surfaces.some((x) => x.surfaceId === 'PROFILE_ASSESSMENT' && x.route === '/perspectives/profile/'));
assert.equal(surfaces.rules.r2ActivatesPresentation, false);
assert.equal(surfaces.rules.r2PerformsRouteCutover, false);

const serialized = JSON.stringify({ ia, routes, surfaces });
assert.equal(serialized.includes('"availability":"AVAILABLE"'), false, 'CX-R2 may not hard-code perspective capability as AVAILABLE');
assert.equal(serialized.includes('"routeCutoverPerformed":true'), false, 'CX-R2 may not claim route cutover');

assert.equal(acceptance.status, 'ACCEPTED_CUSTOMER_IA_AND_ROUTE_AUTHORITY');
assert.deepEqual(acceptance.requiredExitStates, ['CUSTOMER_MAIN_CHAIN_FROZEN', 'GLOBAL_IA_FROZEN', 'REALITY_JOURNEY_DEMOTED']);
assert.equal(acceptance.rules.backendAuthorityTouched, false);
assert.equal(acceptance.rules.productionRouteCutoverPerformed, false);
assert.equal(acceptance.rules.legacyPhysicalDeletePerformed, false);
assert.equal(acceptance.rules.newCustomerDesignSystemCreated, false);
assert.equal(acceptance.rules.canonicalAskAuthority, '/knowledge/ask/');
assert.equal(acceptance.rules.readyForCxR3, true);

console.log(`✓ CX-R2 Customer IA / Route Authority passed at f6d31da: ${spine.canonicalSequence.length}-step internal spine, ${intents.primaryIntents.length} primary intents, ${ia.primaryNavigation.length} primary navigation domains, ${routes.routes.length} canonical route targets, ${surfaces.surfaceCount} customer surface authorities.`);
console.log('✓ CX-R2 ACCEPTED: CUSTOMER_MAIN_CHAIN_FROZEN · GLOBAL_IA_FROZEN · REALITY_JOURNEY_DEMOTED');
console.log('✓ No route cutover, legacy physical deletion, design-system creation, backend authority creation or hard-coded method availability was performed by CX-R2.');
