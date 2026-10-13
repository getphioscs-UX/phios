const params=new URLSearchParams(location.search),en=params.get('locale')==='en',result=document.querySelector('#result');
async function load(){result.textContent=en?'Checking source permissions…':'正在核对来源权限…';try{
 const saved=params.get('taskId')&&params.get('sourceId');
 const response=await fetch(saved?'/api/membership-ask?'+new URLSearchParams({taskId:params.get('taskId'),sourceId:params.get('sourceId')}):'/api/membership-ask',saved?{method:'GET'}:{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'PREVIEW',mode:'KNOWLEDGE',question:params.get('q'),bookCode:params.get('bookCode'),locale:en?'en':'zh-Hans'})});
 const data=await response.json();if(!response.ok)throw Error(data.code);
 const source=saved?data.source:data.pack.sources.find(s=>s.chapterId===params.get('chapter'));if(!source)throw Error('SOURCE_NOT_AVAILABLE_IN_CURRENT_AUTHORITY_PACK');
 result.replaceChildren();for(const text of [source.heading,source.chapterId,source.sourceVersion,source.sourceSha256,(en?'Source language: ':'来源语言：')+source.sourceLanguage,JSON.stringify(source.pdfPages)]){const p=document.createElement('p');p.textContent=text;result.append(p);}
 const note=document.createElement('p');note.textContent=en?'This is a permission-checked chapter description. PDF pages are support positions, not a public PDF download.':'这是经过权限核对的章节说明。PDF 页码为支持位置，不提供私有 PDF 下载。';result.append(note);
 if(typeof source.readingHref==='string'&&/^\/books\/(?!\/)/.test(source.readingHref)){const link=document.createElement('a');link.href=source.readingHref;link.textContent=en?'Related book information / purchase options':'相关书籍说明／购买选项';result.append(link);}
 }catch(error){result.textContent=(en?'Source unavailable; retry after resolving access: ':'来源暂不可用，请核对权限后重试：')+error.message;}}
document.querySelector('#retry').onclick=load;load();
