import assert from 'node:assert/strict';
import fs from 'node:fs';
import {compileRelationshipNarrativeBrief} from '../functions/personal-reading/relationship/relationship-narrative-brief.js';
import {buildRelationshipVisualProjection,RELATIONSHIP_VISUAL_PROJECTION_SCHEMA} from '../functions/personal-reading/relationship/relationship-visual-projection.js';
import {buildSpecificRelW7Case,buildSelfRelW7Case} from './rel-w7-relationship-narrative-fixtures.mjs';
const j=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const registry=j('content/product-visual-platform-r1/relationship/registries/rfig-authority-registry-v1.json');
const contract=j('content/product-visual-platform-r1/relationship/contracts/relationship-visual-projection-contract-v1.json');
assert.equal(registry.status,'RELATIONSHIP_VISUAL_IDENTITIES_ADMITTED_FOR_PROJECTION');
assert.deepEqual(registry.visuals.map(x=>x.visualId),['RFIG-001','RFIG-002','RFIG-003','RFIG-004','RFIG-005']);
assert.equal(registry.boundaries.compatibilityScoreAuthority,false);assert.equal(registry.boundaries.mfigRegistryMutated,false);
assert.equal(contract.authorityBoundary.projectionOnly,true);assert.equal(contract.authorityBoundary.newRelationshipRuntime,false);assert.equal(contract.authorityBoundary.phase12StaticAssetsNotExecuted,true);assert.equal(contract.customerActivation.bindingMode,'CONDITIONAL_ON_REL_W7_BRIEF_PRESENT');assert.equal(contract.customerActivation.relationshipLandingRouteCutover,false);assert.equal(contract.customerActivation.productionBrowserAcceptanceRequiredInPhase13,true);
const stats={total:0,specific:0,self:0,withReality:0,withProfileSources:0,allFivePresent:0};
for(let i=1;i<=24;i++){
  const input=i<=20?await buildSpecificRelW7Case(i,{hasProfile:i%2===0,realityMode:['SUPPORT','CONTRADICT','OPEN','NONE'][i%4],sensitive:i%7===0}):await buildSelfRelW7Case(i-20,{hasProfile:i%2===0,sensitive:i===24});
  const brief=await compileRelationshipNarrativeBrief(input);const out=buildRelationshipVisualProjection(brief);
  assert.equal(out.schemaVersion,RELATIONSHIP_VISUAL_PROJECTION_SCHEMA);assert.equal(out.sourceBriefDigest,brief.briefSemanticDigest);assert.equal(out.depth,'FREE');
  assert.deepEqual(Object.keys(out.rfigs),['RFIG-001','RFIG-002','RFIG-003','RFIG-004','RFIG-005']);
  assert.equal(out.governance.projectionOnly,true);assert.equal(out.governance.compatibilityScoreCreated,false);assert.equal(out.governance.partnerHiddenStateInferred,false);assert.equal(out.governance.relationshipOutcomeGuaranteed,false);
  assert.deepEqual(out.visibleFree,['RFIG-001','RFIG-002','RFIG-005']);assert.deepEqual(out.deepAdditional,['RFIG-003','RFIG-004']);
  const serialized=JSON.stringify(out);assert.equal(/compatibilityScore"\s*:\s*(?!false)/i.test(serialized),false);assert.equal(/\b\d{1,3}%\b/.test(serialized),false,'no compatibility percentage may be created');
  const specific=brief.relationshipIntent.mode==='SPECIFIC_PERSON_RELATIONSHIP';assert.equal(Boolean(out.rfigs['RFIG-001'].participantB),specific);assert.equal(out.rfigs['RFIG-001'].governance.participantsRemainDistinct,true);
  if(!specific){assert.equal(out.rfigs['RFIG-003'].state,'NOT_APPLICABLE');assert.deepEqual(out.rfigs['RFIG-003'].complementarity,[]);stats.self++;}else{assert.equal(out.rfigs['RFIG-003'].state,'READY');stats.specific++;}
  assert.equal(out.rfigs['RFIG-002'].governance.compatibilityScoreCreated,false);
  assert.equal(out.rfigs['RFIG-004'].governance.methodVoting,false);assert.equal(out.rfigs['RFIG-004'].governance.sourceClassesRemainDistinct,true);
  assert.equal(out.rfigs['RFIG-005'].governance.currentRealityProvesMethod,false);assert.equal(out.rfigs['RFIG-005'].governance.automaticPersistence,false);
  if(out.rfigs['RFIG-005'].currentReality.length)stats.withReality++;if(out.rfigs['RFIG-004'].sourceClasses.length>1)stats.withProfileSources++;if(Object.keys(out.rfigs).length===5)stats.allFivePresent++;stats.total++;
}
const client=fs.readFileSync('assets/customer-ui/js/personal-products/final-personal-reading-experience.js','utf8');
for(const id of ['RFIG-001','RFIG-002','RFIG-003','RFIG-004','RFIG-005'])assert.ok(client.includes(id),`client missing ${id}`);
assert.ok(client.includes('No compatibility score'));assert.ok(client.includes('Person A and Person B remain separate'));
assert.equal(client.includes('compatibility 83%'),false);
console.log(`✓ PVP Phase 11 Relationship Visual passed: ${stats.total}/24 governed REL-W7 briefs projected; ${stats.specific} specific + ${stats.self} self-pattern; five RFIG identities preserved with no compatibility score or partner hidden-state inference.`);
