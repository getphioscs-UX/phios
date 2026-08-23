import assert from 'node:assert/strict';
import {runHfpFixture,buildFixtureInput,composeHolisticFinancialPlan} from './lib/hfp/hfp-check-lib.mjs';
const pro=await runHfpFixture('professional.json');
assert.equal(pro.candidate.productionEligible,false); assert.equal(pro.candidate.professionalCompletionRequired,true); assert.ok(pro.candidate.professionalCompletionReasons.includes('FIXTURE_PFR_NOT_PRODUCTION_AUTHORITY'));
const professional=pro.candidate.sections.flatMap(s=>s.statements).filter(s=>['PROFESSIONAL_RECOMMENDATION','PROFESSIONAL_WARNING'].includes(s.statementType)); assert.ok(professional.length>=2); for(const s of professional){ assert.equal(s.sourceAuthority,'FIXTURE_PFR'); assert.ok(s.professionalAuthorship?.authorReference); }
const suitability=pro.candidate.sections.find(s=>s.sectionCode==='ALTERNATIVES_DISADVANTAGES').statements.find(s=>s.semanticCode==='HFP.PFR.SUITABILITY'); assert.ok(suitability); for(const f of ['objectiveReference','findingReference','recommendationReference','impactReference','experienceReference','capacityReference','alternativeReferences','disadvantageReferences']) assert.ok(Object.hasOwn(suitability.payload.content,f),`Missing suitability field ${f}`);
const noRec=await runHfpFixture('no-recommendation.json'); assert.equal(noRec.candidate.sections.flatMap(s=>s.statements).filter(s=>['PROFESSIONAL_RECOMMENDATION','PROFESSIONAL_WARNING'].includes(s.statementType)).length,0,'HFP invented recommendation.');
const blocked=await buildFixtureInput('pfr-production-block.json'); await assert.rejects(()=>composeHolisticFinancialPlan(blocked.input),/PFR_PRODUCTION_AUTHORITY_NOT_INSTALLED/);
console.log('✓ HFP-W17/W18 professional authorship + fail-closed PFR boundary passed.');
