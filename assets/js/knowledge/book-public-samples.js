export function renderBookPublicSamples(host,book,locale='en'){
 const doc=host.ownerDocument,zh=locale==='zh-Hans';host.replaceChildren();
 const heading=doc.createElement('h2');heading.textContent=book.previewPages?.length||book.figures?.length?(zh?'免费阅读预览':'Free reading preview'):(zh?'本册封面':'Book cover');host.append(heading);
 if(book.cover){const cover=doc.createElement('img');cover.src=book.cover;cover.alt=zh?'本册封面':'Book cover';cover.loading='lazy';cover.style.cssText='width:200px;max-width:100%;height:auto';host.append(cover);}
 else {const note=doc.createElement('p');note.textContent=zh?'本册封面与预览尚待公布。':'Cover and preview will be announced.';host.append(note);}
 const pages=book.previewPages||[];
 if(pages.length){const note=doc.createElement('p');note.textContent=zh?'购买前可免费阅读以下静态预览页。原文语言保持不变。':'Read these sample pages free before purchasing. The original page language is preserved.';host.append(note);
 const controls=doc.createElement('div'),prev=doc.createElement('button'),next=doc.createElement('button'),select=doc.createElement('select'),image=doc.createElement('img'),status=doc.createElement('p');
 prev.type=next.type='button';prev.textContent=zh?'上一页':'Previous';next.textContent=zh?'下一页':'Next';select.setAttribute('aria-label',zh?'预览页码':'Preview page');status.setAttribute('role','status');
 pages.forEach((url,i)=>{const o=doc.createElement('option');o.value=String(i);o.textContent=`${i+1} / ${pages.length}`;select.append(o)});
 image.style.cssText='display:block;width:100%;max-width:900px;height:auto;margin:20px auto';image.loading='lazy';let index=0;
 const show=()=>{select.value=String(index);prev.disabled=index===0;next.disabled=index===pages.length-1;status.textContent='';image.hidden=false;image.alt=zh?`预览第 ${index+1} 页`:`Preview page ${index+1}`;image.src=pages[index];};
 image.addEventListener('error',()=>{image.hidden=true;status.textContent=zh?'此页暂时无法显示，请选择其他页或重试。':'This page could not load. Select another page or retry.'});
 prev.onclick=()=>{if(index>0){index--;show()}};next.onclick=()=>{if(index<pages.length-1){index++;show()}};select.onchange=()=>{index=Number(select.value);show()};
 controls.append(prev,select,next);host.append(controls,status,image);show();
 }
 if(book.figures?.length){const title=doc.createElement('h3');title.textContent=zh?'各部分总结图 · 免费预览':'Part summary figures · Free preview';host.append(title);
 for(const f of book.figures){const details=doc.createElement('details'),summary=doc.createElement('summary');summary.textContent=`${zh?'部分':'Part'} ${f.part} · FIG ${f.number}${f.title?.[locale]?' · '+f.title[locale]:''}`;details.append(summary);details.addEventListener('toggle',()=>{if(!details.open||details.querySelector('img'))return;const img=doc.createElement('img');img.src=f.url;img.alt=summary.textContent;img.loading='lazy';img.style.cssText='width:100%;height:auto';const a=doc.createElement('a');a.href=f.url;a.target='_blank';a.rel='noopener';a.textContent=zh?'查看原图':'Open full image';img.onerror=()=>{img.hidden=true};details.append(img,a);});host.append(details);}
 }
}
