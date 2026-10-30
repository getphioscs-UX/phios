import fs from'node:fs';import{createHash}from'node:crypto';import{execFileSync}from'node:child_process';
const D='tools/review/hd-r6/import-20261027/r611a/',P=D+'../r611/',read=p=>JSON.parse(fs.readFileSync(p,'utf8').replace(/^\uFEFF/,''));
const memo=new Map();async function hash(p){if(!fs.existsSync(p))return null;if(!memo.has(p)){const h=createHash('sha256');for await(const b of fs.createReadStream(p))h.update(b);memo.set(p,h.digest('hex'));}return memo.get(p)}
const original=read(P+'CANDIDATE-SOURCE-MANIFEST.json'),preservation={HEAD:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),currentR611Sources:[],acceptedR610Sources:[],previousPDFs:[]};
for(const [source,dest]of [[original.files,preservation.currentR611Sources],[original.inheritedR610,preservation.acceptedR610Sources],[read(P+'PDF-MANIFEST.json').files,preservation.previousPDFs]])for(const a of source){const current=await hash(a.path);dest.push({path:a.path,priorSHA256:a.sha256,currentSHA256:current,unchanged:current===a.sha256});}
const old=read(P+'SIX-METHOD-SEVEN-GATES.json'),rows=[];
for(const oldRow of old.rows){const r=structuredClone(oldRow);r.inheritedStatus=r.status;r.observedAt=new Date().toISOString();r.currentReceiptCheck=[];
 for(const ref of r.ownerReceipts||[]){const current=await hash(ref.path);r.currentReceiptCheck.push({path:ref.path,inheritedSHA256:ref.sha256,currentSHA256:current,unchanged:current===ref.sha256});}
 if(r.currentReceiptCheck.some(x=>!x.unchanged)){r.status='PARTIAL';r.blocker='Current owner receipt bytes changed; exact successor acceptance requires review. Original accepted scope is preserved.';}
 if(r.method==='HD'&&r.gate==='DYNAMIC_PDF'){
  r.status='BLOCKED';r.acceptedScope+=' R611A newest-asset rendering not performed: authorized object list HTTP401, object reads401/429. Historical R611 layout evidence is preserved, not current-asset acceptance.';
  r.blocker='R611A_CURRENT_15_ASSET_BYTES_UNAVAILABLE';r.nextAction='Acquire current authorized exact bytes, decode and visually verify language/role, render through existing native owner, inspect new PDFs and verify delivery/TOC.';
 }
 rows.push(r);
}
fs.writeFileSync(D+'PRESERVATION-AND-SOURCE-IDENTITY.json',JSON.stringify(preservation,null,2));
fs.writeFileSync(D+'SIX-METHOD-SEVEN-GATES.json',JSON.stringify({at:new Date().toISOString(),inheritedFrom:P+'SIX-METHOD-SEVEN-GATES.json',inheritedSHA256:await hash(P+'SIX-METHOD-SEVEN-GATES.json'),scope:'Same independent six-method/seven-gate evidence owner; no new admission registry or authority.',rows,productionAdmitted:false},null,2));
console.log(JSON.stringify({R611:preservation.currentR611Sources.filter(x=>x.unchanged).length+'/'+preservation.currentR611Sources.length,R610:preservation.acceptedR610Sources.filter(x=>x.unchanged).length+'/'+preservation.acceptedR610Sources.length,previousPDFs:preservation.previousPDFs.filter(x=>x.unchanged).length,independentGateRows:rows.length,changedReceipts:rows.flatMap(r=>r.currentReceiptCheck.filter(x=>!x.unchanged).map(x=>x.path)).filter((x,i,a)=>a.indexOf(x)===i)}));
