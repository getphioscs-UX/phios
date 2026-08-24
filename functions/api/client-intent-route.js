import { routeClientIntent } from '../public/client-intent-router.js';
const headers={'content-type':'application/json; charset=utf-8','cache-control':'no-store','referrer-policy':'no-referrer'};
export async function onRequestPost({request}){try{const body=await request.json();return new Response(JSON.stringify({ok:true,route:routeClientIntent(body)}),{status:200,headers})}catch{return new Response(JSON.stringify({ok:false,error:'CLIENT_INTENT_ROUTE_INVALID'}),{status:400,headers})}}
export function onRequestGet(){return new Response(JSON.stringify({ok:false,error:'CLIENT_INTENT_POST_ONLY'}),{status:405,headers})}
