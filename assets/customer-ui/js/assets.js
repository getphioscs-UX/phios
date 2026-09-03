const REGISTRY_URL='/content/customer-experience-rebuild/authority/customer-visual-asset-registry-v3.json';
let cache=null;

export async function customerAssetRegistry(){
  if(cache)return cache;
  const response=await fetch(REGISTRY_URL,{cache:'force-cache'});
  if(!response.ok)throw new Error(`CX_ASSET_REGISTRY_${response.status}`);
  cache=await response.json();
  return cache;
}

function deliveryFor(record){
  const delivery=record?.delivery||{};
  return Object.freeze({
    loading:delivery.loading||'lazy',
    decoding:delivery.decoding||'async',
    fetchPriority:delivery.fetchPriority||'auto'
  });
}

export function resolveCustomerAssetFromRegistry(registry,assetId){
  const record=registry?.entries?.find(item=>item.assetId===assetId);
  if(!record)throw new Error(`CX_ASSET_UNKNOWN:${assetId}`);
  if(record.available!==true||!record.publicUrl)throw new Error(`CX_ASSET_UNAVAILABLE:${assetId}`);
  return Object.freeze({...record,delivery:deliveryFor(record)});
}

export function resolveCustomerAssetRoleFromRegistry(registry,roleId){
  const binding=registry?.roleBindings?.find(item=>item.roleId===roleId);
  if(!binding)throw new Error(`CX_ASSET_ROLE_UNKNOWN:${roleId}`);
  if(binding.available!==true)throw new Error(`CX_ASSET_ROLE_UNAVAILABLE:${roleId}`);
  const asset=resolveCustomerAssetFromRegistry(registry,binding.assetId);
  return Object.freeze({...asset,roleId,binding:Object.freeze({...binding})});
}

export async function resolveCustomerAsset(assetId){
  return resolveCustomerAssetFromRegistry(await customerAssetRegistry(),assetId);
}

export async function resolveCustomerAssetRole(roleId){
  return resolveCustomerAssetRoleFromRegistry(await customerAssetRegistry(),roleId);
}

function localizedUnavailableLabel(node){
  if(node.dataset.cxAssetFallbackText)return node.dataset.cxAssetFallbackText;
  return String(document.documentElement.lang||'').toLowerCase().startsWith('zh')?'视觉资源暂时无法显示':'Visual unavailable';
}

function fallbackFor(node){
  const explicit=node.parentElement?.querySelector?.('[data-cx-asset-fallback]');
  if(explicit)return explicit;
  if(node.nextElementSibling?.hasAttribute?.('data-cx-asset-fallback'))return node.nextElementSibling;
  const fallback=document.createElement('span');
  fallback.dataset.cxAssetFallback='';
  fallback.setAttribute('role','status');
  fallback.textContent=localizedUnavailableLabel(node);
  node.insertAdjacentElement('afterend',fallback);
  return fallback;
}

function applyImageDelivery(node,asset){
  const delivery=asset.delivery||{};
  node.loading=delivery.loading||'lazy';
  node.decoding=delivery.decoding||'async';
  if('fetchPriority' in node)node.fetchPriority=delivery.fetchPriority||'auto';
  if(asset.width&&!node.hasAttribute('width'))node.width=Number(asset.width);
  if(asset.height&&!node.hasAttribute('height'))node.height=Number(asset.height);
}

async function loadImage(node,asset){
  node.hidden=true;
  node.removeAttribute('src');
  applyImageDelivery(node,asset);
  return new Promise((resolve,reject)=>{
    const onLoad=()=>{cleanup();resolve()};
    const onError=()=>{cleanup();reject(new Error(`CX_ASSET_IMAGE_LOAD_FAILED:${asset.assetId}`))};
    const cleanup=()=>{node.removeEventListener('load',onLoad);node.removeEventListener('error',onError)};
    node.addEventListener('load',onLoad,{once:true});
    node.addEventListener('error',onError,{once:true});
    node.src=asset.publicUrl;
    if(node.complete&&node.naturalWidth>0){cleanup();resolve()}
  });
}

function revealFallback(node,fallback,error){
  node.dataset.cxAssetState='unavailable';
  node.hidden=true;
  fallback.hidden=false;
  fallback.dataset.cxAssetState='unavailable';
  fallback.dataset.cxAssetError=error?.message||'CX_ASSET_UNAVAILABLE';
}

async function resolveNodeAsset(node){
  const roleId=node.dataset.cxAssetRole;
  const assetId=node.dataset.cxAsset;
  if(roleId&&assetId)throw new Error(`CX_ASSET_BINDING_AMBIGUOUS:${roleId}:${assetId}`);
  if(roleId)return resolveCustomerAssetRole(roleId);
  if(assetId)return resolveCustomerAsset(assetId);
  throw new Error('CX_ASSET_BINDING_MISSING');
}

export async function hydrateCustomerAssets(scope=document){
  const nodes=[...scope.querySelectorAll('[data-cx-asset],[data-cx-asset-role]')];
  await Promise.all(nodes.map(async node=>{
    const requested=node.dataset.cxAssetRole||node.dataset.cxAsset||'';
    const fallback=fallbackFor(node);
    fallback.hidden=true;
    try{
      const asset=await resolveNodeAsset(node);
      if(node instanceof HTMLImageElement){
        await loadImage(node,asset);
        node.hidden=false;
      }else{
        node.style.setProperty('--cx-asset-url',`url("${asset.publicUrl}")`);
      }
      node.dataset.cxAssetState='ready';
      node.dataset.cxAssetType=asset.type;
      node.dataset.cxAssetResolvedId=asset.assetId;
    }catch(error){
      revealFallback(node,fallback,error);
      console.warn('[CX asset]',requested,error.message);
    }
  }));
}
