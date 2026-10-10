const target=document.querySelector('[data-consolidation-target]')?.dataset.consolidationTarget;
if(target){const url=new URL(target,location.origin);url.search=location.search;if(location.hash)url.hash=location.hash;location.replace(url.pathname+url.search+url.hash);}
