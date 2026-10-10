import fs from 'node:fs';
import {createHash} from 'node:crypto';
import {currentDedupReport} from './build-b14-sks-dedup.mjs';
export const base='content/knowledge/structured/loading/';
export function loadingFiles(){
 currentDedupReport(); // Validate the registered source chain before projecting.
 const read=p=>JSON.parse(fs.readFileSync(p));
 const discovery=read('content/knowledge/structured/structured-knowledge-registry-v1.json');
 const backlinks=read('content/knowledge/structured/structured-knowledge-backlinks-v1.json');
 const files={},manifest={version:'1.0.0',books:{},canonicalAuthority:false};
 for(let n=1;n<=4;n++){
  const bookCode=`BOOK-${n}`,entries=discovery.objects.filter(o=>o.bookCode===bookCode),registry=read(entries[0].registryPath);
  const rows=registry.objects||registry.patterns||registry.entries,book={bookCode,families:{},objects:{}};
  for(const object of rows){
   const family=object.family||object.runtimeLevel||object.objectType;
   const detail=registry.details?.[object.objectId]||null;
   const record={bookCode,family,object,detail,backlink:backlinks.backlinks.find(b=>b.objectId===object.objectId)};
   const body=JSON.stringify(record,null,2)+'\n',hash=createHash('sha256').update(body).digest('hex');
   const filename=`objects/${object.objectId}-${hash.slice(0,16)}.json`;
   files[filename]=body;
   const item={objectId:object.objectId,title:object.title,titleEn:object.titleEn||detail?.titleEn||null,family,path:'/'+base+filename};
   book.objects[object.objectId]={family,title:object.title,titleEn:item.titleEn};
   (book.families[family]??={items:[]}).items.push(item);
  }
  for(const [family,value] of Object.entries(book.families)){
   const body=JSON.stringify({bookCode,family,...value},null,2)+'\n';const hash=createHash('sha256').update(body).digest('hex');
   const name=`families/${bookCode}-${family}-${hash.slice(0,16)}.json`;files[name]=body;book.families[family]={path:'/'+base+name,count:value.items.length};
  }
  const body=JSON.stringify(book,null,2)+'\n';const hash=createHash('sha256').update(body).digest('hex');const name=`books/${bookCode}-${hash.slice(0,16)}.json`;
  files[name]=body;manifest.books[bookCode]={path:'/'+base+name};
 }
 files['manifest-v1.json']=JSON.stringify(manifest,null,2)+'\n';return files;
}
if(process.argv[1]?.replaceAll('\\','/').endsWith('/build-b14-sks-loading.mjs'))for(const [name,body] of Object.entries(loadingFiles())){fs.mkdirSync(base+name.slice(0,name.lastIndexOf('/')+1),{recursive:true});fs.writeFileSync(base+name,body);}
