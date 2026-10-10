/** R2-W15 adapter: accepted ASTT current-dynamic reading -> AST customer TIMING section IR. */
const list=v=>Array.isArray(v)?v:[];const freeze=v=>{if(v&&typeof v==='object'&&!Object.isFrozen(v)){Object.freeze(v);for(const x of Object.values(v))freeze(x)}return v};
const fail=code=>{throw Object.assign(new Error(code),{code})};
const pick=(o,l,f='')=>o?.[l]??o?.en??f;
const body=(registry,code,locale)=>pick(registry?.bodyLabels?.[code],locale,code);
const target=(registry,code,locale)=>({ASC:locale==='zh-Hans'?'上升点':'Ascendant',MC:locale==='zh-Hans'?'天顶':'Midheaven',DSC:locale==='zh-Hans'?'下降点':'Descendant',IC:locale==='zh-Hans'?'天底':'Imum Coeli'})[code]||body(registry,code,locale);
export function buildAstGovernedTemporalReadingIR({projection,reading,meaningBundle,languageRegistry,locale='en'}={}){
 if(projection?.schemaVersion!=='PHI-OS-AST-TRANSIT-PROJECTION-v1.0.0')fail('AST_TIMING_ASTT_PROJECTION_REQUIRED');
 if(reading?.schemaVersion!=='PHI-OS-AST-TRANSIT-READING-IR-v1.0.0'||reading.sourceProjectionId!==projection.projectionId)fail('AST_TIMING_ASTT_READING_REQUIRED');
 if(meaningBundle?.schemaVersion!=='PHI-OS-AST-TRANSIT-MEANING-BUNDLE-v1.0.0'||meaningBundle.sourceProjectionId!==projection.projectionId)fail('AST_TIMING_ASTT_MEANING_REQUIRED');
 const lang=locale==='zh-Hans'?'zh-Hans':'en',items=[];
 const relations=list(reading.sections?.transitRelations).slice().sort((a,b)=>Number(a.orbDegrees??999)-Number(b.orbDegrees??999)||String(a.transitBodyCode).localeCompare(String(b.transitBodyCode))).slice(0,5);
 for(const x of relations){if(!x.meaning?.definition)continue;const from=body(languageRegistry,x.transitBodyCode,lang),to=target(languageRegistry,x.natalTargetCode,lang),label=x.meaning.label||x.aspectCode;const readerText=lang==='zh-Hans'?`当前${from}与本命${to}形成「${label}」。${x.meaning.definition}`:`Current ${from} forms “${label}” with natal ${to}. ${x.meaning.definition}`;items.push(freeze({itemType:'ASTT_RELATION',temporalClaimRef:`${projection.projectionId}:${x.transitBodyCode}:${x.natalTargetCode}:${x.aspectCode}`,readerText,sourceRefs:[projection.projectionId,meaningBundle.bundleCode,x.meaning.meaningCode||`ASTT-MEANING-${x.aspectCode}`],orbDegrees:x.orbDegrees??null}));}
 const activations=list(reading.sections?.currentActivation?.transits).filter(x=>x.houseNumber!=null&&x.houseMeaning?.definition).slice(0,3);
 for(const x of activations){const from=body(languageRegistry,x.bodyCode,lang),readerText=lang==='zh-Hans'?`当前${from}经过本命第 ${x.houseNumber} 宫。${x.houseMeaning.definition}`:`Current ${from} is moving through natal House ${x.houseNumber}. ${x.houseMeaning.definition}`;items.push(freeze({itemType:'ASTT_HOUSE_ACTIVATION',temporalClaimRef:`${projection.projectionId}:${x.bodyCode}:HOUSE_${x.houseNumber}`,readerText,sourceRefs:[projection.projectionId,meaningBundle.bundleCode,x.houseMeaning.meaningCode||'ASTT-MEANING-HOUSE-ACTIVATION']}));}
 return freeze({schemaVersion:'PHI-OS-AST-GOVERNED-TEMPORAL-READING-IR-v1.0.0',workCode:'R2-W15',sourceAsttProjectionId:projection.projectionId,sourceNatalProjectionId:projection.sourceNatalProjectionId,locale:lang,targetContext:projection.targetContext,items,customerPublicationAllowed:true,boundary:{currentDynamicOnly:true,eventPredictionCreated:false,fortunePredictionCreated:false,goodBadScoreCreated:false,natalMeaningRewritten:false,serverCurrentTimeInferred:false,browserTimezoneInferred:false}});
}
export default Object.freeze({buildAstGovernedTemporalReadingIR});
