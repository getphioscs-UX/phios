import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import {projectOne,projectThree} from './lib/tarot/tari-fixtures-v1.mjs';
import {createTarotReadingIR} from '../functions/interpretation-runtime/tarot-reading-ir-v1.js';
import {createTarotProductPublicViewModel} from '../functions/symbolic-method-public-ux/tarot-product-view-model-v1.js';

const ROOT=process.cwd();
const BASE='60411a80e0247a99f26d6321ea6a4f6305042b5f';
const readJson=p=>JSON.parse(fs.readFileSync(path.join(ROOT,p),'utf8'));
const text=p=>fs.readFileSync(path.join(ROOT,p),'utf8');
const sha256=p=>crypto.createHash('sha256').update(fs.readFileSync(path.join(ROOT,p))).digest('hex');
const exists=p=>assert.ok(fs.existsSync(path.join(ROOT,p)),`missing ${p}`);
const P={
  cards:'content/professional/core-method-runtime/tarot-card-registry-v1.json',
  visual:'content/interpretation/tarot/corpus/tarot-rws-visual-observation-corpus-v1.json',
  visualLoc:'content/interpretation/tarot/registries/tarot-visual-evidence-locator-v1.json',
  sourceRegistry:'content/interpretation/tarot/registries/tarot-source-registry-v2.json',
  perspective:'content/interpretation/tarot/registries/tarot-interpretation-perspective-registry-v2.json',
  waite:'content/interpretation/tarot/corpus/tarot-waite-source-bound-corpus-v1.json',
  meaning:'content/interpretation/tarot/corpus/tarot-minimum-source-bound-corpus-v1.json',
  lens:'content/interpretation/tarot/registries/tarot-reflective-lens-registry-v1.json',
  blend:'content/interpretation/tarot/contracts/tarot-no-source-blending-contract-v1.json',
  freeze:'content/interpretation/tarot/freeze/tarot-corpus-freeze-v1.json',
  rcc:'content/interpretation/tarot/contracts/tarot-rcc-mandatory-contract-v1.json',
  agency:'content/interpretation/tarot/contracts/tarot-agency-contract-v1.json',
  uncertainty:'content/interpretation/tarot/contracts/tarot-uncertainty-contract-v1.json',
  comp:'content/interpretation/tarot/contracts/tarot-composition-evidence-contract-v1.json',
  surfaceContract:'content/public-ux/symbolic-method/contracts/tarot-product-result-surface-contract-v1.json',
  artworkContract:'content/public-ux/symbolic-method/contracts/tarot-artwork-production-binding-contract-v1.json',
  artworkManifest:'content/public-ux/symbolic-method/registries/tarot-artwork-production-manifest-v1.json',
  sourceVisibility:'content/public-ux/symbolic-method/contracts/tarot-source-visibility-contract-v1.json',
  a11y:'content/public-ux/symbolic-method/acceptance/tarot-product-surface-accessibility-acceptance-v1.json',
  successor:'content/interpretation/tarot/reconciliation/tarot-product-surface-current-successor-v1.json',
  acceptance:'content/interpretation/tarot/acceptance/tarot-product-surface-acceptance-v1.json',
  html:'readings/symbolic/index.html',
  client:'assets/js/pages/symbolic-perspective.js',
  css:'assets/css/symbolic-perspective.css',
  viewModel:'functions/symbolic-method-public-ux/tarot-product-view-model-v1.js',
  execute:'functions/api/symbolic-method-execute.js',
  pcm:'content/governance/production-capability-matrix/registries/production-capability-registry-v6.json',
  publicCatalog:'content/web-production/px2/successors/public-method-catalog-v2.json'
};
for(const p of Object.values(P)) exists(p);
const authorities=Object.freeze({
  cardRegistry:readJson(P.cards),visualCorpus:readJson(P.visual),visualLocator:readJson(P.visualLoc),sourceRegistry:readJson(P.sourceRegistry),perspectiveRegistry:readJson(P.perspective),waiteCorpus:readJson(P.waite),predecessorMeaningCorpus:readJson(P.meaning),reflectiveLensRegistry:readJson(P.lens),noSourceBlendingContract:readJson(P.blend),corpusFreeze:readJson(P.freeze)
});
const boundaryVersions=Object.freeze({rcc:readJson(P.rcc).contractVersion,agency:readJson(P.agency).contractVersion,uncertainty:readJson(P.uncertainty).contractVersion,compositionEvidence:readJson(P.comp).contractVersion});
const compositionEvidence=Object.freeze({generatedAt:'2026-08-24T10:00:00.000Z',authorityDigests:{corpusFreezeSha256:sha256(P.freeze)},boundaryContractVersions:boundaryVersions});

// W27 — one Reading IR drives the seven inspectable result layers.
const surface=readJson(P.surfaceContract);
assert.equal(surface.baselineCommit,BASE);assert.equal(surface.status,'SOURCE_BOUND_PRODUCT_SURFACE_READY_EXECUTION_STILL_GATED');
assert.deepEqual(surface.layers.map(x=>x.id),['YOUR_INPUT','METHOD_EVIDENCE','PROJECTION','SYMBOLIC_INTERPRETATION','REALITY_COMPARISON','WHAT_REMAINS_UNCERTAIN','POSSIBLE_NEXT_QUESTIONS_ACTIONS']);
assert.equal(surface.rules.readingIrIsSingleSurfaceInput,true);assert.equal(surface.rules.rawAiLongformMayReplaceHierarchy,false);assert.equal(surface.rules.rccMayBeHidden,false);assert.equal(surface.rules.agencyMayBeHidden,false);
const threeProj=await projectThree(['RWS-MAJOR-00','RWS-MAJOR-13','RWS-WANDS-ACE'],'TPAG-THREE');
const realityEvidence={supportingEvidence:[{statement:'A deadline is documented for this week.',source:'CURRENT_REALITY'}],contradictoryEvidence:[{statement:'The available budget does not support the most ambitious option.',source:'CURRENT_REALITY'}],observation:[{statement:'Two options remain open.',source:'CURRENT_REALITY'}],unknown:[{statement:'A stakeholder has not confirmed availability.',source:'CURRENT_REALITY'}]};
const ir=createTarotReadingIR({question:'What should I examine before choosing a direction?',contextDisclosure:{currentRealityContextUsed:true,currentRealityContextLabel:'Current Reality case R-001',contextUseWasExplicit:true},projections:threeProj,authorities,realityEvidence,compositionEvidence});
const view=createTarotProductPublicViewModel(ir);
assert.equal(view.schemaVersion,'PHI-OS-TAROT-PRODUCT-PUBLIC-VIEW-MODEL-v1.0.0');assert.equal(view.readingIrVersion,'1.0.0');assert.equal(view.hierarchy.length,7);assert.deepEqual(view.hierarchy.map(x=>x.id),surface.layers.map(x=>x.id));
assert.equal(view.hierarchy[1].data.draw.length,3);assert.equal(view.hierarchy[2].data.cards.length,3);assert.equal(view.hierarchy[3].data.cards.length,3);assert.equal(view.hierarchy[4].data.contradictoryEvidence.length,1);assert.ok(view.hierarchy[5].data.some(x=>x.status==='CONTRADICTORY'));
assert.equal(view.tarotSurface.agency.decisionAuthority,'USER');assert.equal(view.tarotSurface.agency.tarotMayDecide,false);assert.equal(view.production.runAllowed,false);
const oneIr=createTarotReadingIR({question:'What deserves attention?',projections:await projectOne('RWS-MAJOR-13','TPAG-ONE'),authorities,realityEvidence:{},compositionEvidence});
assert.equal(createTarotProductPublicViewModel(oneIr).hierarchy[2].data.cards.length,1);

// W28 — 78 rights-cleared original RWS witness bindings, no modern recolor or unknown artwork.
const artContract=readJson(P.artworkContract), manifest=readJson(P.artworkManifest);
assert.equal(artContract.baselineCommit,BASE);assert.equal(artContract.rules.originalRwsOnly,true);assert.equal(artContract.rules.modernRecolorAllowed,false);assert.equal(artContract.productionDelivery.currentMode,'REMOTE_RIGHTS_CLEARED_CANONICAL_WITNESS');
assert.equal(manifest.entries.length,78);assert.equal(manifest.coverage.cards,78);assert.equal(manifest.coverage.publicDomain,78);assert.equal(manifest.coverage.authorityTierT0,78);assert.equal(manifest.coverage.repoBundledAssets,0);
const ids=new Set();for(const item of manifest.entries){assert.equal(ids.has(item.cardId),false,`duplicate artwork ${item.cardId}`);ids.add(item.cardId);assert.equal(item.sourceId,'TAR-ART-RWS-ORIGINAL-PD');assert.equal(item.rightsStatus,'PUBLIC_DOMAIN');assert.equal(item.authorityTier,'T0');assert.equal(item.repoBundledAsset,false);assert.equal(item.deliveryMode,'REMOTE_RIGHTS_CLEARED_CANONICAL_WITNESS');assert.match(item.assetPath,/^https:\/\/upload\.wikimedia\.org\//);assert.match(item.originalSourcePage,/^https:\/\/commons\.wikimedia\.org\/wiki\/File:/);assert.ok(item.altTextEn.length>20);assert.ok(item.altTextZhHans.length>15);}
const projectionCards=view.hierarchy[2].data.cards;for(const card of projectionCards){assert.equal(card.artwork.rightsStatus,'PUBLIC_DOMAIN');assert.equal(card.artwork.authorityTier,'T0');assert.match(card.artwork.src,/^https:\/\/upload\.wikimedia\.org\//);}

// W29 — source title/edition/availability and exact page locators are visible; T4/T5 stay out.
const sourceContract=readJson(P.sourceVisibility);
assert.equal(sourceContract.baselineCommit,BASE);assert.equal(sourceContract.rules.privateReferenceTextMayBeProjected,false);assert.equal(sourceContract.rules.webDiscoveryMayBecomeRuntimeMeaningAuthority,false);
assert.equal(view.sourceVisibility.sources.length,3);for(const source of view.sourceVisibility.sources){assert.equal(source.sourceId,'TAR-SRC-WAITE-PKT-1910');assert.equal(source.sourceTitle,'The Pictorial Key to the Tarot');assert.ok(source.sourceEdition);assert.equal(source.authorityTier,'T1');assert.equal(source.rightsClass,'PUBLIC_DOMAIN');assert.ok(source.availability);assert.ok(source.sourceUnits.length>=1);for(const unit of source.sourceUnits){assert.match(unit.sourceUrl,/^https:\/\/en\.wikisource\.org\/wiki\/Page:/);assert.ok(unit.scanPageIndex>0);}}
const serialized=JSON.stringify(view);assert.equal(serialized.includes('TAR-SRC-PRIV-LUA'),false);assert.equal(serialized.includes('WEB_DISCOVERY'),false);

// W30 — bilingual source surface + static accessibility acceptance; live browser remains deferred.
const a11y=readJson(P.a11y), html=text(P.html), client=text(P.client), css=text(P.css);
assert.equal(a11y.baselineCommit,BASE);assert.equal(a11y.bilingual.en,true);assert.equal(a11y.bilingual.zhHans,true);assert.equal(a11y.browserAcceptance.realBrowserVerified,false);assert.equal(a11y.browserAcceptance.screenReaderVerified,false);
for(const token of ['puxr-lang-zh','puxr-lang-en','Interpretation based on…','View sources','data-symbolic-results hidden tabindex="-1" aria-live="polite"','data-view-sources aria-expanded="false"','data-execution-status'])assert.ok(html.includes(token),`html missing ${token}`);
for(const token of ['altTextZhHans','altTextEn','aria-expanded','puxr:localechange','loading="lazy"','referrerpolicy="no-referrer"'])assert.ok(client.includes(token),`client missing ${token}`);
for(const bad of ['localStorage','sessionStorage'])assert.equal(client.includes(bad),false,`hidden persistence primitive ${bad}`);
assert.ok(css.includes(':focus-visible'));assert.ok(css.includes('@media(max-width:800px)'));assert.ok(css.includes('@media(max-width:520px)'));
assert.equal(view.hierarchy[6].data.every(x=>x.en&&x.zhHans),true);assert.equal(view.authority.establishesFacts,false);assert.equal(view.authority.predictsGuaranteedOutcomes,false);assert.equal(view.authority.directsDecision,false);

// Acceptance / successor + production closure.
const acceptance=readJson(P.acceptance), successor=readJson(P.successor);
assert.equal(acceptance.baselineCommit,BASE);assert.equal(acceptance.status,'ACCEPTED_PRODUCT_SURFACE_SOURCE_BINDING_EXECUTION_STILL_CLOSED');
for(const [name,item] of Object.entries(acceptance.artifacts)){exists(item.path);assert.equal(item.sha256,sha256(item.path),`acceptance drift ${name}`);}
assert.equal(successor.baselineCommit,BASE);assert.equal(successor.status,'TAROT_PRODUCT_SURFACE_SOURCE_READY_EXECUTION_ACTIVATION_DEFERRED');assert.equal(successor.runtimeBinding.readingIrConsumerBound,true);assert.equal(successor.runtimeBinding.publicSurfaceReady,true);assert.equal(successor.productionBoundary.publicRunAllowedChanged,false);assert.equal(successor.productionBoundary.productionCapabilityPromoted,false);
const execute=text(P.execute);assert.ok(execute.includes('SYMBOLIC_LIMITED_PRODUCTION_NOT_ACTIVATED'));assert.ok(execute.includes('runAllowed:false'));
const pcm=readJson(P.pcm), tarPcm=pcm.capabilities.find(x=>x.methodRuntime?.methodCode==='TAROT');assert.ok(tarPcm);assert.equal(tarPcm.userExecutable,false);assert.equal(tarPcm.productionAccepted,false);
const catalog=readJson(P.publicCatalog), tarPublic=catalog.methods.find(x=>x.methodCode==='TAROT');assert.ok(tarPublic);assert.equal(tarPublic.runAllowed,false);

console.log('✓ TPA-W27 Result Surface Binding passed: Tarot Reading IR projects into the seven-layer product surface without collapsing into one AI answer.');
console.log('✓ TPA-W28 Artwork Production Binding passed: 78/78 original RWS PUBLIC_DOMAIN T0 witnesses are bound; no modern recolor or unknown artwork is admitted.');
console.log('✓ TPA-W29 Source Visibility passed: Waite title, edition, perspective availability and exact Wikisource locators remain inspectable; private/web discovery sources stay out.');
console.log('✓ TPA-W30 Bilingual / Accessibility source acceptance passed: EN + zh-Hans, semantic result focus, source disclosure state, alt text and responsive/focus-visible contracts are present; live browser/screen-reader verification remains deferred.');
console.log('  Product surface is source-ready; public execution remains closed.');
