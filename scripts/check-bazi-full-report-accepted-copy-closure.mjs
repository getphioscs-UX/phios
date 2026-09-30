import fs from 'node:fs';
import assert from 'node:assert/strict';
import {projectBaziSectionPublication} from '../functions/personal-reading/bazi-section-publication.js';
import {getAcceptedBaziRemainingSection,BAZI_S06_S10_ACCEPTED_VERSION} from '../functions/personal-reading/narrative/bazi-s06-s10-accepted-copy.generated.js';
import {acceptedS06S10} from '../functions/personal-reading/narrative/bazi-owner-acceptance.generated.js';
import {bindSectionVisual} from '../functions/canonical-presentation-runtime/report-section-contract.js';

const source=JSON.parse(fs.readFileSync('docs/guided-report-successor-r2/bazi-source.json','utf8'));
assert.equal(acceptedS06S10.decision,'ACCEPT');
assert.equal(acceptedS06S10.productionActivated,false);
assert.equal(acceptedS06S10.version,BAZI_S06_S10_ACCEPTED_VERSION);
assert.equal(acceptedS06S10.reviewArtifact.builderBlobSha,'3d87c62056db0536d61f0fdc8e30ec78b8164421');

const sectionKeys=['S06_RELATIONSHIP','S07_HEALTH','S08_TIMING','S09_GUIDANCE','S10_APPENDIX'];
const normalized=s=>String(s||'').replace(/\s+/g,' ').trim();
const allAcceptedTexts=new Map();

for(const locale of ['zh-Hans','en']){
 const projection=await projectBaziSectionPublication({
  reading:source.reading,
  locale,
  temporalContext:source.temporalSnapshot,
  composition:{},
  allowUnselectedTiming:false
 });
 assert.equal(projection.sections.length,10);
 for(const sectionKey of sectionKeys){
  const expected=getAcceptedBaziRemainingSection(sectionKey,locale);
  const pages=projection.pages.filter(p=>p.sectionKey===sectionKey);
  assert(pages.length>=2,sectionKey+' requires opener plus body pages');
  assert.equal(pages.filter(p=>p.pageFamily==='SECTION_OPENER_PAGE').length,1,sectionKey+' must have exactly one opener');
  assert.equal(projection.internalSections.find(x=>x.sectionKey===sectionKey)?.diagnostics?.sectionRuntimeTier,'DETERMINISTIC');
  assert.equal(projection.internalSections.find(x=>x.sectionKey===sectionKey)?.composition?.executionClass,'OWNER_ACCEPTED_FROZEN_COPY');
  const visual=bindSectionVisual(sectionKey);
  assert(visual.assetKey&&visual.assetKey.startsWith('VIS-REPORT-BAZI-SEC-'));
  assert(visual.url&&/VIS-REPORT-BAZI-SEC-/.test(visual.url),sectionKey+' must bind its Section Master asset');
  const bodyParagraphs=pages.filter(p=>p.pageFamily!=='SECTION_OPENER_PAGE').flatMap(p=>p.paragraphs||[]);
  for(const row of expected.blocks){
   const matches=bodyParagraphs.filter(x=>normalized(x)===normalized(row.text));
   assert.equal(matches.length,1,sectionKey+' accepted block must appear exactly once: '+row.title);
   const key=normalized(row.text);
   assert(!allAcceptedTexts.has(key),'Cross-section duplicate accepted paragraph: '+row.title);
   allAcceptedTexts.set(key,sectionKey+':'+row.title);
   if(locale==='en')assert.equal((row.text.match(/[\u3400-\u9fff]/g)||[]).length,0,sectionKey+' English accepted copy contains Han text');
  }
 }
}

const publicationSource=fs.readFileSync('functions/personal-reading/bazi-section-publication.js','utf8');
assert(publicationSource.includes("executionClass:'OWNER_ACCEPTED_FROZEN_COPY'"));
assert(publicationSource.includes("if(!ownerAcceptedRemaining&&composition.t3&&T3_SECTIONS.includes(section.key))"));
assert(!publicationSource.includes("ownerAcceptedRemaining?await composePublicationNarrative"));

console.log('PASS: BaZi S06-S10 owner-accepted copy is frozen into canonical publication.');
console.log('  Both locales preserve every accepted paragraph exactly once.');
console.log('  Section Master bindings remain active; no duplicate opener; T3/provider overwrite is blocked.');
console.log('  Cross-section exact paragraph duplication: 0.');
console.log('  Production activation remains separate.');
