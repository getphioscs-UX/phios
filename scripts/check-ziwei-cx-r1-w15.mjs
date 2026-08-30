import assert from 'node:assert/strict';
import fs from 'node:fs';
import crypto from 'node:crypto';
import {execFileSync} from 'node:child_process';

const BASE='content/customer-experience-rebuild/ziwei-cx-r1';
const BASELINE='1189c0519f1c5e9376965324b6010c00c212a3a1';
const paths={
 contract:`${BASE}/contracts/ziwei-cx-r1-w15-human-visual-interaction-acceptance-contract-v1.json`,
 authority:`${BASE}/authority/ziwei-cx-r1-w15-human-visual-review-authority-v1.json`,
 freeze:`${BASE}/authority/ziwei-cx-r1-w15-ppr-r3-shared-freeze-v1.json`,
 campaign:`${BASE}/campaign/ziwei-cx-r1-w15-human-visual-interaction-campaign-v1.json`,
 results:`${BASE}/review/ziwei-cx-r1-w15-human-visual-review-results-v1.json`,
 html:`${BASE}/review/ziwei-cx-r1-w15-human-visual-review.html`,
 preview:`${BASE}/review/ziwei-cx-r1-w15-canonical-responsive-preview.html`,
 acceptance:`${BASE}/acceptance/ziwei-cx-r1-w15-human-visual-acceptance-v1.json`,
 roadmap:`${BASE}/roadmap/ziwei-cx-r1-master-work-v5.json`
};
for(const p of Object.values(paths))assert.ok(fs.existsSync(p),`missing ${p}`);
const j=p=>JSON.parse(fs.readFileSync(p,'utf8'));const sha=p=>crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
const contract=j(paths.contract),authority=j(paths.authority),freeze=j(paths.freeze),campaign=j(paths.campaign),results=j(paths.results),acceptance=j(paths.acceptance),roadmap=j(paths.roadmap),html=fs.readFileSync(paths.html,'utf8'),preview=fs.readFileSync(paths.preview,'utf8');
for(const x of [contract,authority,freeze,campaign,results,acceptance,roadmap])assert.equal(x.integrationBaselineCommit,BASELINE,`${x.schemaVersion} baseline drift`);
execFileSync(process.execPath,['scripts/check-ziwei-cx-r1-w14.mjs'],{stdio:'inherit'});
assert.equal(contract.reviewCaseCount,12);assert.deepEqual(contract.responsiveWitnessViewports,[375,430,768,1024,1280,1440,1920]);assert.equal(contract.machineReviewCannotSubstituteHumanDecision,true);assert.equal(contract.sharedLayerMutationAllowed,false);assert.equal(contract.customerSurfaceActivationAllowedBeforeAcceptance,false);
assert.equal(authority.currentHumanAccepted,false);assert.equal(authority.customerSurfaceActivationAllowed,false);
assert.equal(campaign.status,'HUMAN_REVIEW_READY_0_OF_12');assert.equal(campaign.reviewCaseCount,12);assert.equal(campaign.selection.caseIds.length,12);assert.equal(new Set(campaign.selection.lifeBranches).size,12);assert.deepEqual(campaign.selection.localeCounts,{'zh-Hans':6,en:6});assert.deepEqual(campaign.selection.sexCounts,{MALE:6,FEMALE:6});assert.deepEqual(campaign.responsiveWitness.requiredViewports,[375,430,768,1024,1280,1440,1920]);assert.equal(campaign.humanAccepted,false);
assert.equal(results.status,'PENDING_HUMAN_REVIEW');assert.equal(results.results.length,12);assert.equal(results.summary.required,12);assert.equal(results.summary.pending,12);assert.equal(results.summary.accepted,0);assert.equal(results.results.every(x=>x.decision==='PENDING'),true);
assert.equal(acceptance.status,'HUMAN_REVIEW_READY_0_OF_12');assert.equal(acceptance.gates.W14_MACHINE_ACCEPTED_96_OF_96,true);assert.equal(acceptance.gates.HUMAN_VISUAL_ACCEPTED_12_OF_12,false);assert.equal(acceptance.gates.CUSTOMER_SURFACE_ACTIVATION_OPEN,false);
assert.equal(roadmap.status,'W0_W14_MACHINE_ACCEPTED_W15_HUMAN_REVIEW_READY_W16_BLOCKED');assert.match(roadmap.works.find(x=>x.work==='ZIWEI-CX-R1-W16').status,/BLOCKED/);assert.equal(roadmap.customerSurface.customerSurfaceActivationAllowed,false);
for(const width of [375,430,768,1024,1280,1440,1920])assert(html.includes(`<option value="${width}">${width}px</option>`),`review viewport missing ${width}`);
for(const id of campaign.selection.caseIds)assert(html.includes(id),`review case missing from HTML: ${id}`);
assert.match(html,/iframe class="w15-frame"/);assert.match(html,/srcdoc/);assert.match(html,/data-ziwei-topic-index/);assert.match(html,/data-ziwei-palace-index/);assert.match(html,/Export review JSON/);assert.match(html,/HUMAN_REVIEWER/);assert.match(preview,/data-ziwei-current-render-owner="W12_W13"/);assert.match(preview,/cx-ziwei-specialist-chart__grid/);
for(const row of freeze.files){assert.ok(fs.existsSync(row.path),`shared frozen path missing ${row.path}`);assert.equal(sha(row.path),row.sha256,`PPR-R3 shared mutation detected: ${row.path}`);assert.equal(fs.statSync(row.path).size,row.sizeBytes,`PPR-R3 shared size drift: ${row.path}`);}
for(const p of freeze.requiredAbsent)assert.equal(fs.existsSync(p),false,`retired shared file resurrected: ${p}`);
console.log('✓ ZIWEI-CX-R1-W15 Human Visual & Interaction Acceptance campaign is review-ready.');
console.log('  W14 prerequisite remains 96/96 Real API + DOM machine accepted.');
console.log('  12 diverse visual cases: 12/12 Life Palace branches, 6 zh-Hans + 6 en, 6 MALE + 6 FEMALE.');
console.log('  Review UI exposes real iframe CSS viewports at 375/430/768/1024/1280/1440/1920 and live topic/palace interactions.');
console.log('  Human decisions remain 0/12 ACCEPT; W16 customer-surface activation remains blocked by design.');
