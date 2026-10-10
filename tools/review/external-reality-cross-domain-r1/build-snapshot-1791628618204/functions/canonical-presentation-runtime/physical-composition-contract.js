export const PHYSICAL_COMPOSITION_R1='PHI-OS-PHYSICAL-COMPOSITION-R1';
// The accepted cross-method contract owns physical grouping, never semantics.
export function validatePhysicalComposition({pages,intro,sourceBlocks,sectionIds}){
 const total=pages.length+intro.length;
 if(total<30||total>40)throw Error('PHYSICAL_PAGE_BUDGET');
 const ids=new Set(sourceBlocks.map(b=>b.sourceNodeId+':'+b.blockId)),seen=[];
 for(const p of pages){
  if(!p.compositionGroupId||!p.sourceNodeIds?.length||!p.physicalPageRole||!sectionIds.includes(p.sectionId))throw Error('PHYSICAL_GROUP_INVALID');
  if(p.pageFamily==='SECTION_OPENER_PAGE')continue;
  for(const n of p.compositionNodes||[])for(const b of n.paragraphs){const key=b.sourceNodeId+':'+b.blockId;if(!ids.has(key))throw Error('PHYSICAL_BLOCK_UNBOUND');seen.push(key);}
 }
 if(seen.length!==ids.size||new Set(seen).size!==ids.size)throw Error('PHYSICAL_BLOCK_COVERAGE');
 for(const id of sectionIds)if(pages.filter(p=>p.sectionId===id&&p.pageFamily==='SECTION_OPENER_PAGE').length!==1)throw Error('PHYSICAL_MASTER_MISSING');
 return true;
}
