import assert from 'node:assert/strict';
import fs from 'node:fs';

const projection=JSON.parse(fs.readFileSync('content/civilization-atlas/visuals/atlas-visual-projection-v1.json','utf8'));
const targets=[];
for(const layer of projection.layers||[]){
  if(layer.poster) targets.push({layerId:layer.layerId,assetRef:layer.poster.assetRef,url:layer.poster.publicUrl});
  for(const p of layer.posters||[]) targets.push({layerId:layer.layerId,assetRef:p.assetRef,url:p.publicUrl});
}
assert.ok(targets.length>=21,'Expected L2-L8 template set including World snapshots.');

let ok=0;
for(const item of targets){
  const response=await fetch(item.url,{method:'HEAD',redirect:'follow'});
  assert.equal(response.status,200,`TEMPLATE_HTTP_${item.assetRef}_${response.status}`);
  const type=(response.headers.get('content-type')||'').toLowerCase();
  assert.match(type,/image\/webp|application\/octet-stream/,`TEMPLATE_TYPE_${item.assetRef}_${type}`);
  ok++;
}
console.log(`FR3 live template delivery PASS: ${ok}/${targets.length} Library template WebPs reachable.`);
