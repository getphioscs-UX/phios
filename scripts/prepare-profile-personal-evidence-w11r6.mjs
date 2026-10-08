import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {parseHTML} from 'linkedom';
import {buildProfileCustomerVisualProjection} from '../functions/profile/profile-customer-visual-projection.js';
import {PERSONAL_EVIDENCE_PFIG_PRIMARY_SECTION as primary} from '../functions/profile/personal-evidence-dossier-projection.js';
const dir='content/profile/successors/personal-evidence-r1/w11r6/';
fs.mkdirSync(dir,{recursive:true});
if(fs.existsSync(dir+'baseline.json'))throw Error('W11R6_BASELINE_ALREADY_CAPTURED');
const hash=x=>crypto.createHash('sha256').update(x).digest('hex'),git=(...args)=>execFileSync('git',args,{maxBuffer:64*1024*1024}).toString();
const timestamp=new Date().toISOString(),backup='.phios-repair-backups/w11r6/'+timestamp.replaceAll(':','-')+'/';
const root='tools/review/personal-evidence-r1/',hub='tools/review/PROFILE-PERSONAL-EVIDENCE-R1-HUMAN-REVIEW.html';
const paths=['assets/customer-ui/js/visuals/profile-visual-mvp.js','assets/customer-ui/js/personal-products/personal-evidence-dossier.bundle.js','assets/customer-ui/surfaces/personal-evidence-dossier.css','functions/canonical-presentation-runtime/personal-evidence-dossier-presentation.js','scripts/build-profile-personal-evidence-w11r3.mjs','scripts/check-profile-personal-evidence-w11r5.mjs','package.json','config/reports/zero-cost-check-commands.json',hub,root+'portable-evidence-manifest.json',...fs.readdirSync('tools/review').filter(x=>x.startsWith('PROFILE-PERSONAL-EVIDENCE-W11R3')).map(x=>'tools/review/'+x)];
const cases=[];
for(let i=1;i<=11;i++){
 const id='CASE-'+String(i).padStart(2,'0'),html=fs.readFileSync(root+id+'-bilingual-dossier.html','utf8'),doc=parseHTML(html).document,view=JSON.parse(fs.readFileSync(root+id+'-source-view.json'));
 for(const suffix of ['-bilingual-dossier.html','-bilingual-results.html','-bilingual-trace.json'])paths.push(root+id+suffix);
 const visuals=buildProfileCustomerVisualProjection({progressiveView:view});
 const pages=[...doc.querySelectorAll('.pub-page,.pub-static')];
 cases.push({id,sourceHash:hash(fs.readFileSync(root+id+'-source-view.json')),traceHash:hash(fs.readFileSync(root+id+'-bilingual-trace.json')),pages:pages.length,figures:visuals.figures.map(f=>({figureId:f.pfig,sectionId:primary[f.pfig],status:f.state,title:f.customerLabel,sourceIds:f.evidenceRefs,sourceType:[...new Set((f.data.lanes||f.data.series||[]).map(l=>l.sourceClass))],payloadHash:hash(JSON.stringify(f)),reviewPage:pages.findIndex(p=>p.querySelector('[data-pfig="'+f.pfig+'"]'))+1,unknownReason:f.state==='READY'?null:f.boundaries,renderCount:doc.querySelectorAll('figure[data-pfig="'+f.pfig+'"]').length}))});
}
for(const p of paths){if(!fs.existsSync(p))continue;const target=backup+p;fs.mkdirSync(path.dirname(target),{recursive:true});fs.copyFileSync(p,target);}
const hubText=fs.readFileSync(hub,'utf8'),assets=JSON.parse(hubText.match(/embeddedAssets=(.*?);\s*const displayAssets/s)[1]);
const protectedAssets=Object.entries(assets).map(([url,data])=>({url,sha256:hash(Buffer.from(data.split(',')[1],'base64'))}));
const pdfPath='output/pdf/CASE-01-bilingual-dossier.pdf';
if(!fs.existsSync(pdfPath))throw Error('AUTHORITATIVE_W11R5_PDF_NOT_FOUND');
const manifest={timestamp,head:git('rev-parse','HEAD').trim(),branch:git('branch','--show-current').trim(),toplevel:git('rev-parse','--show-toplevel').trim(),worktreeBefore:git('status','--porcelain=v1'),diffBefore:git('diff','--name-status'),untrackedBefore:git('ls-files','--others','--exclude-standard'),backup,protectedAssets,cases,reviewReference:{path:pdfPath,sha256:hash(fs.readFileSync(pdfPath)),attachmentBytesSupplied:false,comparison:'Located exact W11R5 working-tree review artifact; original 40-page PDF unavailable; no pixel-equivalence claim.'},scopeCandidates:paths.map(p=>({path:p,sha256:hash(fs.readFileSync(p)),diff:git('diff','--',p)}))};
fs.writeFileSync(dir+'baseline.json',JSON.stringify(manifest,null,2));
fs.writeFileSync(dir+'PRD-W11R6-FIGURE-AUTHORITY-MAP.json',JSON.stringify({phase:'BEFORE',caseId:'CASE-01',figures:cases[0].figures.map(f=>({...f,authoritativePayloadOwner:'functions/profile/profile-customer-visual-projection.js',rendererPath:'assets/customer-ui/js/visuals/profile-visual-mvp.js',publicationIrLocation:'functions/profile/personal-evidence-publication-ir-adapter.js:visualBlocks',cprRenderLocation:'functions/canonical-presentation-runtime/personal-evidence-dossier-presentation.js',dataReady:f.status==='READY',visualRendered:f.renderCount===1,interpretationReady:false,humanApproved:false}))},null,2));
console.log('W11R6 reconciled current main; protected hashes and timestamped backups captured.');
