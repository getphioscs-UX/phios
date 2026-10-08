const referenceMap=[1,1,3,2,2,4,5,6,7,9,8,10];
export function normalizeAstPublicationManuscript(source){
 if(source.status==='HUMAN_ACCEPTED')return {title:source.title,metadata:source.metadata,blocks:[{blockId:'OPENING',sectionId:'SEC-01',title:'阅读起点',text:source.opening},...source.chapters.map((c,i)=>({blockId:`CHAPTER-${i+1}`,sectionId:`SEC-${String(referenceMap[i]).padStart(2,'0')}`,title:c.title,text:c.text}))],sourceManuscriptDigest:source.contentDigest};
 if(source.completeness?.status!=='PASS_3_CALL')throw Error('AST_MANUSCRIPT_COMPLETENESS_REQUIRED');
 return {title:source.title,metadata:source.customerDisplay,blocks:[...source.sectionManuscripts.map(s=>({blockId:s.sectionId,sectionId:s.sectionId,title:s.title,text:s.text})),{blockId:'INTEGRATED_CLOSE',sectionId:'SEC-10',title:'整合阅读',text:source.integratedClose}],sourceManuscriptDigest:source.manuscriptDigest};
}
