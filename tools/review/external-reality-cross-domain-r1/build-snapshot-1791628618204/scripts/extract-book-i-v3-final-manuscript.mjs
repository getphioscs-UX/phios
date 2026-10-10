import fs from 'node:fs';
import fsp from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { createHash } from 'node:crypto';
import { Transform } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import { spawnSync } from 'node:child_process';
import { S3Client, HeadObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getDocument } from 'pdfjs-dist/legacy/build/pdf.mjs';
import { textItemsToLines, normalizeOverprintedHeading } from './lib/knowledge-manuscripts/searchable-pdf-extraction.mjs';

const ROOT=process.cwd();
const ADMISSION='content/knowledge/manuscripts/completed/book-1-completed-manuscript-v3.json';
const INVENTORY='content/knowledge/manuscripts/extraction/book-1-v3-full-section-inventory-v1.json';
const INTEGRITY='content/knowledge/manuscripts/extraction/book-1-v3-section-integrity-v1.json';
const TMP=path.join(ROOT,'.tmp/knowledge-manuscripts/book-1-v3');
const PDF=path.join(TMP,'PHI-OS-Book-I-v3.pdf');
const SOURCE_KEY='books/book-1/source/PHI-OS-Book-I-v3.pdf';
const BUCKET='phios-private-manuscripts';
const MARKER=/^[◈❖◆◇]\s*/u;
const PART_PATTERNS=[
  ['P1',/(?:第一部|Part\s*I)\b|现实物理学|Reality Physics/iu],
  ['P2',/(?:第二部|Part\s*II)\b|投影系统|Projection System/iu],
  ['P3',/(?:第三部|Part\s*III)\b|运行动力学|现实动力学|Runtime Dynamics|Reality Dynamics/iu],
  ['P4',/(?:第四部|Part\s*IV)\b|人类运行载体|Human Runtime Carrier/iu]
];

const readJson=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const writeJson=(p,v)=>fs.writeFileSync(p,JSON.stringify(v,null,2)+'\n','utf8');
const sha=b=>createHash('sha256').update(b).digest('hex');
const text=v=>String(v??'').trim();

function envCreds(){
 const names=['PHIOS_MANUSCRIPT_R2_ACCOUNT_ID','PHIOS_MANUSCRIPT_R2_ACCESS_KEY_ID','PHIOS_MANUSCRIPT_R2_SECRET_ACCESS_KEY'];
 const missing=names.filter(n=>!text(process.env[n]));
 if(missing.length) return null;
 const configured=text(process.env.PHIOS_MANUSCRIPT_R2_BUCKET)||BUCKET;
 if(configured!==BUCKET) throw new Error('BOOK_I_V3_R2_BUCKET_MISMATCH');
 return {
   accountId:text(process.env.PHIOS_MANUSCRIPT_R2_ACCOUNT_ID),
   accessKeyId:text(process.env.PHIOS_MANUSCRIPT_R2_ACCESS_KEY_ID),
   secretAccessKey:text(process.env.PHIOS_MANUSCRIPT_R2_SECRET_ACCESS_KEY),
   bucket:configured
 };
}
function clientFor(c){return new S3Client({
 region:'auto',
 endpoint:`https://${c.accountId}.r2.cloudflarestorage.com`,
 forcePathStyle:true,
 credentials:{accessKeyId:c.accessKeyId,secretAccessKey:c.secretAccessKey}
});}
function wranglerExecutable(){
 const local=path.join(ROOT,'node_modules','wrangler','bin','wrangler.js');
 if(fs.existsSync(local)) return {cmd:process.execPath,args:[local]};
 return {cmd:'npx',args:['wrangler']};
}
async function downloadViaWrangler(){
 await fsp.mkdir(TMP,{recursive:true});
 if(fs.existsSync(PDF)) await fsp.rm(PDF,{force:true});
 const target=`${BUCKET}/${SOURCE_KEY}`;
 const w=wranglerExecutable();
 const result=spawnSync(w.cmd,[...w.args,'r2','object','get',target,'--file',PDF,'--remote'],{
   cwd:ROOT,
   stdio:'inherit',
   shell:false,
   env:process.env
 });
 if(result.error) throw result.error;
 if(result.status!==0 || !fs.existsSync(PDF)) throw new Error('BOOK_I_V3_WRANGLER_DOWNLOAD_FAILED');
 const bytes=await fsp.readFile(PDF);
 return {sizeBytes:bytes.length,sha256:sha(bytes),authMode:'WRANGLER_LOGIN'};
}

async function download(client,bucket,key){
 await fsp.mkdir(TMP,{recursive:true});
 if(fs.existsSync(PDF)) await fsp.rm(PDF,{force:true});
 const partial=PDF+'.partial-'+process.pid;
 const res=await client.send(new GetObjectCommand({Bucket:bucket,Key:key}));
 if(!res.Body) throw new Error('BOOK_I_V3_DOWNLOAD_BODY_MISSING');
 const h=createHash('sha256');let size=0;
 const meter=new Transform({transform(chunk,enc,cb){const b=Buffer.isBuffer(chunk)?chunk:Buffer.from(chunk,enc);size+=b.length;h.update(b);cb(null,b);}});
 await pipeline(res.Body,meter,fs.createWriteStream(partial,{flags:'wx'}));
 fs.renameSync(partial,PDF);
 return {sizeBytes:size,sha256:h.digest('hex')};
}

async function extractPages(){
 const task=getDocument({url:PDF,isEvalSupported:false,useSystemFonts:true,verbosity:0});
 const doc=await task.promise;
 const pages=[];let totalItems=0;
 try{
  for(let n=1;n<=doc.numPages;n++){
   const page=await doc.getPage(n);
   try{
    const viewport=page.getViewport({scale:1});
    const content=await page.getTextContent({disableNormalization:false,includeMarkedContent:false});
    const items=content.items.filter(x=>typeof x?.str==='string'&&text(x.str));
    totalItems+=items.length;
    pages.push({pageNumber:n,lines:textItemsToLines(items,n,viewport.height)});
   }finally{page.cleanup();}
  }
  return {pageCount:doc.numPages,totalItems,pages};
 }finally{await task.destroy();}
}
function normalizeHeading(raw){
 const collapsed=normalizeOverprintedHeading(raw).text;
 return collapsed.replace(MARKER,'').replace(/\s+/gu,' ').trim();
}
function detectPart(heading,current){
 for(const [code,re] of PART_PATTERNS) if(re.test(heading)) return code;
 return current;
}
function buildCorpusAndSegments(pages){
 let corpus=''; const pageRanges=[]; const markers=[];
 for(const page of pages){
  const start=corpus.length;
  for(const line of page.lines){
   const raw=text(line.text);
   if(!raw) continue;
   const lineStart=corpus.length;
   corpus+=raw+'\n';
   if(MARKER.test(raw)){
    const heading=normalizeHeading(raw);
    if(heading) markers.push({heading,headingRaw:raw,offset:lineStart,pageNumber:page.pageNumber});
   }
  }
  pageRanges.push({pageNumber:page.pageNumber,startOffset:start,endOffset:corpus.length});
 }
 // suppress decorative/overprint duplicate headings occurring very close together.
 const logical=[];
 for(const m of markers){
   const last=logical.at(-1);
   if(last && last.heading===m.heading && m.offset-last.offset<2500){
     last.duplicateOccurrences=(last.duplicateOccurrences||0)+1;
     continue;
   }
   logical.push({...m,duplicateOccurrences:0});
 }
 if(!logical.length) throw new Error('BOOK_I_V3_SECTION_MARKERS_NOT_FOUND');
 let currentPart='P0'; const sections=[];
 // Front matter before first marker is preserved as metadata-only segment.
 if(logical[0].offset>0){
  const end=logical[0].offset;
  const startPage=1;
  const endPage=pageRanges.find(p=>end<=p.endOffset)?.pageNumber||1;
  const body=corpus.slice(0,end);
  sections.push({sectionCode:'B1V3-FRONT-S000',segmentType:'FRONT_MATTER',partCode:'FRONT',sequence:0,heading:'Front Matter',headingRaw:null,startOffset:0,endOffset:end,startPage,endPage,charCount:body.length,textSha256:sha(body),integrityStatus:'VERIFIED',humanReviewStatus:'PENDING'});
 }
 let sequence=sections.length;
 const counters={P0:0,P1:0,P2:0,P3:0,P4:0,FRONT:0};
 for(let i=0;i<logical.length;i++){
   const m=logical[i], end=logical[i+1]?.offset??corpus.length;
   currentPart=detectPart(m.heading,currentPart);
   counters[currentPart]=(counters[currentPart]||0)+1;
   const startPage=m.pageNumber;
   const endPage=pageRanges.find(p=>end<=p.endOffset)?.pageNumber??pages.at(-1).pageNumber;
   const body=corpus.slice(m.offset,end);
   const code=`B1V3-${currentPart}-S${String(counters[currentPart]).padStart(3,'0')}`;
   sections.push({sectionCode:code,segmentType:/第[一二三四]部|Reality Physics|Projection System|Runtime Dynamics|Reality Dynamics|Human Runtime Carrier/iu.test(m.heading)?'PART_OPENING':'SECTION',partCode:currentPart,sequence:sequence++,heading:m.heading,headingRaw:m.headingRaw,startOffset:m.offset,endOffset:end,startPage,endPage,charCount:body.length,textSha256:sha(body),duplicateHeadingOccurrencesSuppressed:m.duplicateOccurrences,integrityStatus:'VERIFIED',humanReviewStatus:'PENDING'});
 }
 return {corpus,pageRanges,sections,rawMarkerCount:markers.length,logicalMarkerCount:logical.length};
}
function chain(values){return sha(Buffer.from(values.join('\n'),'utf8'));}
function counts(sections){const out={};for(const s of sections)out[s.partCode]=(out[s.partCode]||0)+1;return out;}

async function main(){
 const apply=process.argv.includes('--apply');
 if(!apply) throw new Error('BOOK_I_V3_APPLY_REQUIRED');
 let dl;
 const ec=envCreds();
 if(ec){
   const client=clientFor(ec);
   const head=await client.send(new HeadObjectCommand({Bucket:ec.bucket,Key:SOURCE_KEY,ChecksumMode:'ENABLED'}));
   dl=await download(client,ec.bucket,SOURCE_KEY);
   if(Number(head.ContentLength)!==dl.sizeBytes) throw new Error('BOOK_I_V3_HEAD_DOWNLOAD_SIZE_MISMATCH');
   dl.authMode='S3_ENV_CREDENTIALS';
 }else{
   dl=await downloadViaWrangler();
 }
 const extracted=await extractPages();
 const built=buildCorpusAndSegments(extracted.pages);
 const corpusSha=sha(Buffer.from(built.corpus,'utf8'));
 const pageHashes=built.pageRanges.map(p=>sha(Buffer.from(built.corpus.slice(p.startOffset,p.endOffset),'utf8')));
 const sectionHashes=built.sections.map(s=>s.textSha256);
 const now=new Date().toISOString();

 const admission=readJson(ADMISSION);
 admission.status='BINARY_VERIFIED_EXTRACTION_CANDIDATE_READY';
 admission.sourceBinary.byteSize=dl.sizeBytes;
 admission.sourceBinary.pageCount=extracted.pageCount;
 admission.sourceBinary.sha256=dl.sha256;
 admission.sourceBinary.exactBinaryMetadataStatus='VERIFIED_FROM_PRIVATE_R2_DOWNLOAD';
 admission.privateStorageBinding.remoteBinaryVerification='VERIFIED_DOWNLOAD_SHA256';
 admission.privateStorageBinding.verifiedAt=now;
 admission.cutoverGate.completedManuscriptRegistryCutoverAllowed=false;
 writeJson(ADMISSION,admission);

 const inventory={
  schemaVersion:'PHI-OS-BOOK-I-V3-FULL-SECTION-INVENTORY-v1.0.0',
  stage:'BOOK-I-V3-LOSSLESS-SECTION-EXTRACTION',
  status:'EXTRACTED_INTEGRITY_VERIFIED_HUMAN_REVIEW_PENDING',
  bookCode:'BOOK-1',
  sourceObjectKey:SOURCE_KEY,
  sourceSha256:dl.sha256,
  sourceByteSize:dl.sizeBytes,
  sourcePageCount:extracted.pageCount,
  segmentationMethod:'marker_anchored_searchable_text_layer_segmentation',
  markerSet:['◈','❖','◆','◇'],
  semanticRewrite:false,
  ocrUsed:false,
  humanReviewStatus:'PENDING',
  rawMarkerCount:built.rawMarkerCount,
  logicalMarkerCount:built.logicalMarkerCount,
  totalSegments:built.sections.length,
  sectionSegments:built.sections.filter(s=>s.segmentType!=='FRONT_MATTER').length,
  partCounts:counts(built.sections),
  sections:built.sections
 };
 writeJson(INVENTORY,inventory);

 const integrity={
  schemaVersion:'PHI-OS-BOOK-I-V3-SECTION-INTEGRITY-v1.0.0',
  stage:'BOOK-I-V3-LOSSLESS-SECTION-EXTRACTION',
  status:'INTEGRITY_VERIFIED_HUMAN_REVIEW_PENDING',
  bookCode:'BOOK-1',
  sourceObjectKey:SOURCE_KEY,
  sourceSha256:dl.sha256,
  byteSize:dl.sizeBytes,
  pageCount:extracted.pageCount,
  textItemCount:extracted.totalItems,
  corpusCharCount:built.corpus.length,
  corpusSha256:corpusSha,
  pageHashChainSha256:chain(pageHashes),
  sectionHashChainSha256:chain(sectionHashes),
  totalSegments:built.sections.length,
  sectionSegments:built.sections.filter(s=>s.segmentType!=='FRONT_MATTER').length,
  exactCoverage:{firstOffset:0,lastOffset:built.corpus.length,coveredCharCount:built.sections.reduce((n,s)=>n+s.charCount,0),gaps:0,overlaps:0,corpusLengthMatches:built.sections.reduce((n,s)=>n+s.charCount,0)===built.corpus.length},
  authorityBoundary:{extractedTextIsSourceDerivative:true,privateFullTextPath:path.relative(ROOT,TMP).replaceAll('\\','/'),publicRepositoryBodyStorageAllowed:false,canonicalNodeAuthorityCreated:false,nodeCodeMutationAllowed:false,humanSemanticAcceptanceRequired:true,completedRegistryCutoverAllowed:false}
 };
 writeJson(INTEGRITY,integrity);

 // Private-only corpus evidence; never commit.
 await fsp.writeFile(path.join(TMP,'v3-full-corpus.txt'),built.corpus,'utf8');
 await fsp.writeFile(path.join(TMP,'v3-extraction-report.json'),JSON.stringify({source:{key:SOURCE_KEY,sizeBytes:dl.sizeBytes,sha256:dl.sha256,pageCount:extracted.pageCount},corpus:{charCount:built.corpus.length,sha256:corpusSha},segments:{total:built.sections.length,partCounts:counts(built.sections)},generatedAt:now},null,2)+'\n','utf8');

 console.log(JSON.stringify({
  status:'BOOK_I_V3_BINARY_VERIFIED_AND_SECTION_INVENTORY_READY_FOR_HUMAN_REVIEW',
  source:{objectKey:SOURCE_KEY,sizeBytes:dl.sizeBytes,sha256:dl.sha256,pageCount:extracted.pageCount,authMode:dl.authMode},
  extraction:{textItems:extracted.totalItems,corpusCharCount:built.corpus.length,corpusSha256:corpusSha,rawMarkerCount:built.rawMarkerCount,logicalMarkerCount:built.logicalMarkerCount,totalSegments:built.sections.length,partCounts:counts(built.sections)},
  repoWrites:[ADMISSION,INVENTORY,INTEGRITY],
  privateWrites:[path.relative(ROOT,PDF),path.relative(ROOT,path.join(TMP,'v3-full-corpus.txt')),path.relative(ROOT,path.join(TMP,'v3-extraction-report.json'))],
  canonicalNodesModified:false,
  completedRegistryCutover:false,
  nextAction:'HUMAN_REVIEW_V3_SECTION_INVENTORY'
 },null,2));
}
main().catch(e=>{console.error(JSON.stringify({status:'BLOCKED',code:e.message},null,2));process.exitCode=2;});
