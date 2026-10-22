import http from 'node:http';import fs from 'node:fs';import path from 'node:path';import crypto from 'node:crypto';
import {onRequest} from '../../../../functions/api/world-observations.js';
import {answerWorldSession,projectWorldSessionReality,requireSessionSelection,recheckWorldSession} from '../../../../functions/customer-projection/ric-world-session.js';
import {onRequestPost as explainWorld} from '../../../../functions/api/world-question-explanation.js';
import {clarifyRealityQuestion,beginRealityWorkbench,updateRealityWorkbench,projectRealityWorkbench} from '../../../../functions/customer-projection/ric-reality-workbench.js';
export async function startSessionServer({port=0,ttlMs=600000,clock=()=>Date.now(),evidenceFailure=false,explanationCatalogs=null}={}){
 const root=process.cwd(),review=path.resolve(root,'tools/review/reality-information-contract-r1'),sessions=new Map(),calls=[];let origin;
 const assets={fetch:async request=>{const name=new URL(request.url).pathname;if(!name.startsWith('/content/knowledge/public/')&&name!=='/content/civilization-atlas/search/world-search-index-v1.json'&&name!=='/content/world/local-answer-quality-r1.json')return new Response(null,{status:403});const file=path.resolve(root,'.'+name);return file.startsWith(root+path.sep)&&fs.existsSync(file)?new Response(fs.readFileSync(file),{headers:{'content-type':'application/json'}}):new Response(null,{status:404});}};
 const server=http.createServer(async(req,res)=>{
  const u=new URL(req.url,'http://local');const record={method:req.method,path:u.pathname};calls.push(record);
  const send=(status,body,headers={})=>{record.status=status;res.writeHead(status,{'content-type':'application/json','cache-control':'no-store','referrer-policy':'no-referrer',...headers});res.end(JSON.stringify(body));};
  try{
   if(u.pathname==='/api/world-question-explanation'){
    if(req.method!=='POST'||req.headers.origin!==origin)return send(403,{code:'LOCAL_ORIGIN_REQUIRED'});let raw='';for await(const part of req){raw+=part;if(raw.length>6000)return send(413,{code:'BODY_TOO_LARGE'});}const locale=JSON.parse(raw).locale,selectedCatalog=explanationCatalogs?.[locale];const scopedAssets=selectedCatalog?{fetch:request=>new URL(request.url).pathname==='/content/world/local-answer-quality-r1.json'?Promise.resolve(Response.json(selectedCatalog)):assets.fetch(request)}:assets;const response=await explainWorld({request:new Request(origin+u.pathname,{method:'POST',body:raw}),env:{PHIOS_ENVIRONMENT:'local',PHIOS_WORLD_EXPLANATION_LOCAL_ENABLED:'true',ASSETS:scopedAssets}});return send(response.status,await response.json());
   }
   if(u.pathname==='/api/world-observations'){
    if(req.method!=='GET'||!u.searchParams.has('series'))return send(400,{code:'LOCAL_TYPED_EVIDENCE_ONLY'});
    record.publicQuery=Object.fromEntries(u.searchParams);if(evidenceFailure)return send(503,{code:'INJECTED_LOCAL_EVIDENCE_FAILURE'});
    const response=await onRequest({request:new Request(origin+u.pathname+u.search,{method:'GET'})});const data=await response.json();record.evidenceState=data.evidence?.state;return send(response.status,data);
   }
   if(u.pathname.startsWith('/api/local-ric/')){
    if(u.search)return send(400,{code:'NO_CONTEXT_IN_URL'});
    const match=req.headers.cookie?.match(/(?:^|;\s*)ric_local_session=([a-f0-9]{32})(?:;|$)/);let key=match?.[1];
    if(!key||!sessions.has(key)){key=crypto.randomBytes(16).toString('hex');sessions.set(key,{subjectReference:key,result:null,selection:null,lastState:'EMPTY'});res.setHeader('Set-Cookie',`ric_local_session=${key}; HttpOnly; SameSite=Strict; Path=/`);}
    const session=sessions.get(key);
    const publicMaterials=async()=>{if(!session.workbench?.selectedMaterialVersion||session.workbench.selectedMaterialVersion!==session.result?.version)return [];if(await recheckWorldSession(session.result,{fetcher:(url,options)=>fetch(origin+url,{...options,headers:{...options?.headers,origin}})})!=='SOURCE_UNCHANGED')return [];const selected=projectWorldSessionReality({result:session.result,selection:session.selection,actorReference:key,subjectReference:session.subjectReference,now:clock()});return selected.state==='SESSION_SELECTED'?selected.workspace.currentReality.evidence.map(m=>({...m,comparisonQuestions:session.result.explanation?.nextSteps||[]})):[];};
    if(req.method==='GET'&&u.pathname==='/api/local-ric/workbench')return send(200,projectRealityWorkbench(session.workbench,{subject:key,now:clock(),selectedMaterials:await publicMaterials()}));
    if(req.method==='GET'&&u.pathname==='/api/local-ric/reality'){if(session.selection&&await recheckWorldSession(session.result,{fetcher:(url,options)=>fetch(origin+url,{...options,headers:{...options?.headers,origin}})})!=='SOURCE_UNCHANGED'){session.selection=null;session.lastState='SOURCE_RECHECK_REQUIRED';}return send(200,{...projectWorldSessionReality({result:session.result,selection:session.selection,actorReference:key,subjectReference:session.subjectReference,now:clock()}),transition:session.lastState});}
    if(req.method!=='POST')return send(405,{code:'METHOD_NOT_ALLOWED'});
    if(req.headers.origin!==origin||!req.headers['content-type']?.startsWith('application/json'))return send(403,{code:'LOCAL_ORIGIN_REQUIRED'});
    let text='';for await(const chunk of req){text+=chunk;if(text.length>6000)return send(413,{code:'BODY_TOO_LARGE'});}const body=JSON.parse(text);
    if(u.pathname==='/api/local-ric/workbench'){
     const allowed=['action','question','situation','known','unknown','options','nextReview','locale','consent','optionId','reason','statement','reflection','useSelectedMaterials'];if(Object.keys(body).some(k=>!allowed.includes(k)))return send(400,{code:'INPUT_FIELD_NOT_ALLOWED'});
     const workbenchEpoch=session.workbenchEpoch=(session.workbenchEpoch||0)+1;
     if(body.useSelectedMaterials!==undefined&&typeof body.useSelectedMaterials!=='boolean')return send(400,{code:'MATERIAL_SELECTION_INVALID'});let materialVersion=null;if(body.action==='start'&&body.useSelectedMaterials===true){requireSessionSelection({result:session.result,selection:session.selection,actorReference:key,subjectReference:session.subjectReference,now:clock()});if(await recheckWorldSession(session.result,{fetcher:(url,options)=>fetch(origin+url,{...options,headers:{...options?.headers,origin}})})!=='SOURCE_UNCHANGED')return send(403,{code:'SOURCE_RECHECK_REQUIRED'});materialVersion=session.result.version;}
     if(workbenchEpoch!==session.workbenchEpoch)return send(409,{code:'STALE_REQUEST_IGNORED'});
     session.workbench=body.action==='clarify'?clarifyRealityQuestion(body,{subject:key,now:clock(),ttlMs}):body.action==='start'?beginRealityWorkbench(body,{subject:key,now:clock(),ttlMs,materialVersion}):updateRealityWorkbench(session.workbench,body,{subject:key,now:clock()});const materials=await publicMaterials();if(workbenchEpoch!==session.workbenchEpoch)return send(409,{code:'STALE_REQUEST_IGNORED'});return send(200,projectRealityWorkbench(session.workbench,{subject:key,now:clock(),selectedMaterials:materials}));
    }
    if(u.pathname==='/api/local-ric/answer'){
     if(Object.keys(body).some(k=>!['question','locale','region','year'].includes(k)))return send(400,{code:'INPUT_FIELD_NOT_ALLOWED'});
     const previous=session.result?.version;session.selection=null;session.result=null;session.lastState='RECHECK_REQUIRED';
     const result=await answerWorldSession({...body,now:new Date(clock()).toISOString(),fetcher:async(url,options)=>fetch(origin+url,{...options,headers:{...options?.headers,origin}})});session.result=result;session.lastState=previous&&previous!==result.version?'SOURCE_OR_SCOPE_CHANGED':'ANSWER_READY';
     return send(200,result);
    }
    if(u.pathname==='/api/local-ric/select'){
     if(Object.keys(body).some(k=>!['selectedIds','answerVersion','purpose','explicit','accepted'].includes(k)))return send(400,{code:'INPUT_FIELD_NOT_ALLOWED'});
     const selection={...body,expiresAt:clock()+ttlMs,revokedAt:null};session.selection=null;
     try{requireSessionSelection({result:session.result,selection,actorReference:key,subjectReference:session.subjectReference,now:clock()});}catch(e){session.lastState=e.code;return send(403,{code:e.code});}
     session.selection=selection;session.lastState='SESSION_SELECTED';return send(200,projectWorldSessionReality({result:session.result,selection,actorReference:key,subjectReference:session.subjectReference,now:clock()}));
    }
    if(u.pathname==='/api/local-ric/revoke'){
     if(Object.keys(body).some(k=>k!=='scope')||!['public','workbench'].includes(body.scope||'public'))return send(400,{code:'INPUT_FIELD_NOT_ALLOWED'});if(body.scope==='workbench'){session.workbenchEpoch=(session.workbenchEpoch||0)+1;session.workbench=null;return send(200,{available:false,persisted:false});}
     if(session.selection)session.selection.revokedAt=new Date(clock()).toISOString();session.lastState='SESSION_REVOKED';return send(200,projectWorldSessionReality({result:session.result,selection:session.selection,actorReference:key,subjectReference:session.subjectReference,now:clock()}));
    }
    return send(404,{code:'LOCAL_ROUTE_NOT_FOUND'});
   }
   if(u.pathname.startsWith('/api/'))return send(503,{code:'NO_PRODUCTION_API_MOUNTED'});
   if(req.method!=='GET')return send(405,{code:'METHOD_NOT_ALLOWED'});
   let file;
   if(u.pathname.startsWith('/quality-r1/'))file=path.resolve(root,'tools/review/world-answer-quality-r1','.'+decodeURIComponent(u.pathname.slice('/quality-r1'.length)));
   else if(u.pathname.startsWith('/value-r1/'))file=path.resolve(root,'tools/review/world-reality-value-r1','.'+decodeURIComponent(u.pathname.slice('/value-r1'.length)));
   else if(/^\/(?:assets|world|content\/civilization-atlas|content\/world|content\/knowledge\/public|content\/web-production\/registries)\//.test(u.pathname)){file=path.resolve(root,'.'+decodeURIComponent(u.pathname));if(fs.existsSync(file)&&fs.statSync(file).isDirectory())file=path.join(file,'index.html');}
   else file=path.resolve(review,'.'+decodeURIComponent(u.pathname==='/'?'/RIC-HUMAN-REVIEW.html':u.pathname));
   if(!file.startsWith(review+path.sep)&&!['tools/review/world-answer-quality-r1','tools/review/world-reality-value-r1','assets','world','content/civilization-atlas','content/world','content/knowledge/public','content/web-production/registries'].some(dir=>file.startsWith(path.resolve(root,dir)+path.sep)))return send(403,{code:'STATIC_SCOPE_DENIED'});
   if(!fs.existsSync(file)||!fs.statSync(file).isFile())return send(404,{code:'NOT_FOUND'});
   record.status=200;res.writeHead(200,{'content-type':({'.html':'text/html','.js':'text/javascript','.mjs':'text/javascript','.json':'application/json','.md':'text/plain','.png':'image/png'})[path.extname(file)]||'application/octet-stream','cache-control':'no-store','content-security-policy':"default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; connect-src 'self'; frame-src 'self'; object-src 'none'; base-uri 'none'"});res.end(fs.readFileSync(file));
  }catch(e){return send(400,{code:e.code||'LOCAL_REQUEST_FAILED'});}
 });
 await new Promise(r=>server.listen(port,'127.0.0.1',r));origin='http://127.0.0.1:'+server.address().port;
 return {origin,calls,stop:()=>new Promise(r=>{server.closeAllConnections();server.close(r);})};
}
if(process.argv.includes('--serve')){const explanationCatalogs=process.env.RIC_WORLD_CLOSURE_CANDIDATE==='true'?JSON.parse(fs.readFileSync('tools/review/reality-information-contract-r1/ADDENDUM-WORLD-CANDIDATE-CATALOGS.json','utf8')):null;const s=await startSessionServer({port:Number(process.env.RIC_LOCAL_PORT||59834),explanationCatalogs});console.log(s.origin+'/RIC-HUMAN-REVIEW.html');process.on('SIGINT',()=>s.stop().then(()=>process.exit(0)));}
