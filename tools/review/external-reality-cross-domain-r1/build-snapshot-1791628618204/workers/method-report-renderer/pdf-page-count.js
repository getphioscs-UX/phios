// Bounded-memory pagination inspection for this service's trusted Chromium PDF
// stream. Compressed object streams and ambiguous/incomplete page trees fail closed.
// This is not a general parser for customer-supplied PDFs.
export async function countChromiumPdfPages(stream){
 const reader=stream.getReader(),decoder=new TextDecoder('latin1'),pages=new Set(),trees=new Map();
 let tail='',size=0,header=false,compressed=false;
 for(;;){
  const {done,value}=await reader.read();if(done)break;
  size+=value.byteLength;if(size>192000000){await reader.cancel();throw Error('PDF_SIZE_LIMIT');}
  const text=tail+decoder.decode(value,{stream:true});
  header ||=text.startsWith('%PDF-');compressed ||= /\/Type\s*\/ObjStm\b/.test(text);
  for(const match of text.matchAll(/(?:^|[\r\n])(\d{1,10})[ \t]+0[ \t]+obj[\r\n \t]*<<([\s\S]{0,32768}?)>>[\r\n \t]*(?:endobj|stream)/g)){
   const body=match[2];
   if(/\/Type\s*\/Page\b/.test(body))pages.add(match[1]);
   if(/\/Type\s*\/Pages\b/.test(body)){
    const count=body.match(/\/Count\s+(\d+)\b/);if(count)trees.set(match[1],Number(count[1]));
   }
  }
  tail=text.slice(-65536);
 }
 const count=Math.max(0,...trees.values());
 if(!header||compressed||!tail.includes('%%EOF')||!count||count!==pages.size)throw Error('PDF_PAGE_TREE_UNVERIFIED');
 return count;
}
