import assert from 'node:assert/strict';
import fs from 'node:fs';
import { buildProfileCustomerVisualProjection } from '../functions/profile/profile-customer-visual-projection.js';
import { renderProfileVisualMvp, PROFILE_VISUAL_MVP_IDS } from '../assets/customer-ui/js/visuals/profile-visual-mvp.js';

const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const mvp=read('content/product-visual-platform-r1/profile/mvp/pvp-r1-vis-w8-profile-visual-mvp-v1.json');
const acc=read('content/product-visual-platform-r1/acceptance/pvp-r1-vis-w8-profile-visual-mvp-v1.json');
const projectionContract=read('content/product-visual-platform-r1/profile/ir/profile-customer-visual-projection-v1.json');
assert.equal(mvp.status,'PROFILE_VISUAL_MVP_IMPLEMENTED');
assert.deepEqual(mvp.implemented,['PFIG-001','PFIG-003','PFIG-005','PFIG-009']);
assert.deepEqual(PROFILE_VISUAL_MVP_IDS,mvp.implemented);
assert.equal(acc.status,'MACHINE_ACCEPTED_MVP_4_OF_4');
assert.equal(acc.implementedCount,4);
assert.equal(projectionContract.status,'PROJECTION_IR_CONTRACT_READY_ALL_9_PFIG');

const customerOutput={
  sourceScopedDimensions:[{sourceKey:'CUSTOMER_SELF_REPORT::PHI',sourceClass:'CUSTOMER_SELF_REPORT',providerFamily:'PHI',dimensions:[{signalRef:'S1',domainId:'SELF_REGULATION',facetId:'PLANNING',value:{normalizedSelfReportIndex:72},assessmentDate:'2026-09-09',provenance:[]}]}],
  tensionSignals:[{kind:'CROSS_SOURCE_TENSION',id:'T1',statement:'A tension remains visible',signalRefs:['S1']}],
  contextEvidence:{currentReality:{state:'CURRENTLY_RESONANT'},crossSourceGroups:['SOURCE_TENSION']},
  contradictions:[{kind:'SOURCE_CONTRADICTION',id:'C1',statement:'Sources differ here',signalRefs:['S1']}],
  realityQuestions:[{questionId:'Q1',text:'Where does this pattern show up now?',owner:'TEST'}],
  relationshipEvidence:null,careerInterest:null
};
const progressiveView={participantRef:'PERSON-A',asOfDate:'2026-09-09',crossSource:{perspectives:[{id:'X1',group:'SOURCE_ALIGNED',sourceClasses:['CUSTOMER_SELF_REPORT','STANDARDIZED_SELF_REPORT'],signalRefs:['S1'],statement:'Two sources point toward a similar observation'}]}};
const projection=buildProfileCustomerVisualProjection({progressiveView,customerOutput,confirmations:[{signalRef:'S1',confirmation:'HELPS_ME',contextType:'GENERAL',note:'Useful when planning'}]});
const html=renderProfileVisualMvp(projection,{locale:'en'});
for(const id of mvp.implemented) assert.match(html,new RegExp(`data-pfig="${id}"`));
assert.doesNotMatch(html,/data-pfig="PFIG-002"/);
assert.match(html,/Profile dimension map/);
assert.match(html,/Resource & cost map/);
assert.match(html,/Convergence & divergence/);
assert.match(html,/Bring Profile back to reality/);

const unknown=buildProfileCustomerVisualProjection({progressiveView:{},customerOutput:{sourceScopedDimensions:[],tensionSignals:[],contextEvidence:null,contradictions:[],realityQuestions:[],relationshipEvidence:null,careerInterest:null}});
const unknownHtml=renderProfileVisualMvp(unknown,{locale:'zh-Hans'});
assert.equal((unknownHtml.match(/prf-pfig--empty/g)||[]).length,4);
assert.match(unknownHtml,/资料仍在形成/);

const api=fs.readFileSync('functions/api/profile-progressive.js','utf8');
assert.match(api,/buildProfileCustomerVisualProjection/);
assert.match(api,/visualProjection/);
const page=fs.readFileSync('perspectives/profile/index.html','utf8');
assert.match(page,/data-prf-visual-mvp/);
assert.match(page,/profile-visual-mvp\.css/);
assert.match(page,/customer-ui\/visuals\/tokens\.css/);
const surface=fs.readFileSync('assets/customer-ui/js/surfaces/profile-progressive.js','utf8');
assert.match(surface,/mountProfileVisualMvp/);

console.log('✓ PVP-R1-VIS-W8 Profile Visual MVP passed.');
console.log('  PFIG-001 / 003 / 005 / 009 render from W7 IR with explicit unresolved states.');
console.log('  Profile/PPR remains truth owner; W9 Free/Paid is the next gate.');
