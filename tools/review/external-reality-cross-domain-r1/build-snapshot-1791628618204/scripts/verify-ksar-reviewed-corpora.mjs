import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import crypto from 'node:crypto';

const ROOT=process.cwd();
const sourceRegistry=JSON.parse(fs.readFileSync(path.join(ROOT,'content/knowledge/source-access/registries/manuscript-knowledge-source-registry-v1.json'),'utf8'));
const reviewedRegistry=JSON.parse(fs.readFileSync(path.join(ROOT,'content/knowledge/source-access/registries/manuscript-reviewed-corpus-registry-v1.json'),'utf8'));
const corpusDir=path.resolve(process.argv[2]||process.env.KSAR_PRIVATE_REVIEWED_CORPUS_DIR||'');
if(!corpusDir||!fs.existsSync(corpusDir)) throw new Error('Usage: node scripts/verify-ksar-reviewed-corpora.mjs <private-reviewed-corpus-dir>');
const sha=file=>crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
function resolveObject(key){return [path.join(corpusDir,key),path.join(corpusDir,key.replace(/^books[\\/]/,''))].find(fs.existsSync);}
let total=0;
for(const reviewed of reviewedRegistry.records){
  const source=sourceRegistry.records.find(row=>row.sourceCode===reviewed.sourceCode);
  if(!source) throw new Error(`Missing source ${reviewed.sourceCode}`);
  const file=resolveObject(reviewed.r2ObjectKey); if(!file) throw new Error(`Missing ${reviewed.r2ObjectKey}`);
  const actual=sha(file); if(actual!==reviewed.retrievalCorpusSha256) throw new Error(`Reviewed file hash mismatch ${reviewed.sourceCode}: ${actual}`);
  const corpus=JSON.parse(fs.readFileSync(file,'utf8'));
  if(corpus.status!=='HUMAN_REVIEW_COMPLETE_PROMOTED'||corpus.bookCode!==reviewed.bookCode||corpus.locale!==reviewed.locale) throw new Error(`Reviewed corpus status/identity mismatch ${reviewed.sourceCode}`);
  if(corpus.sourceSha256!==source.sourceSha256||corpus.corpusSha256!==source.corpusSha256||Number(corpus.recordCount)!==Number(reviewed.recordCount)) throw new Error(`Reviewed corpus lineage mismatch ${reviewed.sourceCode}`);
  if(!corpus.records.every(r=>r.reviewStatus==='HUMAN_APPROVED_FINAL'&&typeof r.text==='string'&&r.textSha256===crypto.createHash('sha256').update(r.text).digest('hex'))) throw new Error(`Reviewed record integrity mismatch ${reviewed.sourceCode}`);
  total+=corpus.records.length;
  console.log(`✓ ${reviewed.sourceCode} ${reviewed.r2ObjectKey} ${actual}`);
}
if(total!==448) throw new Error(`Expected 448 promoted records, got ${total}`);
console.log('✓ KSAR-R4 final reviewed corpora match public promotion registry; 448/448 human review is closed.');
