import visualRegistry from '../../content/customer-experience-rebuild/authority/customer-visual-asset-registry-v4.json';
const HTTPS_URL = /^https:\/\/[^\s]+$/i;
function normalize(value) {
 const raw=String(value??'').trim();if(!raw||!HTTPS_URL.test(raw))return null;
 try{const url=new URL(raw);if(url.protocol!=='https:'||url.username||url.password||url.search||url.hash)return null;return url.toString().replace(/\/$/,'');}catch{return null;}
}
export function onRequestGet({env={}}={}) {
 const registered=normalize(visualRegistry.publicR2Base),supplied=String(env.PHIOS_PUBLIC_ASSET_BASE_URL??'').trim(),configured=supplied?normalize(supplied):null;
 // The existing public authority supplies the default; an explicit conflicting override fails closed.
 if(!registered||(supplied&&configured!==registered))return Response.json({success:false,code:'PUBLIC_ASSET_BASE_URL_UNAVAILABLE',deliveryState:'FAIL_CLOSED'},{status:503,headers:{'Cache-Control':'no-store'}});
 return Response.json({success:true,publicAssetBaseUrl:configured||registered,source:supplied?'PHIOS_PUBLIC_ASSET_BASE_URL':'customer-visual-asset-registry-v4.publicR2Base',registryVersion:'1.0.0',deliveryState:'CONFIGURED_NOT_UPSTREAM_VERIFICATION_AUTHORITY'},{headers:{'Cache-Control':'public, max-age=300, stale-while-revalidate=60'}});
}
