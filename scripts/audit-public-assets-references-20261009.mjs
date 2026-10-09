import fs from 'node:fs';import path from 'node:path';import {execFileSync} from 'node:child_process';
const dir='docs/assets/r2-public/audit-20261009',inventory=JSON.parse(fs.readFileSync(dir+'/INVENTORY.json'));
const rows=inventory.objects.map(o=>({...o,references:[],registrations:[],dynamicReferences:[],runtimeObserved:[],classification:'证据不足',releasableBytes:0})),byKey=new Map(rows.map(r=>[r.key,r])),byLeaf=new Map();
for(const r of rows){const leaf=r.key.split('/').pop();if(!leaf)continue;if(!byLeaf.has(leaf))byLeaf.set(leaf,[]);byLeaf.get(leaf).push(r);}
const excluded=/^(?:node_modules|\.git|\.wrangler|\.codex|\.agents|dist|build|docs\/assets\/r2-public\/audit-20261009)\//;
const names=execFileSync('git',['ls-files','-z','--cached','--others','--exclude-standard'],{encoding:'utf8',maxBuffer:64*1024*1024}).split('\0').filter(p=>p&&!excluded.test(p)&&/\.(?:json|js|mjs|cjs|ts|tsx|jsx|html|css|md|txt|sql|toml|yaml|yml|svg|xml|csv|log)$/.test(p)&&!/(?:credentials|secret|\.env)/i.test(p));
const sources=[],largeFiles=[],codes=new Map(),dynamicSites=[];
const runtime=p=>/^(?:assets|functions|perspectives|books|academy|account|knowledge|professional)\//.test(p)&&!p.includes('/review/');
function walk(v,p,inherited=false,pointer='$'){
 if(!v||typeof v!=='object')return;
 const accepted=inherited||Object.entries(v).some(([k,x])=>/^(?:reviewState|status|decision|humanAcceptance|humanVisualAcceptance)$/.test(k)&&typeof x==='string'&&/^(?:ACCEPT|ACCEPTED|HUMAN_ACCEPTED|HUMAN_VISUAL_ACCEPTED|HUMAN_ADMITTED)(?:$|_)/.test(x));
 const keys=Object.values(v).filter(x=>typeof x==='string').flatMap(x=>{let value=x;try{value=decodeURIComponent(value)}catch{};const k=value.includes('.r2.dev/')?value.split('.r2.dev/')[1].split(/[?#]/)[0]:value;return byKey.has(k)?[k]:[];});
 const id=v.asset_code||v.assetCode||v.assetId||v.id;
 for(const key of new Set(keys)){const r=byKey.get(key);r.registrations.push({path:p,pointer,accepted,assetCode:id||null,state:v.reviewState||v.status||v.verification||null});if(id&&typeof id==='string'){if(!codes.has(id))codes.set(id,new Set());codes.get(id).add(key);}}
 for(const [k,x]of Object.entries(v))if(x&&typeof x==='object')walk(x,p,accepted,pointer+'/'+k);
}
for(const p of names){if(!fs.existsSync(p)||!fs.statSync(p).isFile())continue;const b=fs.readFileSync(p);if(b.includes(0))continue;const text=b.toString('utf8');sources.push({p,text});if(b.length>2*1024*1024)largeFiles.push({path:p,bytes:b.length});
 const leaves=new Set((text.match(/[^\s"'`<>\/\\:=,{}\[\]()]+/g)||[]).filter(t=>/\.(?:webp|png|jpe?g|svg|gif|avif|pdf|woff2?|mp4|webm|json|zip)$/.test(t)).map(t=>{try{return decodeURIComponent(t)}catch{return t}}));
 for(const leaf of leaves)for(const r of byLeaf.get(leaf)||[]){const exact=text.includes(r.key)||text.includes(r.key.split('/').map(encodeURIComponent).join('/'));r.references.push({path:p,kind:exact?'EXACT_KEY':'BASENAME_ONLY_UNRESOLVED',runtime:runtime(p),historical:/history|historical|freeze|receipt|acceptance|material|archive|print|pdf|fallback/i.test(p)});}
 if(/resolver|objectKey|object_key|PUBLIC_R2|publicAsset|r2\.dev/.test(text)&&/\$\{|\.replace\(|\.join\(|\+.*(?:file|key)/.test(text))dynamicSites.push(p);
 if(p.endsWith('.json')&&!p.startsWith(dir))try{walk(JSON.parse(text.replace(/^\uFEFF/,'')),p)}catch{}
}
for(const {p,text}of sources.filter(s=>runtime(s.p)))for(const[id,keys]of codes)if(text.includes(id))for(const k of keys)byKey.get(k).dynamicReferences.push({path:p,kind:'ASSET_CODE_INDIRECTION',assetCode:id});
// Execute the existing pure Profile resolver, including its deliberate double-dot stored key.
const profile=await import('../functions/profile/personal-evidence-visual-assets.js');
for(const [fn,ids]of [['resolvePersonalEvidenceStaticPage',Object.keys(profile.PERSONAL_EVIDENCE_STATIC_VISUALS)],['resolvePersonalEvidenceSectionMaster',Object.keys(profile.PERSONAL_EVIDENCE_SECTION_MASTERS)],['resolvePersonalEvidenceSharedVisual',Object.keys(profile.PERSONAL_EVIDENCE_SHARED_VISUALS)]])for(const id of ids){const asset=profile[fn](id);const r=byKey.get(asset.objectKey);if(r)r.dynamicReferences.push({path:'functions/profile/personal-evidence-visual-assets.js',kind:'EXECUTED_PURE_RESOLVER',resolver:fn,id});}
for(const r of rows){const exact=r.references.filter(x=>x.kind==='EXACT_KEY'),active=exact.filter(x=>x.runtime),dynamic=r.dynamicReferences;
 if(active.length||dynamic.length){r.classification='已使用';r.reason='当前源码直接或资产代码/纯 resolver 消费；线上与真实客户使用须另证。';}
 else if(exact.some(x=>x.historical)){r.classification='历史/打印/回退保留';r.reason='存在历史、验收、客户材料或打印相关引用，保留依赖尚未排除。';}
 else if(r.registrations.some(x=>x.accepted)){r.classification='已批准但未接入';r.reason='发现具体 ACCEPT 登记，当前消费者尚未证实。';}
 else{r.classification='证据不足';r.reason='未证实当前消费者与完整客户材料保留边界；零引用不代表无人使用。';}
 r.deletionBlockers=['No complete historical customer-material object dependency inventory','No per-object accepted replacement effectiveness proof','No complete runtime access logs'];
}
const report={head:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),bucket:inventory.bucket,observedAt:new Date().toISOString(),inventoryComplete:inventory.complete,totalObjects:rows.length,totalBytes:inventory.totalBytes,scannedTextFiles:sources.length,largeFiles,dynamicSites,limitations:['Basename-only matches are not binding proof','Dynamic code indirection is conservative reachability, not live use','ACCEPT inheritance is registry-level scope; does not grant current product completion','Unsigned customer material and authenticated print/report paths are unverified'],rows};
fs.writeFileSync(dir+'/OBJECT-REVIEW.json',JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({objects:rows.length,textFiles:sources.length,largeFiles:largeFiles.length,dynamicSites:dynamicSites.length,counts:rows.reduce((a,r)=>(a[r.classification]=(a[r.classification]||0)+1,a),{}),releasableBytes:0}));
