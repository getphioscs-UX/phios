import assert from 'node:assert/strict';import fs from 'node:fs';
const p='content/personal-reading/relationship/hd-r1/source/HD-REL-R1-W0-source-school-ontology-reconciliation-v1.json';const j=JSON.parse(fs.readFileSync(p,'utf8'));
assert.equal(j.work,'HD-REL-R1-W0');assert.equal(j.relationshipScale,'DYADIC_A_X_B');assert.equal(j.chartAuthority,'CONFIRMED_CUSTOMER_SUPPLIED_EXTERNAL_HUMAN_DESIGN_CHART');
assert.deepEqual(j.schoolReconciliation.admittedInteractionClasses,['ELECTROMAGNETIC','DOMINANCE','COMPROMISE','COMPANIONSHIP']);
for(const ref of j.sourceAuthorities.filter(x=>x.path).map(x=>x.path))assert.ok(fs.existsSync(ref),ref);
assert.equal(j.ontology.participantCount,2);assert.equal(j.ontology.compositeTypeAuthorityProfileForbidden,true);assert.equal(j.ontology.individualAuthorityStillGovernsEachParticipantsDecisions,true);
for(const scope of ['TRANSIT_CONNECTION','PENTA','BG5'])assert.ok(j.explicitExclusions.find(x=>x.scope===scope));
for(const f of ['compatibility score','PHI OS birth-data Human Design calculation'])assert.ok(j.forbidden.includes(f));
assert.equal(j.publication.customerPublishable,false);console.log('✓ HD-REL-R1 W0 source + school + ontology reconciliation passed.');
