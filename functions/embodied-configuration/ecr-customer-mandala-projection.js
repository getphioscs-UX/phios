import {getEcrCanonicalOntology} from './ecr-ontology-registry.js';
import {ECR_CALCULATION_SPEC_RUNTIME} from './ecr-calculation-spec-runtime.js';

export const ECR_CUSTOMER_MANDALA_PROJECTION_SCHEMA='PHI-OS-ECR-CUSTOMER-MANDALA-PROJECTION-v1.0.0';
const READING_IR_SCHEMA='PHI-OS-ECR-RUNTIME-READING-IR-v1.0.0';
const freeze=value=>{if(value&&typeof value==='object'&&!Object.isFrozen(value)){Object.freeze(value);for(const child of Object.values(value))freeze(child)}return value};
const list=value=>Array.isArray(value)?value:[];
const fail=(code,details={})=>{throw Object.assign(new Error(code),{code,...details})};
const code=item=>String(item?.code||'');
const numeric=value=>Number.isFinite(Number(value))?Number(value):null;
const requiredOne=(items,label)=>{const xs=list(items);if(xs.length!==1||!code(xs[0]))fail(`ECR_MANDALA_${label}_SELECTION_REQUIRED`);return xs[0]};
const by=(items,key,id,label)=>{const found=list(items).find(item=>item?.[key]===id);if(!found)fail(`ECR_MANDALA_${label}_AUTHORITY_MISSING`,{id});return found};
const ordinal=id=>{const match=String(id||'').match(/(\d+)$/);return match?Number(match[1]):null};

function publicContext(item,index){return freeze({contextId:item.contextId,ordinal:index+1,zodiacCode:item.zodiacCode,label:item.label,labelZhHans:item.labelZhHans,startLongitudeInclusive:item.startLongitudeInclusive,endLongitudeExclusive:item.endLongitudeExclusive});}
function publicGrammar(item,index){return freeze({grammarId:item.code,ordinal:index+1,label:item.label,labelZhHans:item.chineseLabel});}
function publicQuestion(item,index){return freeze({questionId:item.questionId,ordinal:index+1,question:item.question,questionZhHans:item.questionZhHans});}
function publicCapability(item,index){return freeze({capabilityId:item.id,ordinal:index+1,label:item.label,labelZhHans:item.bookZh||item.zh});}
function publicDriver(item,index){return freeze({driverId:item.id,ordinal:index+1,label:item.label,labelZhHans:item.zh});}
function publicMotion(item,index){return freeze({motionId:item.motionId,ordinal:index+1,trigramCode:item.trigramCode,trigramRef:item.trigramRef,trigramZhHans:item.trigramZhHans,label:item.label,labelZhHans:item.labelZhHans,role:item.role});}
function publicConfiguration(item,index){return freeze({configurationId:item.configurationId,ordinal:index+1,environmentOrder:item.environmentOrder,hexagramRef:item.hexagramRef,kingWenNumber:item.kingWenNumber,canonicalName:item.canonicalName,chineseNameZhHans:item.chineseNameZhHans,upperTrigramRef:item.upperTrigramRef,lowerTrigramRef:item.lowerTrigramRef,environmentPriorityMotionId:item.environmentPriorityMotionId,embodiedResponseMotionId:item.embodiedResponseMotionId,rule:item.rule});}
function publicActivation(item,index){return freeze({activationId:item.activationId,ordinal:index+1,code:item.code,label:item.label,labelZhHans:item.labelZhHans,role:item.role});}

function selectedDriver(item,authority){
  return freeze({driverId:authority.id,label:authority.label,labelZhHans:authority.zh,rank:numeric(item?.meta?.rank),baselineAffinity:numeric(item?.value),angularDistanceDegrees:numeric(item?.meta?.angularDistanceDegrees),classification:item?.meta?.classification||'BASELINE_AFFINITY_NOT_CURRENT_REALITY_PRIORITY'});
}

function validateDriverSelection(driverItems,driverAuthority){
  if(driverItems.length!==driverAuthority.length)fail('ECR_MANDALA_DRIVER_STACK_INCOMPLETE',{actual:driverItems.length,expected:driverAuthority.length});
  const ids=driverItems.map(code);if(new Set(ids).size!==driverAuthority.length)fail('ECR_MANDALA_DRIVER_STACK_DUPLICATED');
  for(const authority of driverAuthority)if(!ids.includes(authority.id))fail('ECR_MANDALA_DRIVER_AUTHORITY_ITEM_MISSING',{driverId:authority.id});
}

export function buildEcrCustomerMandalaProjection(readingIR){
  if(readingIR?.schemaVersion!==READING_IR_SCHEMA)fail('ECR_MANDALA_READING_IR_REQUIRED');
  if(!readingIR.sourceProjectionId)fail('ECR_MANDALA_SOURCE_PROJECTION_ID_REQUIRED');
  const anchorLongitude=numeric(readingIR?.sections?.coordinate?.anchorLongitude);if(anchorLongitude===null)fail('ECR_MANDALA_ANCHOR_LONGITUDE_REQUIRED');

  const ontology=getEcrCanonicalOntology(),core=ontology.coreTheory,specific=ontology.ecrSpecific,spec=ECR_CALCULATION_SPEC_RUNTIME;
  const contexts=specific.cosmologicalContext.map(publicContext);
  const grammars=core.grammarCodes.map((id,index)=>publicGrammar(core.grammars[id],index));
  const questions=core.questionCodes.map((id,index)=>publicQuestion(core.questions[id],index));
  const capabilities=core.capabilities.map(publicCapability),drivers=core.drivers.map(publicDriver),motions=specific.motions.map(publicMotion),configurations=specific.configurations.map(publicConfiguration),activations=specific.activations.map(publicActivation);
  const expectedCounts={contexts:12,grammars:16,questions:16,capabilities:9,drivers:12,motions:8,configurations:64,activations:8};
  for(const [key,count] of Object.entries(expectedCounts))if({contexts,grammars,questions,capabilities,drivers,motions,configurations,activations}[key].length!==count)fail('ECR_MANDALA_AUTHORITY_COUNT_DRIFT',{key,actual:{contexts,grammars,questions,capabilities,drivers,motions,configurations,activations}[key].length,expected:count});

  const contextItem=requiredOne(readingIR?.sections?.coordinate?.context,'CONTEXT');
  const grammarItem=requiredOne(readingIR?.sections?.coordinate?.grammar,'GRAMMAR');
  const questionItem=requiredOne(readingIR?.sections?.coordinate?.question,'QUESTION');
  const motionItem=requiredOne(readingIR?.sections?.change?.motion,'MOTION');
  const configurationItem=requiredOne(readingIR?.sections?.change?.configuration,'CONFIGURATION');
  const activationItem=requiredOne(readingIR?.sections?.change?.activation,'ACTIVATION');
  const capabilityItems=list(readingIR?.sections?.response?.capabilities),driverItems=list(readingIR?.sections?.response?.driverPriority);
  if(!capabilityItems.length)fail('ECR_MANDALA_CAPABILITY_SELECTION_REQUIRED');
  validateDriverSelection(driverItems,core.drivers);

  const context=by(specific.cosmologicalContext,'contextId',code(contextItem),'CONTEXT');
  const grammar=by(Object.values(core.grammars),'code',code(grammarItem),'GRAMMAR');
  const question=by(Object.values(core.questions),'questionId',code(questionItem),'QUESTION');
  const motion=by(specific.motions,'motionId',code(motionItem),'MOTION');
  const configuration=by(specific.configurations,'configurationId',code(configurationItem),'CONFIGURATION');
  const activation=by(specific.activations,'activationId',code(activationItem),'ACTIVATION');
  const primaryItem=capabilityItems.find(item=>item?.meta?.priority==='PRIMARY'||item?.value==='PRIMARY');
  const supportingItems=capabilityItems.filter(item=>item!==primaryItem&&(item?.meta?.priority==='SUPPORTING'||item?.value==='SUPPORTING'));
  if(!primaryItem)fail('ECR_MANDALA_PRIMARY_CAPABILITY_REQUIRED');
  const primaryCapability=by(core.capabilities,'id',code(primaryItem),'CAPABILITY');
  const supportingCapabilities=supportingItems.map(item=>by(core.capabilities,'id',code(item),'CAPABILITY'));

  const grammarOrdinal=ordinal(grammar.code),questionOrdinal=ordinal(question.questionId);
  if(grammarOrdinal!==questionOrdinal)fail('ECR_MANDALA_GRAMMAR_QUESTION_LINEAGE_MISMATCH',{grammarId:grammar.code,questionId:question.questionId});
  const capabilityRule=spec.questionCapabilityMatrix[question.questionId];if(!capabilityRule)fail('ECR_MANDALA_QUESTION_CAPABILITY_AUTHORITY_MISSING',{questionId:question.questionId});
  if(primaryCapability.id!==capabilityRule.primary)fail('ECR_MANDALA_PRIMARY_CAPABILITY_LINEAGE_MISMATCH',{questionId:question.questionId,actual:primaryCapability.id,expected:capabilityRule.primary});
  const expectedSupporting=list(capabilityRule.supporting),actualSupporting=supportingCapabilities.map(item=>item.id);
  if(expectedSupporting.length!==actualSupporting.length||expectedSupporting.some(id=>!actualSupporting.includes(id)))fail('ECR_MANDALA_SUPPORTING_CAPABILITY_LINEAGE_MISMATCH',{questionId:question.questionId,actual:actualSupporting,expected:expectedSupporting});
  if(configuration.environmentPriorityMotionId!==motion.motionId)fail('ECR_MANDALA_MOTION_CONFIGURATION_LINEAGE_MISMATCH',{motionId:motion.motionId,configurationId:configuration.configurationId});

  const grammarQuestion=core.grammarCodes.map((grammarId,index)=>freeze({grammarId,questionId:core.questionCodes[index],rule:spec.layerRules.Q16.rule}));
  const questionCapability=core.questionCodes.map(questionId=>freeze({questionId,primaryCapabilityId:spec.questionCapabilityMatrix[questionId].primary,supportingCapabilityIds:list(spec.questionCapabilityMatrix[questionId].supporting),rule:spec.layerRules.R9.rule}));
  const motionConfiguration=specific.configurations.map(item=>freeze({configurationId:item.configurationId,environmentPriorityMotionId:item.environmentPriorityMotionId,embodiedResponseMotionId:item.embodiedResponseMotionId,upperTrigramRef:item.upperTrigramRef,lowerTrigramRef:item.lowerTrigramRef,rule:item.rule}));
  const activationIds=specific.activations.map(item=>item.activationId);
  const configurationActivation=specific.configurations.map(item=>freeze({configurationId:item.configurationId,activationIds,rule:spec.layerRules.A8.rule}));
  const selectedDrivers=driverItems.map(item=>selectedDriver(item,by(core.drivers,'id',code(item),'DRIVER'))).sort((a,b)=>(a.rank??999)-(b.rank??999)||a.driverId.localeCompare(b.driverId));

  const selected=freeze({
    contextId:context.contextId,
    grammarId:grammar.code,
    questionId:question.questionId,
    primaryCapabilityId:primaryCapability.id,
    supportingCapabilityIds:supportingCapabilities.map(item=>item.id),
    driverPriority:selectedDrivers,
    motionId:motion.motionId,
    configurationId:configuration.configurationId,
    activationId:activation.activationId
  });
  const projectionSuffix=String(readingIR.sourceProjectionId).replace(/^CMP-ECR-/,'');
  return freeze({
    schemaVersion:ECR_CUSTOMER_MANDALA_PROJECTION_SCHEMA,
    projectionId:`ECR-MANDALA-${projectionSuffix}`,
    sourceProjectionId:readingIR.sourceProjectionId,
    sourceMeaningBundleCode:readingIR.sourceMeaningBundleCode||null,
    locale:readingIR.locale==='zh-Hans'?'zh-Hans':'en',
    anchor:freeze({longitude:anchorLongitude,anchorCode:spec.anchor.code,referenceFrame:spec.zeroPoint.frame,label:freeze({en:'Solar anchor',zhHans:'太阳锚点'}),interpretiveConvention:spec.anchor.interpretiveConvention===true}),
    selected,
    catalogs:freeze({contexts,grammars,questions,capabilities,drivers,motions,configurations,activations}),
    relations:freeze({grammarQuestion,questionCapability,motionConfiguration,configurationActivation}),
    display:freeze({
      layerOrder:['CC12','G16','Q16','R9','D12','M8','H64','A8'],
      labels:freeze({CC12:freeze({en:'Long-range context',zhHans:'长期方向背景'}),G16:freeze({en:'Reality Grammar',zhHans:'现实语法'}),Q16:freeze({en:'Baseline question',zhHans:'基础问题'}),R9:freeze({en:'Response capability',zhHans:'回应能力'}),D12:freeze({en:'Baseline driver affinity',zhHans:'出生基线驱动'}),M8:freeze({en:'Change motion',zhHans:'变化运动'}),H64:freeze({en:'Environment-response configuration',zhHans:'环境—回应构型'}),A8:freeze({en:'Activation stage',zhHans:'激活阶段'})})
    }),
    boundaries:freeze({personalityClaimed:false,currentRealityKnown:false,currentDriverPriorityClaimed:false,fortunePredictionCreated:false,rendererRecalculated:false,visualProjectionCreatesMeaning:false,astrologySignPersonalityMeaningImported:false,ichingFortuneMeaningImported:false})
  });
}

export default Object.freeze({buildEcrCustomerMandalaProjection});
