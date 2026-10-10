import {monitorVisual} from './visual-runtime.js';
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
const INFRA_TRAJECTORY={
 'INF-01':'POPULATION','INF-02':'SURPLUS_BUFFER','INF-03':'COORDINATION_SCALE','INF-04':'ECONOMIC_CONNECTIVITY','INF-05':'MOBILITY_RADIUS',
 'INF-06':'ECONOMIC_CONNECTIVITY','INF-07':'INFRASTRUCTURE_DEPENDENCY','INF-08':'MEANING_NETWORK_REACH','INF-09':'COORDINATION_SCALE','INF-10':'MEMORY_CAPACITY',
 'INF-11':'KNOWLEDGE_PARTICIPATION','INF-12':'INFORMATION_VELOCITY','INF-13':'SURPLUS_BUFFER','INF-14':'ENERGY','INF-15':'MOBILITY_RADIUS',
 'INF-16':'INFORMATION_VELOCITY','INF-17':'ENERGY','INF-18':'ECONOMIC_CONNECTIVITY','INF-19':'COMPUTATIONAL_CAPACITY','INF-20':'LOAD_FUTURE_CAPACITY'
};
const FIGURE_PERIOD={
 'HF-01':'T03','HF-02':'T03','HF-03':'T05','HF-04':'T05','HF-05':'T05','HF-06':'T06','HF-07':'T07','HF-08':'T08',
 'HF-09':'T09','HF-10':'T10','HF-11':'T10','HF-12':'T11','HF-13':'T13','HF-14':'T15','HF-15':'T16','HF-16':'T15'
};
export function resolveAtlasVisualDeepLink(bindings,assetId,{data={},allowPendingReview=false}={}){
 const asset=resolveAtlasVisualById(bindings,assetId,{allowPendingReview});
 if(!asset)return null;
 let patch=null,externalHref=null;
 if(asset.family==='TIMELINE_ANCHOR')patch={activeLayer:'timeline',timeWindowId:asset.subjectId};
 else if(asset.family==='CASE_HERO'||asset.family==='CASE_SECONDARY')patch={activeLayer:'cases',primaryCaseId:asset.subjectId,caseIds:[asset.subjectId]};
 else if(asset.family==='WORLD_SNAPSHOT_ATMOSPHERE')patch={activeLayer:'world',snapshotId:asset.subjectId};
 else if(asset.family==='COMPARISON_FAMILY')patch={activeLayer:'comparison',comparisonFamilyId:asset.subjectId};
 else if(asset.family==='TRAJECTORY_MOTIF')patch={activeLayer:'trajectories',trajectoryIds:[asset.subjectId]};
 else if(asset.family==='TRANSITION_WINDOW')patch={activeLayer:'transitions',transitionWindowId:asset.subjectId};
 else if(asset.family==='SCALE_SHIFT'){
  const shift=(data.transitions?.scaleShifts||[]).find(x=>x.scaleShiftId===asset.subjectId);
  patch={activeLayer:'transitions',transitionWindowId:shift?.transitionWindowIds?.[0]||null};
 }
 else if(asset.family==='LOSS_FAMILY')patch={activeLayer:'loss',lossFamilyId:asset.subjectId,lossTypeId:null};
 else if(asset.family==='LOSS_TYPE_VIGNETTE')patch={activeLayer:'loss',lossTypeId:asset.subjectId};
 else if(asset.family==='CIVILIZATION_INFRASTRUCTURE')patch={activeLayer:'trajectories',trajectoryIds:[INFRA_TRAJECTORY[asset.subjectId]||'INFRASTRUCTURE_DEPENDENCY']};
 else if(asset.family==='GEOGRAPHIC_BASE')externalHref='/world?explore=visuals&familyFilter='+asset.family+'&subjectFilter='+encodeURIComponent(asset.subjectId);
 else if(asset.family==='HISTORICAL_FIGURE')patch={activeLayer:'timeline',timeWindowId:FIGURE_PERIOD[asset.subjectId]||null};
 else if(asset.family==='MODERN_FLAG')externalHref='/world?explore=visuals&familyFilter='+asset.family+'&subjectFilter='+encodeURIComponent(asset.subjectId);
 else if(asset.family==='WORLD_RECONFIGURATION_SNAPSHOT')externalHref='/world?view=reconfiguration&atlas=snapshots&snapshot='+encodeURIComponent(asset.subjectId)+'&visual='+encodeURIComponent(asset.assetId)+'#atlas';
 return {asset,patch,externalHref};
}

const firstResolved=(bindings,family,subjectId,options)=>subjectId?(bindings?.assets||[]).filter(a=>a.family===family&&a.subjectId===subjectId).map(a=>resolveAtlasVisualById(bindings,a.assetId,options)).find(Boolean)||null:null;
const resolvedCaseVisuals=(bindings,caseIds,options,limit=3)=>{const out=[];for(const id of caseIds||[]){for(const family of ['CASE_HERO','CASE_SECONDARY']){const a=firstResolved(bindings,family,id,options);if(a&&!out.some(x=>x.assetId===a.assetId))out.push(a);if(out.length>=limit)return out;}}return out;};
export function resolveAtlasStaticVisuals(bindings,state,options={},data={}){
 const layer=state.activeLayer,assets=[];
 const add=a=>{if(a&&!assets.some(x=>x.assetId===a.assetId))assets.push(a);};
 if(layer==='timeline'){
  const periods=data.timeline?.periods||[],period=periods.find(p=>p.periodId===state.timeWindowId)||periods.find(p=>state.time!==null&&state.time>=p.startYear&&state.time<=p.endYear)||periods[0];
  add(firstResolved(bindings,'TIMELINE_ANCHOR',period?.periodId||state.timeWindowId,options));
  resolvedCaseVisuals(bindings,period?.caseIds,options,3).forEach(add);
 }else if(layer==='world'){
  const rows=data.world?.snapshots||[],snapshot=rows.find(x=>x.snapshotId===state.snapshotId)||rows.reduce((best,x)=>state.time===null?best:(!best||Math.abs(x.year-state.time)<Math.abs(best.year-state.time)?x:best),null)||rows[0];
  add(firstResolved(bindings,'WORLD_SNAPSHOT_ATMOSPHERE',snapshot?.snapshotId||state.snapshotId,options));
  resolvedCaseVisuals(bindings,snapshot?.majorCaseIds,options,3).forEach(add);
 }else if(layer==='cases'){
  const caseId=state.primaryCaseId||(data.cases?.cases||[])[0]?.caseId;
  resolvedCaseVisuals(bindings,[caseId],options,2).forEach(add);
 }else if(layer==='comparison'){
  const families=data.comparison?.families||[],family=families.find(x=>x.familyId===state.comparisonFamilyId)||families[0];
  add(firstResolved(bindings,'COMPARISON_FAMILY',family?.familyId||state.comparisonFamilyId,options));
  const preferred=(state.compareBasket||[]).filter(id=>family?.caseIds?.includes(id));
  resolvedCaseVisuals(bindings,preferred.length?preferred:family?.caseIds,options,3).forEach(add);
 }else if(layer==='trajectories'){
  const rows=data.trajectories?.trajectories||[],trajectory=rows.find(x=>x.trajectoryId===state.trajectoryIds?.[0])||rows[0];
  add(firstResolved(bindings,'TRAJECTORY_MOTIF',trajectory?.trajectoryId,options));
  resolvedCaseVisuals(bindings,trajectory?.relatedCases,options,3).forEach(add);
 }else if(layer==='transitions'){
  const rows=data.transitions?.transitionWindows||[],transition=rows.find(x=>x.transitionWindowId===state.transitionWindowId)||rows[0];
  add(firstResolved(bindings,'TRANSITION_WINDOW',transition?.transitionWindowId,options));
  resolvedCaseVisuals(bindings,transition?.relatedCases,options,3).forEach(add);
 }else if(layer==='loss'){
  const families=data.loss?.families||[],types=data.loss?.lossTypes||[],lossType=types.find(x=>x.lossTypeId===state.lossTypeId);
  const familyId=state.lossFamilyId||lossType?.familyId||families[0]?.familyId;
  if(lossType){add(firstResolved(bindings,'LOSS_TYPE_VIGNETTE',lossType.lossTypeId,options));resolvedCaseVisuals(bindings,lossType.exampleCaseIds,options,3).forEach(add);}
  else add(firstResolved(bindings,'LOSS_FAMILY',familyId,options));
 }
 return assets.slice(0,4);
}
function ensureStyle(doc){
 if(doc.getElementById('atlas-static-visual-style'))return;
 const style=doc.createElement('style');style.id='atlas-static-visual-style';style.textContent=`
 [data-atlas-static-visuals]{display:grid;gap:1rem;margin-block:1rem;min-width:0}
 .civ-visual-frame{margin:0;border:1px solid #d5b36c66;border-radius:18px;overflow:hidden;background:#071828;color:#f5f0e6}
 .civ-visual-frame img{display:block;width:100%;height:auto;max-height:520px;object-fit:contain;background:#071828}
 .civ-visual-frame figcaption{padding:1rem;line-height:1.6}.civ-visual-frame h4{margin:0 0 .4rem;color:#f1dfb0}.civ-visual-frame p{margin:.4rem 0}
 .civ-visual-frame button,.civ-visual-dialog button{padding:.65rem 1rem;border-radius:8px;border:1px solid #d5b36c;background:#122b40;color:#fff;cursor:pointer}
`;
 (doc.head||doc.documentElement).append(style);
}
function visualFigure(doc,a,locale){
 const zh=locale==='zh-Hans',figure=doc.createElement('figure'),img=doc.createElement('img'),caption=doc.createElement('figcaption');figure.className='civ-visual-frame';figure.dataset.assetId=a.assetId;
 const title=a.subjectTitle?.[locale]||a.subjectTitle?.en||a.subjectTitle?.['zh-Hans']||atlasVisualFamilyLabel(a.family,locale);
 img.alt=title;img.setAttribute('loading','lazy');img.setAttribute('decoding','async');img.dataset.assetId=a.assetId;const ratio=(a.aspectRatio||'16:9').split(':').map(Number);img.width=1600;img.height=Math.round(1600*(ratio[1]||9)/(ratio[0]||16));
 const heading=doc.createElement('h4');heading.textContent=title;caption.append(heading);
 const note=doc.createElement('p');note.textContent=a.family==='MODERN_FLAG'?(zh?'现代国家旗帜，仅用于现代国家识别，不代表古代文明或历史疆界。':'A modern national flag, for modern country identification, not ancient civilizations or historical borders.'):a.family==='HISTORICAL_FIGURE'?(zh?'人物形象为创作性复原，不作为真实容貌或历史事实的证据。':'An artistic reconstruction, not evidence of exact appearance or historical facts.'):(zh?'情境插画；图中文字、位置与边界不作为历史依据，年代与资料请以图谱正文为准。':'Contextual illustration. Embedded text, positions and borders are not historical evidence; consult the structured Atlas for dates and information.');caption.append(note);
 const expand=doc.createElement('button');expand.type='button';expand.textContent=zh?'展开图片':'Expand image';expand.disabled=true;expand.title=zh?'正在加载图片':'Loading image';caption.append(expand);img.addEventListener('error',()=>{expand.remove();},{once:true});
 img.addEventListener('load',()=>{figure.dataset.imageState='ready';expand.disabled=false;expand.title='';},{once:true});
 figure.append(img,caption);monitorVisual(img,a,locale);
 expand.addEventListener('click',()=>{const dialog=doc.createElement('dialog');dialog.className='civ-visual-dialog';dialog.setAttribute('aria-label',title);const close=doc.createElement('button');close.type='button';close.textContent=zh?'关闭图片':'Close image';const large=img.cloneNode();large.loading='eager';dialog.append(close,large);const label=doc.createElement('p');label.textContent=title+' · '+note.textContent;dialog.append(label);doc.body.append(dialog);close.addEventListener('click',()=>dialog.close());dialog.addEventListener('close',()=>{dialog.remove();expand.focus();},{once:true});dialog.showModal();close.focus();});
 img.src=a.publicUrl;return figure;
}
export function renderAtlasStaticVisuals(root,{bindings,state,locale='en',data={}}={}){
 const primaryHost=root.querySelector('[data-atlas-primary-visual]');
 primaryHost?.replaceChildren();
 if(bindings?.schemaVersion==='PHI-OS-CIVILIZATION-VISUAL-APPROVED-BINDINGS-v2'&&root.dataset.atlasReady!=='true')return;
 const doc=root.ownerDocument,options={allowPendingReview:isLocalAtlasReview(doc.defaultView?.location)},assets=resolveAtlasStaticVisuals(bindings,state,options,data);
 const existingURLs=new Set([...root.querySelectorAll('[data-atlas-layer-content] img,[data-atlas-template-projection] img')].map(i=>i.src));const uniqueAssets=assets.filter(a=>!existingURLs.has(a.publicUrl));
 const [primary]=assets;
 let related=root.querySelector('[data-atlas-related-visuals]');if(!related){related=root.ownerDocument.createElement('section');related.dataset.atlasRelatedVisuals='';root.querySelector('.civ-atlas-canvas')?.append(related);}related.replaceChildren();if(assets.length){ensureStyle(root.ownerDocument);const h=root.ownerDocument.createElement('h3');h.textContent=locale==='zh-Hans'?'登记关联的视觉情境':'Registered related visual context';related.append(h);for(const a of uniqueAssets.filter(a=>state.activeLayer!=='world'||a.family!=='WORLD_SNAPSHOT_ATMOSPHERE'))related.append(visualFigure(root.ownerDocument,a,locale));}
 const requestedId=new URLSearchParams(doc.defaultView?.location?.search||'').get('visual');
 const requested=requestedId?resolveAtlasVisualById(bindings,requestedId,options):null;
 const componentOwned=new Set(['timeline','world','cases','comparison','trajectories','transitions','loss']);
 const display=(requested&&!existingURLs.has(requested.publicUrl)?requested:null)||(!componentOwned.has(state.activeLayer)?primary:null);
 if(display&&primaryHost){
  ensureStyle(doc);
  primaryHost.className=requested?'civ-atlas-primary-visual civ-atlas-deep-linked-visual':'civ-atlas-primary-visual';
  const figure=visualFigure(doc,display,locale),img=figure.querySelector('img');
  if(img){img.loading=requested?'lazy':'eager';if(!requested)img.setAttribute('fetchpriority','high');}
  primaryHost.append(figure);
 }else if(primaryHost){
  primaryHost.className='';
 }
}
