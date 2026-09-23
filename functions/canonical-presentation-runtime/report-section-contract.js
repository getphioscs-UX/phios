import {registry,familyRegistry,visualAssets} from './report-section-config.generated.js';
export const BAZI_SECTION_REGISTRY=registry;
export const REPORT_PAGE_FAMILIES=familyRegistry.families;
export const BAZI_SECTION_VISUAL_ASSETS=visualAssets;
export const SECTION_LAYOUT='SECTION_BASED_V1';
export function validateSectionRegistry(plan=registry){
 if(plan.frontMatter.length!==6||plan.sections.length!==10)throw Error('SECTION_REGISTRY_STRUCTURE');
 const keys=new Set();
 for(const [i,s] of plan.sections.entries()){
  if(s.number!==String(i+1).padStart(2,'0')||!s.enabled||s.pages[0]?.family!=='SECTION_OPENER_PAGE')throw Error('SECTION_OPENER_OR_ORDER');
  for(const p of s.pages){if(keys.has(p.key)||!REPORT_PAGE_FAMILIES[p.family]||!p.dataModules?.length)throw Error('SECTION_PAGE_FAMILY_OR_MODULE');keys.add(p.key);}
 }return plan;
}
export function textUnits(text,locale){return locale==='en'?String(text).trim().split(/\s+/).filter(Boolean).length:[...String(text).replace(/\s/g,'')].length;}
export function splitSemanticBlocks(blocks,{locale,maxUnits,minUnits=0}){
 const pages=[];let current=[],size=0;
 for(const block of blocks){const units=textUnits(block.text,locale);if(units>maxUnits)throw Error('SECTION_SINGLE_BLOCK_OVER_BUDGET');if(size+units>maxUnits&&current.length){pages.push(current);current=[];size=0;}current.push(block);size+=units;}
 if(current.length)pages.push(current);
 // Keep a short final continuation with a complete preceding semantic block
 // when both resulting pages still meet their budgets. Never pad or split prose.
 if(pages.length>1&&minUnits){
  const last=pages.at(-1),previous=pages.at(-2),sizeOf=page=>page.reduce((n,b)=>n+textUnits(b.text,locale),0);
  while(sizeOf(last)<minUnits&&previous.length>1){const candidate=previous.at(-1),units=textUnits(candidate.text,locale);if(sizeOf(last)+units>maxUnits||sizeOf(previous)-units<minUnits)break;last.unshift(previous.pop());}
 }
 return pages;
}
export function bindSectionVisual(sectionKey,{assets=visualAssets}={}){
 const sectionNumber=Number(sectionKey.match(/^S(\d+)/)?.[1]||1),motifKey=assets.global.motifs?.[(sectionNumber-1)%2]||assets.global.motifLayer;
 const assetKey=assets.sections[sectionKey],hero=assets.bindings[assetKey],style=assets.bindings[assets.global.sectionStyle],bodyUrl=assets.bindings[assets.global.bodyBackground]||null,motifUrl=assets.bindings[motifKey]||null,url=hero||style||bodyUrl;
 // Only explicit registry bindings become images; symbolic asset IDs never do.
 for(const v of [hero,style,bodyUrl,motifUrl].filter(Boolean))if(!/^https:\/\//.test(v)&&!/^\/assets\//.test(v))throw Error('SECTION_VISUAL_URL_INVALID');
 return {assetKey,url:url||null,bodyUrl,motifUrl,motifKey,intensityByFamily:assets.intensityByFamily||{},candidates:[hero,style,bodyUrl].filter(Boolean),fallback:assets.fallback,selected:hero?'SECTION_HERO':style?'SECTION_STYLE':bodyUrl?(motifUrl?'BODY_WITH_MOTIF':'BODY'):'CSS_PREMIUM',motif:'LANDSCAPE_RINGS'};
}
export function validateExpandedSections(pages,plan=registry){
 let cursor=0;
 for(const s of plan.sections.filter(s=>s.enabled)){
  const group=[];while(pages[cursor]?.sectionKey===s.key)group.push(pages[cursor++]);
  if(group.length<2||group[0].pageFamily!=='SECTION_OPENER_PAGE'||group.slice(1).some(p=>p.pageFamily==='SECTION_OPENER_PAGE'))throw Error('SECTION_EXPANSION_ORDER');
  for(const p of group)if(!s.pages.some(d=>d.key===p.definitionKey&&d.family===p.pageFamily))throw Error('SECTION_EXPANSION_FAMILY');
 }
 if(cursor!==pages.length||pages.some((p,i)=>p.pageNumber!==i+7)||new Set(pages.map(p=>p.pageKey)).size!==pages.length)throw Error('SECTION_EXPANSION_SEQUENCE');
 return true;
}
