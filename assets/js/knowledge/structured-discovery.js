// Discovery metadata only: no meaning, manuscript text or authority promotion.
export function structuredDiscoveryRows(registry,index,books,locale='en') {
 const zh=locale==='zh-Hans', terms=new Map(index.map(x=>[x.objectId,x]));
 const rows=registry.objects.filter(x=>['IN_REVIEW','ACTIVE','ACCEPTED'].includes(x.status)).map(x=>{
  const item=terms.get(x.objectId), title=zh?x.title:item?.aliases?.[0]||x.title;
  const params=new URLSearchParams({contextType:'KNOWLEDGE',contextRef:`CONCEPT:${x.objectId.toLowerCase()}`,contextLabel:title,readingPath:x.explorerHref});
  return {type:'STRUCTURED_OBJECT',title,summary:zh?'打开主题，查看可用解释与来源。':'Open this topic for available explanations and sources.',source:x.bookCode,related:x.partCode,href:x.explorerHref,ask:`/knowledge/ask/?${params}`,terms:[x.objectId,x.title,...(item?.aliases||[]),...(item?.keywords||[]),'structured object 结构化对象'].join(' ')};
 });
 const atlas=books.books.find(b=>b.bookCode==='BOOK-5');
 if(atlas)rows.push({type:'ATLAS',title:zh?'文明图谱':'Civilization Atlas',summary:zh?'探索文明案例与现实位置。':'Explore civilization cases and reality positions.',source:'BOOK-5',related:atlas.title?.[locale]||atlas.title?.en,href:'/books/reality-differentiation/#atlas',ask:null,terms:'文明 图谱 civilization atlas Book V'});
 return rows;
}
