import assert from 'node:assert/strict';import fs from 'node:fs';
import {adaptTarotProjections} from '../functions/interpretation-runtime/adapters/tarot-interpretation-adapter-v1.js';
import {tariAuthorities,projectOne} from './lib/tarot/tari-fixtures-v1.mjs';
const registry=JSON.parse(fs.readFileSync('content/interpretation/tarot/registries/tarot-symbol-dimension-registry-v1.json','utf8'));
assert.equal(registry.work,'TARI-W1');assert.deepEqual(registry.dimensions.map(x=>x.dimensionId),['VISUAL_OBJECT','NUMBER','SUIT','FIGURE','ORIENTATION','POSITION']);assert.ok(registry.dimensions.every(x=>x.meaningAttached===false));assert.equal(registry.rules.semanticKeywordMappingAllowed,false);assert.equal(registry.rules.deathEqualsTransformationUniversalMappingAllowed,false);
for(const cardId of ['RWS-MAJOR-13','RWS-WANDS-KING','RWS-CUPS-ACE']){
  const b=adaptTarotProjections(await projectOne(cardId,`TARI-DIM-${cardId}`),{cardRegistry:tariAuthorities.cardRegistry,sourceRegistry:tariAuthorities.sourceRegistry,perspectiveRegistry:tariAuthorities.perspectiveRegistry,symbolDimensionRegistry:tariAuthorities.symbolDimensionRegistry,corpus:tariAuthorities.corpus});
  const d=b.cards[0].symbolDimensions;assert.equal(d.semanticMeaningAttached,false);assert.equal(d.visualObject.status,'NOT_INGESTED');assert.deepEqual(d.visualObject.objects,[]);assert.equal(d.orientation.value,'UPRIGHT');assert.ok(d.position.positionId);
}
const king=adaptTarotProjections(await projectOne('RWS-WANDS-KING','TARI-DIM-KING'),{cardRegistry:tariAuthorities.cardRegistry,sourceRegistry:tariAuthorities.sourceRegistry,perspectiveRegistry:tariAuthorities.perspectiveRegistry,symbolDimensionRegistry:tariAuthorities.symbolDimensionRegistry,corpus:tariAuthorities.corpus});assert.equal(king.cards[0].symbolDimensions.figure.value,'KING');assert.equal(king.cards[0].symbolDimensions.suit.value,'WANDS');
console.log('✓ TARI-W1 source-neutral low-level symbol dimensions passed with zero universal semantic mapping.');
