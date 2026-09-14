import {loadStructuredObject} from './structured-ask-policy.js';
export const STRUCTURED_CANDIDATE_ROLES=Object.freeze(['interpretationCandidate','observationPrompt','comparisonFrame','recoveryOptionFrame','navigationFrame']);
export async function resolveStructuredRealityCandidates(requested,env={},locale='en'){
 const accepted=[],rejected=[];
 for(const request of (Array.isArray(requested)?requested:[]).slice(0,5)){
  const reject=reason=>rejected.push({objectId:String(request?.objectId||'').slice(0,90),reason});
  if(!STRUCTURED_CANDIDATE_ROLES.includes(request?.role)){reject('UNSUPPORTED_ROLE');continue;}
  if(request.userConfirmed!==true){reject('USER_CONFIRMATION_REQUIRED');continue;}
  const found=await loadStructuredObject(env,{scopeType:'STRUCTURED_KNOWLEDGE',bookCode:request.bookCode,objectId:request.objectId});
  if(!found){reject('SOURCE_UNAVAILABLE');continue;}
  const o=found.object,sourceText=o.canonicalMeaning||o.definition||o.articles?.find(a=>a.locale===locale)?.summary;
  if(!sourceText){reject('SOURCE_INDEX_ONLY');continue;}
  const [route,param,anchor]={'BOOK-1':['reality-formation','mechanism','explorer'],'BOOK-2':['reality-runtime','pattern','runtime-atlas'],'BOOK-3':['reality-continuity','topic','maintenance'],'BOOK-4':['reality-expansion','expansion','expansion']}[o.bookCode];
  accepted.push({refId:o.objectId,objectId:o.objectId,bookCode:o.bookCode,title:o.title,role:request.role,sourceRefs:o.sourceRefs,href:`/books/${route}/?${param}=${encodeURIComponent(o.objectId)}#${anchor}`,
   referenceText:sourceText,userReportedObservation:String(request.observation||'').trim().slice(0,500),userConfirmed:true,
   prompt:locale==='zh-Hans'?'这个框架与你观察到的情况有哪些相符与不符之处？':'Where does this framework fit, or fail to fit, what you observed?',
   realityFact:false,diagnosis:false,recommendation:false,authorityClass:'INTERPRETATION_CANDIDATE',humanAcceptanceComplete:false});
 }
 return {accepted,rejected,createsCurrentRealityFact:false,createsProfessionalAdvice:false};
}
