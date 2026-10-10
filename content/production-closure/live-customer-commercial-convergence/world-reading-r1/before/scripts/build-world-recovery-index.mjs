import fs from 'node:fs';
import crypto from 'node:crypto';
import {resolveAtlasVisualById,resolveAtlasVisualDeepLink} from '../assets/js/pages/civilization-atlas/atlas-static-visual.js';
const base='content/civilization-atlas',read=p=>JSON.parse(fs.readFileSync(p,'utf8').replace(/^\uFEFF/,''));
const bindings=read(base+'/visuals/civilization-visual-approved-bindings-v2.json');
const rows=[],sources=[];const positionRegistry=read('content/registry/runtime-position-48-v1.json');
const configs=[
 ['timeline/timeline-macro-eras-v1.json','macroEras','macroEraId','macro-era','timeline','period'],
 ['timeline/timeline-periods-v1.json','periods','periodId','period','timeline','period'],
 ['cases/civilization-case-registry-v1.json','cases','caseId','civilization','cases','case'],
 ['snapshots/world-snapshots-v1.json','snapshots','snapshotId','snapshot','world','snapshot'],
 ['comparison/comparison-families-v1.json','families','familyId','comparison','comparison','family'],
 ['trajectories/long-duration-trajectories-v1.json','trajectories','trajectoryId','trajectory','trajectories','trajectories'],
 ['transitions/transition-windows-v1.json','transitionWindows','transitionWindowId','transition','transitions','tw'],
 ['transitions/transition-windows-v1.json','scaleShifts','scaleShiftId','scale-shift','transitions','tw'],
 ['loss/reversal-loss-atlas-v1.json','families','familyId','loss-family','loss','lossFamily'],
 ['loss/reversal-loss-atlas-v1.json','lossTypes','lossTypeId','loss-type','loss','lossType'],
 ['reconfiguration/book-vi-sections-v1.json','sections','id','book-section','overview','section'],
 ['reconfiguration/reconfiguration-case-registry-v1.json','cases','id','reconfiguration-case','cases','case'],
 ['reconfiguration/reconfiguration-windows-v1.json','windows','id','reconfiguration-window','windows','window'],
 ['reconfiguration/world-reconfiguration-snapshots-v1.json','snapshots','id','reconfiguration-snapshot','snapshots','snapshot'],
 ['reconfiguration/contemporary-runtime-dossiers-v1.json','dossiers','id','current-dossier','dossiers','dossier'],
 ['reconfiguration/lived-reality-dimensions-v1.json','dimensions','id','lived-dimension','lived','lived']
];
const title=r=>r.title||r.label||r.entity||r.name||{en:r.titleEn||r.labelEn||r.metadata?.titleEn,'zh-Hans':r.titleZh||r.labelZh||r.metadata?.titleZh};
const localized=v=>typeof v==='object'&&v?{en:v.en||'Source object','zh-Hans':v['zh-Hans']||'来源对象'}:{en:typeof v==='string'?v:'Source object','zh-Hans':'来源对象'};
for(const [file,array,key,type,layer,param]of configs){
 const source=base+'/'+file,data=read(source);sources.push({path:source,sha256:crypto.createHash('sha256').update(fs.readFileSync(source)).digest('hex')});
 for(const r of data[array]||[]){const book=file.startsWith('reconfiguration/')?'BOOK-6':'BOOK-5',id=r[key],a=bindings.assets.filter(x=>x.subjectId===id&&resolveAtlasVisualById(bindings,x.assetId));
 const time=r.timeWindow||r.timeRange||{},params=new URLSearchParams({atlas:layer,[param]:String(type==='macro-era'?r.periodIds?.[0]:type==='scale-shift'?r.transitionWindowIds?.[0]:id)});if(book==='BOOK-6')params.set('view','reconfiguration');
 rows.push({id,type,book,layer,title:localized(title(r)),aliases:r.aliases||[],keywords:r.keywords||[],region:localized(r.region?.label||r.entity),regionId:r.region?.regionId||r.region||'',time:{start:r.startYear??r.timeStart??time.startYear??r.year,end:r.endYear??r.timeEnd??time.endYear??r.year},summary:localized(r.summary||r.runtimeSummary||r.description||r.definition||r.metadata?.historicalContext||r.coreRuntimeProblem),relatedObjects:r.relatedCases||r.caseIds||r.majorCaseIds||[],state:book==='BOOK-5'?'HISTORICAL':type==='current-dossier'?'UNKNOWN':type==='reconfiguration-snapshot'?'STRUCTURE_ONLY':r.knowledgeState||'HISTORICAL',sourceDate:r.sourceDate||r.asOfDate||null,version:r.version||data.version||null,href:'/world?'+params,visualAssets:a.map(x=>x.assetId),source});}
}
const data={timeline:read(base+'/timeline/timeline-periods-v1.json'),transitions:read(base+'/transitions/transition-windows-v1.json')};
const visualRows=bindings.assets.filter(a=>resolveAtlasVisualById(bindings,a.assetId)).map(a=>{const object=rows.find(r=>r.id===a.subjectId),resolved=resolveAtlasVisualDeepLink(bindings,a.assetId,{data});let href=resolved?.externalHref||'/world?visual='+encodeURIComponent(a.assetId);if(resolved?.patch){const map={activeLayer:'atlas',timeWindowId:'period',snapshotId:'snapshot',primaryCaseId:'case',comparisonFamilyId:'family',trajectoryIds:'trajectories',transitionWindowId:'tw',lossFamilyId:'lossFamily',lossTypeId:'lossType'};const params=new URLSearchParams({visual:a.assetId});for(const[k,v]of Object.entries(resolved.patch))if(map[k]&&v!=null)params.set(map[k],String(v));href='/world?'+params;}
 return {id:a.assetId,type:'visual',book:a.relatedBook||'BOOK-5',layer:object?.layer||'visual',title:localized(a.subjectTitle),summary:object?.summary||{en:'Contextual illustration; registered sources own facts.','zh-Hans':'情境插画；事实以登记来源为准。'},aliases:[],keywords:[],region:object?.region||{},regionId:object?.regionId||'',time:object?.time||{},state:object?.state||'ILLUSTRATION',family:a.family,subjectId:a.subjectId,bucketKey:a.bucketKey,publicUrl:a.publicUrl,sha256:a.sha256,href,source:a.sourceRegistry,relatedObjects:object?[object.id]:[],visualAssets:[a.assetId]};});
rows.push(...visualRows);
// Only human-accepted subsystem records are searchable as admitted current objects.
for(const file of fs.readdirSync(base+'/reconfiguration').filter(f=>/^dossier-.*-w8i-accepted-current-dossier-v1\.json$/.test(f))){const p=base+'/reconfiguration/'+file,r=read(p),id=r.dossierId||r.id;const dossier=rows.find(x=>x.type==='current-dossier'&&x.id===id);if(!dossier)continue;for(const position of r.admittedPositions||[])rows.push({...dossier,id:id+':'+position.runtimePositionId,type:'runtime-position',title:localized(position.shortLabel||positionRegistry.positions.find(p=>p.id===position.runtimePositionId)?.shortLabel),state:'CURRENT_SUBSYSTEM_ONLY',relatedObjects:[id],source:p,summary:{en:'Human-accepted subsystem position; never a whole-region verdict.','zh-Hans':'人工接受的子系统位置，不代表整个地区。'}});rows.push({...dossier,id:id+':accepted',type:'admitted-current-evidence',state:'CURRENT_SUBSYSTEM_ONLY',source:p,summary:{en:'Human-accepted subsystem evidence only; no whole-region conclusion.','zh-Hans':'仅限人工接受的子系统证据，不代表整个地区。'}});}
const out={schemaVersion:'PHI-OS-WORLD-SEARCH-INDEX-v1',generatedAt:new Date().toISOString(),sourceAuthority:'CANONICAL_REGISTRIES_AND_ACCEPTED_BINDINGS_ONLY',sources,rows};
// Rebuilding unchanged admitted inputs must not alter the published bytes merely
// to record another build time. This timestamp is generation, not currentness.
const indexPath=base+'/search/world-search-index-v1.json';
if(fs.existsSync(indexPath)){
 const prior=JSON.parse(fs.readFileSync(indexPath,'utf8'));
 const {generatedAt:priorGeneratedAt,...priorContent}=prior;
 const {generatedAt:ignoredGeneratedAt,...currentContent}=out;
 if(JSON.stringify(priorContent)===JSON.stringify(currentContent))out.generatedAt=priorGeneratedAt;
}
fs.mkdirSync(base+'/search',{recursive:true});fs.writeFileSync(base+'/search/world-search-index-v1.json',JSON.stringify(out)+'\n');
const previousLedger=fs.existsSync('docs/acceptance/world-recovery/visual-coverage-ledger.json')?read('docs/acceptance/world-recovery/visual-coverage-ledger.json').rows:[];
const coverage=bindings.assets.map(a=>({assetId:a.assetId,family:a.family,subjectId:a.subjectId,reviewState:a.reviewState,bindingState:a.bindingState,bucketKey:a.bucketKey,publicUrl:a.publicUrl,actualConsumer:visualRows.some(x=>x.id===a.assetId)?'world-semantic-visual-atlas':null,consumerRoute:'/world?explore=visuals',discoverable:visualRows.some(x=>x.id===a.assetId),requestedInBrowser:'NOT_RUN',decoded:'NOT_RUN',visible:'NOT_RUN',desktopState:'NOT_RUN',mobileState:'NOT_RUN',localeState:'NOT_RUN',decision:visualRows.some(x=>x.id===a.assetId)?'ACTIVE_VISUAL_ATLAS':'BROKEN_CONSUMER'})).map(row=>{const previous=previousLedger.find(p=>p.assetId===row.assetId&&p.publicUrl===row.publicUrl&&p.bucketKey===row.bucketKey);return previous?{...previous,...row,requestedInBrowser:previous.requestedInBrowser,decoded:previous.decoded,visible:previous.visible,desktopState:previous.desktopState,mobileState:previous.mobileState,localeState:previous.localeState}:row;});
fs.mkdirSync('docs/acceptance/world-recovery',{recursive:true});fs.writeFileSync('docs/acceptance/world-recovery/visual-coverage-ledger.json',JSON.stringify({registeredVisuals:read(base+'/visuals/civilization-visual-asset-registry-v2.json').assets.length,boundVisuals:bindings.assets.length,acceptedVisuals:bindings.assets.filter(a=>a.reviewState==='ACCEPTED').length,rows:coverage},null,2)+'\n');
fs.writeFileSync('docs/acceptance/world-recovery/orphan-report.json',JSON.stringify({unexplainedAcceptedOrphans:coverage.filter(a=>a.reviewState==='ACCEPTED'&&!a.discoverable),pending:coverage.filter(a=>a.reviewState!=='ACCEPTED')},null,2)+'\n');
console.log(JSON.stringify({entities:rows.length,visuals:visualRows.length,counts:Object.fromEntries([...new Set(rows.map(x=>x.type))].map(t=>[t,rows.filter(x=>x.type===t).length]))}));
