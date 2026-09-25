import assert from 'node:assert/strict';
import fs from 'node:fs';

const projection=JSON.parse(fs.readFileSync('content/civilization-atlas/visuals/atlas-visual-projection-v1.json','utf8'));
const targets=[];
for(const layer of projection.layers||[]){
  if(layer.poster) targets.push({layerId:layer.layerId,assetRef:layer.poster.assetRef,url:layer.poster.publicUrl});
  for(const p of layer.posters||[]) targets.push({layerId:layer.layerId,assetRef:p.assetRef,url:p.publicUrl});
}
assert.ok(targets.length>=21,'Expected L2-L8 template set including World snapshots.');

const results=[];
for(const item of targets){
  try{
    const response=await fetch(item.url,{method:'HEAD',redirect:'follow'});
    results.push({...item,status:response.status,type:(response.headers.get('content-type')||'').toLowerCase()});
  }catch(error){
    results.push({...item,status:0,type:'',error:String(error)});
  }
}
const missing=results.filter(x=>x.status!==200);
const wrongType=results.filter(x=>x.status===200&&!/image\/webp|application\/octet-stream/.test(x.type));
if(missing.length) console.error('FR3_TEMPLATE_MISSING\n'+missing.map(x=>`${x.assetRef}\t${x.status}\t${x.url}`).join('\n'));
if(wrongType.length) console.error('FR3_TEMPLATE_WRONG_TYPE\n'+wrongType.map(x=>`${x.assetRef}\t${x.type}`).join('\n'));
assert.equal(missing.length,0,`FR3 missing template WebPs: ${missing.length}/${targets.length}`);
assert.equal(wrongType.length,0,`FR3 wrong template content types: ${wrongType.length}`);
console.log(`FR3 live template delivery PASS: ${results.length}/${targets.length} Library template WebPs reachable.`);
