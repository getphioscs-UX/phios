import fs from 'node:fs';
import cp from 'node:child_process';
import crypto from 'node:crypto';
import {resolveSelectedArticle} from '../../../functions/contextual-ask/contextual-ask-runtime.js';
import {manuscriptMetadataRaw} from '../../../functions/knowledge-runtime/current-manuscript-server-metadata.js';
const dir='tools/review/knowledge-answer-quality-r1/';
const hash=b=>crypto.createHash('sha256').update(b).digest('hex');
const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const git=(...args)=>cp.execFileSync('git',args,{encoding:'utf8',maxBuffer:30e6});
fs.mkdirSync(dir,{recursive:true});
if(fs.existsSync(dir+'BASELINE.json'))throw Error('BASELINE_ALREADY_EXISTS');
fs.writeFileSync(dir+'INITIAL-DIFF.patch',git('diff','--binary','HEAD'));
const paths=git('diff','--name-only','HEAD').trim().split('\n').filter(Boolean);
const baseline={at:new Date().toISOString(),head:git('rev-parse','HEAD').trim(),branch:git('branch','--show-current').trim(),status:git('status','--short'),protected:paths.map(path=>({path,sha256:hash(fs.readFileSync(path))}))};
fs.writeFileSync(dir+'BASELINE.json',JSON.stringify(baseline,null,2));
// Cache only public projection reads; no private corpus or credentials.
const cache=new Map();const env={ASSETS:{fetch:async req=>{const p=new URL(req.url).pathname.slice(1);if(!p.startsWith('content/knowledge/public/'))return new Response('',{status:403});if(!cache.has(p))cache.set(p,fs.existsSync(p)?fs.readFileSync(p):null);const b=cache.get(p);return b?new Response(b):new Response('',{status:404});}}};
const manifests=['content/knowledge/public/visual-article-release.json','content/knowledge/public/abl-bilingual-release.json',...['book4','book5','book6'].map(b=>`content/knowledge/public/successors/${b}-publication-v1/visual-article-release.json`)];
const articles=[];const seen=new Set();const rejected=[];
for(const path of manifests){for(const row of read(path).records||[]){const key=row.slug+'|'+row.locale;if(seen.has(key))continue;seen.add(key);const a=await resolveSelectedArticle(env,row.slug,row.locale);if(!a){rejected.push({slug:row.slug,locale:row.locale,manifest:path});continue;}articles.push({...a,manifest:path,manifestRecord:row,bodySha256:row.path&&fs.existsSync(row.path.slice(1))?hash(fs.readFileSync(row.path.slice(1))):null});}}
fs.writeFileSync(dir+'ADMITTED-PUBLIC-CORPUS.json',JSON.stringify({at:baseline.at,owner:'functions/contextual-ask/contextual-ask-runtime.js#resolveSelectedArticle',articles,rejected},null,2));
const active=manuscriptMetadataRaw.ACTIVE_MANUSCRIPT_SOURCE_REGISTRY;
const registry=JSON.parse(manuscriptMetadataRaw[active]);
const inventories=Object.entries(manuscriptMetadataRaw).filter(([p])=>/admission|chapter/.test(p)).map(([path,raw])=>{try{const d=JSON.parse(raw);return {path,status:d.status,chapters:d.chapters?.map(r=>({bookCode:r.bookCode,locale:r.locale,currentAdmission:r.currentAdmission,currentWholeChapterQualified:r.currentWholeChapterQualified,sectionCode:r.sectionCode}))};}catch{return {path};}});
const matrix=[];for(let n=1;n<=8;n++)for(const locale of ['zh-Hans','en']){const bookCode='BOOK-'+n,rows=registry.records.filter(r=>r.bookCode===bookCode&&r.locale===locale),a=articles.filter(a=>a.bookCode===bookCode&&a.locale===locale);matrix.push({bookCode,locale,publicArticlesResolved:a.length,publicParagraphs:a.reduce((s,a)=>s+a.sources.length,0),publicArticleIndex:'VERIFIED_LOCAL_OWNER_RESOLUTION',fullOriginalTextStored:rows.length?'REGISTERED_PRIVATE_STORAGE_NOT_LIVE_VERIFIED':'MISSING_FROM_ACTIVE_MANUSCRIPT_REGISTRY',fullManuscriptIndexed:rows.map(r=>({sourceCode:r.sourceCode,recordCount:r.recordCount,runtimeAdmission:r.runtimeAdmission,currentness:r.currentness,sourceSha256:r.sourceSha256,corpusSha256:r.corpusSha256,retrievalCorpusSha256:r.retrievalCorpusSha256,scopeAdmissionPath:r.scopeAdmissionPath,sourceAcceptancePath:r.sourceAcceptancePath})),qaAdmission:'SOURCE_AND_SCOPE_SPECIFIC_SEE_OWNER_RECORDS_NOT_WHOLE_BOOK',productionReadable:'RUNTIME_UNVERIFIED'});}
fs.writeFileSync(dir+'CORPUS-COVERAGE.json',JSON.stringify({activeRegistry:active,matrix,inventories,manifests},null,2));
const old=read('content/knowledge/knowledge-intelligence-r2/benchmarks/kir-r2-w15r-100-question-answer-benchmark-v2.json');
fs.writeFileSync(dir+'OLD-100-AUDIT.json',JSON.stringify({path:'content/knowledge/knowledge-intelligence-r2/benchmarks/kir-r2-w15r-100-question-answer-benchmark-v2.json',count:old.cases.length,summary:old.summary,expectedBooks:[...new Set(old.cases.map(c=>c.expected?.bookCode))],locales:[...new Set(old.cases.map(c=>c.locale))],sourceInjection:true,limitation:'Historical checker injects expected article authority into each pipeline test; not blind whole-corpus retrieval. Readability and model acceptance have distinct successor receipts. No human judgment inferred from machine metrics.'},null,2));
console.log(JSON.stringify({head:baseline.head,articles:articles.length,paragraphs:articles.reduce((s,a)=>s+a.sources.length,0),rejected:rejected.length,matrix:matrix.map(r=>[r.bookCode,r.locale,r.publicArticlesResolved,r.publicParagraphs])}));
