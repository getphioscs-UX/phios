import assert from 'node:assert/strict';
import {validateEditorial,validateSemanticVerdict,crossSectionEditorialCheck,narrativeBlocks} from '../functions/personal-reading/narrative/bazi-editorial-contract.js';
import {editorialFixture} from './lib/bazi-t3-test-fixture.mjs';
const {pack,candidate,verdict}=editorialFixture();
assert.equal(validateEditorial(candidate,pack).status,'PASS');
assert(validateSemanticVerdict(verdict,candidate,pack));
for(const text of ['23.1% determines your personality','leading functional group is fixed','功能接口决定命运','professionalModules/private','<script>bad</script>']){
 const n=structuredClone(candidate);n.lead.text=text;assert.equal(validateEditorial(n,pack).status,'REJECT');
}
const invalid=structuredClone(candidate);invalid.lead.factRefs=['invented'];assert.equal(validateEditorial(invalid,pack).status,'REJECT');
const mismatch=structuredClone(verdict);mismatch.assessments[0].entailed=false;assert(!validateSemanticVerdict(mismatch,candidate,pack));
assert(!validateSemanticVerdict({...verdict,assessments:[]},candidate,pack),'reference existence is not semantic verification');
assert(!validateSemanticVerdict({...verdict,temporalPreserved:false},candidate,pack));
assert(!validateSemanticVerdict({...verdict,unsupportedClaims:['invented outcome']},candidate,pack));
assert.equal(crossSectionEditorialCheck([{sectionKey:'a',finalNarrative:candidate},{sectionKey:'b',finalNarrative:candidate}]).status,'REJECT');
assert(narrativeBlocks(candidate).every(b=>b.factRefs.length));
console.log('PASS: editorial leak, banned prose, completeness, per-block entailment verdict, repetition and temporal fail-closed regressions. Synthetic tests do not establish live acceptance.');
