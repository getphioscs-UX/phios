import registry from '../../content/health/health-reality-runtime/authority/approved-health-authority-registry-v1.json';
import { retrieveApprovedHealthSource } from '../health/health-live-authority-retrieval.js';
const json=(b,s=200)=>new Response(JSON.stringify(b),{status:s,headers:{'content-type':'application/json; charset=utf-8','cache-control':'no-store'}});
export async function onRequestPost(context){if(context.env?.PHIOS_HEALTH_AUTHORITY_ENABLED!=='1')return json({ok:false,error:{code:'HRX_LIVE_AUTHORITY_DISABLED'}},503);try{const body=await context.request.json();return json(await retrieveApprovedHealthSource(body,{registry}));}catch(e){return json({ok:false,error:{code:String(e?.message||'HRX_RETRIEVAL_FAILED')}},400)}}
export async function onRequestGet(){return json({ok:false,error:{code:'HRX_RETRIEVAL_POST_ONLY'}},405)}

