import assert from 'node:assert/strict';
import fs from 'node:fs';

const samples=JSON.parse(fs.readFileSync('content/web-production/registries/book-public-samples-v1.json','utf8'));
const book=samples.books.find(b=>b.bookId==='book-6');
assert.ok(book,'Book VI preview record missing');
assert.equal(book.previewPages.length,50);

const results=[];
for(const [index,url] of book.previewPages.entries()){
  try{
    const response=await fetch(url,{method:'HEAD',redirect:'follow'});
    results.push({page:index+1,url,status:response.status,type:(response.headers.get('content-type')||'').toLowerCase()});
  }catch(error){
    results.push({page:index+1,url,status:0,type:'',error:String(error)});
  }
}
const missing=results.filter(x=>x.status!==200);
const wrongType=results.filter(x=>x.status===200&&!/image\/webp|application\/octet-stream/.test(x.type));
if(missing.length) console.error('BOOK6_PREVIEW_MISSING\n'+missing.map(x=>`${x.page}\t${x.status}\t${x.url}`).join('\n'));
if(wrongType.length) console.error('BOOK6_PREVIEW_WRONG_TYPE\n'+wrongType.map(x=>`${x.page}\t${x.type}\t${x.url}`).join('\n'));
assert.equal(missing.length,0,`Book VI preview pages missing: ${missing.length}/50`);
assert.equal(wrongType.length,0,`Book VI preview pages wrong content type: ${wrongType.length}`);
console.log('Book VI live preview PASS: 50/50 public WebP pages reachable.');
