const supported=new Set(['numerology','ziwei','astrology','phi-configuration','human-design']);
const titles={COVER:['Cover','封面'],METHOD_INTRO:['About this method','方法介绍'],ORIGIN:['Origins and development','形成与发展'],PHIOS_LENS:['The PHI OS reading','PHI OS 阅读方式'],HOW_TO_READ:['How to read','阅读说明']};
const language=()=>document.documentElement.lang.startsWith('zh')?'zh-Hans':'en';
export function installFreeReportFrontMatter(parent,slug){
 if(!parent||!supported.has(slug)||slug==='astrology'&&parent.matches('[data-ast-entry]'))return;
 let section=parent.querySelector('[data-free-front-matter]');
 if(section&&section.dataset.freeLocale===language())return;
 section?.remove();section=document.createElement('section');section.className='chapter chapter-light';section.dataset.freeFrontMatter=slug;section.dataset.freeLocale=language();section.id='free-fixed-pages';
 const wrap=document.createElement('div');wrap.className='wrap';section.append(wrap);
 const heading=document.createElement('h2');heading.textContent=language()==='en'?'Read the method guide':'阅读方法固定页';wrap.append(heading);
 const status=document.createElement('p');status.setAttribute('role','status');status.textContent=language()==='en'?'Loading the public reading pages…':'正在读取公开固定页…';wrap.append(status);
 const host=parent.querySelector('[data-method-native-intake]');if(host)host.after(section);else parent.append(section);
 const offer=parent.querySelector('#access');if(offer)section.after(offer);
 const locale=language();
 void (async()=>{
  try{
   const response=await fetch('/api/report-free-front-matter?'+new URLSearchParams({method:slug,locale}),{credentials:'omit',cache:'no-store',signal:AbortSignal.timeout(10000)});
   const data=await response.json();if(!response.ok||!data.ok||!Array.isArray(data.pages)||!data.pages.length)throw Error('FREE_PAGES_UNAVAILABLE');
   if(!section.isConnected||section.dataset.freeLocale!==locale)return;
   status.textContent=data.pages.some(p=>p.language==='bilingual')?(locale==='en'?'These approved fixed pages include bilingual artwork. They are method guides, separate from your personal result.':'以下获准固定页包含双语版面，是方法导读，与个人计算结果分开。'):'';
   for(const page of data.pages){
    const details=document.createElement('details'),summary=document.createElement('summary'),img=document.createElement('img');
    summary.textContent=page.pageId+' · '+(titles[page.role]||['Reading page','阅读页'])[locale==='en'?0:1];details.append(summary);img.alt=summary.textContent;img.loading='lazy';img.decoding='async';img.style.maxWidth='100%';img.style.height='auto';if(page.width)img.width=page.width;if(page.height)img.height=page.height;
    img.addEventListener('load',()=>{details.dataset.imageState=img.naturalWidth>0?'decoded':'failed';});
    img.addEventListener('error',()=>{details.dataset.imageState='failed';img.hidden=true;const note=document.createElement('p');note.textContent=locale==='en'?'This page could not be loaded. Your free calculation remains available.':'此固定页暂时无法读取，免费计算仍可使用。';details.append(note);});
    const a=document.createElement('a');a.href=page.url;a.target='_blank';a.rel='noopener noreferrer';a.append(img);details.append(a);wrap.append(details);img.src=page.url;
   }
   section.dataset.freeState='registered-pages-loaded';
  }catch{if(section.isConnected){status.textContent=locale==='en'?'The fixed pages are temporarily unavailable. You can still use the free input and calculation.':'固定页暂时无法读取，你仍可使用免费输入和计算。';section.dataset.freeState='unavailable';}}
 })();
}
