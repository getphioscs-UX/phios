import {onRequest} from "C:/Users/Guest Account/.codex/worktrees/world-customer-experience-r3/phios/functions/_middleware.js";
import {onRequestGet} from "C:/Users/Guest Account/.codex/worktrees/world-customer-experience-r3/phios/functions/api/current-facts.js";
export default {fetch(request,env){return onRequest({request,env,next:async()=>{
 if(new URL(request.url).pathname==='/trap'){try{await env.RUNTIME_DB.prepare('INSERT INTO isolation_probe VALUES(1)').run();}catch{}return Response.json({swallowed:true});}
 if(request.method==='GET')return onRequestGet({request});return Response.json({safePost:true});
}})}};