/* Presentation only. Identity, entitlements and delivery remain server-authoritative. */
function revealAccountTarget(){
 let id;try{id=decodeURIComponent(location.hash.slice(1));}catch{return;}
 const target=id&&document.getElementById(id);if(!target)return;
 for(let n=target;n;n=n.parentElement)if(n instanceof HTMLDetailsElement)n.open=true;
 requestAnimationFrame(()=>target.scrollIntoView({block:'start'}));
}
document.addEventListener('click',event=>{
 const link=event.target.closest('a[data-account-r5-open]');if(!link)return;
 const panel=document.getElementById(link.dataset.accountR5Open);if(panel instanceof HTMLDetailsElement)panel.open=true;
});
window.addEventListener('hashchange',revealAccountTarget);
document.addEventListener('phios:account-rendered',()=>{if(location.hash)revealAccountTarget();});
revealAccountTarget();
