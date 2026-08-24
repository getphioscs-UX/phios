export const CX_NAVIGATION=Object.freeze({
 primary:[
  {id:'EXPLORE',href:'/explore/',en:'Explore',zh:'探索'},
  {id:'MY_REALITY',href:'/reality/',en:'My Reality',zh:'我的现实'},
  {id:'PERSPECTIVES',href:'/perspectives/',en:'Perspectives',zh:'视角'},
  {id:'KNOWLEDGE',href:'/knowledge/',en:'Knowledge',zh:'知识'},
  {id:'PROFESSIONAL',href:'/professional/',en:'Professional',zh:'专业'}
 ],
 utilities:[
  {id:'SEARCH',href:'/search/',en:'Search',zh:'搜索'},
  {id:'ASK',href:'/ask',en:'Ask PHI OS',zh:'Ask PHI OS'},
  {id:'ACCOUNT',href:'/account/',en:'Account',zh:'账户'}
 ]
});
export function installNavigationToggle(header){const button=header?.querySelector('[data-cx-menu]');if(!button)return;const set=open=>{header.dataset.open=String(open);button.setAttribute('aria-expanded',String(open));};button.addEventListener('click',()=>set(header.dataset.open!=='true'));header.addEventListener('keydown',event=>{if(event.key==='Escape')set(false)});header.querySelectorAll('a').forEach(link=>link.addEventListener('click',()=>set(false)));}
