import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import crypto from 'node:crypto';

const stable = value => JSON.stringify(value, null, 2) + '\n';
const sha = value => crypto.createHash('sha256').update(value).digest('hex');
function arg(name) { const i=process.argv.indexOf(name); return i>=0 ? process.argv[i+1] : null; }
function resolveCorpus(root, rel) {
  const candidates=[path.join(root,rel),path.join(root,rel.replace(/^books[\\/]/,''))];
  const found=candidates.find(fs.existsSync); if(!found) throw new Error(`Missing corpus ${rel}`); return found;
}
const corpusDir=path.resolve(arg('--corpus-dir')||process.env.KSAR_PRIVATE_CORPUS_DIR||'');
const decisionsFile=path.resolve(arg('--decisions')||'');
const outDir=path.resolve(arg('--out')||'dist/ksar-reviewed-corpora');
if(!corpusDir||!fs.existsSync(corpusDir)) throw new Error('Provide --corpus-dir.');
if(!decisionsFile||!fs.existsSync(decisionsFile)) throw new Error('Provide --decisions exported from review-index.html.');
const decisions=JSON.parse(fs.readFileSync(decisionsFile,'utf8'));
const decisionBySection=new Map((decisions.records||[]).map(r=>[r.sectionCode,r]));
const sources=[['BOOK-1','books/book-1/materialized/v2/retrieval-corpus.json'],['BOOK-2','books/book-2/materialized/v1/retrieval-corpus.json']];
fs.mkdirSync(outDir,{recursive:true});
let totalApproved=0,totalExcluded=0,totalPending=0;
const manifest=[];
for(const [bookCode,rel] of sources){
  const corpus=JSON.parse(fs.readFileSync(resolveCorpus(corpusDir,rel),'utf8'));
  const records=[];
  for(const record of corpus.records||[]){
    const d=decisionBySection.get(record.sectionCode)||{decision:'PENDING'};
    if(d.sourceDigest && d.sourceDigest!==record.textSha256) throw new Error(`Decision/source digest drift: ${record.sectionCode}`);
    const decision=d.decision||'PENDING';
    if(decision==='APPROVE_TEXT') {
      records.push({...record,reviewStatus:'APPROVED',reviewDisposition:decision,reviewedTextSha256:record.textSha256}); totalApproved++; continue;
    }
    if(['CORRECT_TEXT','APPROVE_WITH_FIGURE_EXCLUSION'].includes(decision)) {
      const reviewed=String(d.reviewedText||'').trim();
      if(!reviewed) throw new Error(`${decision} requires reviewedText: ${record.sectionCode}`);
      records.push({...record,text:reviewed,textSha256:sha(reviewed),reviewStatus:'APPROVED',reviewDisposition:decision,sourceTextSha256:record.textSha256,reviewedTextSha256:sha(reviewed)}); totalApproved++; continue;
    }
    if(['IGNORE_DECORATIVE_TEXT','REEXTRACT','REPLACE_FROM_SOURCE','SOURCE_PDF_FIX_REQUIRED'].includes(decision)) { totalExcluded++; continue; }
    totalPending++;
  }
  const reviewed={
    schemaVersion:'PHI-OS-REVIEWED-MANUSCRIPT-RETRIEVAL-CORPUS-v1.0.0',stage:'KSAR-R4',status:totalPending?'PARTIAL_HUMAN_REVIEW':'HUMAN_REVIEW_COMPLETE',bookCode,locale:corpus.locale,sourceSha256:corpus.sourceSha256,sourceCorpusSha256:corpus.corpusSha256,recordCount:records.length,records
  };
  const text=stable(reviewed); const name=`${bookCode.toLowerCase()}-reviewed-retrieval-corpus.json`; fs.writeFileSync(path.join(outDir,name),text,'utf8'); manifest.push({bookCode,file:name,recordCount:records.length,sha256:sha(text)});
}
fs.writeFileSync(path.join(outDir,'reviewed-corpus-manifest.json'),stable({schemaVersion:'PHI-OS-KSAR-REVIEWED-CORPUS-MANIFEST-v1.0.0',stage:'KSAR-R4',status:totalPending?'PARTIAL_REVIEW_ONLY':'READY_FOR_PRIVATE_R2_UPLOAD',approvedSections:totalApproved,excludedSections:totalExcluded,pendingSections:totalPending,records:manifest}),'utf8');
console.log(`✓ KSAR reviewed corpus built. approved=${totalApproved} excluded=${totalExcluded} pending=${totalPending}`);
