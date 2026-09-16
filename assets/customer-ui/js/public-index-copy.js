// A presentation-only locale bridge for editorial additions on both existing shells.
// It does not set language, replace either locale authority, or touch page forms.
function apply(){
 const zh=document.documentElement.lang.toLowerCase().startsWith('zh');
 document.querySelectorAll('[data-pis-copy]').forEach(node=>{
   node.textContent=node.getAttribute(zh?'data-cx-zh':'data-cx-en')||'';
 });
 document.querySelectorAll('[data-pis-aria]').forEach(node=>{
   node.setAttribute('aria-label',node.getAttribute(zh?'data-cx-zh-aria-label':'data-cx-en-aria-label'));
 });
}
apply();
new MutationObserver(apply).observe(document.documentElement,{attributes:true,attributeFilter:['lang']});
