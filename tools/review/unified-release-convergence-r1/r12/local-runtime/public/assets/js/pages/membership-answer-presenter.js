export function presentMembershipAnswer(root,saved,{locale='zh-Hans',taskId=''}={}){
 root.replaceChildren();const el=(tag,text)=>{const n=document.createElement(tag);n.textContent=text;return n;};
 // Never rewrite the model answer to hide defects. Candidate calibration keeps
 // original text; future requests omit internal editorial status instructions.
 if(saved.answerCompleteness==='PARTIAL')root.append(el('strong',locale==='en'?'Partial answer':'部分回答'));
 if(saved.answerCompleteness==='SOURCE_INSUFFICIENT')root.append(el('strong',locale==='en'?'Insufficient sources':'来源不足'));
 root.append(el('p',saved.answer));const bindings=saved.sourceBinding?.bindings||[],languages=[...new Set(bindings.map(b=>b.sourceLanguage))];
 root.append(el('small',locale==='en'?'Source language: '+languages.map(l=>l==='zh-Hans'?'Chinese':l).join(', '):'来源语言：'+languages.map(l=>l==='zh-Hans'?'中文':l==='en'?'英文':l).join('、')));
 if(saved.limitations)root.append(el('p',saved.limitations));
 const used=new Set((saved.supportMap||[]).flatMap(s=>s.sourceIds||[]));for(const b of bindings.filter(b=>used.has(b.shortId))){const href=b.chapterDeepLink;if(typeof href!=='string'||!href.startsWith('/membership-source.html?'))continue;const a=el('a',locale==='en'?'Read chapter '+b.chapterId:'阅读章节 '+b.chapterId);const url=new URL(href,location.origin);if(taskId){url.searchParams.set('taskId',taskId);url.searchParams.set('sourceId',b.shortId);}a.setAttribute('href',url.pathname+url.search);root.append(a);if(typeof b.purchaseHref==='string'&&/^\/books\/(?!\/)/.test(b.purchaseHref)){const buy=el('a',locale==='en'?'Related book / purchase options':'相关书籍／购书选项');buy.href=b.purchaseHref;root.append(buy);}}
 return {sourceLanguages:languages,excerptsExposed:0};
}
