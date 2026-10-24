import fs from 'node:fs';import path from 'node:path';import {createHash} from 'node:crypto';
import {startContinuityServer} from '../../reality-navigation-continuity-r1/server.mjs';
import {onRequestGet as worldObservations} from '../../../../functions/api/world-observations.js';
import {createWorldR4Engine} from './engine.mjs';
import {projectObservationImpact} from '../../../../functions/customer-projection/world-observation-impact.js';
import {internalPublicationFile} from '../../../../scripts/lib/publication-boundary.mjs';
const base='tools/review/world-ux-r1/world-r4';
export async function startWorldR4Server({port=0,filename='.tmp/reality-navigation-continuity-r1/world-r4-preview.sqlite',clock=()=>new Date().toISOString(),validateEvidenceOverride=null,reviewExtension=null}={}){
 const engine=createWorldR4Engine(),explanations=new Map();
 const validateEvidence=validateEvidenceOverride||engine.validateEvidence;
 const extension=async({req,u,owner,origin,send})=>{
  if(reviewExtension&&await reviewExtension({req,u,owner,origin,send}))return true;
  const rel=decodeURIComponent(u.pathname).slice(1),publicFile=path.resolve(rel);
  if(req.method==='GET'&&/^(content\/civilization-atlas\/|content\/web-production\/registries\/)/.test(rel)){
   const within=['content/civilization-atlas','content/web-production/registries'].some(dir=>publicFile.startsWith(path.resolve(dir)+path.sep));
   if(!within||internalPublicationFile(rel)||path.extname(rel)!=='.json'||!fs.existsSync(publicFile)){send(403,{code:'PUBLICATION_BOUNDARY_DENIED'});return true;}
   send(200,fs.readFileSync(publicFile),{'content-type':'application/json'});return true;
  }
  if(u.pathname==='/api/world-observations'&&u.searchParams.get('dataset')==='MY_CPI'){
   if(req.method!=='GET'){send(405,{code:'GET_REQUIRED'});return true;}
   const response=await worldObservations({request:new Request(origin+u.pathname+u.search),env:{PHIOS_ENVIRONMENT:'local',PHIOS_WORLD_R4_LOCAL_ENABLED:'true',WORLD_R4_READ:engine.query}});send(response.status,await response.text());return true;
  }
  if(u.pathname.startsWith('/__local/world-r4')){
   if(req.method==='GET'&&u.pathname==='/__local/world-r4/coverage'){send(200,JSON.parse(fs.readFileSync('content/world/successors/world-r4-local-validation/coverage.json')));return true;}
   if(req.method!=='POST'||req.headers.origin!==origin){send(403,{code:'ORIGIN_AND_POST_REQUIRED'});return true;}
   let raw='';for await(const chunk of req){raw+=chunk;if(raw.length>12000){send(413,{code:'BODY_TOO_LARGE'});return true;}}const input=JSON.parse(raw);
   if(u.pathname==='/__local/world-r4/ask'){
    if(Object.keys(input).some(k=>!['caseType','geo','other','period','locale','question'].includes(k))){send(400,{code:'SERVER_SOURCE_FIELDS_ONLY'});return true;}
    if(typeof input.question!=='string'||!input.question.trim()||input.question.length>800){send(400,{code:'QUESTION_REQUIRED'});return true;}
    const answer=engine.answer(input);if(answer.observations?.length){const payload={question:answer.question,locale:answer.locale,answer:answer.answer,answerState:answer.answerState,supports:answer.observations.map(o=>({observationId:o.observationId,sourceId:o.sourceId,sourceVersion:o.sourceVersion,supportLocation:o.sourceSnapshotReference,geography:o.geographyId,period:o.observationPeriod})),limits:answer.missingEvidence};const digest=createHash('sha256').update(JSON.stringify(payload)).digest('hex');const explanation={...payload,digest,explanationId:'WORLD-R4-EXPLANATION:'+digest,createdAt:clock(),providerCalls:0};explanations.set(explanation.explanationId,explanation);if(explanations.size>1000)explanations.delete(explanations.keys().next().value);answer.explanation=explanation;}
    send(200,answer);return true;
   }
   if(u.pathname!=='/__local/world-r4/impact'){send(404,{code:'LOCAL_ROUTE_NOT_FOUND'});return true;}
   if(Object.keys(input).some(k=>!['caseId','observationId','explanationId','expectedVersion','confirmApplicability','reason','consent','requestId'].includes(k))){send(400,{code:'SERVER_SOURCE_FIELDS_ONLY'});return true;}
   const token=(req.headers.cookie||'').split(';').map(x=>x.trim()).find(x=>x.startsWith('qa-continuity='))?.slice(14),userId=await owner.identity(token),state=owner.read(userId,input.caseId);
   const observation=engine.observations.find(o=>o.observationId===input.observationId);if(!observation){send(404,{code:'OBSERVATION_NOT_FOUND'});return true;}
   const impact=projectObservationImpact(observation,{caseId:state.case.case_id,userId,caseVersion:state.case.version,confirmApplicability:input.confirmApplicability===true,reason:input.reason||'',locale:state.case.language,now:clock()});
   if(input.consent!==true||!impact.resolvedEvidence){send(403,{code:impact.state,impact});return true;}
   if(input.explanationId){const x=explanations.get(input.explanationId);if(!x||!x.supports.some(s=>s.observationId===observation.observationId)){send(409,{code:'EXPLANATION_RELOAD_REQUIRED'});return true;}impact.resolvedEvidence.explanation=structuredClone(x);}
   if(validateEvidence(impact.resolvedEvidence,{now:clock()}).state!=='VALID'){send(409,{code:'SOURCE_RECHECK_REQUIRED'});return true;}
   if(typeof input.requestId!=='string'||input.requestId.length>80){send(400,{code:'REQUEST_ID_REQUIRED'});return true;}
   const old=state.case.records.find(r=>r.kind==='EVIDENCE'&&r.validity==='ACTIVE'&&r.source_reference?.seriesKey===impact.resolvedEvidence.seriesKey);
   if(old?.source_reference?.observationId===observation.observationId&&(!input.explanationId||old.source_reference.explanation?.explanationId===input.explanationId)){send(200,{...state,impact,replayed:true});return true;}
   if(input.expectedVersion!==state.case.version){send(409,{code:'VERSION_CONFLICT'});return true;}
   let current=state;owner.sql.exec('BEGIN');try{
    if(old)current=owner.update(userId,input.caseId,{action:'withdraw',recordId:old.record_id,consent:true,reason:'User selected a different source observation; dependent understanding needs review',expectedVersion:current.case.version,requestId:input.requestId+'-withdraw'});
    current=owner.update(userId,input.caseId,{action:'record',kind:'EVIDENCE',content:'Server resolved observation reference',consent:true,expectedVersion:current.case.version,requestId:input.requestId+'-attach'},{resolvedEvidence:impact.resolvedEvidence});owner.sql.exec('COMMIT');
   }catch(e){owner.sql.exec('ROLLBACK');throw e;}
   send(200,{...current,impact,sourceReplaced:!!old});return true;
  }
  if(u.pathname.startsWith('/'+base+'/')){
   const file=path.resolve('.'+decodeURIComponent(u.pathname));if(!file.startsWith(path.resolve(base)+path.sep)||!fs.existsSync(file)||!fs.statSync(file).isFile()){send(404,{code:'REVIEW_FILE_NOT_FOUND'});return true;}
   send(200,fs.readFileSync(file),{'content-type':({'.html':'text/html','.mjs':'text/javascript','.css':'text/css','.png':'image/png','.json':'application/json','.md':'text/plain'})[path.extname(file)]||'application/octet-stream'});return true;
  }
  return false;
 };
 const s=await startContinuityServer({port,filename,extension,validateEvidence,clock,decoratePage:(name,html)=>name==='/world/index.html'?html.replace('</body>',`<script type="module" src="/${base}/boot.mjs"></script></body>`):html});return {...s,engine};
}
if(process.argv.includes('--serve')&&path.resolve(process.argv[1]||'')===path.resolve('tools/review/world-ux-r1/world-r4/server.mjs')){const s=await startWorldR4Server({port:63961});console.log(s.origin+'/world/?locale=zh-Hans#world-r4');}
