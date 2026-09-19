export const ATLAS_VISUAL_BINDINGS_PATH='/content/civilization-atlas/visuals/civilization-visual-approved-bindings-v2.json';
const PUBLIC_BASE='https://pub-1967bc5812ee4164b19a806fb1427021.r2.dev/';
const FAMILIES={
 TIMELINE_ANCHOR:['timeline','时代场景','Timeline scenes'],CASE_HERO:['cases','文明案例','Civilization cases'],CASE_SECONDARY:['cases','案例细节','Case details'],
 WORLD_SNAPSHOT_ATMOSPHERE:['snapshots','世界横切面','World snapshots'],COMPARISON_FAMILY:['comparison','文明比较','Civilization comparisons'],TRAJECTORY_MOTIF:['trajectories','长时段轨迹','Long-term trajectories'],
 TRANSITION_WINDOW:['transitions','转型窗口','Transitions'],SCALE_SHIFT:['scale-shifts','尺度变化','Scale shifts'],LOSS_FAMILY:['loss','损失与延续','Loss and continuity'],LOSS_TYPE_VIGNETTE:['loss','损失类型','Types of loss'],
 CIVILIZATION_INFRASTRUCTURE:['infrastructure','文明基础设施','Civilization infrastructure'],GEOGRAPHIC_BASE:['maps','地理背景','Geographic settings'],HISTORICAL_FIGURE:['historical-figures','历史人物形象','Historical figure illustrations'],MODERN_FLAG:['flags','现代国家旗帜','Modern national flags'],WORLD_RECONFIGURATION_SNAPSHOT:['reconfiguration','第六册：世界重构','Book VI: world reconfiguration']
};
export function isLocalAtlasReview(location=globalThis.location){return ['localhost','127.0.0.1','[::1]'].includes(location?.hostname);}
export function atlasVisualFamilyLabel(family,locale='en'){return FAMILIES[family]?.[locale==='zh-Hans'?1:2]||'';}
export function resolveAtlasVisualById(bindings,assetId,{allowPendingReview=false}={}){
 const a=bindings?.assets?.find(a=>a.assetId===assetId),folder=FAMILIES[a?.family]?.[0];
 if(!a||!folder||!(/^(VIS-CIV-[A-Z0-9_-]+|WORLD_RECONFIGURATION_SNAPSHOT_\d{4})$/).test(a.assetId))return null;
 const pending=allowPendingReview&&bindings.pendingReviewPolicy==='LOCAL_REVIEW_ONLY_UNTIL_EXPLICIT_HUMAN_ACCEPTANCE'&&a.reviewState==='PENDING_HUMAN_REVIEW'&&a.deliveryVerified===true&&a.ownerUploadConfirmed===true;
 if(a.reviewState!=='ACCEPTED'&&!pending)return null;
 if(bindings.schemaVersion==='PHI-OS-CIVILIZATION-VISUAL-APPROVED-BINDINGS-v2'&&(a.deliveryVerified!==true||a.ownerUploadConfirmed!==true))return null;
 const boundedText=a.containsText===false||(bindings.schemaVersion==='PHI-OS-CIVILIZATION-VISUAL-APPROVED-BINDINGS-v2'&&[null,true].includes(a.containsText)&&a.embeddedTextAuthority==='NONE'&&a.displayTextAuthority==='HTML_REGISTRY_ONLY');
 if(a.bindingState!=='BOUND'||a.fallback!=='STRUCTURED_HTML_SVG'||!boundedText||a.historicalAuthority!==false||a.canonicalAuthority!==false||a.registryWriteAuthority!==false||a.ocrWriteBackAllowed!==false)return null;
 if(!/^[a-f0-9]{64}$/.test(a.sha256||'')||typeof a.reviewEvidence!=='string'||!a.reviewEvidence.trim())return null;
 if(a.bucketKey!==`images/civilization-atlas/${folder}/${a.assetId}.webp`||a.publicUrl!==PUBLIC_BASE+a.bucketKey)return null;
 const prefixes={CIVILIZATION_INFRASTRUCTURE:`VIS-CIV-${a.subjectId}`,GEOGRAPHIC_BASE:`VIS-CIV-${a.subjectId}`,HISTORICAL_FIGURE:`VIS-CIV-${a.subjectId}`,MODERN_FLAG:`VIS-CIV-${a.subjectId}`,WORLD_RECONFIGURATION_SNAPSHOT:a.subjectId,TIMELINE_ANCHOR:`VIS-CIV-${a.subjectId}-HERO`,CASE_HERO:`VIS-CIV-${a.subjectId}-HERO`,CASE_SECONDARY:`VIS-CIV-${a.subjectId}-SECONDARY`,WORLD_SNAPSHOT_ATMOSPHERE:`VIS-CIV-${a.subjectId}-ATMOSPHERE`,COMPARISON_FAMILY:`VIS-CIV-CF-${a.subjectId}`,TRAJECTORY_MOTIF:`VIS-CIV-TRJ-${a.subjectId}`,TRANSITION_WINDOW:`VIS-CIV-${a.subjectId}`,SCALE_SHIFT:`VIS-CIV-${a.subjectId}`,LOSS_FAMILY:`VIS-CIV-LF-${a.subjectId}`,LOSS_TYPE_VIGNETTE:`VIS-CIV-LT-${a.subjectId}`};
 if(prefixes[a.family]&&a.assetId!==prefixes[a.family])return null;
 return a;
}
export function resolveAtlasStaticVisuals(bindings,state,options={}){
 const selectors={timeline:['TIMELINE_ANCHOR',state.timeWindowId],cases:['CASE_HERO',state.primaryCaseId],comparison:['COMPARISON_FAMILY',state.comparisonFamilyId],world:['WORLD_SNAPSHOT_ATMOSPHERE',state.snapshotId],trajectories:['TRAJECTORY_MOTIF',state.trajectoryIds?.[0]],transitions:['TRANSITION_WINDOW',state.transitionWindowId],loss:[state.lossTypeId?'LOSS_TYPE_VIGNETTE':'LOSS_FAMILY',state.lossTypeId||state.lossFamilyId]};
 const selected=selectors[state.activeLayer];if(!selected)return [];
 const [family,id]=selected;const subject=id||bindings?.assets?.find(a=>a.family===family)?.subjectId;
 return (bindings?.assets||[]).filter(a=>a.subjectId===subject&&(a.family===family||(family==='CASE_HERO'&&a.family==='CASE_SECONDARY'))).map(a=>resolveAtlasVisualById(bindings,a.assetId,options)).filter(Boolean).slice(0,2);
}
function ensureStyle(doc){
 if(doc.getElementById('atlas-static-visual-style'))return;
 const style=doc.createElement('style');style.id='atlas-static-visual-style';style.textContent=`
 [data-atlas-static-visuals]{display:grid;gap:1rem;margin-block:1rem;min-width:0}
 .civ-visual-frame{margin:0;border:1px solid #d5b36c66;border-radius:18px;overflow:hidden;background:#071828;color:#f5f0e6}
 .civ-visual-frame img{display:block;width:100%;height:auto;max-height:520px;object-fit:contain;background:#071828}
 .civ-visual-frame figcaption{padding:1rem;line-height:1.6}.civ-visual-frame h4{margin:0 0 .4rem;color:#f1dfb0}.civ-visual-frame p{margin:.4rem 0}
 .civ-visual-frame button,.civ-visual-dialog button{padding:.65rem 1rem;border-radius:8px;border:1px solid #d5b36c;background:#122b40;color:#fff;cursor:pointer}
 .civ-visual-library{padding:1rem;border:1px solid #d5b36c66;border-radius:14px}.civ-visual-library summary{cursor:pointer;font-weight:600}.civ-visual-controls{display:grid;gap:.8rem;margin-block:1rem}.civ-visual-controls label{display:grid;gap:.3rem}.civ-visual-controls select{max-width:100%;min-width:0;padding:.65rem}
 .civ-visual-dialog{max-width:94vw;max-height:94vh;padding:1rem;background:#071828;color:#fff;border:1px solid #d5b36c;border-radius:14px}.civ-visual-dialog::backdrop{background:#000b}.civ-visual-dialog img{display:block;max-width:88vw;max-height:76vh;object-fit:contain}
 [data-atlas-static-visuals] :focus-visible,.civ-visual-dialog :focus-visible{outline:3px solid #d5b36c;outline-offset:4px}
 @media(min-width:800px){.civ-visual-controls{grid-template-columns:1fr 2fr}}`;
 (doc.head||doc.documentElement).append(style);
}
function visualFigure(doc,a,locale){
 const zh=locale==='zh-Hans',figure=doc.createElement('figure'),img=doc.createElement('img'),caption=doc.createElement('figcaption');figure.className='civ-visual-frame';figure.dataset.assetId=a.assetId;
 const title=a.subjectTitle?.[locale]||a.subjectTitle?.en||a.subjectTitle?.['zh-Hans']||atlasVisualFamilyLabel(a.family,locale);
 img.alt=title;img.setAttribute('loading','lazy');img.setAttribute('decoding','async');img.dataset.assetId=a.assetId;const ratio=(a.aspectRatio||'16:9').split(':').map(Number);img.width=1600;img.height=Math.round(1600*(ratio[1]||9)/(ratio[0]||16));
 const heading=doc.createElement('h4');heading.textContent=title;caption.append(heading);
 const note=doc.createElement('p');note.textContent=a.family==='MODERN_FLAG'?(zh?'现代国家旗帜，仅用于现代国家识别，不代表古代文明或历史疆界。':'A modern national flag, for modern country identification, not ancient civilizations or historical borders.'):a.family==='HISTORICAL_FIGURE'?(zh?'人物形象为创作性复原，不作为真实容貌或历史事实的证据。':'An artistic reconstruction, not evidence of exact appearance or historical facts.'):(zh?'情境插画；图中文字、位置与边界不作为历史依据，年代与资料请以图谱正文为准。':'Contextual illustration. Embedded text, positions and borders are not historical evidence; consult the structured Atlas for dates and information.');caption.append(note);
 const expand=doc.createElement('button');expand.type='button';expand.textContent=zh?'展开图片':'Expand image';expand.disabled=true;caption.append(expand);
 img.addEventListener('load',()=>{figure.dataset.imageState='ready';expand.disabled=false;},{once:true});
 img.addEventListener('error',()=>{figure.remove();},{once:true});
 expand.addEventListener('click',()=>{const dialog=doc.createElement('dialog');dialog.className='civ-visual-dialog';dialog.setAttribute('aria-label',title);const close=doc.createElement('button');close.type='button';close.textContent=zh?'关闭图片':'Close image';const large=img.cloneNode();large.loading='eager';dialog.append(close,large);const label=doc.createElement('p');label.textContent=title+' · '+note.textContent;dialog.append(label);doc.body.append(dialog);close.addEventListener('click',()=>dialog.close());dialog.addEventListener('close',()=>{dialog.remove();expand.focus();},{once:true});dialog.showModal();close.focus();});
 img.src=a.publicUrl;figure.append(img,caption);return figure;
}
export function renderAtlasStaticVisuals(root,{bindings,state,locale='en'}={}){
 root.querySelector('[data-atlas-static-visuals]')?.remove();
 const structured=root.querySelector('[data-atlas-structured-visual]');if(!structured?.firstElementChild)return;
 if(bindings?.schemaVersion==='PHI-OS-CIVILIZATION-VISUAL-APPROVED-BINDINGS-v2'&&root.dataset.atlasReady!=='true')return;
 const doc=root.ownerDocument,options={allowPendingReview:isLocalAtlasReview(doc.defaultView?.location)},assets=resolveAtlasStaticVisuals(bindings,state,options);
 const library=bindings?.assets?.filter(a=>resolveAtlasVisualById(bindings,a.assetId,options))||[];
 if(!assets.length&&!library.length)return;ensureStyle(doc);
 const host=doc.createElement('div');host.dataset.atlasStaticVisuals='';
 for(const a of assets)host.append(visualFigure(doc,a,locale));
 if(bindings?.schemaVersion==='PHI-OS-CIVILIZATION-VISUAL-APPROVED-BINDINGS-v2'){
  const details=doc.createElement('details');details.className='civ-visual-library';const summary=doc.createElement('summary');summary.textContent=locale==='zh-Hans'?'浏览插画、人物与现代国旗':'Browse illustrations, figures and modern flags';details.append(summary);
  const note=doc.createElement('p');note.textContent=locale==='zh-Hans'?'此处独立选择参考图，不会改变当前图谱的历史情境或提问范围。':'Choose a reference image independently. This does not change the historical context or scope of your Atlas question.';details.append(note);
  const controls=doc.createElement('div');controls.className='civ-visual-controls';const family=doc.createElement('select'),choice=doc.createElement('select');family.dataset.atlasVisualFamily='';choice.dataset.atlasVisualChoice='';
  for(const [control,text] of [[family,locale==='zh-Hans'?'图像类别':'Image category'],[choice,locale==='zh-Hans'?'图像主题':'Image subject']]){const label=doc.createElement('label');label.textContent=text;label.append(control);controls.append(label);}
  for(const id of [...new Set(library.map(a=>a.family))]){const option=doc.createElement('option');option.value=id;option.textContent=atlasVisualFamilyLabel(id,locale);family.append(option);}
  const display=doc.createElement('div');display.dataset.atlasVisualSelection='';
  const show=()=>{display.replaceChildren();if(!details.open)return;const a=resolveAtlasVisualById(bindings,choice.value,options);if(a)display.append(visualFigure(doc,a,locale));};
  const choices=()=>{choice.replaceChildren();for(const a of library.filter(a=>a.family===family.value)){const option=doc.createElement('option');option.value=a.assetId;option.textContent=a.subjectTitle?.[locale]||a.subjectTitle?.en;choice.append(option);}show();};
  family.addEventListener('change',choices);choice.addEventListener('change',show);details.addEventListener('toggle',show);details.append(controls,display);choices();host.append(details);
  const requested=new URLSearchParams(doc.defaultView?.location?.search||'').get('visual');
  const selected=library.find(a=>a.assetId===requested);
  if(selected){family.value=selected.family;choices();choice.value=selected.assetId;details.open=true;show();}
 }
 structured.before(host);
}
