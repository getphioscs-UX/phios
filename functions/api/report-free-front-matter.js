import manifest from '../../content/reports/shared/report-visual-assets-r2.json';
import {REPORT_EDITORIAL_ASSETS} from '../canonical-presentation-runtime/report-editorial-registry.js';
import {onRequestGet as publicAssetConfig} from './public-asset-config.js';
import {freeReportFrontMatter} from '../report-delivery/report-free-front-matter.js';
const json=(body,status=200)=>Response.json(body,{status,headers:{'cache-control':'no-store','x-content-type-options':'nosniff'}});
export async function onRequestGet(context){
 const query=new URL(context.request.url).searchParams;
 if([...query.keys()].some(k=>!['method','locale'].includes(k))||query.getAll('method').length!==1||query.getAll('locale').length!==1)return json({ok:false,code:'FREE_REQUEST_INVALID'},400);
 try{
  const configResponse=publicAssetConfig(context),config=await configResponse.json();
  if(!configResponse.ok||!config.success)return json({ok:false,code:'PUBLIC_ASSET_BASE_URL_UNAVAILABLE'},503);
  return json(freeReportFrontMatter({slug:query.get('method'),locale:query.get('locale'),manifest,editorialAssets:REPORT_EDITORIAL_ASSETS,publicBaseUrl:config.publicAssetBaseUrl}));
 }catch(error){return json({ok:false,code:['FREE_METHOD_UNKNOWN','FREE_LOCALE_INVALID','FREE_FRONT_MATTER_UNAVAILABLE','FREE_ASSET_BASE_INVALID','FREE_ASSET_KEY_INVALID'].includes(error.code)?error.code:'FREE_FRONT_MATTER_UNAVAILABLE'},error.code==='FREE_METHOD_UNKNOWN'?404:error.code==='FREE_LOCALE_INVALID'?400:503);}
}
export const onRequestPost=()=>json({ok:false,code:'FREE_READ_ONLY'},405);
