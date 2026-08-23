import assert from 'node:assert/strict'; import fs from 'node:fs';
const j=p=>JSON.parse(fs.readFileSync(p,'utf8')); const R='content/professional/core-method-runtime'; const s=j(`${R}/tarot-spread-registry-v1.json`), p=j(`${R}/tarot-position-contract-v1.json`);
assert.equal(s.work,'TAR-W4'); assert.equal(s.entries.length,2); assert.deepEqual(s.entries.map(x=>x.spreadId),['ONE_CARD','THREE_CARD']); assert.deepEqual(s.entries.map(x=>x.cardCount),[1,3]); assert.equal(s.rules.arbitraryPromptDefinedSpreadAllowed,false); assert.equal(s.rules.unregisteredSpreadAllowed,false); assert.equal(s.rules.pastPresentFutureDefaultAllowed,false);
assert.deepEqual(s.entries[0].positions.map(x=>x.label),['What deserves attention']); assert.deepEqual(s.entries[1].positions.map(x=>x.label),['Situation','Tension','Consideration']);
for(const spread of s.entries) for(const pos of spread.positions) assert.equal(pos.temporalPredictionRole,false);
const text=JSON.stringify(s).toLowerCase(); for(const forbidden of ['"past"','"present"','"future"']) assert.equal(text.includes(forbidden),false,`TAR-W5 predictive default leaked: ${forbidden}`);
assert.equal(p.work,'TAR-W5'); assert.equal(p.rules.positionAuthority,'TAROT_SPREAD_REGISTRY_V1'); assert.equal(p.rules.temporalPredictionRoleAllowed,false); assert.equal(p.rules.pagePromptMayRenamePosition,false); assert.equal(p.rules.positionMayCreateOutcomeClaim,false);
console.log('✓ TAR-W4/W5 governed ONE_CARD + THREE_CARD spread/position contracts passed.');
console.log('  Three-card v1 uses Situation / Tension / Consideration; Past / Present / Future is not a default.');
