import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';

const ROOT = process.cwd();
const readJson = (p) => JSON.parse(fs.readFileSync(path.join(ROOT,p),'utf8'));
const sha256 = (p) => crypto.createHash('sha256').update(fs.readFileSync(path.join(ROOT,p))).digest('hex');

const paths = {
  cards: 'content/professional/core-method-runtime/tarot-card-registry-v1.json',
  sourceV2: 'content/interpretation/tarot/registries/tarot-source-registry-v2.json',
  schema: 'content/interpretation/tarot/contracts/tarot-visual-observation-entry-v1.schema.json',
  corpus: 'content/interpretation/tarot/corpus/tarot-rws-visual-observation-corpus-v1.json',
  locator: 'content/interpretation/tarot/registries/tarot-visual-evidence-locator-v1.json',
  successor: 'content/interpretation/tarot/reconciliation/tarot-visual-corpus-current-successor-v1.json'
};
for (const p of Object.values(paths)) assert.ok(fs.existsSync(path.join(ROOT,p)), `missing ${p}`);

const cardReg=readJson(paths.cards);
const sourceReg=readJson(paths.sourceV2);
const schema=readJson(paths.schema);
const corpus=readJson(paths.corpus);
const locator=readJson(paths.locator);
const successor=readJson(paths.successor);

assert.equal(cardReg.entries.length,78,'structural card registry must contain 78 cards');
assert.equal(corpus.entries.length,78,'TAR-VIS corpus must contain 78 entries');
assert.equal(locator.entries.length,78,'visual evidence locator must contain 78 entries');
assert.equal(corpus.sourceAuthority.sourceId,'TAR-ART-RWS-ORIGINAL-PD');
assert.equal(corpus.sourceAuthority.rightsClass,'PUBLIC_DOMAIN');
assert.equal(corpus.sourceAuthority.authorityTier,'T0');
assert.equal(corpus.sourceAuthority.declaredFileCount,78);
assert.equal(locator.witnessSet.fileCount,78);
assert.equal(successor.runtimeBinding.tariRuntimeConsumerRebound,false);
assert.equal(successor.productionBoundary.runAllowedChanged,false);
assert.equal(successor.productionBoundary.productionCapabilityPromoted,false);

const source=sourceReg.sources.find(s=>s.sourceId==='TAR-ART-RWS-ORIGINAL-PD');
assert.ok(source,'T0 artwork source missing from source registry v2');
assert.equal(source.rightsClass,'PUBLIC_DOMAIN');
assert.equal(source.authorityTier,'T0');
assert.equal(source.meaningAuthority,false);
assert.equal(source.declaredCardCoverage,78);

const structural = new Map(cardReg.entries.map(c=>[c.cardId,c]));
const seen=new Set();
const artworkSeen=new Set();
const disallowedKeys=['meaning','keywords','interpretation','psychologicalMeaning','traditionalMeaning','uprightMeaning','reversedMeaning','prediction'];
const disallowedValueTerms=/\b(fortune|fate|destiny|will happen|soulmate|diagnos(?:e|is)|investment advice)\b/i;

for (const e of corpus.entries) {
  assert.ok(structural.has(e.cardId),`unknown cardId ${e.cardId}`);
  assert.ok(!seen.has(e.cardId),`duplicate cardId ${e.cardId}`); seen.add(e.cardId);
  assert.ok(!artworkSeen.has(e.artworkId),`duplicate artworkId ${e.artworkId}`); artworkSeen.add(e.artworkId);
  const c=structural.get(e.cardId);
  assert.equal(e.cardIdentity,c.cardIdentity,`${e.cardId} identity drift`);
  assert.equal(e.canonicalTitle,c.canonicalTitle,`${e.cardId} title drift`);
  assert.equal(e.deckId,c.deckId); assert.equal(e.deckVersion,c.deckVersion);
  assert.equal(e.sourceId,'TAR-ART-RWS-ORIGINAL-PD');
  assert.equal(e.witnessSetId,'WIKIMEDIA_COMMONS_TAIONWC_PAM_A_78');
  assert.equal(e.meaningAttached,false,`${e.cardId} meaningAttached must be false`);
  assert.equal(e.interpretationAllowedInThisRecord,false,`${e.cardId} interpretation must be false`);
  assert.equal(e.observationEvidence.rightsClass,'PUBLIC_DOMAIN');
  assert.equal(e.observationEvidence.authorityTier,'T0');
  assert.ok(e.observationEvidence.commonsFilePage.startsWith('https://commons.wikimedia.org/wiki/File:'),`${e.cardId} missing Commons file page`);
  assert.ok(e.observationEvidence.originalFileUrl.startsWith('https://upload.wikimedia.org/wikipedia/commons/'),`${e.cardId} missing original file locator`);
  for (const k of ['figures','objects','posture','direction','environment','foreground','background','numbers','writtenMarks','animals','plants','celestialObjects','architecturalObjects','visibleSymbols']) {
    assert.ok(Array.isArray(e[k]),`${e.cardId} ${k} must be array`);
  }
  for (const k of disallowedKeys) assert.ok(!(k in e),`${e.cardId} forbidden interpretation field: ${k}`);
  const observableOnly=JSON.stringify({figures:e.figures,objects:e.objects,posture:e.posture,direction:e.direction,environment:e.environment,foreground:e.foreground,background:e.background,numbers:e.numbers,writtenMarks:e.writtenMarks,animals:e.animals,plants:e.plants,celestialObjects:e.celestialObjects,architecturalObjects:e.architecturalObjects,visibleSymbols:e.visibleSymbols});
  assert.ok(!disallowedValueTerms.test(observableOnly),`${e.cardId} contains forbidden semantic/predictive terms in observation fields`);
}
assert.equal(seen.size,78);
for (const id of structural.keys()) assert.ok(seen.has(id),`missing TAR-VIS entry ${id}`);

const locByCard=new Map();
for (const l of locator.entries) {
  assert.ok(structural.has(l.cardId),`locator unknown card ${l.cardId}`);
  assert.ok(!locByCard.has(l.cardId),`duplicate locator ${l.cardId}`); locByCard.set(l.cardId,l);
  assert.equal(l.sourceId,'TAR-ART-RWS-ORIGINAL-PD');
  assert.equal(l.rightsClass,'PUBLIC_DOMAIN');
  assert.equal(l.authorityTier,'T0');
  assert.equal(l.repoBundledAsset,false);
  assert.equal(l.remoteAssetOnly,true);
}
for (const e of corpus.entries) {
  const l=locByCard.get(e.cardId); assert.ok(l,`missing locator ${e.cardId}`);
  assert.equal(l.artworkId,e.artworkId);
  assert.equal(l.commonsFileName,e.observationEvidence.commonsFileName);
  assert.equal(l.commonsFilePage,e.observationEvidence.commonsFilePage);
  assert.equal(l.originalFileUrl,e.observationEvidence.originalFileUrl);
}

const coverage={major:0,wands:0,cups:0,swords:0,pentacles:0};
for (const c of cardReg.entries) {
  if(c.arcana==='MAJOR') coverage.major++;
  else if(c.suit==='WANDS') coverage.wands++;
  else if(c.suit==='CUPS') coverage.cups++;
  else if(c.suit==='SWORDS') coverage.swords++;
  else if(c.suit==='PENTACLES') coverage.pentacles++;
}
assert.deepEqual(coverage,{major:22,wands:14,cups:14,swords:14,pentacles:14});
assert.deepEqual(corpus.coverage,{majorArcana:22,wands:14,cups:14,swords:14,pentacles:14,total:78});

// Schema governance checks. This is not a general JSON Schema validator; it verifies the frozen constraints the runtime depends on.
assert.equal(schema.additionalProperties,false);
assert.equal(schema.properties.meaningAttached.const,false);
assert.equal(schema.properties.interpretationAllowedInThisRecord.const,false);

console.log('✓ TPA-W7 Visual Observation Schema passed.');
console.log('✓ TPA-W8 78/78 RWS visual observations passed: 22 Major + 14 Wands + 14 Cups + 14 Swords + 14 Pentacles.');
console.log('✓ TPA-W9 Visual Evidence Locator passed: exactly one PUBLIC_DOMAIN T0 Commons Pam-A witness per card; image binaries are not vendored by this phase.');
console.log('✓ TPA-W10 TAR-VIS Machine Acceptance passed: visual observation remains meaning-free, source-attributed, card-identity bound, and runtime activation remains closed.');
console.log(`  corpus sha256=${sha256(paths.corpus)}`);
console.log(`  locator sha256=${sha256(paths.locator)}`);
