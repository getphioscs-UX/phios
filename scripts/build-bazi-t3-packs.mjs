import fs from 'node:fs';
import {projectBaziSectionPublication} from '../functions/personal-reading/bazi-section-publication.js';
const source=JSON.parse(fs.readFileSync('docs/guided-report-successor-r2/bazi-source.json'));
const packs={};
for(const locale of ['en','zh-Hans']){
 const projection=await projectBaziSectionPublication({reading:source.reading,locale,temporalContext:source.temporalSnapshot,composition:{t3:{stage:'SHADOW'}}});
 for(const s of projection.internalSections.filter(s=>s.t3))packs[`${locale}:${s.sectionKey}`]=s.t3.evidencePack;
}
fs.writeFileSync('functions/personal-reading/narrative/bazi-t3-preview-packs.generated.json',JSON.stringify({fixtureClass:'SYNTHETIC_EXISTING_CANONICAL_BAZI_BENCHMARK',packs},null,2)+'\n');
console.log('Built 16 bilingual section packs from existing canonical benchmark, no live provider invoked.');
