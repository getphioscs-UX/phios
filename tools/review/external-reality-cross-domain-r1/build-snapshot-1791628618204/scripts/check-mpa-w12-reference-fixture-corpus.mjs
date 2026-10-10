import assert from 'node:assert/strict';
import { BASELINE, readJson, sorted } from './lib/method-production-activation/mpa-validation-evidence-v1.mjs';
import { validateFixtureCorpus } from '../functions/method-production-activation/validation-evidence-runtime.js';
const corpus=readJson('content/professional/method-production-activation/fixtures/mpa-reference-fixture-corpus-v1.json'); const schema=readJson('content/professional/method-production-activation/schemas/mpa-reference-fixture-corpus-v1.schema.json');
assert.equal(corpus.work,'MPA-W12'); assert.equal(corpus.baselineCommit,BASELINE); assert.equal(schema.properties.work.const,'MPA-W12'); const result=validateFixtureCorpus(corpus); assert.match(result.corpusDigest,/^[a-f0-9]{64}$/);
for(const m of corpus.methods){const types=sorted(corpus.fixtures.filter(x=>x.methodCode===m).map(x=>x.fixtureType)); assert.deepEqual(types,['edge','invalid','regression','valid']);}
const coverage=new Set(corpus.fixtures.flatMap(x=>x.coverage)); for(const code of ['TIMEZONE_BOUNDARY','LEAP_YEAR','DST','MISSING_TIME','INVALID_LOCATION','DETERMINISM']) assert.ok(coverage.has(code),code);
const num=corpus.fixtures.find(x=>x.fixtureId==='NUM-VALID-001'); assert.deepEqual({lifePath:num.expected.lifePath,birthday:num.expected.birthdayNumber,attitude:num.expected.attitudeNumber},{lifePath:8,birthday:6,attitude:8});
assert.equal(corpus.rules.syntheticAdapterEvidenceCannotCreateProductionEligibility,true);
console.log('✓ MPA-W12 Reference Fixture Corpus passed.');
console.log('  NUM/AST/BZR/HDR each contain valid, edge, invalid and regression fixtures with timezone/leap/DST/missing-time/location coverage.');
