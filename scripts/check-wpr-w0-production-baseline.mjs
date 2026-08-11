import assert from 'node:assert/strict';
import { readJson, sha256, BASELINE, exists } from './lib/web-production/wpr-foundation-v1.mjs';
const b='content/web-production/audits';
for (const f of ['wpr-production-baseline-v1.json','wpr-route-baseline-v1.json','wpr-runtime-consumption-baseline-v1.json','wpr-frontend-authority-gap-v1.json','wpr-asset-delivery-gap-v1.json']) assert.ok(exists(`${b}/${f}`),f);
const audit=readJson(`${b}/wpr-production-baseline-v1.json`); assert.equal(audit.baseline.commit,BASELINE); assert.equal(audit.upstreamState.cpr.productionStatus,'validation_only'); assert.equal(audit.upstreamState.cpr.canonicalPresentationProductionRecordCount,0); assert.equal(audit.upstreamState.carPublishedAsset.productionStatus,'validation_only'); assert.equal(audit.upstreamState.carPublishedAsset.publicationCount,0); assert.equal(audit.upstreamState.alr.liveAcademyDelivery,false); assert.equal(audit.upstreamState.rmo.productionExecutionActivated,false); assert.equal(audit.upstreamState.vap.w4ArticleEligibilityActive,true); assert.equal(audit.upstreamState.vap.w5PjaBriefExportAccepted,true);
for (const [p,d] of Object.entries(audit.sourceDigests)) assert.equal(sha256(p),d,`WPR-W0 baseline source drift: ${p}`);
const routes=readJson(`${b}/wpr-route-baseline-v1.json`); assert.ok(routes.rootHtmlRouteCount>=40); assert.equal(routes.observations.routeAuthorityCurrentlyCentralized,false);
const asset=readJson(`${b}/wpr-asset-delivery-gap-v1.json`); assert.equal(asset.publicAssetAuthority.bucket,'phios-public-assets'); assert.equal(asset.publicAssetAuthority.publicBaseUrl,null); assert.equal(asset.publicAssetAuthority.failClosed,true); assert.equal(asset.wprW0MutatesR2,false);
console.log('✓ WPR-W0 Production Baseline Audit passed.');
