const FOCUSABLE='button:not([disabled]),a[href],input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])';

export function wireAtlasKeyboardNavigation(root,{onLayerActivate=()=>{}}={}){
  if(!root) return ()=>{};
  const nav=root.querySelector('[data-atlas-layer-nav]');
  if(!nav) return ()=>{};
  const handler=event=>{
    const target=event.target.closest('[data-atlas-layer]');
    if(!target) return;
    const buttons=[...nav.querySelectorAll('[data-atlas-layer]')];
    const index=buttons.indexOf(target);
    if(index<0) return;
    let next=index;
    if(event.key==='ArrowRight'||event.key==='ArrowDown') next=(index+1)%buttons.length;
    else if(event.key==='ArrowLeft'||event.key==='ArrowUp') next=(index-1+buttons.length)%buttons.length;
    else if(event.key==='Home') next=0;
    else if(event.key==='End') next=buttons.length-1;
    else return;
    event.preventDefault();
    buttons[next]?.focus();
    onLayerActivate(buttons[next]?.dataset.atlasLayer,{source:'keyboard-layer-nav'});
  };
  nav.addEventListener('keydown',handler);
  return ()=>nav.removeEventListener('keydown',handler);
}

export function ensureAtlasInteractiveNames(root){
  if(!root) return;
  root.querySelectorAll('button,a,input').forEach(el=>{
    const hasName=(el.getAttribute('aria-label')||el.textContent||el.getAttribute('placeholder')||'').trim();
    if(!hasName && el.matches(FOCUSABLE)) el.setAttribute('aria-label','Civilization Atlas control');
  });
}
