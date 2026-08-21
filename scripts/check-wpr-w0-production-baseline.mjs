import assert from 'node:assert/strict';
import { readJson, sha256, BASELINE, exists } from './lib/web-production/wpr-foundation-v1.mjs';
const b='content/web-production/audits';
for (const f of ['wpr-production-baseline-v1.json','wpr-route-baseline-v1.json','wpr-runtime-consumption-baseline-v1.json','wpr-frontend-authority-gap-v1.json','wpr-asset-delivery-gap-v1.json']) assert.ok(exists(`${b}/${f}`),f);
const audit=readJson(`${b}/wpr-production-baseline-v1.json`); assert.equal(audit.baseline.commit,BASELINE); assert.equal(audit.upstreamState.cpr.productionStatus,'validation_only'); assert.equal(audit.upstreamState.cpr.canonicalPresentationProductionRecordCount,0); assert.equal(audit.upstreamState.carPublishedAsset.productionStatus,'validation_only'); assert.equal(audit.upstreamState.carPublishedAsset.publicationCount,0); assert.equal(audit.upstreamState.alr.liveAcademyDelivery,false); assert.equal(audit.upstreamState.rmo.productionExecutionActivated,false); assert.equal(audit.upstreamState.vap.w4ArticleEligibilityActive,true); assert.equal(audit.upstreamState.vap.w5PjaBriefExportAccepted,true);
for (const [p,d] of Object.entries(audit.sourceDigests)) {
  if (p === 'wrangler.jsonc' && sha256(p) !== d) {
    const successor=readJson('content/knowledge/registry/m3c-w3-wrangler-successor-reconciliation-v1.json');
    assert.equal(successor.predecessor.wranglerSha256,d.replace('sha256:',''),`WPR-W0 baseline predecessor drift: ${p}`);
    assert.equal(successor.successor.wranglerSha256,sha256(p).replace('sha256:',''),`WPR-W0 successor drift: ${p}`);
    continue;
  }
  if (['content/registry/books.json','content/registry/parts.json'].includes(p) && sha256(p) !== d) {
    const successor=readJson('content/knowledge/authoring/audits/kau-r0-five-volume-baseline-reconciliation-v1.json');
    assert.equal(successor.status,'reconciled');
    assert.equal(successor.before.architecture,'four-volume-15-part');
    assert.equal(successor.after.architecture,'five-volume-15-part');
    continue;
  }
  if (p === 'content/registry/public-assets.json' && sha256(p) !== d) {
    const successor=readJson('content/web-production/reconciliation/wpr-w7-w10-hpc2-pre-successor-v1.json');
    const current=readJson(p);
    assert.equal(successor.historicalWprEvidencePreserved,true);
    assert.equal(successor.successorRules.registryMayAddConcreteMembersWithoutRewritingHistoricalObservation,true);
    assert.equal(current.registry_version,'1.2.0');
    assert.equal(current.bucket,'phios-public-assets');
    assert.equal(current.resolution_policy.fail_closed,true);
    continue;
  }
  if (p === 'content/knowledge/public/authority/published-knowledge-authority.json' && sha256(p) !== d) {
    const successor=readJson('content/web-production/reconciliation/bfr-h-part-a-7e2b212-current-source-successor-v1.json');
    const transition=successor.reconciledDrifts.find(item=>item.path===p);
    assert.equal(successor.status,'ADDITIVE_CURRENT_SOURCE_SUCCESSOR_ACTIVE_HISTORICAL_EVIDENCE_PRESERVED');
    assert.equal(successor.historicalArtifactsRewritten,false);
    assert.ok(transition,'WPR-W0 Published Knowledge successor reconciliation required');
    assert.equal(transition.currentSha256,sha256(p).replace('sha256:',''),'WPR-W0 Published Knowledge current successor drift');
    assert.equal(transition.authorityRecreated,false);
    continue;
  }
  assert.equal(sha256(p),d,`WPR-W0 baseline source drift: ${p}`);
}
const routes=readJson(`${b}/wpr-route-baseline-v1.json`); assert.ok(routes.rootHtmlRouteCount>=40); assert.equal(routes.observations.routeAuthorityCurrentlyCentralized,false);
const asset=readJson(`${b}/wpr-asset-delivery-gap-v1.json`); assert.equal(asset.publicAssetAuthority.bucket,'phios-public-assets'); assert.equal(asset.publicAssetAuthority.publicBaseUrl,null); assert.equal(asset.publicAssetAuthority.failClosed,true); assert.equal(asset.wprW0MutatesR2,false);
console.log('✓ WPR-W0 Production Baseline Audit passed.');
