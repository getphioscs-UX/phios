import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';

const ROOT=process.cwd();
const readJson=p=>JSON.parse(fs.readFileSync(path.join(ROOT,p),'utf8'));
const sha256=p=>crypto.createHash('sha256').update(fs.readFileSync(path.join(ROOT,p))).digest('hex');
const exists=p=>assert.ok(fs.existsSync(path.join(ROOT,p)),`missing ${p}`);
const BASE='3ccbb60485c466e145ff33da0addfd6d991ac1c8';
const paths={
 cards:'content/professional/core-method-runtime/tarot-card-registry-v1.json',
 sourceV2:'content/interpretation/tarot/registries/tarot-source-registry-v2.json',
 tiers:'content/interpretation/tarot/registries/tarot-source-tier-registry-v1.json',
 rights:'content/interpretation/tarot/rights/tarot-source-rights-registry-v1.json',
 visualCorpus:'content/interpretation/tarot/corpus/tarot-rws-visual-observation-corpus-v1.json',
 visualSuccessor:'content/interpretation/tarot/reconciliation/tarot-visual-corpus-current-successor-v1.json',
 waite:'content/interpretation/tarot/corpus/tarot-waite-source-bound-corpus-v1.json',
 separation:'content/interpretation/tarot/contracts/tarot-source-text-editorial-separation-contract-v1.json',
 privateSourceRegistry:'content/interpretation/tarot/research/tarot-private-reference-source-registry-v1.json',
 privateCoverage:'content/interpretation/tarot/research/tarot-private-reference-coverage-v1.json',
 successor:'content/interpretation/tarot/reconciliation/tarot-source-corpus-current-successor-v1.json',
 acceptance:'content/interpretation/tarot/acceptance/tarot-source-bound-corpus-acceptance-v1.json',
 pcm:'content/governance/production-capability-matrix/registries/production-capability-registry-v6.json',
 publicCatalog:'content/web-production/px2/successors/public-method-catalog-v2.json'
};
for(const p of Object.values(paths)) exists(p);
const cards=readJson(paths.cards), sourceV2=readJson(paths.sourceV2), tiers=readJson(paths.tiers), rights=readJson(paths.rights), visual=readJson(paths.visualCorpus), waite=readJson(paths.waite), sep=readJson(paths.separation), privReg=readJson(paths.privateSourceRegistry), priv=readJson(paths.privateCoverage), succ=readJson(paths.successor), acc=readJson(paths.acceptance);

// W11 — exact identity-bound 78-card source locator map.
assert.equal(waite.baselineCommit,BASE);
assert.equal(waite.status,'WAITE_78_CARD_SOURCE_LOCATOR_MAPPING_COMPLETE_NOT_RUNTIME_BOUND');
assert.equal(cards.entries.length,78); assert.equal(waite.entries.length,78); assert.equal(visual.entries.length,78);
assert.deepEqual(waite.coverage,{cards:78,majorArcana:22,minorArcana:56,majorSourceUnits:44,minorSourceUnits:56,totalSourceUnits:100});
assert.equal(waite.sourceAuthority.sourceId,'TAR-SRC-WAITE-PKT-1910');
assert.equal(waite.sourceAuthority.rightsClass,'PUBLIC_DOMAIN'); assert.equal(waite.sourceAuthority.authorityTier,'T1'); assert.equal(waite.sourceAuthority.witnessPageCount,353);
assert.equal(waite.locatorGovernance.sourceTextVendored,false); assert.equal(waite.locatorGovernance.editorialParaphraseDeferred,true); assert.equal(waite.locatorGovernance.automatedMeaningInferenceForbidden,true); assert.equal(waite.locatorGovernance.runtimeConsumerRebound,false); assert.equal(waite.locatorGovernance.rebindRequiredAt,'TPA-W21');
const structural=new Map(cards.entries.map(x=>[x.cardId,x]));
const seen=new Set(); let unitCount=0, majorCount=0, minorCount=0;
const minorBase={WANDS:183,CUPS:211,SWORDS:239,PENTACLES:267};
const sourceOrder=['KING','QUEEN','KNIGHT','PAGE','TEN','NINE','EIGHT','SEVEN','SIX','FIVE','FOUR','THREE','TWO','ACE'];
const expectedMajorInner=n=>n===0?165:n===21?169:85+(n-1)*4;
const expectedMajorDiv=n=>n>=1&&n<=4?296:n>=5&&n<=10?297:n>=11&&n<=15?298:n===21?300:299;
for(const e of waite.entries){
 assert.ok(structural.has(e.cardId),`unknown card ${e.cardId}`); assert.ok(!seen.has(e.cardId),`duplicate card ${e.cardId}`); seen.add(e.cardId);
 const c=structural.get(e.cardId); assert.equal(e.cardIdentity,c.cardIdentity,`${e.cardId} identity drift`); assert.equal(e.canonicalTitle,c.canonicalTitle,`${e.cardId} title drift`);
 assert.equal(e.sourceId,'TAR-SRC-WAITE-PKT-1910'); assert.equal(e.rightsClass,'PUBLIC_DOMAIN'); assert.equal(e.authorityTier,'T1'); assert.equal(e.meaningAuthority,'SOURCE_BOUND_ONLY');
 assert.equal(e.sourceTextVendored,false); assert.equal(e.editorialParaphraseCreated,false); assert.equal(e.systemCompositionCreated,false); assert.equal(e.orientationPolicy.runtimeV1Orientation,'UPRIGHT_ONLY'); assert.equal(e.orientationPolicy.mappingActivatesReversals,false);
 assert.ok(Array.isArray(e.sourceUnits)); unitCount+=e.sourceUnits.length;
 for(const u of e.sourceUnits){ assert.ok(Number.isInteger(u.scanPageIndex)); assert.equal(u.printedPage,u.scanPageIndex-13); assert.equal(u.wikisourcePageUrl,`https://en.wikisource.org/wiki/Page:The_Pictorial_Key_to_the_Tarot.pdf/${u.scanPageIndex}`); }
 if(c.arcana==='MAJOR'){
   majorCount++; assert.equal(e.sourceUnits.length,2); const inner=e.sourceUnits.find(x=>x.unitType==='INNER_SYMBOLISM'), div=e.sourceUnits.find(x=>x.unitType==='DIVINATORY_MEANING'); assert.ok(inner&&div);
   assert.equal(inner.scanPageIndex,expectedMajorInner(c.number),`${e.cardId} inner locator drift`); assert.equal(div.scanPageIndex,expectedMajorDiv(c.number),`${e.cardId} divinatory locator drift`);
 } else {
   minorCount++; assert.equal(e.sourceUnits.length,1); const u=e.sourceUnits[0]; assert.equal(u.unitType,'CARD_DESCRIPTION_AND_DIVINATORY_MEANING'); const idx=sourceOrder.indexOf(c.rank); assert.ok(idx>=0); assert.equal(u.scanPageIndex,minorBase[c.suit]+idx*2,`${e.cardId} minor locator drift`);
 }
}
assert.equal(seen.size,78); assert.equal(unitCount,100); assert.equal(majorCount,22); assert.equal(minorCount,56);
for(const id of structural.keys()) assert.ok(seen.has(id),`missing Waite mapping ${id}`);

// W12 — source text, editorial paraphrase, and system composition stay distinct.
assert.equal(sep.baselineCommit,BASE); assert.equal(sep.status,'FROZEN_SOURCE_EDITORIAL_SYSTEM_SEPARATION');
assert.deepEqual(sep.layers.map(x=>x.layer),['SOURCE_RECORD','EDITORIAL_PARAPHRASE','SYSTEM_COMPOSITION']);
assert.equal(sep.phaseDPolicy.waiteSourceTextVendored,false); assert.equal(sep.phaseDPolicy.waiteLocatorMetadataOnly,true); assert.equal(sep.phaseDPolicy.editorialParaphrasesCreatedInPhaseD,false); assert.equal(sep.phaseDPolicy.systemCompositionCreatedInPhaseD,false); assert.equal(sep.phaseDPolicy.aiFillMissingSourceMaterialForbidden,true); assert.equal(sep.phaseDPolicy.runtimeRebindDeferredTo,'TPA-W21');
for(const v of Object.values(sep.invariants)) assert.equal(v,true);

// W13/W14 — private scans contribute only coverage/navigation metadata.
assert.equal(priv.baselineCommit,BASE); assert.equal(priv.status,'PRIVATE_REFERENCE_COVERAGE_METADATA_ONLY_NO_PUBLIC_TEXT_EXTRACTION'); assert.equal(priv.sources.length,3);
for(const k of ['publicTextExtraction','publicVendoring','publicCorpusIngestion','runtimeMeaningAuthority']) assert.equal(priv.rightsBoundary[k],false,`${k} must be false`);
assert.equal(priv.rightsBoundary.coverageObservationOnly,true); assert.equal(priv.researchRules.noSourceTextCopied,true); assert.equal(priv.researchRules.noExcerptsCopied,true); assert.equal(priv.researchRules.noCardMeaningClaimsCopied,true); assert.equal(priv.researchRules.noKeywordsCopied,true);
const regById=new Map(privReg.sources.map(x=>[x.sourceId,x]));
const forbiddenKeys=new Set(['sourceText','fullText','quote','quotation','excerpt','keywords','uprightMeaning','reversedMeaning','meaningClaim','interpretationClaim','editorialParaphrase']);
function walk(v,p='root') { if(Array.isArray(v)) return v.forEach((x,i)=>walk(x,`${p}[${i}]`)); if(v&&typeof v==='object'){ for(const [k,x] of Object.entries(v)){ assert.ok(!forbiddenKeys.has(k),`private coverage forbidden content field ${p}.${k}`); walk(x,`${p}.${k}`); } } }
walk(priv);
for(const s of priv.sources){ const r=regById.get(s.sourceId); assert.ok(r,`private coverage source not registered ${s.sourceId}`); assert.equal(s.rawFileSha256,r.rawFileSha256); assert.ok(Array.isArray(s.coverageUnits)&&s.coverageUnits.length>0); for(const u of s.coverageUnits){ assert.deepEqual(Object.keys(u).sort(),['coverageCategory','printedPageRange']); assert.ok(/^[A-Z0-9_]+$/.test(u.coverageCategory)); assert.ok(typeof u.printedPageRange==='string'&&u.printedPageRange.length<=20); } }
const privateInSource=sourceV2.sources.filter(x=>x.authorityTier==='T4'); assert.equal(privateInSource.length,3); for(const s of privateInSource){assert.equal(s.rightsClass,'PRIVATE_REFERENCE'); assert.equal(s.underlyingRightsStatus,'UNKNOWN_RIGHTS'); assert.equal(s.publicVendoringAllowed,false); assert.equal(s.corpusExtractionAllowed,false); assert.equal(s.meaningAuthority,'NOT_ADMITTED_TO_PUBLIC_RUNTIME');}

// W15 — source tiers remain governing authority; web/private sources do not promote.
assert.deepEqual(tiers.tiers.map(x=>x.tier),['T0','T1','T2','T3','T4','T5']); for(const t of tiers.tiers) assert.equal(t.automaticCanonicalPromotion,false);
const waiteSource=sourceV2.sources.find(x=>x.sourceId==='TAR-SRC-WAITE-PKT-1910'); assert.ok(waiteSource); assert.equal(waiteSource.authorityTier,'T1'); assert.equal(waiteSource.meaningAuthority,'SOURCE_BOUND_ONLY');
const artSource=sourceV2.sources.find(x=>x.sourceId==='TAR-ART-RWS-ORIGINAL-PD'); assert.ok(artSource); assert.equal(artSource.authorityTier,'T0'); assert.equal(artSource.meaningAuthority,false);
assert.ok(tiers.tiers.find(x=>x.tier==='T4').forbiddenRole.includes('RUNTIME_MEANING_AUTHORITY')); assert.ok(tiers.tiers.find(x=>x.tier==='T5').forbiddenRole.includes('SCRAPE_TO_CANONICAL'));
const rightsById=new Map(rights.sourceAssessments.map(x=>[x.sourceId,x])); assert.equal(rightsById.get('TAR-SRC-WAITE-PKT-1910').publicAdmission,true); for(const id of ['TAR-SRC-PRIV-LUA-01','TAR-SRC-PRIV-LUA-02','TAR-SRC-PRIV-LUA-03']) assert.equal(rightsById.get(id).publicAdmission,false);

// Successor pins predecessors, keeps TARI and product activation closed.
assert.equal(succ.baselineCommit,BASE); assert.equal(succ.status,'SOURCE_BOUND_CORPUS_ACTIVE_RUNTIME_REBIND_DEFERRED');
for(const item of Object.values(succ.preservedPredecessors)) assert.equal(sha256(item.path),item.sha256,`predecessor drift ${item.path}`);
assert.equal(succ.runtimeBinding.tariRuntimeConsumerRebound,false); assert.equal(succ.runtimeBinding.rebindRequiredAt,'TPA-W21'); assert.equal(succ.runtimeBinding.privateReferenceRuntimeConsumptionAllowed,false); assert.equal(succ.runtimeBinding.newUniversalMeaningAuthorityCreated,false);
for(const k of ['runAllowedChanged','productionCapabilityPromoted','persistenceActivated','humanAcceptanceClaimed','liveBrowserAcceptanceClaimed','liveProductionShaAlignmentClaimed']) assert.equal(succ.productionBoundary[k],false,`${k} must remain false`);
const pcm=readJson(paths.pcm), tarPcm=pcm.capabilities.find(x=>x.methodRuntime?.methodCode==='TAROT'); assert.ok(tarPcm); assert.equal(tarPcm.userExecutable,false); assert.equal(tarPcm.productionAccepted,false);
const cat=readJson(paths.publicCatalog), tarPublic=cat.methods.find(x=>x.methodCode==='TAROT'); assert.ok(tarPublic); assert.equal(tarPublic.runAllowed,false);
assert.equal(acc.baselineCommit,BASE); assert.equal(acc.status,'ACCEPTED_SOURCE_LOCATOR_CORPUS_NO_RUNTIME_REBIND_NO_PRODUCT_ACTIVATION'); for(const [k,v] of Object.entries(acc.accepted)) assert.equal(v,true,`${k} not accepted`);

console.log('✓ TPA-W11 Waite 78-card mapping passed: 78 structural identities mapped to 100 source units with deterministic 1922 Wikisource page locators.');
console.log('✓ TPA-W12 source/editorial/system separation passed: no Waite source text or editorial paraphrase is vendored by Phase D.');
console.log('✓ TPA-W13 LUA private-reference coverage passed: 3 sources recorded as coverage/navigation metadata only.');
console.log('✓ TPA-W14 private-reference boundary passed: no source text, excerpts, keywords, card meanings, public vendoring, or runtime authority leaked from T4 scans.');
console.log('✓ TPA-W15 source-tier verification passed: T0 visual-only, T1 Waite source-bound, T4 private research-only, T5 no scrape-to-canonical; TARI rebind and product activation remain closed.');
console.log(`  waite corpus sha256=${sha256(paths.waite)}`);
console.log(`  private coverage sha256=${sha256(paths.privateCoverage)}`);
