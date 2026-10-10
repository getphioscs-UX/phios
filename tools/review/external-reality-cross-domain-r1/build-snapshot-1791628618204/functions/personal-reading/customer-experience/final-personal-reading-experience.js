import {createHash} from 'node:crypto';

export const FINAL_PERSONAL_READING_EXPERIENCE_SCHEMA='PHI-OS-FINAL-PERSONAL-READING-EXPERIENCE-v1.0.0';
export const INPUT_PRECISION_BOUNDARY_SCHEMA='PHI-OS-INPUT-NARRATIVE-PRECISION-BOUNDARY-v1.0.0';
export const MY_REALITY_HANDOFF_SCHEMA='PHI-OS-MY-REALITY-HANDOFF-SELECTION-v1.0.0';

const freeze=value=>Object.freeze(value);
const list=value=>Array.isArray(value)?value:[];
const text=value=>String(value??'').trim();
const digest=value=>createHash('sha256').update(JSON.stringify(value)).digest('hex');
const fail=(code,status=422)=>{const error=new Error(code);error.code=code;error.status=status;throw error};

export const W55_W66_FORBIDDEN_FACTUAL_CLASSES=freeze([
  'MEDICAL_DIAGNOSIS','MENTAL_HEALTH_DIAGNOSIS','FINANCIAL_RECOMMENDATION','LEGAL_CONCLUSION',
  'GUARANTEED_FUTURE_EVENT','OBJECTIVE_RELATIONSHIP_FACT','OBJECTIVE_PERSONALITY_FACT',
  'PARTNER_HIDDEN_STATE_INFERENCE','COMPATIBILITY_PERCENTAGE','DESTINY_OR_SOULMATE_VERDICT'
]);

export const W55_W66_CUSTOMER_LIFECYCLE_LABELS=freeze({
  AVAILABLE:'Ready to read',PARTIAL:'Needs more information',DETERMINISTIC:'Calculated from the confirmed input',
  SOURCE_ADMITTED:'Supported by this reading',CUSTOMER_PUBLISHABLE:'Ready to read',MACHINE_VERIFIED:'Checked',
  HUMAN_ADMITTED:'Reviewed',NOT_ESTABLISHED:'Not established',SUPPRESSED:'Not shown'
});

export function assertMethodNarrativeBoundary({claimClass,supportRefs=[],sourceClass=null}={}){
  const klass=text(claimClass).toUpperCase();
  if(!klass)fail('W64_CLAIM_CLASS_REQUIRED');
  if(W55_W66_FORBIDDEN_FACTUAL_CLASSES.includes(klass))fail(`W64_FORBIDDEN_${klass}`,403);
  const refs=list(supportRefs).map(text).filter(Boolean);
  if(klass==='NEW_FACTUAL_PERSONALITY_ASSERTION'&&!refs.length)fail('W64_NEW_FACTUAL_PERSONALITY_ASSERTION_REQUIRES_EVIDENCE');
  if(klass==='NEW_LIFE_EVENT'&&!refs.length)fail('W64_NEW_LIFE_EVENT_REQUIRES_SOURCE');
  if(klass==='RELATIONSHIP_CONTEXT'&&sourceClass==='CUSTOMER_SELF_REPORT')return freeze({allowed:true,objectiveFact:false,sourceClass});
  return freeze({allowed:true,objectiveFact:false,sourceClass:sourceClass||null,supportRefs:freeze(refs)});
}

export function normalizeSensitiveCurrentRealityBoundary({observations=[],purposeCode=null,consent=false,sensitiveConsent=false,persistence='NONE'}={}){
  const items=list(observations).map((item,index)=>freeze({
    observationId:text(item?.observationId)||`CX-CR-${String(index+1).padStart(2,'0')}`,
    statement:text(item?.statement||item?.text),
    sourceClass:text(item?.sourceClass)||'CUSTOMER_SELF_REPORT',
    sensitive:item?.sensitive===true,
    professionalEvidence:item?.professionalEvidence===true
  }));
  const sensitive=items.filter(item=>item.sensitive);
  if(items.length&&consent!==true)fail('W65_EXPLICIT_PURPOSE_CONSENT_REQUIRED',403);
  if(items.length&&!text(purposeCode))fail('W65_PURPOSE_REQUIRED');
  if(sensitive.length&&sensitiveConsent!==true)fail('W65_SENSITIVE_CONSENT_REQUIRED',403);
  if(persistence!=='NONE')fail('W65_HIDDEN_PERSISTENCE_FORBIDDEN',403);
  if(items.some(item=>!item.statement))fail('W65_OBSERVATION_STATEMENT_REQUIRED');
  return freeze({
    purposeCode:text(purposeCode)||null,consent:consent===true,sensitiveConsent:sensitive.length?true:false,
    observations:freeze(items),persistence:'NONE',minimalCollection:true,automaticPersistence:false,
    sourceClasses:freeze(['METHOD_INTERPRETATION','CUSTOMER_SELF_REPORT','PROFESSIONAL_EVIDENCE','AI_NARRATIVE_LANGUAGE']),
    governance:freeze({methodInterpretationIsProfessionalEvidence:false,selfReportIsProfessionalEvidence:false,aiNarrativeIsEvidence:false})
  });
}

const PRECISION_ORDER=freeze({UNKNOWN:0,LOW:1,MEDIUM:2,HIGH:3,EXACT:4,NOT_APPLICABLE:5});
const precision=value=>Object.prototype.hasOwnProperty.call(PRECISION_ORDER,text(value).toUpperCase())?text(value).toUpperCase():'UNKNOWN';
function weakest(values){const active=values.filter(v=>v!=='NOT_APPLICABLE');if(!active.length)return 'NOT_APPLICABLE';return active.reduce((a,b)=>PRECISION_ORDER[a]<=PRECISION_ORDER[b]?a:b,'EXACT')}

export function buildInputPrecisionBoundary({
  birthTime='UNKNOWN',timezone='UNKNOWN',location='UNKNOWN',calendarBoundary='UNKNOWN',houseCuspProximity='UNKNOWN',
  solarTermBoundary='UNKNOWN',ziWeiHour='UNKNOWN',baZiHourPillar='UNKNOWN',numerologyName='UNKNOWN',
  participantAPrecision='HIGH',participantBPrecision='NOT_APPLICABLE',dependencies=[]
}={}){
  const dimensions=freeze({birthTime:precision(birthTime),timezone:precision(timezone),location:precision(location),calendarBoundary:precision(calendarBoundary),houseCuspProximity:precision(houseCuspProximity),solarTermBoundary:precision(solarTermBoundary),ziWeiHour:precision(ziWeiHour),baZiHourPillar:precision(baZiHourPillar),numerologyName:precision(numerologyName),participantAPrecision:precision(participantAPrecision),participantBPrecision:precision(participantBPrecision)});
  const used=list(dependencies).map(text).filter(key=>Object.prototype.hasOwnProperty.call(dimensions,key));
  const considered=used.length?used:Object.keys(dimensions).filter(key=>dimensions[key]!=='NOT_APPLICABLE');
  const overall=weakest(considered.map(key=>dimensions[key]));
  const wording=overall==='EXACT'||overall==='HIGH'?'QUALIFIED_DIRECT':overall==='MEDIUM'?'QUALIFIED':overall==='LOW'?'TENTATIVE':'WITHHOLD_HIGH_PRECISION';
  return freeze({schemaVersion:INPUT_PRECISION_BOUNDARY_SCHEMA,dimensions,dependencies:freeze(considered),overallPrecision:overall,narrativeWordingPolicy:wording,certaintyMayExceedInput:false,aiMayImproveReadabilityOnly:true});
}

export function applyNarrativePrecisionBoundary({inputPrecision,claimPrecision='HIGH',requestedCertainty='DIRECT'}={}){
  if(inputPrecision?.schemaVersion!==INPUT_PRECISION_BOUNDARY_SCHEMA)fail('W66_INPUT_PRECISION_BOUNDARY_REQUIRED');
  const available=precision(inputPrecision.overallPrecision),claim=precision(claimPrecision);
  const allowed=PRECISION_ORDER[available]>=PRECISION_ORDER[claim]&&available!=='UNKNOWN';
  const maxCertainty=available==='EXACT'||available==='HIGH'?'QUALIFIED_DIRECT':available==='MEDIUM'?'QUALIFIED':available==='LOW'?'TENTATIVE':'WITHHOLD';
  return freeze({allowed,requestedCertainty:text(requestedCertainty)||'DIRECT',maxCertainty,outputCertainty:allowed?maxCertainty:'WITHHOLD',certaintyRaised:false});
}

function methodProducts(view){
  const route=view?.productRoute||{};
  if(route.mode==='SINGLE_METHOD')return route.primaryProduct?[route.primaryProduct]:[];
  return list(route.products);
}
function methodId(product){return text(product?.methodId||product?.methodCode).toUpperCase()}
const METHOD_LABELS=freeze({ECR:'PHI Configuration',AST:'Astrology',BZR:'BaZi',ZWR:'Zi Wei',HD:'Human Design',NUM:'Numerology'});
function hasProfile(view){return Boolean(list(view?.profileSignals).length||view?.profileView||view?.profileSummary||view?.profile?.signals?.length)}
function relationshipIntent(view){return view?.relationshipIntent||view?.relationship?.intent||view?.relationshipNarrativeBrief?.relationshipIntent||null}
function hasCross(view){return Boolean(view?.crossPerspectiveReading||view?.reading?.combinedReading||view?.crossSourcePerspective||view?.relationshipCrossPerspective)}
function narrativeState(view){
  const ready=view?.narrativeReading?.generationState==='READY'||view?.narrativeReading?.state==='READY';
  const preview=Boolean(view?.narrativePreview);
  return ready?'READY':preview?'PREVIEW':'NOT_AVAILABLE';
}
function section(id,label,visible=true,sourceRef=null){return freeze({sectionId:id,label,visible:visible===true,sourceRef:sourceRef||null})}

export function buildFinalPersonalReadingExperience({view={},locale='en',inputPrecision=null}={}){
  const lang=locale==='zh-Hans'?'zh-Hans':'en',products=methodProducts(view),ids=new Set(products.map(methodId));
  if(view?.humanDesignContext?.confirmed===true||view?.humanDesignContext||view?.humanDesignProfessionalReading)ids.add('HD');
  const profile=hasProfile(view),rel=relationshipIntent(view),cross=hasCross(view),nState=narrativeState(view);
  const sections=[
    section('OVERVIEW',lang==='zh-Hans'?'总览':'Overview',true,'W51/W52'),
    section('MY_READING',lang==='zh-Hans'?'我的读取':'My Reading',products.length>0||ids.has('HD'),'PersonalReadingReportIR'),
    section('MY_NARRATIVE',lang==='zh-Hans'?'我的叙事':'My Narrative',true,nState==='READY'?'NarrativeReadingIR':nState==='PREVIEW'?'NarrativePreview':null),
    section('PROFILE_ASSESSMENT',lang==='zh-Hans'?'Profile 与自我评估':'Profile & Assessment',profile,'ProfileSignalEnvelope'),
    ...['ECR','AST','BZR','ZWR','HD','NUM'].map(id=>section(`METHOD_${id}`,METHOD_LABELS[id],ids.has(id),id)),
    section('RELATIONSHIP',lang==='zh-Hans'?'关系读取':'Relationship',Boolean(rel),'RelationshipIntent'),
    section('CROSS_PERSPECTIVE',lang==='zh-Hans'?'跨视角':'Cross-Perspective',cross,'CrossPerspectiveIR'),
    section('CURRENT_REALITY',lang==='zh-Hans'?'当前现实':'Current Reality',Boolean(view?.currentReality),'CurrentReality'),
    section('SOURCES_DETAILS',lang==='zh-Hans'?'来源与细节':'Sources & Details',true,'TechnicalLineage')
  ];
  const readingRefs=products.map(product=>text(product?.productId||product?.projectionId||product?.methodId)).filter(Boolean);
  const overview=freeze({
    sourceAuthority:'W51_W52_ONLY',newMeaningCreated:false,
    readingRefs:freeze(readingRefs),narrativeState:nState,
    profileAvailable:profile,relationshipAvailable:Boolean(rel),crossPerspectiveAvailable:cross,currentRealityAvailable:Boolean(view?.currentReality)
  });
  const crossGroups=freeze(['COMMON_EMPHASIS','COMPLEMENTARY_VIEW','TENSION','NON_CONVERGENCE','REALITY_SUPPORTED','REALITY_CONTRADICTED','OPEN',...(profile?['PROFILE_ALIGNMENT','PROFILE_DIFFERENCE','SOURCE_TENSION']:[])]);
  const technicalDrawer=freeze({collapsedByDefault:true,fields:freeze(['methodVersion','projectionId','digest','meaningAuthority','compositionVersion','admissionRef','ephemeris','houseSystem','timezoneLineage','sourceReferences','narrativeBriefDigest','narrativeProductVersion','writerVersion','verifierVersion','verificationSummary'])});
  const surfaces=freeze({free:freeze({web:'PersonalReadingReportIR',print:'PersonalReadingReportIR',pdf:'PersonalReadingReportIR'}),paid:freeze({web:'NarrativeReadingIR',print:'NarrativeReadingIR',pdf:'NarrativeReadingIR'}),oneProductOneSemanticIr:true});
  const precisionBoundary=inputPrecision?.schemaVersion===INPUT_PRECISION_BOUNDARY_SCHEMA?inputPrecision:null;
  const core={schemaVersion:FINAL_PERSONAL_READING_EXPERIENCE_SCHEMA,locale:lang,sections:freeze(sections),overview,crossGroups,technicalDrawer,surfaces,precisionBoundary,customerLanguage:freeze({internalLifecycleLabelsHiddenByDefault:true}),myRealityHandoff:freeze({explicitActionRequired:true,allowedFields:freeze(['selectedInsight','openQuestion','currentRealityObservation','observationTarget','actionCandidate']),automaticPersistence:false}),boundaries:freeze({medicalDiagnosis:false,mentalHealthDiagnosis:false,financialRecommendation:false,legalConclusion:false,guaranteedFuture:false,objectiveRelationshipFact:false,objectivePersonalityFact:false,compatibilityScore:false,partnerMindReading:false}),governance:freeze({newMeaningAuthorityCreated:false,newNarrativeAuthorityCreated:false,specialistProductsRemainMethodNative:true,profileConditional:true,relationshipConditional:true,technicalCollapsed:true})};
  return freeze({...core,semanticDigest:digest(core)});
}

export function buildExplicitMyRealityHandoff({selectedInsight=null,openQuestion=null,currentRealityObservation=null,observationTarget=null,actionCandidate=null,consent=false}={}){
  if(consent!==true)fail('W63_HANDOFF_EXPLICIT_CONSENT_REQUIRED',403);
  const payload={schemaVersion:MY_REALITY_HANDOFF_SCHEMA,selectedInsight:text(selectedInsight)||null,openQuestion:text(openQuestion)||null,currentRealityObservation:text(currentRealityObservation)||null,observationTarget:text(observationTarget)||null,actionCandidate:text(actionCandidate)||null};
  if(!Object.values(payload).some((value,key)=>key>0&&Boolean(value)))fail('W63_HANDOFF_SELECTION_REQUIRED');
  return freeze({...payload,automaticPersistence:false,customerSelected:true});
}

export function derivePersonalInputPrecisionFromRequest({body={},location=null,selectedMethods=[]}={}){
  const selected=new Set(list(selectedMethods).map(x=>text(x).toLowerCase()));
  const hasTime=!body?.birthTimeUnknown&&Boolean(text(body?.birthTime));
  const hasLocation=Boolean(location?.timezone?.iana||location?.timeZone||location?.displayName);
  const birthTime=selected.has('numeric')&&selected.size===1?'NOT_APPLICABLE':hasTime?'HIGH':'LOW';
  const timezone=(selected.has('astrology')||selected.has('bazi')||selected.has('ziwei')||selected.has('ecr'))?(hasLocation?'HIGH':'LOW'):'NOT_APPLICABLE';
  const locationPrecision=(selected.has('astrology')||selected.has('bazi')||selected.has('ziwei')||selected.has('ecr'))?(hasLocation?'HIGH':'LOW'):'NOT_APPLICABLE';
  const ziWeiHour=selected.has('ziwei')?(hasTime?'HIGH':'LOW'):'NOT_APPLICABLE';
  const baZiHourPillar=selected.has('bazi')?(hasTime?'HIGH':'LOW'):'NOT_APPLICABLE';
  const numerologyName=selected.has('numeric')?(body?.numerologyNameConfirmed===true?'HIGH':'LOW'):'NOT_APPLICABLE';
  const houseCuspProximity=selected.has('astrology')?'UNKNOWN':'NOT_APPLICABLE';
  const solarTermBoundary=selected.has('bazi')?'UNKNOWN':'NOT_APPLICABLE';
  return buildInputPrecisionBoundary({birthTime,timezone,location:locationPrecision,calendarBoundary:'UNKNOWN',houseCuspProximity,solarTermBoundary,ziWeiHour,baZiHourPillar,numerologyName,dependencies:['birthTime','timezone','location','houseCuspProximity','solarTermBoundary','ziWeiHour','baZiHourPillar','numerologyName']});
}

export default freeze({buildFinalPersonalReadingExperience,buildInputPrecisionBoundary,applyNarrativePrecisionBoundary,assertMethodNarrativeBoundary,normalizeSensitiveCurrentRealityBoundary,buildExplicitMyRealityHandoff,derivePersonalInputPrecisionFromRequest});
