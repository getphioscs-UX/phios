// Scope is exactly the five additive links. Selection, forms and other methods
// remain owned by the existing personal surface.
function localizeLinks(){const locale=document.documentElement.lang.startsWith('zh')?'zh-Hans':'en';for(const a of document.querySelectorAll('[data-preentry-r5-link] a')){const u=new URL(a.href,location.origin);u.searchParams.set('locale',locale);a.href=u.pathname+u.search+u.hash;}}
localizeLinks();new MutationObserver(localizeLinks).observe(document.documentElement,{attributes:true,attributeFilter:['lang']});

// The existing surface may replace card markup after locale initialization.
new MutationObserver(localizeLinks).observe(document.body,{childList:true,subtree:true});
document.addEventListener('click',e=>{if(e.target.closest?.('[data-preentry-r5-link] a'))localizeLinks();});
document.documentElement.dataset.preentryHubLinks='ready';
