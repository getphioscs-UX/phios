import assert from 'node:assert/strict';
import fs from 'node:fs';
import {parseHTML} from 'linkedom';
import {renderAtlasVisualProjection} from '../assets/js/pages/civilization-atlas/atlas-visual-projection.js';

const projection=JSON.parse(fs.readFileSync('content/civilization-atlas/visuals/atlas-visual-projection-v1.json','utf8'));
const slots=JSON.parse(fs.readFileSync('content/civilization-atlas/visuals/atlas-layer-template-slots-v1.json','utf8'));
const boundary=JSON.parse(fs.readFileSync('docs/assets/r2-public/wiring-20261009/L5-TEMPLATE-BOUNDARY.json','utf8'));
const world=projection.layers.find(x=>x.layerId==='world');
assert.equal(world.poster.availability,'CURRENT_OBJECT_UNVERIFIED');
assert.equal(world.poster.verificationEvidence,'docs/assets/r2-public/wiring-20261009/L5-TEMPLATE-BOUNDARY.json');
assert.equal(boundary.observed,'HTTP_404_AND_ABSENT_FROM_COMPLETE_INVENTORY');
assert.equal(world.poster.objectKey,boundary.expectedKey);
assert.equal(new URL(world.poster.publicUrl).pathname,'/'+boundary.expectedKey);
// The current Publisher deliberately rejects the unavailable generic poster.
// Exercise that real branch; do not substitute the different historical object.
const {document}=parseHTML('<div id="projection"><img src="stale.webp"></div>');
const container=document.getElementById('projection');
renderAtlasVisualProjection(container,{projection,slots,state:{activeLayer:'world'},locale:'en'});
assert.equal(container.childNodes.length,0,'Unavailable L5 template must not leak into the customer DOM');
const targets=[];
for(const layer of projection.layers||[]){
  if(layer.poster) targets.push({layerId:layer.layerId,assetRef:layer.poster.assetRef,url:layer.poster.publicUrl,expectedStatus:layer.layerId==='world'?404:200});
  for(const p of layer.posters||[]) targets.push({layerId:layer.layerId,assetRef:p.assetRef,url:p.publicUrl});
  // L2/L6 are now structured readers. Keep their historical public asset
  // delivery checks without falsely treating archived posters as live UI.
  if(layer.archivedPoster){
    assert.equal(layer.mode,'STRUCTURED_READER_ONLY');
    assert.equal(layer.archivedPoster.customerRuntime,false);
    assert.equal(layer.primaryContent,'STRUCTURED_HTML_SVG_READER');
    targets.push({layerId:layer.layerId,assetRef:layer.archivedPoster.assetRef,url:layer.archivedPoster.publicUrl,archived:true});
  }
}
const requiredRefs=['VIS-B5-ATLAS-L2-TIMELINE-TEMPLATE-BASE.webp','VIS-B5-ATLAS-L5-TEMPLATE-BASE.webp'];
const l6=projection.layers?.find(x=>x.layerId==='trajectories');
if((l6?.poster||l6?.archivedPoster)?.availability==='VERIFIED_LIVE_R2') requiredRefs.push('VIS-B5-ATLAS-L6-TRAJECTORIES-TEMPLATE-BASE.webp');
for(const ref of requiredRefs) assert.ok(targets.some(x=>x.assetRef===ref),`Missing active template projection: ${ref}`);

const results=[];
for(const item of targets){
  try{
    const response=await fetch(item.url,{method:'HEAD',redirect:'follow'});
    results.push({...item,status:response.status,type:(response.headers.get('content-type')||'').toLowerCase()});
  }catch(error){
    results.push({...item,status:0,type:'',error:String(error)});
  }
}
const missing=results.filter(x=>x.status!==(x.expectedStatus||200));
const wrongType=results.filter(x=>x.status===200&&!/image\/webp|application\/octet-stream/.test(x.type));
if(missing.length) console.error('FR3_TEMPLATE_MISSING\n'+missing.map(x=>`${x.assetRef}\t${x.status}\t${x.url}`).join('\n'));
if(wrongType.length) console.error('FR3_TEMPLATE_WRONG_TYPE\n'+wrongType.map(x=>`${x.assetRef}\t${x.type}`).join('\n'));
assert.equal(missing.length,0,`FR3 missing template WebPs: ${missing.length}/${targets.length}`);
assert.equal(wrongType.length,0,`FR3 wrong template content types: ${wrongType.length}`);
console.log(`FR3/FR4 delivery contract PASS: archived L2/L6 remain reachable, the documented L5 404 is rejected by the real customer Renderer; no substitute object is admitted.`);
