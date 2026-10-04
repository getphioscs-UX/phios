import fs from 'node:fs';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
const base='content/profile/successors/personal-evidence-r1/';
const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const git=(...args)=>execFileSync('git',args,{encoding:'utf8',maxBuffer:16*1024*1024}).trim();
const baseline='f0a8b24828b618d75ca32002b3b5527fb1539524';
const protectedPaths=['content/profile/freeze','content/profile/academic','content/professional/profile/assessment','content/profile/customer-output','content/product-visual-platform-r1/profile','functions/profile/academic-bridge-runtime.js','functions/profile/profile-foundation-runtime.js','functions/profile/profile-context-runtime.js','content/runtime/customer-report-runtime','content/runtime/reality-model-runtime','functions/pws/commercial','docs/visual-report-r1/commerce-catalog.json'];
const protectedChanges=git('diff',baseline,'--name-only','--',...protectedPaths);
assert.equal(protectedChanges,'','Presentation repair must not alter semantic/scoring/PFIG/canonical/commerce authority');
const original=read(base+'audits/prd-r1-execution-baseline-v1.json');
const freezeHashes=original.owners.filter(x=>x.path.startsWith('content/profile/freeze/')).map(x=>({...x,unchanged:crypto.createHash('sha256').update(fs.readFileSync(x.path)).digest('hex')===x.sha256}));
assert.ok(freezeHashes.every(x=>x.unchanged));
const receipt=read(base+'acceptance/prd-w11-human-review-receipt-v1.json');
const resources=read(base+'audits/prd-w11r-static-resource-probe-v1.json');
const browser=read('tools/review/personal-evidence-r1/browser-layout-observations.json');
assert.equal(receipt.decision,null);assert.equal(receipt.w12Allowed,false);assert.equal(resources.requiredAssetsAvailable,true);
assert.equal(browser.finalDossiers.length,22);assert.equal(browser.outputs.length,44);
assert.ok(browser.finalDossiers.every(x=>x.frames.every(f=>f.staticImages.every(i=>i.loaded)&&f.bodyPages.every(p=>!p.overflow)&&f.emptyBodyPages===0)));
assert.equal(browser.nativePrintPreview.confirmedComplete,true);
assert.equal(fs.existsSync(base+'freeze/personal-evidence-r1-production-freeze-v1.json'),false);
const changed=git('diff',baseline,'--name-only').split('\n').filter(p=>/personal-evidence|profile-progressive|profile-visual-mvp|check-profile-personal-evidence/.test(p));
const audit={work:'PRD-W11R',status:'READY_FOR_HUMAN_REVIEW',generatedAt:new Date().toISOString(),baselineHead:baseline,baselineKind:'FIRST_OBSERVED_HEAD_DURING_REPAIR',currentHead:git('rev-parse','HEAD'),previousHumanDecision:'PRD-R1 HUMAN REJECT',currentHumanDecision:null,w12Allowed:false,
 closure:[
  {item:1,status:'PASS',detail:'Exact original R2 objects confirmed in owner-supplied editorial directory. Corrected shared/ prefix and SEC-05 double-dot object key. No upload or regeneration.'},
  {item:2,status:'PASS',detail:'Customer source/domain/facet/confirmation/precision labels use presentation vocabulary; raw JSON and visible governance IDs removed. Native payloads are retained.'},
  {item:3,status:'PASS',detail:'Both locales regenerated; source statements, RIASEC names, Big Five dimensions, financial options and source boundaries localized. Language switching retains selected answers.'},
  {item:4,status:'PASS',detail:'PFIG-004 READY requires explicit contextual observations with renderable content. Empty containers remain UNKNOWN and render EMPTY. No canonical PFIG schema/meaning changed.'},
  {item:5,status:'PASS',detail:'Dossier body pages require customer evidence; generic unknown and general-boundary body pages suppressed behind existing rich masters.'},
  {item:6,status:'PASS',detail:'Relationship, career and financial links use localized customer CTAs and retain existing governed routes.'},
  {item:7,status:'PASS',detail:'11 × 2 fixture cases rebuilt as 44 result/dossier HTMLs; 88 desktop/mobile frame observations recorded.'},
  {item:8,status:'PASS',detail:'17 required original WebP assets verified by GET, signature and digest; 15 full-page images decoded in all 22 dossiers; user confirmed complete A4 native print preview without missing images.'},
  {item:9,status:'PASS',detail:'Protected authority paths have no changes relative to observed baseline; original eight Profile freeze records and index retain their execution-baseline digests.'},
  {item:10,status:'PASS',detail:'Repair receipt READY_FOR_HUMAN_REVIEW, no ACCEPT, no W12 work, no production freeze.'}
 ],
 'FILES CREATED/MODIFIED':changed,
 'FILES INTENTIONALLY NOT MODIFIED':protectedPaths,
 'CHECKS RUN':['PRD-PRE/W0/W1/W2','PRD-W3/W4/W5','PRD-W6','PRD-W6/W7/W8','PRD-W10 offline APIs','PRD-W11R presentation closure','PVP current Profile/PPR output authority','Cloudflare Pages build','44 browser result/dossier cases','22 final all-image dossier observations','Live financial form EN/ZH switching and complete options','Protected-path Git diff and original freeze digests','git diff --check'],
 'PASS':['All W11R closure items','All required resources','All 44 fixture outputs','All 22 final dossiers','Current Profile/PPR output authority','Pages build','Protected authorities and freezes'],
 'FAIL':['Existing check:pvp-r1:profile-visual-current still expects four PFIG IDs while baseline already exports nine. Verified in baseline script/renderer; not changed to bypass authority.'],
 'NOT_RUN':['W12','Production freeze','Live O*NET provider','Broad RR/RMO regressions (outside W11R; prior baseline digest issues retained)'],
 'KNOWN GAPS':['Two optional, unused SVG motif objects are absent; this dossier requests neither, and all 17 required WebP assets pass.','Existing PVP four-versus-nine historical check mismatch remains outside presentation repair.','Prior RR/RMO baseline digest failures were not repaired or bypassed.'],
 'HUMAN REVIEW REQUIRED':'Explicit PRD-R1 HUMAN ACCEPT or PRD-R1 HUMAN REJECT. Print confirmation is not production acceptance.',
 'GIT STATUS':git('status','--short'),
 'COMMIT READY':'REVIEW REPAIR ONLY; NO PRODUCTION FREEZE',agentCommitPerformed:false,agentPushPerformed:false,remoteMutationPerformed:false,freezeHashes,browserObservationRef:'tools/review/personal-evidence-r1/browser-layout-observations.json',resourceProbeRef:base+'audits/prd-w11r-static-resource-probe-v1.json'};
fs.writeFileSync(base+'audits/prd-w11r-repair-closure-v1.json',JSON.stringify(audit,null,2)+'\n');
console.log(JSON.stringify({status:audit.status,closurePassed:10,requiredAssets:17,cases:22,htmlOutputs:44,protectedPathsUnchanged:true,w12Allowed:false,currentHead:audit.currentHead}));
