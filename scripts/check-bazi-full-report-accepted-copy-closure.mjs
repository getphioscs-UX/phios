import fs from 'node:fs';
import assert from 'node:assert/strict';
import {projectBaziSectionPublication} from '../functions/personal-reading/bazi-section-publication.js';
import {getAcceptedBaziCoreSection} from '../functions/personal-reading/narrative/bazi-s02-s05-accepted-copy.generated.js';
import {getAcceptedBaziRemainingSection,BAZI_S06_S10_ACCEPTED_VERSION} from '../functions/personal-reading/narrative/bazi-s06-s10-accepted-copy.generated.js';
import {acceptedS02,acceptedS03,acceptedS04,acceptedS05,acceptedS06S10} from '../functions/personal-reading/narrative/bazi-owner-acceptance.generated.js';
import {bindSectionVisual} from '../functions/canonical-presentation-runtime/report-section-contract.js';

const source=JSON.parse(fs.readFileSync('docs/guided-report-successor-r2/bazi-source.json','utf8'));
for(const receipt of [acceptedS02,acceptedS03,acceptedS04,acceptedS05,acceptedS06S10]){
 assert.equal(receipt.decision,'ACCEPT');
 assert.equal(receipt.productionActivated,false);
}
assert.equal(acceptedS06S10.version,BAZI_S06_S10_ACCEPTED_VERSION);
assert.equal(acceptedS06S10.reviewArtifact.builderBlobSha,'3d87c62056db0536d61f0fdc8e30ec78b8164421');

const coreKeys=['S02_PERSONALITY','S03_LIFE_STRUCTURE','S04_CAREER','S05_WEALTH'];
const remainingKeys=['S06_RELATIONSHIP','S07_HEALTH','S08_TIMING','S09_GUIDANCE','S10_APPENDIX'];
const sectionKeys=[...coreKeys,...remainingKeys];
const normalized=s=>String(s||'').replace(/\s+/g,' ').trim();

for(const locale of ['zh-Hans','en']){
 const projection=await projectBaziSectionPublication({
  reading:source.reading,
  locale,
  temporalContext:source.temporalSnapshot,
  composition:{},
  allowUnselectedTiming:false
 });
 assert.equal(projection.sections.length,10);
 const allAcceptedTexts=new Map();
 for(const sectionKey of sectionKeys){
  const expected=coreKeys.includes(sectionKey)?getAcceptedBaziCoreSection(sectionKey,locale):getAcceptedBaziRemainingSection(sectionKey,locale);
  const pages=projection.pages.filter(p=>p.sectionKey===sectionKey);
  assert(pages.length>=2,sectionKey+' requires opener plus body pages');
  assert.equal(pages.filter(p=>p.pageFamily==='SECTION_OPENER_PAGE').length,1,sectionKey+' must have exactly one opener');
  const internal=projection.internalSections.find(x=>x.sectionKey===sectionKey);
  assert.equal(internal?.diagnostics?.sectionRuntimeTier,'DETERMINISTIC');
  assert.equal(internal?.composition?.executionClass,'OWNER_ACCEPTED_FROZEN_COPY');
  assert.equal(internal?.composition?.evidenceAdmission,'OWNER_ACCEPTED');
  const visual=bindSectionVisual(sectionKey);
  assert(visual.assetKey&&visual.assetKey.startsWith('VIS-REPORT-BAZI-SEC-'));
  assert(visual.url&&/VIS-REPORT-BAZI-SEC-/.test(visual.url),sectionKey+' must bind its Section Master asset');
  const bodyParagraphs=pages.filter(p=>p.pageFamily!=='SECTION_OPENER_PAGE').flatMap(p=>p.paragraphs||[]);
  for(const row of expected.blocks){
   const matches=bodyParagraphs.filter(x=>normalized(x)===normalized(row.text));
   assert.equal(matches.length,1,sectionKey+' accepted block must appear exactly once: '+(row.title||row.role));
   const key=normalized(row.text);
   assert(!allAcceptedTexts.has(key),'Cross-section duplicate accepted paragraph: '+(row.title||row.role));
   allAcceptedTexts.set(key,sectionKey+':'+(row.title||row.role));
   if(locale==='en'&&remainingKeys.includes(sectionKey)){
    assert.equal((row.text.match(/[\u3400-\u9fff]/g)||[]).length,0,sectionKey+' actual English accepted copy contains Han text');
   }
  }
 }
}

const publicationSource=fs.readFileSync('functions/personal-reading/bazi-section-publication.js','utf8');
assert(publicationSource.includes("executionClass:'OWNER_ACCEPTED_FROZEN_COPY'"));
assert(publicationSource.includes("if(!ownerAcceptedRemaining&&composition.t3&&T3_SECTIONS.includes(section.key))"));
assert(publicationSource.includes("'S02_PERSONALITY','S03_LIFE_STRUCTURE','S04_CAREER','S05_WEALTH','S06_RELATIONSHIP','S07_HEALTH','S08_TIMING','S09_GUIDANCE','S10_APPENDIX'"));
assert(!publicationSource.includes("ownerAcceptedRemaining?await composePublicationNarrative"));

console.log('PASS: BaZi S02-S10 owner-accepted copy is frozen into canonical publication.');
console.log('  Both locales preserve every accepted block exactly once.');
console.log('  Section Master bindings remain active; each section has exactly one opener.');
console.log('  T2/T3/provider overwrite is blocked for owner-accepted sections.');
console.log('  Cross-section exact accepted-block duplication: 0.');
console.log('  Production activation remains separate.');
