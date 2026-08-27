const q=selector=>document.querySelector(selector);
const card=q('[data-iching-availability-title]')?.closest('aside');
const hero=q('.cx-symbolic-hero');
if(card)card.remove();
if(hero){hero.style.gridTemplateColumns='minmax(0,1fr)';hero.style.maxWidth='64rem';}

// The frozen ICHING-1.0.1 entry controller keeps the server-side fail-closed
// authority check. This customer presentation extension only removes
// operational production wording from the visible page.
const observer=new MutationObserver(()=>{
  const current=q('[data-iching-availability-title]')?.closest('aside');
  if(current)current.remove();
});
observer.observe(document.body,{subtree:true,childList:true});
