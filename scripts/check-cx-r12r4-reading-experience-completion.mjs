import assert from 'node:assert/strict';
import fs from 'node:fs';
const read=p=>fs.readFileSync(p,'utf8');const json=p=>JSON.parse(read(p));
const html=read('perspectives/personal/index.html'),js=read('assets/customer-ui/js/surfaces/personal-reality.js'),css=read('assets/customer-ui/surfaces/personal-reality.css');
const workspace=json('content/customer-experience-rebuild/contracts/cx-r12r4-result-workspace-contract-v1.json');
const campaign=json('content/customer-experience-rebuild/review/cx-r12r4-visual-human-acceptance-campaign-v1.json');
const claims=json('content/customer-experience-rebuild/contracts/cx-r12r4-reading-claim-authority-map-v1.json');
const acceptance=json('content/customer-experience-rebuild/acceptance/cx-r12r4-source-acceptance-v1.json');
const iconRecon=json('content/customer-experience-rebuild/registries/cx-r12r4-icon-reconciliation-v1.json');
assert.deepEqual(workspace.tabs,['Overview','Graph','Structure','Patterns','Context','Reality Comparison','Technical Details']);
assert.equal(workspace.graph.rendererCreatesMeaning,false);assert.equal(workspace.structure.atomicMeaningDirectPublicationForbidden,true);assert.equal(workspace.patterns.rawSymbolConsensusForbidden,true);assert.equal(workspace.realityComparison.resonatesIsEvidence,false);assert.equal(workspace.handoff.realityFactPromotion,false);
for(const token of ['graphBoundaryBlock','WHAT THIS GRAPH SHOWS','WHAT IT DOES NOT ESTABLISH','renderCrossPerspectiveComparison','renderSourcesAndBoundaries','CALCULATED STRUCTURE','WHAT REMAINS OPEN'])assert(js.includes(token),`R12R4 result workspace missing ${token}`);
const pprR3SpecialistHost=html.includes('data-cx-specialist-products')&&fs.existsSync('content/professional/personal-reality/r3/authority/ppr-r3-w10-successor-freeze-v1.json');
const pprR5Editorial=fs.existsSync('content/professional/personal-reality/r5/authority/ppr-r5-editorial-successor-v1.json')&&html.includes('data-ppr-r5-editorial="true"');
const p2Assets=['PHIOS-FIGURE-CROSS-PERSPECTIVE-PATTERN-MAP-v1.svg','PHIOS-FIGURE-CROSS-PERSPECTIVE-PATTERN-MAP-v1-mobile.svg','PHIOS-FIGURE-PERSPECTIVE-TO-REALITY-CONTINUITY-v1.svg','PHIOS-FIGURE-PERSPECTIVE-TO-REALITY-CONTINUITY-v1-mobile.svg'];
if(pprR3SpecialistHost){
 const pprR3=json('content/professional/personal-reality/r3/authority/ppr-r3-w10-successor-freeze-v1.json');
 const productRenderers=read('assets/customer-ui/js/personal-products/personal-product-renderers.js');
 const specialistHost=read('assets/customer-ui/js/personal-products/specialist-renderer-host.js');
 assert.equal(pprR3.status,'FROZEN_PPR_R3_SPECIALIST_HOST');
 for(const asset of p2Assets)assert.equal(fs.existsSync(`assets/customer-ui/media/personal/figures/${asset}`),true,`historical R12R4 P2 source asset missing ${asset}`);
 assert.match(html,/data-cx-specialist-products/);if(pprR5Editorial){assert.match(html,/cannot silently promote symbolic material into objective evidence/);assert.match(html,/Similarity → observation/);}else assert.match(html,/Resonance is not evidence by itself/);assert.match(html,/data-cx-authority-layer="NAVIGATION_THRESHOLD"/);
 assert.match(productRenderers,/mountApprovedSpecialistRenderer/);assert.match(specialistHost,/mountApprovedSpecialistRenderer/);
 for(const panel of claims.resultPanels){assert(panel.panel&&Array.isArray(panel.authorityLayers)&&panel.authorityLayers.length,`invalid historical R12R4 claim panel contract ${panel.panel||'UNKNOWN'}`)}
}else{
 for(const asset of p2Assets)assert(html.includes(asset),`R12R4 P2 figure missing ${asset}`);
 assert.match(html,/data-cx-pattern-comparison/);assert.match(html,/data-cx-personal-sources/);assert.match(html,/SOURCES &amp; BOUNDARIES/);assert.match(html,/Resonates is not evidence by itself/);assert.match(html,/data-cx-authority-layer="NAVIGATION_THRESHOLD"/);
 for(const panel of claims.resultPanels){const re=new RegExp(`data-cx-panel="${panel.panel}"[^>]*data-cx-authority-layer="([^"]+)"`);const match=html.match(re);assert(match,`untyped R12R4 result panel ${panel.panel}`);for(const layer of panel.authorityLayers)assert(match[1].split(/\s+/).includes(layer),`${panel.panel} missing authority layer ${layer}`)}
}
const handoffSource=read('functions/api/customer-reality-handoff.js');
const ecrBridgeAcceptancePath='content/embodied-configuration/product-r3/acceptance/ecr-r3-w7-reality-bridge-v1.json';
if(fs.existsSync(ecrBridgeAcceptancePath)){
 const ecrBridge=json(ecrBridgeAcceptancePath);
 assert.equal(ecrBridge.status,'ENGINEERING_COMPLETE');
 assert.equal(ecrBridge.runtimeAuthority?.outputAuthority,'OBSERVATION_BRIDGE_ONLY');
 assert.equal(ecrBridge.handoff?.route,'/api/customer-reality-handoff');
 assert.equal(ecrBridge.handoff?.requiresExistingExplicitConsent,true);
 assert.equal(ecrBridge.handoff?.selectedResponsesOnly,true);
 assert.equal(ecrBridge.handoff?.responseAuthorityAfterHandoff,'USER_REPORTED_CONTEXT');
 assert.equal(ecrBridge.handoff?.currentRealityEvidenceCreated,false);
 assert.equal(ecrBridge.handoff?.currentRealityConclusionCreated,false);
 assert.equal(ecrBridge.handoff?.automaticPersistence,false);
 assert.equal(ecrBridge.boundaries?.userResponseRequiredBeforeReportedContext,true);
 assert.equal(ecrBridge.boundaries?.userResponseIsReportedContextNotEvidence,true);
 assert.equal(ecrBridge.boundaries?.currentRealityFactPromoted,false);
 assert.match(handoffSource,/validateEcrHumanDesignRealityBridgeResponse/);
 assert.match(handoffSource,/bridgeContext=buildEcrHumanDesignRealityBridgeReportedContext\(view,locale\)/);
 assert.match(handoffSource,/reportedContext:\[clean\(view\.realityResponse\),clean\(view\.realityNote\),\.\.\.bridgeContext\]\.filter\(Boolean\)/);
 assert.match(handoffSource,/ecrHumanDesignBridgeResponsesRemainUserReportedContext:true/);
 assert.match(handoffSource,/currentRealityEvidenceCreated:false,currentRealityConclusionCreated:false/);
}else assert.match(handoffSource,/reportedContext:\[clean\(view\.realityResponse\),clean\(view\.realityNote\)\]/);
assert.match(read('functions/reality-orchestration/reality-orchestrator.js'),/authorityClass:'USER_REPORTED_CONTEXT',realityFact:false/);
assert.match(css,/cx-graph-boundary/);assert.match(css,/cx-cross-perspective-compare/);assert.match(css,/cx-source-boundary-list/);assert.match(css,/@media\(max-width:620px\)/);
assert.equal(iconRecon.authorityBoundary.pagePrivateIconAuthorityForbidden,true);assert.equal(iconRecon.forbiddenNewIdentities.includes('PERSPECTIVE_NOT_FACT'),true);assert.equal(html.includes('PHIOS-ICON-PERSPECTIVE-NOT-FACT'),false);
assert.equal(campaign.status,'PENDING_REAL_BROWSER_AND_HUMAN_REVIEW');assert.equal(campaign.claims.realBrowserAccepted,false);assert.equal(campaign.claims.humanVisualAccepted,false);
const packageJson=json('package.json');const globalCheck=packageJson.scripts.check,r3Index=globalCheck.indexOf('npm run check:cx-r12r3b'),r4Index=globalCheck.indexOf('npm run check:cx-r12r4');assert(r3Index>=0&&r4Index>r3Index,'CX-R12R4 must remain the current global CX successor after CX-R12R3B even when later independent method gates follow');assert(packageJson.scripts['check:cx-r12r4'].startsWith('npm run check:cx-r12r3b &&'),'CX-R12R4 must preserve R12R3B predecessor gate');
assert.equal(acceptance.work,'CX-R12R4-W0-W19');assert.equal(acceptance.claims.sourceAccepted,true);assert.equal(acceptance.claims.realBrowserAccepted,false);assert.equal(acceptance.claims.humanVisualAccepted,false);assert.equal(acceptance.claims.fullProduction,false);
console.log('✓ CX-R12R4 W10–W19 source completion passed.');
console.log(pprR3SpecialistHost?'  Historical R12R4 graph/structure/pattern/context/reality/source contracts and P2 assets remain source-accepted while the frozen PPR-R3 specialist host owns the current customer result surface; W18 historical browser/human claims remain unchanged.':'  Governed graph/structure/pattern/context/reality/source layers, explicit handoff context, responsive P2 figures and claim authority typing are source-accepted; W18 real-browser + human visual acceptance remains pending.');
