import fs from 'node:fs';
import assert from 'node:assert/strict';
import {buildProfileCustomerVisualProjection} from '../functions/profile/profile-customer-visual-projection.js';
import {renderProfileVisualMvp,PROFILE_VISUAL_MVP_IDS} from '../assets/customer-ui/js/visuals/profile-visual-mvp.js';
import {renderProfileFreePaid} from '../assets/customer-ui/js/visuals/profile-free-paid.js';
const read=p=>fs.readFileSync(p,'utf8');
const json=p=>JSON.parse(read(p));
const mvp=json('content/product-visual-platform-r1/profile/mvp/pvp-r1-vis-w8-profile-visual-mvp-v1.json');
assert.deepEqual(PROFILE_VISUAL_MVP_IDS,['PFIG-001','PFIG-003','PFIG-005','PFIG-009']);
assert.deepEqual(mvp.implemented,PROFILE_VISUAL_MVP_IDS);
const customerOutput={
  sourceScopedDimensions:[{sourceKey:'CUSTOMER_SELF_REPORT::PHI',sourceClass:'CUSTOMER_SELF_REPORT',providerFamily:'PHI',dimensions:[{signalRef:'S1',domainId:'SELF_REGULATION',facetId:'PLANNING',value:{normalizedSelfReportIndex:72},assessmentDate:'2026-09-10',provenance:[]}]}],
  tensionSignals:[{kind:'CROSS_SOURCE_TENSION',id:'T1',statement:'A tension remains visible',signalRefs:['S1']}],
  contextEvidence:{currentReality:{state:'CURRENTLY_RESONANT'},crossSourceGroups:['SOURCE_TENSION']},
  contradictions:[{kind:'SOURCE_CONTRADICTION',id:'C1',statement:'Sources differ here',signalRefs:['S1']}],
  realityQuestions:[{questionId:'Q1',text:'Where does this pattern show up now?',owner:'TEST'}],relationshipEvidence:null,careerInterest:null
};
const projection=buildProfileCustomerVisualProjection({customerOutput,participantRef:'PERSON-A',asOfDate:'2026-09-10'});
const html=renderProfileVisualMvp(projection,{locale:'en'});
for(const id of PROFILE_VISUAL_MVP_IDS)assert.match(html,new RegExp(`data-pfig="${id}"`));
const wrapper=renderProfileFreePaid({level:'FREE_SNAPSHOT',freeSnapshot:projection,locked:[{level:'DEEP_PROFILE',preview:'deeper'}],commerce:{offerResolved:false}},{locale:'en'});
assert.match(wrapper,/data-pvp-profile-depth="W9"/);
assert.match(wrapper,/What deeper Profile adds/);
assert.match(wrapper,/commerce authority/);
const freePaid=read('assets/customer-ui/js/visuals/profile-free-paid.js');
assert.match(freePaid,/renderProfileVisualMvp/);
const surface=read('assets/customer-ui/js/surfaces/profile-progressive.js');
assert.match(surface,/mountProfileFreePaid/);
assert.match(surface,/data-prf-visual-mvp/);
const page=read('perspectives/profile/index.html');
assert.match(page,/profile-visual-mvp\.css/);
assert.match(page,/profile-free-paid\.css/);
assert.match(page,/data-prf-visual-mvp/);
console.log('✓ PHASE 7 W8 current Profile Visual MVP integration passed.');
console.log('  The historical direct MVP mount is correctly superseded by the W9 Free/Paid wrapper, which still consumes the governed W8 renderer.');
