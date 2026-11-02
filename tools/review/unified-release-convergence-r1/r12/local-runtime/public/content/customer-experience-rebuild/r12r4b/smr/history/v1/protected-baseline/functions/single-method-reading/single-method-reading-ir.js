import {assertSingleMethodReadingEligibility} from './single-method-reading-eligibility.js';
import {resolveInterpretationPriorities} from './single-method-priority-resolver.js';
import {clusterSingleMethodThemes} from './single-method-theme-clusterer.js';
import {resolveSingleMethodSections} from './single-method-section-resolver.js';
import {composeAstrologySingleMethodReading} from './astrology-single-method-composer.js';
import {composeBaziSingleMethodReading} from './bazi-single-method-composer.js';
import {composeZiWeiSingleMethodReading} from './ziwei-single-method-composer.js';
import {composeNumerologySingleMethodReading} from './numerology-single-method-composer.js';
import {inspectSingleMethodReadingQuality} from './single-method-reading-quality.js';
import {SMR_VERSIONS} from './smr-registry-v1.js';

const list=value=>Array.isArray(value)?value:[];
const uniq=value=>[...new Set(list(value).filter(Boolean))];
const freeze=value=>{if(value&&typeof value==='object'&&!Object.isFrozen(value)){Object.freeze(value);for(const item of Object.values(value))freeze(item)}return value};
const stable=value=>JSON.stringify(value,(_key,item)=>item&&typeof item==='object'&&!Array.isArray(item)?Object.fromEntries(Object.entries(item).sort(([a],[b])=>a.localeCompare(b))):item);
async function digest(value){const bytes=new TextEncoder().encode(stable(value)),hash=await crypto.subtle.digest('SHA-256',bytes);return [...new Uint8Array(hash)].map(byte=>byte.toString(16).padStart(2,'0')).join('')}
const isZh=locale=>locale==='zh-Hans';

function composerFor(methodId){return {AST:composeAstrologySingleMethodReading,BZR:composeBaziSingleMethodReading,ZWR:composeZiWeiSingleMethodReading,NUM:composeNumerologySingleMethodReading}[methodId]}
function dimensions(sectionId){
  if(['CORE_READING','CORE_THEMES','NATURAL_OPERATION','FINAL_READING'].includes(sectionId))return ['WHAT','WHY'];
  if(sectionId==='SUPPORT_CONDITIONS')return ['SUPPORT','WHEN'];
  if(sectionId==='COST_PRESSURE')return ['COST','WHEN'];
  if(sectionId==='REALITY_VERIFICATION')return ['OBSERVE','WHEN'];
  if(sectionId==='OPEN_UNCERTAINTY')return ['WHAT','WHY'];
  return ['WHAT','OBSERVE'];
}

function publicSections(methodComposition){
  return methodComposition.sections.map(section=>freeze({...section,paragraphs:section.paragraphs.map(item=>freeze({...item,specificityDimensions:dimensions(section.sectionId)}))}));
}

function whyThisReading(themes,units,locale){
  const byId=new Map(units.map(unit=>[unit.unitId,unit]));
  return themes.slice(0,5).map(theme=>{
    const bound=theme.interpretationUnitRefs.map(ref=>byId.get(ref)).filter(Boolean);
    const relationCount=bound.filter(unit=>['SUPPORT','TENSION','ACTIVATION','TRANSITION'].includes(unit.relationType)).length;
    const text=isZh(locale)
      ?`这个主题来自 ${bound.length} 个较高优先级结构、${relationCount} 个已记录关系，并保留 ${theme.tensions.length} 个可能的内部张力。`
      :`This theme is supported by ${bound.length} higher-priority structure(s), ${relationCount} recorded relation(s), with ${theme.tensions.length} possible tension(s) preserved.`;
    return freeze({themeId:theme.themeId,summary:text,interpretationUnitRefs:theme.interpretationUnitRefs,projectionRefs:uniq(bound.flatMap(unit=>unit.projectionRefs)),meaningRefs:uniq(bound.flatMap(unit=>unit.meaningRefs)),derivationRefs:uniq(bound.flatMap(unit=>[...list(unit.derivationRefs),...list(unit.ruleRefs)]))});
  });
}

function realityQuestions(units){
  const seen=new Set(),output=[];
  for(const unit of units){for(const question of list(unit.realityComparisonQuestions||unit.openQuestions)){if(!question||seen.has(question))continue;seen.add(question);output.push({questionId:`SMR-RQ-${String(output.length+1).padStart(2,'0')}`,text:question,interpretationUnitRefs:[unit.unitId]});if(output.length===7)return output}}
  return output;
}

function observableSignals(units){
  const output=[];
  for(const unit of units){for(const text of list(unit.observableSignals)){if(output.some(item=>item.text===text))continue;output.push({signalId:`SMR-OBS-${String(output.length+1).padStart(2,'0')}`,text,interpretationUnitRefs:[unit.unitId]})}}
  return output;
}

function executiveReading(themes,units,locale){
  const support=units.find(unit=>unit.relationType==='SUPPORT'||unit.constructiveExpression)||units[0];
  const cost=units.find(unit=>unit.relationType==='TENSION'||unit.frictionExpression)||units[1]||units[0];
  const questions=realityQuestions(units);
  return freeze({
    title:isZh(locale)?'这次读取最核心看见什么':'What this reading sees first',
    coreThemes:themes.slice(0,5).map(theme=>({themeId:theme.themeId,headline:theme.headline,tier:theme.tier,interpretationUnitRefs:theme.interpretationUnitRefs})),
    strongestSupport:support?{text:support.constructiveExpression||support.plainLanguageExplanation,interpretationUnitRefs:[support.unitId]}:null,
    highestCost:cost?{text:cost.frictionExpression||list(cost.alternativeInterpretations)[0]||cost.plainLanguageExplanation,interpretationUnitRefs:[cost.unitId]}:null,
    observationQuestion:questions[0]||null,
    remainsOpen:uniq(units.flatMap(unit=>list(unit.uncertainties))).slice(0,5)
  });
}

function tensions(themes){return themes.flatMap(theme=>theme.tensions.map(tension=>({themeId:theme.themeId,relationType:tension.relationType,alternatives:tension.alternatives,interpretationUnitRefs:[tension.unitRef]})))}

export async function composeSingleMethodReadingIR({methodResult,acceptedInterpretationResult,customerIntent=null,locale='en',availableTimingContext=null,currentRealityRefs=[]}={}){
  const eligibility=assertSingleMethodReadingEligibility({methodResult,acceptedInterpretationResult});
  const methodId=methodResult.methodId,useLocale=locale==='zh-Hans'?'zh-Hans':'en';
  const priority=resolveInterpretationPriorities({methodId,interpretationUnits:acceptedInterpretationResult.interpretationUnits,customerIntent,availableTimingContext});
  const clustered=clusterSingleMethodThemes({methodId,prioritizedUnits:priority.units,locale:useLocale});
  const sectionResolution=resolveSingleMethodSections({methodId,prioritizedUnits:priority.units,themes:clustered.themes,locale:useLocale,availableTimingContext});
  const methodComposition=composerFor(methodId)({sectionResolution,themes:clustered.themes});
  const sections=publicSections(methodComposition);
  const semanticInput={methodId,locale:useLocale,interpretationResultId:acceptedInterpretationResult.interpretationResultId,semanticDigest:acceptedInterpretationResult.semanticDigest,priorityRegistryVersion:priority.registryVersion,sectionRegistryVersion:sectionResolution.registryVersion,compositionVersion:SMR_VERSIONS.composition,customerIntent:customerIntent||null,availableTimingContext:availableTimingContext||null,currentRealityRefs:list(currentRealityRefs)};
  const reportDigest=await digest({semanticInput,themes:clustered.themes.map(theme=>({themeId:theme.themeId,refs:theme.interpretationUnitRefs,priority:theme.priority})),sections:sections.map(section=>({sectionId:section.sectionId,state:section.state,refs:section.interpretationUnitRefs,paragraphs:section.paragraphs.map(item=>item.text)}))});
  const ir={
    schemaVersion:SMR_VERSIONS.ir,
    readingId:`SMR-${methodId}-${reportDigest.slice(0,24).toUpperCase()}`,
    methodId,
    locale:useLocale,
    state:'HUMAN_REVIEW_REQUIRED',
    inputSummary:{customerIntent:customerIntent||null,timingContextProvided:Boolean(availableTimingContext),currentRealityProvided:list(currentRealityRefs).length>0},
    executiveReading:executiveReading(clustered.themes,priority.units,useLocale),
    coreThemes:clustered.themes.map(({units:_units,...theme})=>theme),
    sections,
    supportingPatterns:uniq(clustered.themes.flatMap(theme=>theme.supportingPatterns)),
    tensions:tensions(clustered.themes),
    observableSignals:observableSignals(priority.units),
    realityQuestions:realityQuestions(priority.units),
    openQuestions:uniq(priority.units.flatMap(unit=>[...list(unit.uncertainties),...list(unit.realityComparisonQuestions)])),
    timing:{status:(availableTimingContext?.status==='AUTHORISED'||availableTimingContext?.authorised===true||availableTimingContext?.authorityState==='AVAILABLE')?'AUTHORISED':'NOT_ESTABLISHED',sections:sections.filter(section=>section.sectionId==='TIMING'&&section.state==='AVAILABLE')},
    whyThisReading:whyThisReading(clustered.themes,priority.units,useLocale),
    technicalAppendix:{formula:methodComposition.formula,formulaCoverage:methodComposition.formulaCoverage,interpretationUnits:priority.units.map(unit=>({unitId:unit.unitId,priorityScore:unit.priorityScore,priorityReasons:unit.priorityReasons,domainTags:unit.domainTags,projectionRefs:unit.projectionRefs,meaningRefs:unit.meaningRefs,derivationRefs:uniq([...list(unit.derivationRefs),...list(unit.ruleRefs)]),boundaryRefs:list(unit.boundaryRefs)}))},
    lineage:{acceptedInterpretationResultId:acceptedInterpretationResult.interpretationResultId,acceptedInterpretationSemanticDigest:acceptedInterpretationResult.semanticDigest,meaningBundleCode:acceptedInterpretationResult.meaningBundleCode,methodCompositionAdmissionRef:acceptedInterpretationResult.admissionRef,priorityRegistryVersion:priority.registryVersion,themeRegistryVersion:clustered.schemaVersion,sectionRegistryVersion:sectionResolution.registryVersion,compositionRuleVersion:SMR_VERSIONS.composition,reportDigest},
    governance:{singleMethodOnly:true,crossMethodComposition:false,acceptedInterpretationUnitsOnly:true,rawProjectionUsedAsConclusion:false,newMeaningCreated:false,rendererCreatesMeaning:false,currentRealityAssumed:false,timingInvented:false,aiUsed:false,productionAdmission:'PENDING_HUMAN_REVIEW',reportBoundary:isZh(useLocale)?'这份读取提供结构性解释，不是对人格、命运或未来事实的证明。':'This reading provides a structural interpretation; it does not prove personality, destiny, or future facts.'}
  };
  const quality=inspectSingleMethodReadingQuality(ir,{availableTimingContext});
  if(!quality.valid)throw Object.assign(new Error('SMR_QUALITY_VALIDATION_FAILED'),{code:'SMR_QUALITY_VALIDATION_FAILED',failures:quality.failures});
  return freeze({...ir,quality});
}

