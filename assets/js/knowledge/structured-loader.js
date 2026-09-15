const BASE='/content/knowledge/structured/loading/';
export function createStructuredLoader(fetcher=globalThis.fetch){
 const cache=new Map();
 async function read(path){
  if(!path.startsWith(BASE)||path.includes('..'))throw new Error('INVALID_STRUCTURED_PATH');
  if(!cache.has(path)){
   const task=(async()=>{const controller=new AbortController();const timer=setTimeout(()=>controller.abort(),12000);try{const r=await fetcher(path,{signal:controller.signal});if(!r.ok)throw new Error('STRUCTURED_UNAVAILABLE');return await r.json();}finally{clearTimeout(timer);}})();
   cache.set(path,task);task.catch(()=>cache.delete(path));
  }
  return cache.get(path);
 }
 async function book(code){const manifest=await read(BASE+'manifest-v1.json');if(!manifest.books[code])throw new Error('UNKNOWN_BOOK');return read(manifest.books[code].path);}
 async function family(code,id){const b=await book(code);if(!b.families[id])throw new Error('UNKNOWN_FAMILY');const result=await read(b.families[id].path);if(result.bookCode!==code||result.family!==id)throw new Error('FAMILY_SCOPE_MISMATCH');return result;}
 async function object(code,id){const b=await book(code);if(!b.objects[id])throw new Error('UNKNOWN_OBJECT');const f=await family(code,b.objects[id].family);const item=f.items.find(x=>x.objectId===id);if(!item)throw new Error('UNKNOWN_OBJECT');const result=await read(item.path);if(result.bookCode!==code||result.object.objectId!==id)throw new Error('OBJECT_SCOPE_MISMATCH');return result;}
 return {book,family,object};
}
export const structuredLoader=createStructuredLoader();
