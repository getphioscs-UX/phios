// Transport permission for an unsaved public question only. No private contexts,
// follow-up records, paid tasks, report generation or provider admission.
const plain=v=>v&&typeof v==='object'&&!Array.isArray(v);
const only=(v,keys)=>Object.keys(v).every(k=>keys.includes(k));
// Explicit unsaved scam review reaches the existing deterministic handler only.
function publicScamReview(body){
 if(!plain(body)||!only(body,['question','task','locale','jurisdiction','bankJurisdiction','eventJurisdiction','exposure','contexts','questionOnly','guidedContext','contextConsent','guidedRouting','methodGuidanceRequested','followUpContext']))return false;
 if(body.task!=='SCAM_CHECK'||typeof body.question!=='string'||!body.question.trim()||body.question.length>2000||!['en','zh-Hans'].includes(body.locale))return false;
 if(!Array.isArray(body.contexts)||body.contexts.length||body.questionOnly!==true||body.guidedRouting!==false||body.methodGuidanceRequested!==false||body.followUpContext!=null)return false;
 if(!plain(body.guidedContext)||Object.keys(body.guidedContext).length||!plain(body.contextConsent)||Object.keys(body.contextConsent).length)return false;
 if(['jurisdiction','bankJurisdiction','eventJurisdiction'].some(k=>!['UNKNOWN','MY','SG','US','GB','AU'].includes(body[k])))return false;
 const allowed=['PAID_OR_LOST','CREDENTIALS_SHARED','APP_INSTALLED','SCREEN_SHARED','IDENTITY_SHARED'];
 return Array.isArray(body.exposure)&&body.exposure.length<=allowed.length&&new Set(body.exposure).size===body.exposure.length&&body.exposure.every(x=>allowed.includes(x));
}
export function publicBasicAskRequest(body){
 if(body?.task==='SCAM_CHECK')return publicScamReview(body);
 if(!plain(body)||!only(body,['question','task','followUpContext','locale','guidedRouting','methodGuidanceRequested','questionOnly','contexts','knowledgeContext','guidedContext','contextConsent']))return false;
 if(typeof body.question!=='string'||!body.question.trim()||body.question.length>500||body.task!=='KNOWLEDGE_BASIC'||!['en','zh-Hans'].includes(body.locale))return false;
 if(body.knowledgeContext!=null||body.methodGuidanceRequested===true)return false;
 if(body.followUpContext!=null){const f=body.followUpContext,match=typeof f.parentAnswerId==='string'&&f.parentAnswerId.match(/^CX3-COMPANY:MYX:\d{4}:([a-f0-9]{64})$/);if(!plain(f)||!only(f,['parentAnswerId','groundingBundleId','followUpDepth'])||!match||f.groundingBundleId!==match[1]||!Number.isInteger(f.followUpDepth)||f.followUpDepth<1||f.followUpDepth>3)return false;}
 if(body.guidedRouting!==undefined&&typeof body.guidedRouting!=='boolean')return false;
 if(body.methodGuidanceRequested!==undefined&&body.methodGuidanceRequested!==false)return false;
 if(body.questionOnly!==undefined&&body.questionOnly!==false)return false;
 if(!Array.isArray(body.contexts)||body.contexts.length!==1)return false;
 const c=body.contexts[0];if(!plain(c)||!only(c,['contextType','contextRef'])||c.contextType!=='KNOWLEDGE'||c.contextRef!=null&&c.contextRef!=='PHIOS_GOVERNED_KNOWLEDGE')return false;
 if(body.contextConsent!=null&&(!plain(body.contextConsent)||!only(body.contextConsent,['CURRENT_REALITY'])||body.contextConsent.CURRENT_REALITY!==false))return false;
 if(body.guidedContext!=null&&(!plain(body.guidedContext)||!only(body.guidedContext,['whatIsHappening','howLong','whatChanged','whatMattersMostNow'])||Object.values(body.guidedContext).some(v=>v!=='')))return false;
 return true;
}
