import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import sharp from 'sharp';
const base='https://pub-1967bc5812ee4164b19a806fb1427021.r2.dev';
const shared=['BODY','SECTION-STYLE','SEC-01-NATAL-ARCHITECTURE','SEC-02-PATTERN-RESOURCES','SEC-03-SELF-EXPRESSION','SEC-04-RELATIONSHIPS','SEC-05-CAREER','SEC-06-RESOURCES-VALUES','SEC-07-TIMING-CHANGE','SEC-08-REALITY-COMPARISON','SEC-09-OPPORTUNITY-NAVIGATION','SEC-10-EVIDENCE-BOUNDARY'];
const editorial=['P01-COVER','P02-METHOD-INTRO','P03-ORIGIN','P04-PHIOS-LENS','P05-HOW-TO-READ'];
const specs=[...shared.map(n=>({assetId:'VIS-REPORT-ASTROLOGY-'+n,key:`images/reports/astrology/editorial/shared/VIS-REPORT-ASTROLOGY-${n}.webp`,assetRole:n.startsWith('SEC-')?'SECTION_MASTER':n,sectionId:n.startsWith('SEC-')?n.slice(0,6):null})),...editorial.map(n=>({assetId:`RPT-ASTROLOGY-${n}-v1`,key:`images/reports/astrology/editorial/zh-Hans/RPT-ASTROLOGY-${n}-v1.webp`,assetRole:'EDITORIAL_FULL_PAGE',pageRole:n.slice(4)})),...[1,2].map(n=>({assetId:`VIS-REPORT-ASTROLOGY-MOTIF-${n}`,local:`assets/images/report/VIS-REPORT-ASTROLOGY-MOTIF-${n}.svg`,assetRole:'MOTIF'}))];
const assets=[];
for(const s of specs){
 const file=s.local||'assets/ast-vfr-r1/'+s.key;
 if(!fs.existsSync(file)){const r=await fetch(base+'/'+s.key);if(!r.ok)throw Error(`ASSET_FETCH_FAILED:${s.assetId}:${r.status}`);fs.mkdirSync(path.dirname(file),{recursive:true});fs.writeFileSync(file,Buffer.from(await r.arrayBuffer()));}
 const bytes=fs.readFileSync(file),m=await sharp(bytes).metadata();
 assets.push({...s,path:file,fileType:m.format,width:m.width,height:m.height,aspectRatio:m.width/m.height,languageScope:s.assetRole==='EDITORIAL_FULL_PAGE'?'zh-Hans':'shared',pageRole:s.pageRole||s.assetRole,printEligible:true,mobileEligible:true,sourceDigest:crypto.createHash('sha256').update(bytes).digest('hex'),required:s.assetRole!=='MOTIF',fallbackPolicy:'FAIL_CLOSED',sourceUrl:s.key?base+'/'+s.key:null,currentUsages:['AST-VFR-R1_LOCAL_PUBLICATION_BUNDLE']});
}
fs.writeFileSync('content/professional/ast-full-production/publication/ast-vfr-r1-visual-asset-registry.json',JSON.stringify({schemaVersion:'PHI-OS-AST-VFR-R1-VISUAL-ASSET-REGISTRY-v1.0.0',runtimeRemoteFetch:false,assets},null,2)+'\n');
console.log('AST assets:',assets.length);
