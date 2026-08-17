const PROFESSIONAL_DOMAINS = new Set(['MEDICAL','MENTAL_HEALTH','LEGAL','FINANCIAL','PROFESSIONAL_JUDGMENT']);
const DEFAULT_MODES = new Set(['EXPLAIN','OBSERVE','COMPARE','EXPLORE']);
const COVERAGE_GAPS = new Set(['PARTIAL','INSUFFICIENT']);
const OUTCOME_EVENTS = new Set(['answerViewed','relatedKnowledgeOpened','followUpAsked','guidedStarted','journeyStarted','helpfulFeedback']);
const FORBIDDEN_ANALYTICS_FIELDS = new Set(['question','rawQuestion','answer','rawAnswer','userId','email','caseId','realityCaseId','birthDate','birthTime','birthPlace']);
const FORBIDDEN_MUTATIONS = new Set(['CREATE_CANONICAL_NODE','CHANGE_THESIS','CHANGE_RELATIONSHIP','PUBLISH_ARTICLE']);
const ALLOWED_LOCALES = new Set(['en','zh-Hans']);

const clean = value => String(value ?? '').trim();
const arr = value => Array.isArray(value) ? value : [];
const bool = value => value === true;
const unique = value => [...new Set(arr(value).map(clean).filter(Boolean))];
const freeze = value => Object.freeze(value);

function error(code){const e=new Error(code);e.code=code;return e;}
function assertNoForbiddenFields(input, forbidden=FORBIDDEN_ANALYTICS_FIELDS){
  for (const key of forbidden) if (Object.prototype.hasOwnProperty.call(input||{}, key) && input[key] != null) throw error(`KAP_PHASE18_PRIVATE_FIELD_FORBIDDEN:${key}`);
}

export function evaluateProfessionalBoundary({domain='GENERAL',mode='EXPLAIN',requiresLicensedJudgment=false,hasQualifiedExternalAuthority=false}={}){
  const normalizedDomain=clean(domain).toUpperCase()||'GENERAL';
  const normalizedMode=clean(mode).toUpperCase()||'EXPLAIN';
  const professionalDomain=PROFESSIONAL_DOMAINS.has(normalizedDomain);
  const defaultMode=DEFAULT_MODES.has(normalizedMode);
  const externalAuthorityRequired=professionalDomain && (requiresLicensedJudgment===true || !defaultMode);
  return freeze({
    schemaVersion:'PHI-OS-KAP-W30-PROFESSIONAL-BOUNDARY-DECISION-v1.0.0',
    domain:normalizedDomain,
    mode:normalizedMode,
    professionalDomain,
    decision:externalAuthorityRequired&&!hasQualifiedExternalAuthority?'BOUNDARY_LIMITED':'EXPLANATION_ALLOWED',
    externalAuthorityRequired,
    qualifiedExternalAuthorityPresent:Boolean(hasQualifiedExternalAuthority),
    governance:freeze({kapMayExplain:true,kapMayObserve:true,kapMayCompare:true,kapMayExplore:true,kapMayReplaceLicensedJudgment:false,professionalJudgmentAuthorityCreated:false})
  });
}

export function evaluateExplanationAdviceBoundary({statementMode='EXPLAIN',certainty='BOUNDED'}={}){
  const mode=clean(statementMode).toUpperCase();
  const c=clean(certainty).toUpperCase();
  const adviceLike=['ADVISE','DIRECT','PRESCRIBE','MANDATE'].includes(mode);
  const unsupportedAbsolute=['DEFINITE','ABSOLUTE','CERTAIN'].includes(c);
  return freeze({schemaVersion:'PHI-OS-KAP-W31-EXPLANATION-ADVICE-DECISION-v1.0.0',statementMode:mode||'EXPLAIN',certainty:c||'BOUNDED',status:adviceLike||unsupportedAbsolute?'CAUTION_OR_EXTERNAL_AUTHORITY_REQUIRED':'EXPLANATION_DEFAULT',preferredModes:freeze(['EXPLAIN','OBSERVE','COMPARE','EXPLORE']),avoidUnqualifiedPhrases:freeze(['You should','You must','This definitely means'])});
}

export function evaluatePersonalizationBoundary({evidenceRefs=[],claimType='GENERAL',personalAssertion=false}={}){
  const evidence=unique(evidenceRefs);
  const personal=personalAssertion===true || clean(claimType).toUpperCase()==='PERSONAL';
  const groundedPersonal=personal && evidence.length>0;
  return freeze({
    schemaVersion:'PHI-OS-KAP-W32-PERSONALIZATION-BOUNDARY-DECISION-v1.0.0',
    personal,
    evidenceRefs:freeze(evidence),
    status:personal?(groundedPersonal?'EVIDENCE_BOUND_PERSONALIZATION_ALLOWED':'PROPOSITIONAL_ONLY'):'GENERAL_EXPLANATION',
    mayAssertThisIsHappeningToYou:groundedPersonal,
    requiredLanguage:personal&&!groundedPersonal?'MAY_BE_CONSISTENT_WITH':null,
    governance:freeze({evidenceRequiredForPersonalAssertion:true,clientDescriptionIsNotCanonicalReality:true})
  });
}

export function evaluateGroundedAcceptance({claims=[],allNodesExist=true,publicationOwnershipValid=true,relationshipsGoverned=true,noBPrefixInference=true,noFakeCitation=true}={}){
  const normalized=arr(claims).map((claim,index)=>({
    claimId:clean(claim?.claimId)||`CLAIM-${index+1}`,
    grounded:bool(claim?.grounded),
    sourceRefs:unique(claim?.sourceRefs),
    certainty:clean(claim?.certainty).toUpperCase()||'BOUNDED',
    publicationContextSource:clean(claim?.publicationContextSource)||'EXPLICIT_OR_GOVERNED'
  }));
  const allClaimsGrounded=normalized.length>0 && normalized.every(c=>c.grounded&&c.sourceRefs.length>0);
  const noUnsupportedCertainty=normalized.every(c=>!['UNSUPPORTED','ABSOLUTE_WITHOUT_EVIDENCE'].includes(c.certainty));
  const publicationContextExplicit=normalized.every(c=>c.publicationContextSource!=='NODE_CODE_B_PREFIX_INFERENCE');
  const checks={allClaimsGrounded,allNodesExist:Boolean(allNodesExist),publicationOwnershipValid:Boolean(publicationOwnershipValid),relationshipsGoverned:Boolean(relationshipsGoverned),noBPrefixInference:Boolean(noBPrefixInference)&&publicationContextExplicit,noFakeCitation:Boolean(noFakeCitation),noUnsupportedCertainty};
  const passed=Object.values(checks).every(Boolean);
  return freeze({schemaVersion:'PHI-OS-KAP-W33-GROUNDED-ACCEPTANCE-v1.0.0',status:passed?'ACCEPTED':'REJECTED',checks:freeze(checks),claimCount:normalized.length,claims:freeze(normalized.map(freeze))});
}

export function evaluateLocaleRegression({en,zhHans}={}){
  if(!en||!zhHans) throw error('KAP_W35_BOTH_LOCALES_REQUIRED');
  const extract=x=>({authority:clean(x.authority),boundary:clean(x.boundary),meaningKey:clean(x.meaningKey)});
  const a=extract(en),b=extract(zhHans);
  const checks={sameAuthority:a.authority===b.authority,sameBoundary:a.boundary===b.boundary,sameMeaning:a.meaningKey===b.meaningKey};
  return freeze({schemaVersion:'PHI-OS-KAP-W35-LOCALE-REGRESSION-v1.0.0',locales:freeze(['en','zh-Hans']),status:Object.values(checks).every(Boolean)?'PARITY_ACCEPTED':'PARITY_REJECTED',checks:freeze(checks)});
}

export function buildRetrievalCachePolicy({locale='en',knowledgeRevision,scope='GENERIC',containsPrivateContext=false}={}){
  if(!ALLOWED_LOCALES.has(locale)) throw error('KAP_W36_LOCALE_UNSUPPORTED');
  const revision=clean(knowledgeRevision); if(!revision) throw error('KAP_W36_KNOWLEDGE_REVISION_REQUIRED');
  const privateContext=containsPrivateContext===true || clean(scope).toUpperCase()!=='GENERIC';
  return freeze({schemaVersion:'PHI-OS-KAP-W36-RETRIEVAL-CACHE-POLICY-v1.0.0',cacheable:!privateContext,cacheKeyParts:freeze(['normalization','nodeRelation','groundingFragments','publishedRefs','locale','knowledgeRevision']),locale,knowledgeRevision:revision,privateContextExcluded:true,reason:privateContext?'PRIVATE_OR_PERSONAL_CONTEXT_NOT_SHARED_CACHEABLE':'GENERIC_GOVERNED_RETRIEVAL_CACHEABLE'});
}

export function buildAnswerCachePolicy({answerClass='GENERIC',personalized=false,privateContext=false,historyBound=false}={}){
  const personal=personalized===true||privateContext===true||historyBound===true||clean(answerClass).toUpperCase()==='PERSONAL';
  return freeze({schemaVersion:'PHI-OS-KAP-W37-ANSWER-CACHE-POLICY-v1.0.0',answerClass:personal?'PERSONAL':'GENERIC',sharedCacheAllowed:!personal,sessionReuseAllowed:true,personalizedAnswerMayBeSimplyReused:false,reason:personal?'PERSONAL_CONTEXT_REQUIRES_CONTEXT_BOUND_RECOMPOSITION':'GENERIC_ANSWER_MAY_BE_CACHED'});
}

export function evaluateAiBudget({plan='FREE',answerMode='QUICK',sessionSpend=0,userSpend=0,budget={}}={}){
  const normalizedPlan=clean(plan).toUpperCase()||'FREE';
  const normalizedMode=clean(answerMode).toUpperCase()||'QUICK';
  const sessionLimit=Number.isFinite(Number(budget.sessionLimit))?Number(budget.sessionLimit):Infinity;
  const userLimit=Number.isFinite(Number(budget.userLimit))?Number(budget.userLimit):Infinity;
  const modeAllowed=arr(budget.allowedAnswerModes).length===0||arr(budget.allowedAnswerModes).map(x=>clean(x).toUpperCase()).includes(normalizedMode);
  const withinBudget=Number(sessionSpend)<=sessionLimit&&Number(userSpend)<=userLimit&&modeAllowed;
  return freeze({schemaVersion:'PHI-OS-KAP-W38-AI-BUDGET-DECISION-v1.0.0',plan:normalizedPlan,answerMode:normalizedMode,status:withinBudget?'AI_BUDGET_ELIGIBLE':'DETERMINISTIC_FALLBACK_REQUIRED',withinBudget,knowledgeAuthorityQualityMayBeLowered:false,aiIsKnowledgeAuthority:false,deterministicFallbackRequired:true});
}

export function resolveAiFailureFallback({aiAvailable=true,deterministicAnswer}={}){
  if(aiAvailable) return freeze({schemaVersion:'PHI-OS-KAP-W39-AI-FAILURE-FALLBACK-v1.0.0',status:'AI_AVAILABLE',fallbackUsed:false,answer:deterministicAnswer??null});
  if(!deterministicAnswer) throw error('KAP_W39_DETERMINISTIC_ANSWER_REQUIRED');
  return freeze({schemaVersion:'PHI-OS-KAP-W39-AI-FAILURE-FALLBACK-v1.0.0',status:'DETERMINISTIC_FALLBACK_ACTIVE',fallbackUsed:true,answer:deterministicAnswer,authorityQualityReduced:false});
}

export function buildOutcomeSignal(input={}){
  assertNoForbiddenFields(input);
  const event=clean(input.event); if(!OUTCOME_EVENTS.has(event)) throw error('KAP_W40_OUTCOME_EVENT_UNSUPPORTED');
  const locale=clean(input.locale)||'en'; if(!ALLOWED_LOCALES.has(locale)) throw error('KAP_W40_LOCALE_UNSUPPORTED');
  return freeze({schemaVersion:'PHI-OS-KAP-W40-OUTCOME-SIGNAL-v1.0.0',event,locale,entrySurface:clean(input.entrySurface)||'UNKNOWN',answerMode:clean(input.answerMode)||'UNKNOWN',clusterCode:clean(input.clusterCode)||null,value:input.value??true,privacy:freeze({dataClass:'ANONYMOUS_PRODUCT_SIGNAL',rawQuestionStored:false,rawAnswerStored:false,userIdStored:false,caseIdStored:false})});
}

export function buildKnowledgeGapSignal({coverageStatus,frequency=0,clusterCode,matchedNodes=[]}={}){
  const raw=clean(coverageStatus).toUpperCase();
  const gap=raw==='PARTIAL_COVERAGE'?'PARTIAL':raw==='INSUFFICIENT_COVERAGE'?'INSUFFICIENT':raw;
  if(!COVERAGE_GAPS.has(gap)) return freeze({schemaVersion:'PHI-OS-KAP-W41-KNOWLEDGE-GAP-SIGNAL-v1.0.0',status:'NO_GAP_SIGNAL',coverageGap:gap||'NONE'});
  const n=Number(frequency); if(!Number.isFinite(n)||n<0) throw error('KAP_W41_FREQUENCY_INVALID');
  const highFrequency=n>=3;
  return freeze({schemaVersion:'PHI-OS-KAP-W41-KNOWLEDGE-GAP-SIGNAL-v1.0.0',status:highFrequency?'KNOWLEDGE_GAP_REGISTRY_ELIGIBLE':'OBSERVE_ONLY',coverageGap:gap,frequency:n,clusterCode:clean(clusterCode)||null,matchedNodes:freeze(unique(matchedNodes)),authority:freeze({createsCanonicalNode:false,changesThesis:false,changesRelationship:false,publishesArticle:false,pcaKppPlanningSignalOnly:true})});
}

export function assertNoAutomaticMutation({actions=[]}={}){
  const normalized=unique(actions).map(x=>x.toUpperCase());
  const blocked=normalized.filter(x=>FORBIDDEN_MUTATIONS.has(x));
  if(blocked.length) throw error(`KAP_W42_AUTOMATIC_MUTATION_FORBIDDEN:${blocked.join(',')}`);
  return freeze({schemaVersion:'PHI-OS-KAP-W42-NO-AUTOMATIC-MUTATION-v1.0.0',status:'NO_AUTOMATIC_CANONICAL_OR_PUBLICATION_MUTATION',actions:freeze(normalized)});
}

export function evaluateAnswerEntitlement({plan='FREE',requestedDepth='STANDARD',requestHistory=false,requestFollowUp=false,requestGuided=false,policy={}}={}){
  const p=clean(plan).toUpperCase()||'FREE';
  const depth=clean(requestedDepth).toUpperCase()||'STANDARD';
  const allowedDepths=arr(policy.allowedDepths).length?arr(policy.allowedDepths).map(x=>clean(x).toUpperCase()):['QUICK','STANDARD'];
  const isMember=p!=='FREE'&&p!=='GUEST';
  return freeze({schemaVersion:'PHI-OS-KAP-W43-W44-ANSWER-ENTITLEMENT-v1.0.0',plan:p,access:freeze({depthAllowed:allowedDepths.includes(depth),historyAllowed:isMember&&policy.history!==false,followUpContinuityAllowed:isMember&&policy.followUpContinuity!==false,guidedReadingAllowed:isMember&&policy.guidedReading!==false}),requested:freeze({depth,history:Boolean(requestHistory),followUp:Boolean(requestFollowUp),guided:Boolean(requestGuided)}),knowledgeAuthorityQuality:'SAME_FOR_ALL_PLANS',subscriptionCreatesKnowledgeAuthority:false});
}

export function evaluateMethodJourneyEntitlement({methodCode,paidAccess=false,mpaDispatchAllowed=false,mcdProductionAvailable=false,readingDepthAllowed=true,journeyStorageAllowed=false}={}){
  const code=clean(methodCode).toUpperCase();
  const methodRequested=Boolean(code);
  const methodAllowed=methodRequested&&paidAccess===true&&mpaDispatchAllowed===true&&mcdProductionAvailable===true;
  return freeze({schemaVersion:'PHI-OS-KAP-W45-METHOD-JOURNEY-ENTITLEMENT-v1.0.0',methodCode:code||null,access:freeze({paidAccess:Boolean(paidAccess),methodAllowed,readingDepthAllowed:Boolean(readingDepthAllowed),journeyStorageAllowed:Boolean(journeyStorageAllowed)}),reason:!methodRequested?'NO_METHOD_REQUESTED':!paidAccess?'ENTITLEMENT_REQUIRED':!mpaDispatchAllowed?'MPA_BLOCKED':!mcdProductionAvailable?'MCD_PRODUCTION_UNAVAILABLE':'AUTHORIZED_ACCESS',authority:freeze({subscriptionCreatesMethodProductionAuthority:false,mpaControlsMethodProductionAuthority:true,mcdCannotGrantAuthority:true,frontendCannotGrantAuthority:true,rendererCannotGrantAuthority:true})});
}

export const KAP_PHASE18_CONSTANTS=freeze({professionalDomains:freeze([...PROFESSIONAL_DOMAINS]),defaultModes:freeze([...DEFAULT_MODES]),outcomeEvents:freeze([...OUTCOME_EVENTS]),forbiddenMutations:freeze([...FORBIDDEN_MUTATIONS])});
