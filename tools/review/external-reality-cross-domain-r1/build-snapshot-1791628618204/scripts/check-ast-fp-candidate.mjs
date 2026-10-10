import assert from 'node:assert/strict';
import {chartFixtures,projectChart,candidateFor,canonicalInput} from './ast-fp-test-support.mjs';
import {inspectAstEvidence,AST_FP_COMPOSITION_VERSION,AST_FP_ASPECT_POLICY} from '../functions/interpretation-runtime/ast-full-production-composer-v1.js';
import {createMethodInterpretationCandidate,promoteAcceptedInterpretation,validateInterpretationCandidate} from '../functions/interpretation-runtime/cx-r12r3b-shared-runtime-v2.js';
import {resolveCustomerCompositionAdmission} from '../functions/interpretation-runtime/customer-composition-admission-resolver-v1.js';
const group=(p,code)=>p.calculation.structures.find(g=>g.code===code);
const rows=[],types=new Set();let first;
for(const chart of chartFixtures.cases){
  for(const houseSystemCode of ['PLACIDUS_V1','WHOLE_SIGN_V1']){
    const p=await projectChart(chart,{houseSystemCode});first||=p;
    const evidence=inspectAstEvidence(p);let priorLocale;
    for(const locale of ['en','zh-Hans']){
      const {candidate:c,meaningPayload}=await candidateFor(p,locale);
      assert.equal(c.validation.valid,true,JSON.stringify(c.validation));
      assert.equal(c.interpretationUnits.length,12+evidence.aspects.length);
      assert.equal(c.coverage.completeWithinExistingMeaningScope,true);
      assert.equal(c.coverage.houseSystem,houseSystemCode);
      assert.equal(c.coverage.productionAllowed,false);
      assert.equal(c.lifecycle.customerPublishable,false);
      assert.equal(c.status,'HUMAN_REVIEW_REQUIRED');
      assert.equal(new Set(c.interpretationUnits.map(u=>u.interpretationUnitId)).size,c.interpretationUnits.length);
      assert.equal(new Set(c.interpretationUnits.map(u=>u.plainLanguageExplanation)).size,c.interpretationUnits.length);
      for(const u of c.interpretationUnits){
        assert.equal(u.priority,'SECONDARY','Candidate does not invent customer priority');
        assert.ok(u.sourceLineage.length&&u.meaningRefs.length&&u.realityComparisonQuestions.length);
        assert.ok(!u.ruleRefs.some(r=>r.startsWith('CX-COMP-AST-')),'New policy must not borrow old rule admission');
        if(u.evidenceDetail.kind==='ASPECT'){
          const e=u.evidenceDetail;types.add(e.aspectType);
          assert.equal(u.relationType,AST_FP_ASPECT_POLICY[e.aspectType].relation);
          assert.equal(u.projectionRefs.filter(r=>r.includes('#ASPECT:')).length,1);
          for(const code of e.endpointCodes)assert.ok(u.projectionRefs.includes(`${p.projectionId}#POSITION:${code}`));
          for(const ref of e.balancingAspectRefs){
            const b=evidence.aspects.find(x=>ref.endsWith(`:${x.code}`));assert.ok(b);
            assert.ok([b.meta.fromCode,b.meta.toCode].some(code=>e.endpointCodes.includes(code)));
            assert.notEqual(b.relation,u.relationType);
          }
        }else assert.equal(u.meaningRefs.length,3,'All function/sign/house roles retained');
      }
      if(priorLocale)assert.equal(c.semanticDigest,priorLocale.semanticDigest,'Locale must preserve semantic structure');
      priorLocale=c;
      const decision=resolveCustomerCompositionAdmission({methodId:'AST',candidateSchemaVersion:c.schemaVersion,meaningBundleCode:meaningPayload.meaningBundle.bundleCode,compositionRuleVersion:c.compositionVersion,locale,projectionAuthorityVersion:c.sourceReference.projectionVersion,methodParameters:{houseSystemId:houseSystemCode}});
      assert.equal(decision.publicationAllowed,false);assert.ok(decision.constraints.includes('COMPOSITION_RULESET_NOT_ADMITTED'));
      rows.push({caseId:chart.id,houseSystemCode,locale,units:c.interpretationUnits.length,aspects:c.coverage.aspectCount,projectionDigest:c.projectionDigest});
    }
  }
}
assert.equal(new Set(rows.map(r=>r.caseId)).size,8);
assert.equal(new Set(rows.map(r=>r.projectionDigest)).size,16);
assert.deepEqual([...types].sort(),Object.keys(AST_FP_ASPECT_POLICY).sort());

const invalid=[
 ['missing endpoint',p=>group(p,'ASPECTS').items[0].meta.fromCode='CHIRON','AST_FP_ASPECT_ENDPOINT_INVALID'],
 ['self edge',p=>{const e=group(p,'ASPECTS').items[0];e.meta.toCode=e.meta.fromCode;},'AST_FP_ASPECT_ENDPOINT_INVALID'],
 ['node aspect',p=>group(p,'ASPECTS').items[0].meta.fromCode='NORTH_NODE','AST_FP_ASPECT_ENDPOINT_INVALID'],
 ['unknown aspect',p=>group(p,'ASPECTS').items[0].meta.type='QUINCUNX','AST_FP_ASPECT_TYPE_UNSUPPORTED'],
 ['duplicate edge',p=>group(p,'ASPECTS').items.push(structuredClone(group(p,'ASPECTS').items[0])),'AST_FP_ASPECT_DUPLICATE'],
 ['reversed duplicate',p=>{const e=structuredClone(group(p,'ASPECTS').items[0]);[e.meta.fromCode,e.meta.toCode]=[e.meta.toCode,e.meta.fromCode];e.code='REVERSE';group(p,'ASPECTS').items.push(e);},'AST_FP_ASPECT_DUPLICATE'],
 ['wrong orb',p=>group(p,'ASPECTS').items[0].meta.orb+=.01,'AST_FP_ASPECT_GEOMETRY_MISMATCH'],
 ['orb out of range',p=>group(p,'ASPECTS').items[0].meta.orb=100,'AST_FP_ASPECT_ORB_INVALID'],
 ['unapproved orb policy',p=>group(p,'ASPECTS').items[0].meta.authorizedOrbDegrees=10,'AST_FP_ASPECT_ORB_INVALID'],
 ['null orb',p=>group(p,'ASPECTS').items[0].meta.orb=null,'AST_FP_ASPECT_ORB_INVALID'],
 ['geometry mismatch',p=>group(p,'ASPECTS').items[0].value+=1,'AST_FP_ASPECT_GEOMETRY_MISMATCH'],
 ['invented applying',p=>group(p,'ASPECTS').items[0].meta.applyingState='APPLYING','AST_FP_APPLYING_STATE_UNSUPPORTED'],
 ['duplicate planet',p=>p.calculation.positions.push(structuredClone(p.calculation.positions[0])),'AST_FP_POSITION_DUPLICATE'],
 ['null position',p=>p.calculation.positions[0].value=null,'AST_FP_POSITION_INVALID'],
 ['out of zodiac',p=>p.calculation.positions[0].value=360,'AST_FP_POSITION_INVALID'],
 ['missing cusp',p=>group(p,'HOUSE_CUSPS').items.pop(),'AST_FP_HOUSES_INVALID'],
 ['mixed house system',p=>group(p,'HOUSE_CUSPS').items[0].meta.houseSystemCode='WHOLE_SIGN_V1','AST_FP_HOUSES_INVALID'],
 ['invalid house',p=>group(p,'HOUSE_PLACEMENTS').items[0].value=13,'AST_FP_HOUSE_PLACEMENT_INVALID'],
 ['duplicate placement',p=>group(p,'HOUSE_PLACEMENTS').items.push(structuredClone(group(p,'HOUSE_PLACEMENTS').items[0])),'AST_FP_HOUSE_PLACEMENT_DUPLICATE'],
 ['house without cusps',p=>p.calculation.structures=p.calculation.structures.filter(g=>g.code!=='HOUSE_CUSPS'),'AST_FP_HOUSE_PLACEMENT_WITHOUT_CUSPS'],
 ['duplicate group',p=>p.calculation.structures.push(structuredClone(group(p,'ASPECTS'))),'AST_FP_STRUCTURE_GROUP_DUPLICATE']
];
for(const [name,mutate,code] of invalid){const p=structuredClone(first);mutate(p);assert.throws(()=>inspectAstEvidence(p),e=>e.code===code,name);}

// Controlled graph mutation tests, explicitly not additional birth charts.
const sparse=structuredClone(first);
group(sparse,'ASPECTS').items=group(sparse,'ASPECTS').items.filter(e=>e.meta.fromCode!=='SUN'&&e.meta.toCode!=='SUN');
const sparseCandidate=(await candidateFor(sparse)).candidate;
const sun=sparseCandidate.interpretationUnits.find(u=>u.evidenceDetail.bodyCode==='SUN');
assert.deepEqual(sun.evidenceDetail.incidentAspectRefs,[]);
assert.ok(!sun.projectionRefs.some(r=>r.includes('#ASPECT:')),'No unrelated aspect fallback');
const empty=structuredClone(first);group(empty,'ASPECTS').items=[];
assert.equal((await candidateFor(empty)).candidate.interpretationUnits.length,12);

for(const [longitude,index] of [[0,0],[29.999999,0],[30,1],[359.999999,11]]){
  const p=structuredClone(first);p.calculation.positions[0].value=longitude;p.calculation.structures=[{code:'ASPECTS',items:[]}];
  const c=(await candidateFor(p)).candidate;
  assert.equal(c.validation.valid,true);
  assert.equal(c.interpretationUnits[0].evidenceDetail.signIndex,index);
  assert.equal(c.interpretationUnits[0].meaningRefs.length,2);
  assert.ok(c.interpretationUnits.every(u=>!u.projectionRefs.some(r=>r.includes('HOUSE_'))));
}

const partials=[
 ['APPROXIMATE_TIME',{timeAccuracy:'APPROXIMATE'}],
 ['NO_COORDINATES',{birthPlace:{...canonicalInput(chartFixtures.cases[0]).birthPlace,latitude:null,longitude:null}}],
 ['POLAR_PLACIDUS',{birthPlace:{...canonicalInput(chartFixtures.cases[0]).birthPlace,latitude:78,longitude:15}}]
];
for(const [name,overrides] of partials){
  const p=await projectChart(chartFixtures.cases[0],{overrides});
  assert.equal(p.projection.status,'PARTIAL',name);
  const c=(await candidateFor(p)).candidate;assert.equal(c.validation.valid,true,name);
  assert.equal(c.coverage.houseSystem,null);assert.equal(c.lifecycle.customerPublishable,false);
  assert.ok(c.interpretationUnits.every(u=>!u.projectionRefs.some(r=>r.includes('HOUSE_'))));
  assert.ok(c.interpretationUnits.every(u=>u.uncertainties.includes('AST_HOUSE_CONTEXT_UNAVAILABLE')));
}
const blocked=await projectChart(chartFixtures.cases[0],{overrides:{timeAccuracy:'UNKNOWN',birthTime:null}});
assert.equal(blocked.projection.status,'BLOCKED_INPUT');
await assert.rejects(()=>candidateFor(blocked),'No invented noon fallback for missing birth time');
const inconsistent=await projectChart(chartFixtures.cases[0],{overrides:{timeAccuracy:'UNKNOWN'}});
assert.equal(inconsistent.projection.status,'BLOCKED_INPUT','Unknown time must not carry a fabricated clock time');

const {candidate:c,input,meaningPayload}=await candidateFor(first);
const review={methodFidelityAccepted:true,customerClarityAccepted:true,evidenceRef:'TEST_NOT_REAL_HUMAN_REVIEW'};
await assert.rejects(()=>promoteAcceptedInterpretation(c,review),e=>e.code==='AST_FP_VERSIONED_PRODUCTION_ADMISSION_REQUIRED');
await assert.rejects(()=>candidateFor(first,'en',{humanReview:review}),e=>e.code==='AST_FP_REQUIRES_VERSIONED_ADMISSION_NOT_INLINE_REVIEW');
await assert.rejects(()=>createMethodInterpretationCandidate({input,meaningPayload,compositionVersion:'INVENTED'}),e=>e.code==='CX_COMPOSITION_PROFILE_UNSUPPORTED');
const borrowed=structuredClone(c);borrowed.compositionVersion='CX-R12R3B-COMPOSITION-RULES-v1.0.0';assert.equal(validateInterpretationCandidate(borrowed).valid,false);
const stale=structuredClone(meaningPayload);stale.meaningBundle.items[0].sourceProjectionRef.projectionId='OTHER';
await assert.rejects(()=>createMethodInterpretationCandidate({input,meaningPayload:stale,compositionVersion:AST_FP_COMPOSITION_VERSION}),e=>e.code==='AST_FP_MEANING_PROJECTION_MISMATCH');
const wrongLocale=structuredClone(meaningPayload);wrongLocale.localeProjection.locale='en';
await assert.rejects(()=>createMethodInterpretationCandidate({input,meaningPayload:wrongLocale,compositionVersion:AST_FP_COMPOSITION_VERSION}),e=>e.code==='AST_FP_MEANING_LOCALE_MISMATCH');
const missing=structuredClone(meaningPayload),sunCode=missing.meaningBundle.items.find(i=>i.sourceProjectionRef.selector?.operator==='position_code_match'&&i.sourceProjectionRef.selector.code==='SUN').meaningCode;
missing.meaningBundle.items=missing.meaningBundle.items.filter(i=>i.meaningCode!==sunCode);missing.localeProjection.items=missing.localeProjection.items.filter(i=>i.meaningCode!==sunCode);
const limited=await createMethodInterpretationCandidate({input,meaningPayload:missing,compositionVersion:AST_FP_COMPOSITION_VERSION});
assert.equal(limited.coverage.completeWithinExistingMeaningScope,false);assert.ok(limited.coverage.omitted.some(o=>o.code==='SUN'));
assert.ok(!limited.interpretationUnits.some(u=>u.subject==='SUN'),'No substitute meaning for a missing Sun function');
assert.deepEqual((await candidateFor(first)).candidate,c,'Repeated run deterministic');
console.log(JSON.stringify({status:'PASS',independentBirthInputs:8,houseSystemProjections:16,bilingualCandidates:rows.length,partialInputVariants:partials.length,malformedGraphRejections:invalid.length,additionalAssertions:['all-five-aspect-types','isolated-body','no-aspects','four-sign-boundaries','inline-review-rejected','old-admission-not-reused','stale-meaning-rejected','locale-mismatch-rejected','missing-meaning-omitted','determinism'],unitRange:[Math.min(...rows.map(r=>r.units)),Math.max(...rows.map(r=>r.units))],humanReviewed:false,productionAllowed:false},null,2));
