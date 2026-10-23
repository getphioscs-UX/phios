import fs from 'node:fs';import crypto from 'node:crypto';import {execFileSync} from 'node:child_process';
const root='tools/review/financial-publication-merged',out=root+'/closeout-r32',J=p=>JSON.parse(fs.readFileSync(p)),hash=p=>crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
fs.mkdirSync(out,{recursive:true});
if(fs.existsSync(out+'/baseline.json'))throw Error('Closeout baseline already frozen; do not overwrite');
const walk=p=>fs.readdirSync(p,{withFileTypes:true}).flatMap(e=>e.isDirectory()?walk(p+'/'+e.name):[p+'/'+e.name]);
const sources=[...walk('functions/financial'),...walk('scripts').filter(p=>p.includes('financial-merged')),...walk('content/financial/reports'),...walk('tests/financial-preparation')];
const nav=J(root+'/correction-r3/pdf-navigation.json');const saved=[root+'/MASTER-HUMAN-REVIEW.html',root+'/build-state.json',root+'/pdf-verification.json',root+'/EXECUTION-STATE.md',root+'/page-map.json',root+'/correction-r3/test-results.json',...sources];
for(const p of saved){const dest=out+'/baseline/'+p;fs.mkdirSync(dest.slice(0,dest.lastIndexOf('/')),{recursive:true});fs.copyFileSync(p,dest);}
const git=args=>execFileSync('git',args,{encoding:'utf8'});fs.writeFileSync(out+'/baseline.diff',git(['diff','--binary']));fs.writeFileSync(out+'/baseline-index.diff',git(['diff','--cached','--binary']));
fs.writeFileSync(out+'/baseline.json',JSON.stringify({changeClass:'acceptance-fix/accessibility-fix',scope:'Existing renderer only; no financial engine/source/commerce changes',head:git(['rev-parse','HEAD']).trim(),status:git(['status','--short']),index:git(['diff','--cached','--name-status']),sources:sources.map(path=>({path,sha256:hash(path)})),pdfs:nav.results.map(p=>({...p,sha256:hash(p.path)})),missingSecondAudit:true,providerCalls:0},null,2));
console.log('Frozen exact source/diff and five PDF witnesses');
