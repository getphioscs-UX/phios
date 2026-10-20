import {readWorldBankObservation} from '../_lib/world-bank-observations.js';
import {readWorldEvidence} from '../_lib/world-evidence.js';
export async function onRequestGet({request}){try{const u=new URL(request.url);if(u.search.length>300||[...u.searchParams.keys()].some(k=>u.searchParams.getAll(k).length!==1))throw Error('DUPLICATE_OR_LONG_FIELD');
 if(u.searchParams.has('series')){const evidence=readWorldEvidence(Object.fromEntries(u.searchParams));return Response.json({ok:!['SOURCE_ERROR','NO_ACCESS'].includes(evidence.state),evidence},{headers:{'cache-control':'no-store','x-content-type-options':'nosniff'}});}
 const result=await readWorldBankObservation(Object.fromEntries(u.searchParams));return Response.json({ok:!['SERVICE_ERROR','TIMEOUT','INVALID_RESPONSE','IDENTITY_MISMATCH','UNIT_MISMATCH'].includes(result.state),observation:result},{headers:{'cache-control':'public,max-age=300','x-content-type-options':'nosniff'}});}catch{return Response.json({ok:false,error:'PUBLIC_OBSERVATION_INPUT_INVALID'},{status:400});}}
export const onRequest=context=>context.request.method==='GET'?onRequestGet(context):new Response(null,{status:405,headers:{Allow:'GET'}});
