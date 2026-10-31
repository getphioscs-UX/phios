const URL='/content/web-production/registries/wpr-eight-volume-r2-public-assets-v1.json';let cache=null;
const registry=async()=>{if(cache)return cache;const r=await fetch(URL,{cache:'force-cache',signal:AbortSignal.timeout(12000)});if(!r.ok)throw new Error(`SEVEN_VOLUME_ASSET_REGISTRY_${r.status}`);cache=await r.json();return cache};
export async function resolveSevenVolumeCustomerAsset(id){const r=await registry();const a=r.assets?.find(x=>x.assetId===id);if(!a?.available||!a?.publicUrl)throw new Error(`SEVEN_VOLUME_ASSET_UNAVAILABLE:${id}`);return a}
const bindings=new WeakMap();
export async function hydrateSevenVolumeAssets(scope=document){
 await Promise.all([...scope.querySelectorAll('[data-cx-seven-volume-asset]')].map(async node=>{
  bindings.get(node)?.();
  let disposed=false;
  let fallback=node.parentElement?.querySelector?.('[data-cx-asset-fallback]');
  if(!fallback){fallback=document.createElement('span');fallback.dataset.cxAssetFallback='';fallback.setAttribute('role','status');node.after(fallback);}
  const zh=String(document.documentElement.lang).startsWith('zh');
  const cleanup=()=>{node.removeEventListener('load',loaded);node.removeEventListener('error',failed);};
  const fail=error=>{if(disposed)return;cleanup();node.hidden=true;node.dataset.cxAssetState='unavailable';fallback.hidden=false;fallback.dataset.cxAssetError=error.message;fallback.textContent=zh?'图片暂时无法显示。':'Visual unavailable. ';const button=document.createElement('button');button.type='button';button.textContent=zh?'重试':'Retry';button.onclick=()=>{cache=null;hydrateSevenVolumeAssets(node.parentElement);};fallback.append(button);};
  const loaded=()=>{if(disposed)return;if(!node.naturalWidth){fail(new Error('SEVEN_VOLUME_IMAGE_EMPTY'));return;}cleanup();node.dataset.cxAssetState='ready';fallback.hidden=true;};
  const failed=()=>fail(new Error('SEVEN_VOLUME_IMAGE_LOAD_FAILED:'+node.dataset.cxSevenVolumeAsset));
  bindings.set(node,()=>{disposed=true;cleanup();});
  node.dataset.cxAssetState='loading';fallback.hidden=true;
  try{
   const a=await resolveSevenVolumeCustomerAsset(node.dataset.cxSevenVolumeAsset);if(disposed)return;
   if(!(node instanceof HTMLImageElement))throw new Error('SEVEN_VOLUME_IMAGE_REQUIRED');
   node.loading=node.closest('[class*="hero"]')?'eager':node.loading||'lazy';node.decoding='async';
   if(a.width)node.width=Number(a.width);if(a.height)node.height=Number(a.height);
   node.addEventListener('load',loaded);node.addEventListener('error',failed);
   node.hidden=false;node.src=a.publicUrl;
   if(node.complete&&node.naturalWidth>0)loaded();
  }catch(error){fail(error);}
 }));
}
