import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {
  PERSONAL_EVIDENCE_STATIC_VISUALS,
  PERSONAL_EVIDENCE_SECTION_MASTERS,
  resolvePersonalEvidenceStaticPage,
  resolvePersonalEvidenceSectionMaster
} from '../functions/profile/personal-evidence-visual-assets.js';
import {
  buildPersonalEvidenceDossierProjection,
  PERSONAL_EVIDENCE_PFIG_PRIMARY_SECTION
} from '../functions/profile/personal-evidence-dossier-projection.js';
import { PROFILE_VISUAL_MVP_IDS, renderProfileVisualMvp } from '../assets/customer-ui/js/visuals/profile-visual-mvp.js';
import { PROFILE_PFIG_ORDER } from '../functions/profile/profile-customer-visual-projection.js';

const root=process.cwd();
const readJson=p=>JSON.parse(fs.readFileSync(path.join(root,p),'utf8'));

const w3=readJson('content/profile/successors/personal-evidence-r1/personal-evidence-shared-visual-binding-v1.json');
const w4=readJson('content/profile/successors/personal-evidence-r1/personal-evidence-section-master-binding-v1.json');
const w5=readJson('content/profile/successors/personal-evidence-r1/personal-evidence-pfig-section-binding-v1.json');
const renderer=readJson('content/profile/successors/personal-evidence-r1/personal-evidence-pfig-renderer-successor-v1.json');
const authority=readJson('content/profile/customer-output/profile-ppr-visual-output-authority-v2.json');

assert.equal(w3.localePolicy,'ONE_SHARED_BILINGUAL_ASSET_PER_ROLE');
assert.equal(w3.staticEditorialPages.length,5);
assert.equal(Object.keys(PERSONAL_EVIDENCE_STATIC_VISUALS).length,5);
for(const page of ['P01','P02','P03','P04','P05']){
  const resolved=resolvePersonalEvidenceStaticPage(page);
  assert.match(resolved.publicUrl,/\/images\/reports\/profile\/editorial\/shared\//);
  assert.equal(resolved.file,PERSONAL_EVIDENCE_STATIC_VISUALS[page]);
}
assert.equal(w4.sections.length,10);
assert.equal(Object.keys(PERSONAL_EVIDENCE_SECTION_MASTERS).length,10);
for(let i=1;i<=10;i++){
  const section=`SEC-${String(i).padStart(2,'0')}`;
  const resolved=resolvePersonalEvidenceSectionMaster(section);
  assert.match(resolved.publicUrl,/\/images\/reports\/profile\/editorial\/shared\//);
}
assert.ok(!JSON.stringify(w3).includes('PERSONAL-EVIDENCE STRUCTURE'));
assert.ok(JSON.stringify(w4).includes('VIS-REPORT-PROFILE-SEC-02-PERSONAL-EVIDENCE-STRUCTURE.webp'));

assert.equal(w5.bindings.length,9);
assert.equal(new Set(w5.bindings.map(x=>x.pfig)).size,9);
assert.deepEqual([...w5.bindings.map(x=>x.pfig)].sort(),[...PROFILE_PFIG_ORDER].sort());
assert.deepEqual([...PROFILE_VISUAL_MVP_IDS].sort(),[...PROFILE_PFIG_ORDER].sort());
assert.equal(renderer.implemented.length,9);
assert.equal(renderer.deferred.length,0);
assert.equal(authority.pfigAuthority.length,9);
assert.ok(authority.pfigAuthority.every(x=>x.authorityState==='ALLOWED'));
for(const id of PROFILE_PFIG_ORDER) assert.ok(PERSONAL_EVIDENCE_PFIG_PRIMARY_SECTION[id]);

const unknownFigures=PROFILE_PFIG_ORDER.map(pfig=>({
  pfig,
  schemaVersion:'TEST',
  state:'UNKNOWN',
  customerLabel:{en:pfig,'zh-Hans':pfig},
  data:{},
  evidenceRefs:[],
  boundaries:['TEST_UNKNOWN']
}));
const visualProjection={participantRef:'TEST',asOfDate:'2026-10-04',figures:unknownFigures};
const dossier=buildPersonalEvidenceDossierProjection({visualProjection});
assert.equal(dossier.staticPages.length,5);
assert.equal(dossier.sections.length,10);
assert.equal(dossier.sections.flatMap(x=>x.pfigs).length,9);
assert.equal(new Set(dossier.sections.flatMap(x=>x.pfigs.map(f=>f.pfig))).size,9);

const html=renderProfileVisualMvp(visualProjection,{locale:'en'});
for(const id of PROFILE_PFIG_ORDER) assert.ok(html.includes(`data-pfig="${id}"`),`missing renderer ${id}`);
assert.ok(!html.includes('master personality radar'));
assert.equal(dossier.governance.missingEvidenceMayBeInvented,false);

console.log('PASS PRD-W3/W4/W5: 5 shared bilingual editorial pages, 10 shared section masters, and all 9 existing PFIG authorities are bound exactly once into the Personal Evidence dossier projection.');
