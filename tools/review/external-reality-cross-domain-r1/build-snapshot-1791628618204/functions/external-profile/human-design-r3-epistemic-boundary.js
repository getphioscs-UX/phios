export const HD_R3_EPISTEMIC_BOUNDARY_VERSION='PHI-OS-HD-PRO-R3-W19-EPISTEMIC-SENSITIVE-BOUNDARY-v1.0.0';

export const HD_R3_SENSITIVE_DOMAINS=Object.freeze([
  'HEALTH_MEDICAL','MENTAL_HEALTH','FINANCE','LEGAL','PREGNANCY_REPRODUCTIVE','CHILDREN_FAMILY','SAFETY'
]);

const SAFE_FRAMING=Object.freeze([
  'conditional','descriptive','observational','reflective','counter-evidence-friendly','context-dependent'
]);

const FORBIDDEN_RULES=Object.freeze([
  Object.freeze({code:'DETERMINISTIC_IDENTITY_OR_FATE',domain:'EPISTEMIC',patterns:[
    /\byou (?:are|were) destined\b/i,/\bwill definitely\b/i,/\bguaranteed to\b/i,/\bthis proves who you are\b/i,
    /命中注定/u,/一定会/u,/必然会/u,/这证明你就是/u
  ]}),
  Object.freeze({code:'MEDICAL_DIAGNOSIS_OR_TREATMENT',domain:'HEALTH_MEDICAL',patterns:[
    /\b(?:diagnos(?:e|is)|cure|treat) (?:your |the )?(?:disease|condition|illness)\b/i,
    /\bstop (?:your )?(?:medication|medicine)\b/i,/\bimmune system (?:is|will be)\b/i,
    /诊断(?:疾病|病症)/u,/治愈/u,/治疗(?:疾病|病症)/u,/停止(?:服药|药物)/u,/你的免疫系统(?:会|是)/u
  ]}),
  Object.freeze({code:'MENTAL_HEALTH_DIAGNOSIS',domain:'MENTAL_HEALTH',patterns:[
    /\byou (?:have|are) (?:depressed|bipolar|autistic|adhd)\b/i,/\bthis chart shows (?:depression|anxiety disorder|trauma disorder)\b/i,
    /你(?:有|就是)(?:抑郁症|躁郁症|自闭症|多动症)/u,/这张图显示你有(?:抑郁|焦虑障碍|创伤障碍)/u
  ]}),
  Object.freeze({code:'FINANCIAL_OUTCOME_OR_ADVICE',domain:'FINANCE',patterns:[
    /\bguaranteed (?:profit|return|wealth)\b/i,/\byou should (?:buy|sell|invest in)\b/i,/\bthis chart predicts (?:profit|loss|wealth)\b/i,
    /保证(?:获利|回报|发财)/u,/你应该(?:买入|卖出|投资)/u,/这张图预测(?:获利|亏损|财富)/u
  ]}),
  Object.freeze({code:'LEGAL_OUTCOME_OR_ADVICE',domain:'LEGAL',patterns:[
    /\bthis is legal advice\b/i,/\byou will win (?:the )?(?:case|lawsuit)\b/i,/\byou should plead\b/i,
    /这是法律意见/u,/你一定会赢(?:官司|案件)/u,/你应该认罪/u
  ]}),
  Object.freeze({code:'PREGNANCY_OR_REPRODUCTIVE_PREDICTION',domain:'PREGNANCY_REPRODUCTIVE',patterns:[
    /\byou will (?:get pregnant|become pregnant|have a baby)\b/i,/\bthis chart predicts (?:pregnancy|fertility)\b/i,
    /你一定会怀孕/u,/你会怀孕/u,/这张图预测(?:怀孕|生育能力)/u
  ]}),
  Object.freeze({code:'CHILD_DESTINY_OR_PARENTING_VERDICT',domain:'CHILDREN_FAMILY',patterns:[
    /\byour child will definitely\b/i,/\byour child is destined\b/i,/\bthis proves you are a (?:good|bad) parent\b/i,
    /你的孩子一定会/u,/你的孩子命中注定/u,/这证明你是(?:好|坏)父母/u
  ]}),
  Object.freeze({code:'SAFETY_GUARANTEE',domain:'SAFETY',patterns:[
    /\bthis guarantees (?:your )?safety\b/i,/\byou are safe because of (?:your )?chart\b/i,
    /这保证你的安全/u,/因为这张图你就是安全的/u
  ]}),
  Object.freeze({code:'RELATIONSHIP_FATE_OR_COMPATIBILITY_SCORE',domain:'RELATIONSHIP',patterns:[
    /\bsoulmate\b/i,/\bdestined relationship\b/i,/\bcompatibility\s*(?:score|rating)?\s*[:=]?\s*\d{1,3}%/i,/\bwill definitely break up\b/i,
    /灵魂伴侣/u,/命定关系/u,/适合度\s*\d{1,3}%/u,/一定会分手/u
  ]}),
  Object.freeze({code:'DEPENDENCY_OR_COMPLETION_CLAIM',domain:'RELATIONSHIP',patterns:[
    /\byou need (?:this|another|a) person to (?:be|become) complete\b/i,/\bthey complete you\b/i,
    /你需要(?:这个|另一个|某个)人才完整/u,/对方让你完整/u
  ]})
]);

function strings(value,path='$',out=[]){
  if(typeof value==='string'){out.push({path,text:value});return out;}
  if(Array.isArray(value)){value.forEach((v,i)=>strings(v,`${path}[${i}]`,out));return out;}
  if(value&&typeof value==='object'){for(const [k,v] of Object.entries(value))strings(v,`${path}.${k}`,out);}
  return out;
}

function isExplicitBoundarySentence(text){
  const s=String(text).toLowerCase();
  return /\b(?:not|never|does not|do not|cannot|can not|isn't|is not|without)\b/.test(s) || /(?:不是|不得|不能|不会|不构成|不等于|避免|禁止)/u.test(text);
}

export function inspectHumanDesignR3SensitiveOutput(value,{allowBoundaryStatements=true}={}){
  const violations=[];
  for(const item of strings(value)){
    for(const rule of FORBIDDEN_RULES){
      if(allowBoundaryStatements&&isExplicitBoundarySentence(item.text)) continue;
      if(rule.patterns.some(pattern=>pattern.test(item.text))){
        violations.push(Object.freeze({code:rule.code,domain:rule.domain,path:item.path,text:item.text.slice(0,360)}));
      }
    }
  }
  return Object.freeze({
    schemaVersion:HD_R3_EPISTEMIC_BOUNDARY_VERSION,
    passed:violations.length===0,
    violations:Object.freeze(violations),
    policy:Object.freeze({safeFraming:SAFE_FRAMING,sensitiveDomains:HD_R3_SENSITIVE_DOMAINS,diagnosisAllowed:false,prescriptionAllowed:false,outcomeGuaranteeAllowed:false,fateClaimAllowed:false,compatibilityScoreAllowed:false,dependencyLanguageAllowed:false})
  });
}

export function assertHumanDesignR3EpistemicBoundaries(value,options={}){
  const result=inspectHumanDesignR3SensitiveOutput(value,options);
  if(!result.passed){
    const summary=result.violations.map(v=>`${v.code}@${v.path}`).join(', ');
    throw new TypeError(`HD_R3_W19_BOUNDARY_VIOLATION: ${summary}`);
  }
  return result;
}

export function humanDesignR3SensitiveDomainBoundary(){
  return Object.freeze({
    schemaVersion:HD_R3_EPISTEMIC_BOUNDARY_VERSION,
    allowedFraming:SAFE_FRAMING,
    sensitiveDomains:HD_R3_SENSITIVE_DOMAINS,
    forbiddenRuleCodes:Object.freeze(FORBIDDEN_RULES.map(x=>x.code)),
    highStakesPolicy:Object.freeze({
      mayReflectOnObservedDecisionProcess:true,
      mayDescribeConfirmedChartStructure:true,
      mayInviteCounterEvidence:true,
      mayReplaceLicensedProfessionalAdvice:false,
      mayDiagnose:false,
      mayPrescribe:false,
      mayGuaranteeOutcome:false,
      mayPredictPregnancy:false,
      mayMakeChildDestinyClaims:false
    })
  });
}
