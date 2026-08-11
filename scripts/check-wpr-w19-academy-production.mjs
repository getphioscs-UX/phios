import assert from 'node:assert/strict';
import { readText, readJson, BASELINE } from './lib/web-production/wpr-public-v1.mjs';
const c=readJson('content/web-production/composition/public/academy-discovery-composition-v1.json'); assert.equal(c.baselineCommit,BASELINE); assert.equal(c.work,'WPR-W19'); assert.equal(c.academyDiscoveryPublic,true);
for(const k of ['liveAcademyDeliveryActivated','entitlementActivated','progressActivated','assessmentActivated','credentialActivated']) assert.equal(c[k],false,k);
const freeze=readJson('content/academy/academy-learning-runtime/freeze/alr-v2-freeze-v1.json'); assert.equal(freeze.activationState.liveAcademyDelivery,false); assert.equal(freeze.activationState.assessmentExecutionOrCapabilityStateWrite,false); assert.equal(freeze.activationState.credentialEntitlementOrProfessionalAuthority,false);
const html=readText('academy.html'); assert.ok(html.includes('data-wpr-academy-discovery')); assert.ok(html.includes('data-i18n="academyLearning.status.wprDiscoveryBoundary"')); console.log('✓ WPR-W19 Academy Discovery Production Composition passed; live learning delivery remains inactive.');
