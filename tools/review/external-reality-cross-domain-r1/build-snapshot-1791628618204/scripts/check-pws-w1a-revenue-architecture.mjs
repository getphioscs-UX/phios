import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
const root=process.cwd();
const readJson=async p=>JSON.parse(await fs.readFile(path.join(root,p),'utf8'));
const revenue=await readJson('content/registry/pws-w1a-revenue-architecture.json');
const offers=await readJson('content/registry/pws-w1a-offer-catalog.json');
const boundaries=await readJson('content/registry/pws-w1a-modality-boundaries.json');
const index=await readJson('content/registry/index.json');
assert.equal(revenue.status,'extension-defined-implementation-pending');
assert.deepEqual(revenue.revenueFamilies.map(x=>x.familyId),[
  'knowledge_products','runtime_professional_services','interpretive_readers','experiential_reconstruction','regulated_financial_planning'
]);
const offerIds=new Set(offers.offers.map(x=>x.offerId));
assert.equal(offerIds.size,offers.offers.length);
for(const id of ['book_one_digital','audio_learning','video_learning','self_paced_course','professional_runtime_reading','human_design_interpretation','iching_reflection','tarot_reflection','sandtray_simulation','guided_consciousness_exploration','angelic_reiki_restorative_session','financial_planning','insurance_planning','investment_planning']) assert.equal(offerIds.has(id),true,`missing offer ${id}`);
for(const offer of offers.offers){
  assert.match(offer.name.en,/\S/); assert.match(offer.name['zh-Hans'],/\S/);
  if(offer.boundaryProfile) assert.ok(boundaries.modalities[offer.boundaryProfile],`missing boundary ${offer.boundaryProfile}`);
}
assert.equal(boundaries.modalities.iching_tarot.objectiveFact,false);
assert.equal(boundaries.modalities.sandtray.facilitatorInterpretationSeparated,true);
assert.equal(boundaries.modalities.guided_consciousness_exploration.historicalFactByDefault,false);
assert.equal(boundaries.modalities.angelic_reiki.diseaseTreatmentClaim,false);
assert.equal(boundaries.modalities.insurance_planning.suitabilityRequired,true);
assert.equal(boundaries.modalities.investment_planning.aiCardOrRisSelectsProduct,false);
assert.equal(offers.bundleRules.sourceLabelsRemainSeparate,true);
assert.equal(offers.bundleRules.regulatedAndUnregulatedOutputsMergedAsAdvice,false);
assert.equal(index.registries.pws_w1a_revenue_architecture,'./pws-w1a-revenue-architecture.json');
console.log('✓ PWS-W1A revenue architecture, offer catalog and modality boundaries passed.');
