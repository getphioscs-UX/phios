import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import crypto from 'node:crypto';

const ROOT=process.cwd();
const registry=JSON.parse(fs.readFileSync(path.join(ROOT,'content/knowledge/source-access/registries/manuscript-knowledge-source-registry-v1.json'),'utf8'));
const corpusDir=path.resolve(process.argv[2]||process.env.KSAR_PRIVATE_CORPUS_DIR||'');
if(!corpusDir||!fs.existsSync(corpusDir)) throw new Error('Usage: node scripts/verify-ksar-r2-corpora.mjs <private-corpus-dir>');
const sha=file=>crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
function resolveObject(key){const candidates=[path.join(corpusDir,key),path.join(corpusDir,key.replace(/^books[\\/]/,''))];return candidates.find(fs.existsSync);}
for(const source of registry.records){
  const file=resolveObject(source.r2ObjectKey); if(!file) throw new Error(`Missing ${source.r2ObjectKey}`);
  const actual=sha(file); if(actual!==source.retrievalCorpusSha256) throw new Error(`File hash mismatch ${source.sourceCode}: expected ${source.retrievalCorpusSha256}, actual ${actual}`);
  const corpus=JSON.parse(fs.readFileSync(file,'utf8'));
  if(corpus.bookCode!==source.bookCode||corpus.locale!==source.locale||corpus.sourceSha256!==source.sourceSha256||corpus.corpusSha256!==source.corpusSha256||Number(corpus.recordCount)!==Number(source.recordCount)) throw new Error(`Corpus identity mismatch ${source.sourceCode}`);
  console.log(`✓ ${source.sourceCode} ${source.r2ObjectKey} ${actual}`);
}
console.log('✓ KSAR private retrieval corpora match the public source registry.');
