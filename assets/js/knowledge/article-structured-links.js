export async function mountArticleStructuredLinks(host,article){
 try{const r=await fetch('/content/knowledge/structured/article-figure-reconciliation-v1.json');if(!r.ok)return;const data=await r.json();if(!host.isConnected)return;
 const matching=data.articles.filter(a=>a.locale===article.locale&&(a.href===`/articles/${article.slug}`||a.nodeCodes.includes(article.nodeCode)));
 const ids=new Set(matching.flatMap(a=>a.relatedObjectIds));if(!ids.size)return;
 const section=host.ownerDocument.createElement('section');section.className='knowledge-related';const h=host.ownerDocument.createElement('h2');h.textContent=article.locale==='zh-Hans'?'继续探索这个主题':'Explore this topic';section.append(h);
 const ul=host.ownerDocument.createElement('ul');for(const o of data.explorerLinks.filter(o=>ids.has(o.objectId))){const li=host.ownerDocument.createElement('li'),a=host.ownerDocument.createElement('a');if(!/^\/books\/[a-z-]+\//.test(o.href))continue;a.href=o.href;a.textContent=o.title;li.append(a);ul.append(li);}section.append(ul);host.append(section);
 }catch{/* Existing article reading remains available when optional links are unavailable. */}
}
