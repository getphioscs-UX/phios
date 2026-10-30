/**
 * PHI OS HD R6.11 — reference validator for section-opener page maps.
 * This is a stand-alone bounded fixture aid, not the production renderer.
 * Actual page indices MUST come from final PDF composition layout records.
 */
import fs from 'node:fs';
const contract=JSON.parse(fs.readFileSync(new URL('./HD-TOC-CONTRACT.json', import.meta.url),'utf8'));
const ids=contract.section_titles.map(e=>e.id);
export function validateFinalTocPageMap({sectionOpenerEvents, physicalPageCount, selectedLanguage}) {
  if (!(selectedLanguage in contract.languages)) throw new Error('INVALID_PURCHASE_LANGUAGE');
  if (!Number.isInteger(physicalPageCount)||physicalPageCount<9) throw new Error('INVALID_FINAL_PDF_PAGE_COUNT');
  const map={};
  for (const e of sectionOpenerEvents) {
    if (!ids.includes(e.sectionId)) throw new Error(`UNKNOWN_SECTION:${e.sectionId}`);
    if (Object.hasOwn(map,e.sectionId)) throw new Error(`DUPLICATE_SECTION:${e.sectionId}`);
    if (!Number.isInteger(e.physicalPageIndex0)||e.physicalPageIndex0<8||e.physicalPageIndex0>=physicalPageCount) throw new Error(`BAD_PHYSICAL_PAGE_INDEX:${e.sectionId}`);
    map[e.sectionId]=e.physicalPageIndex0+1;
  }
  if (Object.keys(map).length!==17) throw new Error('MISSING_SECTION_OPENER');
  for(let i=1;i<ids.length;i++) if(map[ids[i]]<=map[ids[i-1]]) throw new Error('SECTION_OUT_OF_ORDER');
  return ids.map((id,index)=>({sectionId:id, fixedLabel:contract.section_titles[index][selectedLanguage==='bilingual'?'zh-Hans':selectedLanguage], physicalPageNumber1:map[id], linkTargetPhysicalPageIndex0:map[id]-1}));
}
if(process.argv[1]?.endsWith('toc_page_map_check.mjs')){
  const demo=JSON.parse(fs.readFileSync(new URL('./DEMO-PAGE-MAP-ILLUSTRATION-ONLY.json',import.meta.url),'utf8'));
  const rows=validateFinalTocPageMap({selectedLanguage:'en',physicalPageCount:100,sectionOpenerEvents:ids.map(id=>({sectionId:id,physicalPageIndex0:demo[id]-1}))});
  console.log('DEMO ONLY', rows.length, 'section links checked; first=', rows[0].physicalPageNumber1, 'last=', rows.at(-1).physicalPageNumber1);
}
