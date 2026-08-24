import registry from '../../content/health/health-reality-runtime/authority/approved-health-authority-registry-v1.json' with {type:'json'};
import { routeAskHealthLive } from '../health/ask-health-live-router.js';
const H={'content-type':'application/json; charset=utf-8','cache-control':'no-store','referrer-policy':'no-referrer'}; const json=(b,s=200)=>new Response(JSON.stringify(b),{status:s,headers:H});
export async function onRequestPost(context){try{const body=await context.request.json();const result=await routeAskHealthLive(body,context.env||{},registry);return json({ok:true,...result});}catch(e){return json({ok:false,error:{code:String(e?.message||'HRX_ASK_ROUTE_FAILED')},governance:{healthDataPersisted:false,diagnosis:false,treatmentPrescription:false}},400)}}
export async function onRequestGet(){return json({ok:false,error:{code:'HRX_HEALTH_ASK_POST_ONLY'}},405)}
