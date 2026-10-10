import assert from 'node:assert/strict';
import fs from 'node:fs';
const benchmark=JSON.parse(fs.readFileSync('content/customer-experience-rebuild/r12r4b/smr/benchmark/smr-competitive-product-benchmark-v1.json','utf8'));
assert.equal(benchmark.schemaVersion,'PHI-OS-SMR-R2-COMPETITIVE-PRODUCT-BENCHMARK-v1.0.0');
assert.equal(benchmark.benchmarkScope,'PRODUCT_UX_AND_COVERAGE_ONLY');
assert.equal(benchmark.governance.meaningAuthority,false);
assert.equal(benchmark.governance.webProseCopied,false);
assert.equal(benchmark.governance.canonicalMeaningCreatedFromBenchmark,false);
assert.equal(benchmark.governance.sourceRole,'PRODUCT_COVERAGE_BENCHMARK_ONLY');
assert.equal(benchmark.platforms.length,6);
assert.equal(benchmark.dimensions.length,12);
const allowedStatuses=new Set(['PHIOS_BELOW','PHIOS_MATCH','PHIOS_ABOVE','NOT_COMPARABLE']);
assert.deepEqual(new Set(benchmark.phiOSComparison.map(item=>item.dimension)),new Set(benchmark.dimensions));
for(const item of benchmark.phiOSComparison)assert.ok(allowedStatuses.has(item.status));
const allowedHosts=new Set(['www.astro.com','horoscopes.astro-seek.com','cafeastrology.com','astro.cafeastrology.com','www.thepattern.com','timepassages.astrograph.com','www.numerology.com']);
for(const platform of benchmark.platforms){
  assert.ok(platform.evidenceUrls.length>0);assert.ok(platform.observedFeatures.length>0);assert.ok(platform.benchmarkUse.length>0);
  for(const url of platform.evidenceUrls){const parsed=new URL(url);assert.equal(parsed.protocol,'https:');assert.ok(allowedHosts.has(parsed.hostname),`Unexpected benchmark host: ${parsed.hostname}`)}
  for(const feature of platform.observedFeatures)assert.ok(feature.length<220,'Benchmark observation must stay concise and paraphrased.');
}
assert.equal(benchmark.boundary.productionMeaningChanged,false);
assert.equal(benchmark.boundary.customerCutoverChanged,false);
assert.equal(benchmark.boundary.competitiveCopyUsed,false);
assert.equal(benchmark.boundary.liveVisualSuperiorityClaimed,false);
console.log('✓ CX-R12R4B SMR-R2 W11 competitive benchmark passed: six product references, 12 UX/coverage dimensions, no web meaning authority and conservative pre-render comparison states.');
