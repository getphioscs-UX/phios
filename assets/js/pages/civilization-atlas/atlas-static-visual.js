const PUBLIC_BASE='https://pub-1967bc5812ee4164b19a806fb1427021.r2.dev/';
// Only reviewed delivery bindings enter runtime. Upload observations stay in the review package.
export function resolveAtlasStaticVisuals(bindings,state){
  const family=state.activeLayer==='timeline'?'TIMELINE_ANCHOR':state.activeLayer==='cases'?'CASE_HERO':null;
  const subject=state.activeLayer==='timeline'?state.timeWindowId:state.primaryCaseId;
  if(!family||!subject)return [];
  return (Array.isArray(bindings?.assets)?bindings.assets:[]).filter(a=>{
    if(!a||typeof a!=='object')return false;
    if(a.subjectId!==subject||!(a.family===family||(family==='CASE_HERO'&&a.family==='CASE_SECONDARY')))return false;
    const expected=a.family==='TIMELINE_ANCHOR'?`VIS-CIV-${subject}-HERO`:`VIS-CIV-${subject}-${a.family==='CASE_HERO'?'HERO':'SECONDARY'}`;
    const folder=a.family==='TIMELINE_ANCHOR'?'timeline':'cases';
    return a.assetId===expected&&a.reviewState==='ACCEPTED'&&a.bindingState==='BOUND'&&
      a.fallback==='STRUCTURED_HTML_SVG'&&a.containsText===false&&a.historicalAuthority===false&&
      a.canonicalAuthority===false&&a.registryWriteAuthority===false&&a.ocrWriteBackAllowed===false&&
      /^[a-f0-9]{64}$/.test(a.sha256||'')&&typeof a.reviewEvidence==='string'&&!!a.reviewEvidence.trim()&&
      a.bucketKey===`images/civilization-atlas/${folder}/${expected}.webp`&&
      a.publicUrl===PUBLIC_BASE+a.bucketKey;
  }).slice(0,2);
}
export function renderAtlasStaticVisuals(root,{bindings,state,locale='en'}={}){
  root.querySelector('[data-atlas-static-visuals]')?.remove();
  const structured=root.querySelector('[data-atlas-structured-visual]');
  if(!structured?.firstElementChild)return; // Never replace the structured fallback.
  const assets=resolveAtlasStaticVisuals(bindings,state);if(!assets.length)return;
  const host=root.ownerDocument.createElement('div');host.dataset.atlasStaticVisuals='';
  for(const a of assets){const figure=root.ownerDocument.createElement('figure'),img=root.ownerDocument.createElement('img'),caption=root.ownerDocument.createElement('figcaption');
    img.src=a.publicUrl;img.alt='';img.loading='lazy';img.decoding='async';img.style.cssText='width:100%;max-height:560px;object-fit:cover';
    caption.textContent=locale==='zh-Hans'?'氛围插画；历史资料以结构化图谱为准。':'Atmospheric illustration; historical information remains in the structured Atlas.';
    img.addEventListener('error',()=>figure.remove(),{once:true});figure.append(img,caption);host.append(figure);
  }
  structured.before(host);
}
