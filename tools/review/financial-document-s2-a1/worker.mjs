import {boundary,reserve,boundedBody} from './security.mjs';
import {extractControlled} from '../financial-document-s1-3/parsers.mjs';
import {businessSummary,validateBusinessInput} from '../../../functions/professional/financial/business-intake-candidate-r3.js';
// Do not import the S1.3 localhost harness. No fault injection, fake Account,
// Profile eligibility, grant issuance, public artifact or cloud cleanup route.
export default {async fetch(request,env){try{
 const u=new URL(request.url),routes={'/identity':'identity','/extract':'extract','/financial':'financial','/artifact':'download'};
 const op=routes[u.pathname];if(!op)return Response.json({ok:false,error:'ROUTE_CLOSED'},{status:404});
 if(request.method!==(op==='identity'||op==='download'?'GET':'POST'))return new Response(null,{status:405});
 const ctx=await boundary(request,env,op);
 if(op==='identity'){await reserve(env,ctx,0,0);return Response.json({ok:true,synthetic:true,account:ctx.account.accountId,subject:ctx.account.subject,artifactAdmission:false});}
 const bytes=await boundedBody(request);await reserve(env,ctx,bytes.length,op==='extract'?1:0);
 if(op==='extract')return Response.json(await extractControlled(bytes,u.searchParams.get('format')));
 const input=JSON.parse(new TextDecoder().decode(bytes));if(input.context?.subjectId!==ctx.account.subject)throw Object.assign(Error('SUBJECT_NOT_AUTHORIZED'),{status:403});
 // Access authenticates the gateway only. Native validation/calculation is pure;
 // resource writes and Business/Profile delivery still require native Account/PWS.
 return Response.json(businessSummary(validateBusinessInput(input)));
 }catch(e){return Response.json({ok:false,error:e.status?e.message:'SECURITY_OR_INPUT_REJECTED'},{status:e.status||403,headers:{'cache-control':'no-store'}});}}};
