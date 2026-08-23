import assert from 'node:assert/strict';import fs from 'node:fs';
import {adaptTarotProjections} from '../functions/interpretation-runtime/adapters/tarot-interpretation-adapter-v1.js';
import {tariAuthorities,projectOne} from './lib/tarot/tari-fixtures-v1.mjs';
const c=JSON.parse(fs.readFileSync('content/interpretation/tarot/contracts/tarot-cross-source-interpretation-contract-v1.json','utf8'));
assert.equal(c.work,'TARI-W3');assert.deepEqual(c.displayClasses,['TRADITIONAL','PSYCHOLOGICAL','REFLECTIVE','AUTHOR_SPECIFIC']);assert.equal(c.rules.claimsMayBeMergedIntoSingleTrueMeaning,false);assert.equal(c.rules.missingPerspectiveMustDisplayUnavailable,true);
const b=adaptTarotProjections(await projectOne('RWS-MAJOR-00','TARI-XSR'),{cardRegistry:tariAuthorities.cardRegistry,sourceRegistry:tariAuthorities.sourceRegistry,perspectiveRegistry:tariAuthorities.perspectiveRegistry,symbolDimensionRegistry:tariAuthorities.symbolDimensionRegistry,corpus:tariAuthorities.corpus});
const groups=b.cards[0].crossSourceInterpretation;assert.deepEqual(groups.map(x=>x.perspectiveClass),c.displayClasses);assert.equal(groups.find(x=>x.perspectiveClass==='AUTHOR_SPECIFIC').availability,'SOURCE_BOUND_CLAIMS_AVAILABLE');for(const klass of ['TRADITIONAL','PSYCHOLOGICAL','REFLECTIVE']) assert.equal(groups.find(x=>x.perspectiveClass===klass).availability,'SOURCE_COMMENTARY_NOT_YET_INGESTED');
assert.ok(groups.find(x=>x.perspectiveClass==='AUTHOR_SPECIFIC').sources.every(x=>x.sourceId&&x.claims.every(y=>y.sourceId&&y.perspectiveId&&y.provenance)));
console.log('✓ TARI-W3 cross-source/perspective presentation passed: parallel channels, no invented missing meaning, no true-meaning fusion.');
