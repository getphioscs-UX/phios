import fs from 'node:fs';
import crypto from 'node:crypto';
import {loadBookViiPublishedAdmission,appendBookViiProjection,BOOK_VII_ADMISSION_PATH} from '../../../functions/_lib/book-vii-published-admission.js';
export async function writeBookViiCurrentProjection(){
 const release=await loadBookViiPublishedAdmission(async p=>JSON.parse(fs.readFileSync(p,'utf8')));
 if(!release)throw Error('BOOK_VII_ADMISSION_NOT_VALID');
 const directory='content/knowledge/public/successors/book-vii-production-live-cutover-r1/retrieval';fs.mkdirSync(directory,{recursive:true});
 const artifacts=[];
 for(const name of Object.keys(release.projections)){
  const base=JSON.parse(fs.readFileSync(`content/knowledge/public/retrieval/${name}.json`,'utf8'));
  const current=await appendBookViiProjection(base,name,release);
  const path=`${directory}/${name}.json`,bytes=JSON.stringify(current,null,2)+'\n';fs.writeFileSync(path,bytes);
  artifacts.push({name,path,sha256:crypto.createHash('sha256').update(bytes).digest('hex'),recordCount:current.recordCount});
 }
 const manifest={owner:'knowledge:public:build',releasePath:BOOK_VII_ADMISSION_PATH,canonicalBookViiIdentities:100,bookViiKnowledgeNodes:release.publishedKnowledgeNodeCount,predecessorIndex:'content/knowledge/public/retrieval/published-retrieval-index.json',artifacts};
 manifest.indexDigest=crypto.createHash('sha256').update(JSON.stringify(artifacts)).digest('hex');
 fs.writeFileSync(`${directory}/published-retrieval-index.json`,JSON.stringify(manifest,null,2)+'\n');
 console.log('Book VII versioned current public projection built by existing owner; historical retrieval files preserved.');
 return manifest;
}
