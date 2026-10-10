// Conservative fixed-font line budgets. Split long paragraphs without changing bytes.
export function buildAstAdaptivePagePlan(ir,profile){
 const pages=ir.editorialPages.map(e=>({...e,pageType:'EDITORIAL_FULL_PAGE',parts:[],diagramIds:[]}));
 const max=profile.pageExpansionPolicy.lineBudget,cols=profile.pageExpansionPolicy.charactersPerLine;
 for(const section of ir.sections){
  pages.push({pageType:'SECTION_OPENER',sectionId:section.sectionId,assetId:section.assetId,parts:[],diagramIds:[]});
  let page=null,used=0,index=0;
  const next=()=>{page={pageType:index++?'READING_CONTINUATION_PAGE':'READING_PAGE',sectionId:section.sectionId,parts:[],diagramIds:[]};pages.push(page);used=0;};
  for(const block of ir.contentBlocks.filter(b=>b.sectionId===section.sectionId)){
   const paras=block.text.split(/\r?\n\r?\n/);
   for(let p=0;p<paras.length;p++){
    let text=paras[p],offset=0;
    const heading=p===0?block.title:null;
    if(!page||used+Math.ceil(Math.min(text.length,cols*4)/cols)+3>max)next();
    if(heading)used+=3;
    while(offset<text.length){
     if(max-used<3)next();
     const room=Math.max(cols,(max-used-1)*cols),piece=text.slice(offset,offset+room);
     page.parts.push({blockId:block.blockId,paragraphIndex:p,offset,text:piece,heading:offset===0?heading:null});
     used+=Math.ceil(piece.length/cols)+1;offset+=piece.length;
    }
   }
  }
  for(const d of ir.diagramBlocks.filter(d=>d.sectionId===section.sectionId))pages.push({pageType:d.diagramId==='AST-D15'?'BOUNDARY_PAGE':'DIAGRAM_FULL_PAGE',sectionId:section.sectionId,parts:[],diagramIds:[d.diagramId]});
 }
 return {schemaVersion:'PHI-OS-AST-ADAPTIVE-PAGE-PLAN-v1.0.0',globalPageCount:null,referenceOnly:true,pages:pages.map((p,i)=>({...p,pageId:`AST-P${String(i+1).padStart(3,'0')}`,pageNumber:i+1}))};
}
