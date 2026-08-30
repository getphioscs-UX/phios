import assert from 'node:assert/strict';
import {fixture,buildFixtureProjection} from './lib/ecr-mandala-acceptance-fixture.mjs';
const p=buildFixtureProjection(),e=fixture.expectedSelection;
assert.equal(p.anchor.longitude,fixture.anchorLongitude);
assert.equal(p.selected.contextId,e.contextId);assert.equal(p.selected.grammarId,e.grammarId);assert.equal(p.selected.questionId,e.questionId);
assert.equal(p.selected.primaryCapabilityId,e.primaryCapabilityId);assert.deepEqual(p.selected.supportingCapabilityIds,e.supportingCapabilityIds);
assert.equal(p.selected.driverPriority[0].driverId,e.topDriverId);assert.equal(p.selected.motionId,e.motionId);assert.equal(p.selected.configurationId,e.configurationId);assert.equal(p.selected.activationId,e.activationId);
assert.deepEqual(Object.fromEntries(Object.entries(p.catalogs).map(([k,v])=>[k,v.length])),fixture.expectedCatalogCounts);
for(const expected of fixture.expectedDriverPriority){const actual=p.selected.driverPriority.find(x=>x.driverId===expected.driverId);assert(actual,expected.driverId);assert.equal(actual.rank,expected.rank);assert.ok(Math.abs(actual.baselineAffinity-expected.baselineAffinity)<1e-12,expected.driverId);assert.ok(Math.abs(actual.angularDistanceDegrees-expected.angularDistanceDegrees)<1e-12,expected.driverId);}
assert.equal(p.boundaries.rendererRecalculated,false);assert.equal(p.boundaries.visualProjectionCreatesMeaning,false);assert.equal(p.boundaries.currentDriverPriorityClaimed,false);assert.equal(p.boundaries.astrologySignPersonalityMeaningImported,false);assert.equal(p.boundaries.ichingFortuneMeaningImported,false);
console.log('✓ ECR Mandala projection gate passed: canonical 225.3515625° fixture resolves CC08/G11/Q11/R7+R5/D8/M6/ECR-H41/A1 with backend-owned driver values.');
