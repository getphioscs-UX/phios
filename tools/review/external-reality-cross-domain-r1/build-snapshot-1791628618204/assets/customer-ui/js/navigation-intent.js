export function knowledgeNavigationIntent(question,locale='en'){
 const q=String(question||'').trim().toLowerCase().replace(/[?？。.!！]+$/,'');
 const zh=locale==='zh-Hans';
 const routes=[[/^(?:文章|找文章|看文章|阅读文章|文章在哪(?:里)?|打开文章(?:页面)?|articles?|show (?:me )?(?:the )?articles?|browse articles|where are (?:the )?articles)$/,'/articles',zh?'浏览文章':'Browse articles'],[/^(?:书籍|书籍在哪|书在哪里|书在哪|打开书籍|books|browse books|where are (?:the )?books)$/,'/books',zh?'浏览书籍':'Browse books'],[/^(?:图示|图在哪里|查看图示|figures|browse figures|where are (?:the )?figures)$/,'/figures',zh?'查看图示':'Browse figures']];
 routes.push([/^(?:ask|ask phi os)$/,'/knowledge/ask/',zh?'提问':'Ask PHI OS'],[/^(?:my reality|我的现实)$/,'/reality/',zh?'我的现实':'My Reality'],[/^(?:tarot|塔罗)$/,'/perspectives/tarot/',zh?'塔罗':'Tarot'],[/^(?:i ching|易经)$/,'/perspectives/iching/',zh?'易经':'I Ching']);
 for(const [pattern,href,title] of routes)if(pattern.test(q))return {href,title,text:zh?`可以，点击下方「${title}」。`:`Sure—open “${title}” below.`};
 return null;
}
