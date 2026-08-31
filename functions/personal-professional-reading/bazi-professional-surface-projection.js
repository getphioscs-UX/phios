import {STEMS} from '../bzr-full-production/bazi-structural-registry.js';
import {buildBaziCustomerSafeStructureGraph} from './bazi-customer-safe-graph-projection.js';
const freeze=value=>{if(value&&typeof value==='object'&&!Object.isFrozen(value)){Object.freeze(value);for(const x of Object.values(value))freeze(x)}return value};
const list=value=>Array.isArray(value)?value:[];
const uniq=value=>[...new Set(list(value).filter(Boolean))];
const ownerFor=(readingIR,type,schoolCode=null)=>list(readingIR?.renderOwners).find(x=>x.compositionType===type&&(!schoolCode||x.schoolCode===schoolCode))||null;
const reportBlock=(report,schoolCode)=>list(list(report?.sections).find(x=>x.code==='SCHOOLS')?.blocks).find(x=>x.schoolCode===schoolCode)||null;

const ELEMENT_ORDER=Object.freeze(['WOOD','FIRE','EARTH','METAL','WATER']);
const GENERATES=Object.freeze({WOOD:'FIRE',FIRE:'EARTH',EARTH:'METAL',METAL:'WATER',WATER:'WOOD'});
const CONTROLS=Object.freeze({WOOD:'EARTH',EARTH:'WATER',WATER:'FIRE',FIRE:'METAL',METAL:'WOOD'});
const TEN_GOD_ORDER=Object.freeze(['BI_JIAN','JIE_CAI','SHI_SHEN','SHANG_GUAN','PIAN_CAI','ZHENG_CAI','QI_SHA','ZHENG_GUAN','PIAN_YIN','ZHENG_YIN']);
const TEN_GOD_GROUP=Object.freeze({BI_JIAN:'PEER',JIE_CAI:'PEER',SHI_SHEN:'OUTPUT',SHANG_GUAN:'OUTPUT',PIAN_CAI:'WEALTH',ZHENG_CAI:'WEALTH',QI_SHA:'OFFICER',ZHENG_GUAN:'OFFICER',PIAN_YIN:'RESOURCE',ZHENG_YIN:'RESOURCE'});
const PATTERN_FAMILY_BY_TEN_GOD=Object.freeze({PIAN_CAI:'CAI',ZHENG_CAI:'CAI',QI_SHA:'QI_SHA',ZHENG_GUAN:'ZHENG_GUAN',PIAN_YIN:'YIN',ZHENG_YIN:'YIN',SHI_SHEN:'SHI_SHEN',SHANG_GUAN:'SHANG_GUAN',BI_JIAN:'PEER_MONTH_COMMAND_REQUIRES_SPECIAL_RULE',JIE_CAI:'PEER_MONTH_COMMAND_REQUIRES_SPECIAL_RULE'});
const addInventory=(out,src)=>{for(const key of ELEMENT_ORDER)out[key]+=(Number(src?.[key])||0);return out};
const sumCounts=src=>Object.values(src||{}).reduce((sum,count)=>sum+(Number(count)||0),0);
const stemElement=code=>STEMS[String(code||'').toUpperCase()]?.element||null;
function monthCommandRelation(element,monthElement){
 if(!element||!monthElement)return 'MONTH_COMMAND_RELATION_UNAVAILABLE';
 if(element===monthElement)return 'SAME_AS_MONTH_COMMAND';
 if(GENERATES[monthElement]===element)return 'GENERATED_BY_MONTH_COMMAND';
 if(GENERATES[element]===monthElement)return 'GENERATES_MONTH_COMMAND';
 if(CONTROLS[monthElement]===element)return 'CONTROLLED_BY_MONTH_COMMAND';
 if(CONTROLS[element]===monthElement)return 'CONTROLS_MONTH_COMMAND';
 return 'MONTH_COMMAND_RELATION_UNAVAILABLE';
}
function dayMasterFunction(element,dayElement){
 if(!element||!dayElement)return 'UNAVAILABLE';
 if(element===dayElement)return 'PEER';
 if(GENERATES[element]===dayElement)return 'RESOURCE';
 if(GENERATES[dayElement]===element)return 'OUTPUT';
 if(CONTROLS[dayElement]===element)return 'WEALTH';
 if(CONTROLS[element]===dayElement)return 'OFFICER';
 return 'UNAVAILABLE';
}
function relationToDay(dayElement,targetElement){
 return ({SAME_AS_MONTH_COMMAND:'PEER_SUPPORT',GENERATED_BY_MONTH_COMMAND:'RESOURCE_SUPPORT',GENERATES_MONTH_COMMAND:'OUTPUT_DRAIN',CONTROLS_MONTH_COMMAND:'CONTROLLED_BY_DAY_MASTER',CONTROLLED_BY_MONTH_COMMAND:'PRESSURE_ON_DAY_MASTER',MONTH_COMMAND_RELATION_UNAVAILABLE:'UNAVAILABLE'})[monthCommandRelation(targetElement,dayElement)]||'UNAVAILABLE';
}
const visibleRelationList=readingIR=>{
 const day=readingIR?.sections?.foundation?.dayMaster||{};
 return list(readingIR?.pillars).flatMap(pillar=>{
  const out=[];
  if(pillar?.position!=='DAY'&&pillar?.stem?.element)out.push(freeze({sourceType:'VISIBLE_STEM',pillar:pillar.position,location:`${pillar.position}_STEM`,stemCode:pillar.stem.code,stemZh:pillar.stem.zh,element:pillar.stem.element,relationToDayMaster:relationToDay(day.element,pillar.stem.element),tenGodCode:pillar.stemRole?.tenGodCode||null,tenGodZh:pillar.stemRole?.tenGodZh||null}));
  if(pillar?.branch?.element)out.push(freeze({sourceType:'BRANCH_PRIMARY',pillar:pillar.position,location:`${pillar.position}_BRANCH_PRIMARY_ELEMENT`,branchCode:pillar.branch.code,branchZh:pillar.branch.zh,element:pillar.branch.element,relationToDayMaster:relationToDay(day.element,pillar.branch.element),tenGodCode:null,tenGodZh:null}));
  return out;
 });
};
const relationCounts=list=>list.reduce((out,item)=>{const key=item?.relationToDayMaster||'UNAVAILABLE';out[key]=(out[key]||0)+1;return out},{PEER_SUPPORT:0,RESOURCE_SUPPORT:0,OUTPUT_DRAIN:0,CONTROLLED_BY_DAY_MASTER:0,PRESSURE_ON_DAY_MASTER:0,UNAVAILABLE:0});
const supportState=(support,outward,pressure)=>support>=Math.max(outward,pressure)+2?'SUPPORT_SIDE_VISIBLE':pressure>=Math.max(support,outward)+1?'PRESSURE_SIDE_VISIBLE':outward>=Math.max(support,pressure)+2?'OUTPUT_SIDE_VISIBLE':'MIXED_CARRY';
function fiveElementModule(readingIR){
 const foundation=readingIR?.sections?.foundation||{},inventory=foundation.fiveElementInventory||{};
 const combined=addInventory(addInventory(addInventory(Object.fromEntries(ELEMENT_ORDER.map(x=>[x,0])),inventory.visibleStems),inventory.visibleBranches),inventory.hiddenStemsUnweighted);
 const total=ELEMENT_ORDER.reduce((sum,key)=>sum+combined[key],0),month=foundation.monthCommand||{},day=foundation.dayMaster||{};
 const items=ELEMENT_ORDER.map(element=>freeze({
  element,rawCount:combined[element],rawRatio:total?Math.round((combined[element]/total)*1000)/10:0,
  breakdown:freeze({visibleStems:Number(inventory.visibleStems?.[element])||0,visibleBranches:Number(inventory.visibleBranches?.[element])||0,hiddenStemsUnweighted:Number(inventory.hiddenStemsUnweighted?.[element])||0}),
  monthCommandRelation:monthCommandRelation(element,month?.branch?.element),dayMasterFunction:dayMasterFunction(element,day?.element)
 }));
 return freeze({
  schemaVersion:'PHI-OS-BAZI-CX-PRO-FIVE-ELEMENT-VISUAL-PROJECTION-v1.0.0',work:'BAZI-CX-PRO-W2',
  rawInventory:freeze({visibleStems:freeze({...inventory.visibleStems}),visibleBranches:freeze({...inventory.visibleBranches}),hiddenStemsUnweighted:freeze({...inventory.hiddenStemsUnweighted}),combined:freeze(combined),total}),
  monthCommand:freeze({branchCode:month?.branch?.code||null,branchZh:month?.branch?.zh||null,element:month?.branch?.element||null,season:month?.season||null}),
  dayMaster:freeze({code:day?.code||null,zh:day?.zh||null,element:day?.element||null,polarity:day?.polarity||null}),
  tenGodPreview:freeze({...foundation.tenGodDistribution?.visiblePlusHiddenUnweighted}),items:freeze(items),
  correction:freeze({mode:'QUALITATIVE_MONTH_COMMAND_RELATION_ONLY',numericWeightedStrengthAvailable:false,weightedHiddenStemScoringApplied:inventory.weightedHiddenStemScoringApplied===true}),
  boundaries:freeze({rawRatioIsStrengthScore:false,seasonRelationIsFinalStrongWeakVerdict:false,hiddenStemWeightsInvented:false,goodBadScoreCreated:false,fortunePredictionCreated:false})
 });
}

function tenGodModule(readingIR){
 const foundation=readingIR?.sections?.foundation||{},patterns=readingIR?.sections?.patterns||{},month=foundation.monthCommand||{},counts=foundation.tenGodDistribution?.visiblePlusHiddenUnweighted||{},total=sumCounts(counts);
 const items=TEN_GOD_ORDER.map(code=>{const sources=[];for(const pillar of list(readingIR?.pillars)){if(pillar?.stemRole?.tenGodCode===code)sources.push(freeze({sourceType:'VISIBLE_STEM',pillar:pillar.position,stemCode:pillar.stem?.code||null,stemZh:pillar.stem?.zh||null}));for(const hidden of list(pillar?.hiddenStems))if(hidden?.tenGodCode===code)sources.push(freeze({sourceType:'HIDDEN_STEM',pillar:pillar.position,branchCode:pillar.branch?.code||null,branchZh:pillar.branch?.zh||null,hiddenOrder:hidden.order,stemCode:hidden.stemCode||null,stemZh:hidden.stemZh||null}));}
  const visible=list(sources).filter(x=>x.sourceType==='VISIBLE_STEM'),hidden=list(sources).filter(x=>x.sourceType==='HIDDEN_STEM'),pillarCounts=list(sources).reduce((out,x)=>{out[x.pillar]=(out[x.pillar]||0)+1;return out},{YEAR:0,MONTH:0,DAY:0,HOUR:0});
  const spread=Object.entries(pillarCounts).filter(([,count])=>count>0).map(([pillar,count])=>freeze({pillar,count})).sort((a,b)=>b.count-a.count||a.pillar.localeCompare(b.pillar));
  const topCount=spread[0]?.count||0,repeatCount=Number(counts[code])||0,group=TEN_GOD_GROUP[code]||'UNAVAILABLE',candidateFamilies=uniq(list(patterns.candidates).filter(x=>x?.tenGodCode===code).map(x=>x.patternFamily));
  const sourceElement=stemElement((visible[0]||hidden[0])?.stemCode),monthRel=monthCommandRelation(sourceElement,month?.branch?.element);
  return freeze({tenGodCode:code,count:repeatCount,ratio:total?Math.round(repeatCount/total*1000)/10:0,functionGroup:group,visibleCount:visible.length,hiddenCount:hidden.length,sources:freeze({visible:freeze(visible),hidden:freeze(hidden),pillarCounts:freeze(pillarCounts)}),repeatState:repeatCount>1?'REPEATED':repeatCount===1?'SINGLE_TOUCH':'ABSENT',concentration:freeze({mode:repeatCount<=1?'NONE':topCount>=2&&spread.length<=2?'CONCENTRATED':spread.length>=3?'SPREAD':'BALANCED',topCount,spreadPillars:freeze(spread)}),monthCommandRelation:monthRel,patternFamilies:freeze(candidateFamilies),monthCommandCandidate:candidateFamilies.length>0,primaryPatternRelated:Boolean(list(patterns.verdict?.primaryPatternTenGodCodes).includes(code)||candidateFamilies.includes(patterns.verdict?.primaryPattern))});
 });
 const groups=Object.entries(TEN_GOD_GROUP).reduce((map,[code,group])=>{(map[group]||(map[group]=[])).push(code);return map},{});
 return freeze({
  schemaVersion:'PHI-OS-BAZI-CX-PRO-TEN-GOD-PROFESSIONAL-COMPOSITION-v1.0.0',work:'BAZI-CX-PRO-W3',dayMaster:freeze({...foundation.dayMaster}),monthCommand:freeze({branchCode:month?.branch?.code||null,branchZh:month?.branch?.zh||null,element:month?.branch?.element||null,season:month?.season||null}),totalTouches:total,
  functionGroups:freeze(Object.entries(groups).map(([groupCode,codes])=>{const count=codes.reduce((sum,code)=>sum+(Number(counts[code])||0),0);return freeze({groupCode,tenGodCodes:freeze(codes.slice()),count,ratio:total?Math.round(count/total*1000)/10:0});})),
  items:freeze(items),
  boundaries:freeze({ratioIsOccurrenceOnly:true,hiddenStemWeightInvented:false,goodBadScoreCreated:false,personalityScoreCreated:false,careerVerdictCreated:false,fortunePredictionCreated:false})
 });
}

function dayMasterStrengthModule(readingIR){
 const foundation=readingIR?.sections?.foundation||{},day=foundation.dayMaster||{},month=foundation.monthCommand||{},strength=foundation.strengthEvidence||{},visible=visibleRelationList(readingIR),counts=relationCounts(visible),roots=list(strength.rootEvidence),supportVisible=counts.PEER_SUPPORT+counts.RESOURCE_SUPPORT,outwardVisible=counts.OUTPUT_DRAIN+counts.CONTROLLED_BY_DAY_MASTER,pressureVisible=counts.PRESSURE_ON_DAY_MASTER,supportTotal=supportVisible+roots.length,tendency=supportState(supportTotal,outwardVisible,pressureVisible);
 const visibleStems=list(readingIR?.pillars).filter(x=>x?.position!=='DAY'&&x?.stem?.code).map(pillar=>freeze({pillar:pillar.position,stemCode:pillar.stem.code,stemZh:pillar.stem.zh,element:pillar.stem.element,tenGodCode:pillar.stemRole?.tenGodCode||null,tenGodZh:pillar.stemRole?.tenGodZh||null,relationToDayMaster:relationToDay(day.element,pillar.stem.element)}));
 const stemsByRelation=visibleStems.reduce((out,item)=>{const key=item.relationToDayMaster||'UNAVAILABLE';(out[key]||(out[key]=[])).push(item);return out},{PEER_SUPPORT:[],RESOURCE_SUPPORT:[],OUTPUT_DRAIN:[],CONTROLLED_BY_DAY_MASTER:[],PRESSURE_ON_DAY_MASTER:[],UNAVAILABLE:[]});
 const seasonalRelation=monthCommandRelation(month?.branch?.element,day?.element);
 const signals=freeze([
  freeze({signalCode:'DE_LING',count:seasonalRelation==='SAME_AS_MONTH_COMMAND'||seasonalRelation==='GENERATED_BY_MONTH_COMMAND'?1:0,state:seasonalRelation,sourceCount:1}),
  freeze({signalCode:'DE_DI',count:roots.length,state:roots.length?'ROOTED':'UNROOTED',sourceCount:roots.length}),
  freeze({signalCode:'DE_ZHU',count:supportVisible,state:supportVisible?'VISIBLE_SUPPORT_PRESENT':'VISIBLE_SUPPORT_LIMITED',sourceCount:supportVisible}),
  freeze({signalCode:'XIE',count:counts.OUTPUT_DRAIN,state:counts.OUTPUT_DRAIN?'OUTPUT_VISIBLE':'OUTPUT_LOW',sourceCount:counts.OUTPUT_DRAIN}),
  freeze({signalCode:'HAO',count:counts.CONTROLLED_BY_DAY_MASTER,state:counts.CONTROLLED_BY_DAY_MASTER?'WEALTH_CONSUMPTION_VISIBLE':'WEALTH_CONSUMPTION_LOW',sourceCount:counts.CONTROLLED_BY_DAY_MASTER}),
  freeze({signalCode:'KE',count:counts.PRESSURE_ON_DAY_MASTER,state:counts.PRESSURE_ON_DAY_MASTER?'PRESSURE_VISIBLE':'PRESSURE_LOW',sourceCount:counts.PRESSURE_ON_DAY_MASTER}),
  freeze({signalCode:'GEN_QI',count:roots.length,state:roots.length?roots.some(x=>x.match==='EXACT_DAY_STEM')?'EXACT_ROOT_VISIBLE':'SAME_ELEMENT_ROOT_VISIBLE':'ROOT_ABSENT',sourceCount:roots.length}),
  freeze({signalCode:'TOU_GAN',count:visibleStems.length,state:visibleStems.length?'VISIBLE_STEMS_PRESENT':'VISIBLE_STEMS_ABSENT',sourceCount:visibleStems.length})
 ]);
 return freeze({
  schemaVersion:'PHI-OS-BAZI-CX-PRO-DAY-MASTER-STRENGTH-PROFESSIONAL-COMPOSITION-v1.0.0',work:'BAZI-CX-PRO-W4',dayMaster:freeze({...day}),monthCommand:freeze({branchCode:month?.branch?.code||null,branchZh:month?.branch?.zh||null,element:month?.branch?.element||null,season:month?.season||null}),
  signals,
  seasonalSupport:freeze({monthElementRelationToDayMaster:strength.seasonalContext?.monthElementRelationToDayMaster||seasonalRelation,getLingState:seasonalRelation,monthBranchCode:month?.branch?.code||null,monthBranchZh:month?.branch?.zh||null}),
  supportBalance:freeze({visibleCounts:freeze(counts),supportVisible,outwardVisible,pressureVisible,supportTotal,overallTendency:tendency}),
  roots:freeze({total:roots.length,exactDayStemCount:roots.filter(x=>x.match==='EXACT_DAY_STEM').length,sameElementCount:roots.filter(x=>x.match!=='EXACT_DAY_STEM').length,sources:freeze(roots)}),
  transparentStems:freeze({count:visibleStems.length,items:freeze(visibleStems),byRelation:freeze(Object.fromEntries(Object.entries(stemsByRelation).map(([key,value])=>[key,freeze(value)])))}),
  carriers:freeze({supportiveRootsAndHelp:supportTotal,drainAndConsumption:outwardVisible,pressure:pressureVisible,overallTendency:tendency,rooted:roots.length>0}),
  withheldVerdict:freeze({strongWeakLabelCreated:false,usefulGodCreated:false,numericalStrengthScoreCreated:false}),
  boundaries:freeze({deLingDeDiDeZhuSplitVisible:true,strongWeakLabelCreated:false,weightedStrengthScoreCreated:false,hiddenStemWeightsInvented:false,fortunePredictionCreated:false,goodBadScoreCreated:false})
 });
}


const PILLAR_ORDER=Object.freeze({YEAR:0,MONTH:1,DAY:2,HOUR:3});
const RELATION_META=Object.freeze({
 STEM_COMBINATION:Object.freeze({layer:'STEM',family:'LINK',themeCode:'VISIBLE_STEM_LINK'}),
 BRANCH_SIX_COMBINATION:Object.freeze({layer:'BRANCH',family:'LINK',themeCode:'BRANCH_LINK'}),
 BRANCH_CLASH:Object.freeze({layer:'BRANCH',family:'TENSION',themeCode:'DIRECT_TENSION'}),
 BRANCH_HARM:Object.freeze({layer:'BRANCH',family:'TENSION',themeCode:'INDIRECT_FRICTION'}),
 BRANCH_BREAK:Object.freeze({layer:'BRANCH',family:'TENSION',themeCode:'STRUCTURAL_DISRUPTION'}),
 BRANCH_PUNISHMENT_PAIR:Object.freeze({layer:'BRANCH',family:'TENSION',themeCode:'CONSTRAINT_PATTERN'}),
 BRANCH_PUNISHMENT_GROUP:Object.freeze({layer:'BRANCH',family:'GROUP_TENSION',themeCode:'MULTI_PILLAR_CONSTRAINT'}),
 BRANCH_SELF_PUNISHMENT:Object.freeze({layer:'BRANCH',family:'REPEAT_TENSION',themeCode:'REPEATED_INTERNAL_TENSION'}),
 BRANCH_THREE_HARMONY:Object.freeze({layer:'BRANCH',family:'GROUP_LINK',themeCode:'THREE_PILLAR_ALIGNMENT'}),
 BRANCH_THREE_MEETING:Object.freeze({layer:'BRANCH',family:'GROUP_LINK',themeCode:'THREE_PILLAR_GATHERING'})
});
const sortedPositions=value=>uniq(value).sort((a,b)=>(PILLAR_ORDER[a]??99)-(PILLAR_ORDER[b]??99));
function positionThemeCode(positions){
 const p=sortedPositions(positions);
 if(p.length>=3)return 'MULTI_PILLAR_NETWORK';
 const k=p.join('_');
 return ({YEAR_MONTH:'OUTER_ENVIRONMENT_INTERFACE',YEAR_DAY:'OUTER_SELF_INTERFACE',YEAR_HOUR:'OUTER_EXPRESSION_INTERFACE',MONTH_DAY:'ENVIRONMENT_SELF_INTERFACE',MONTH_HOUR:'ENVIRONMENT_EXPRESSION_INTERFACE',DAY_HOUR:'SELF_EXPRESSION_INTERFACE'})[k]||'PILLAR_INTERFACE';
}
function pillarRelationshipContext(readingIR,tenGods,strength){
 const itemByCode=new Map(list(tenGods?.items).map(x=>[x.tenGodCode,x]));
 return freeze(list(readingIR?.pillars).map(pillar=>{
  const visibleCode=pillar?.stemRole?.tenGodCode||null,visibleItem=visibleCode?itemByCode.get(visibleCode):null;
  const hiddenCodes=uniq(list(pillar?.hiddenStems).map(x=>x.tenGodCode));
  const hiddenGroups=uniq(hiddenCodes.map(code=>itemByCode.get(code)?.functionGroup).filter(Boolean));
  const rootCount=list(strength?.roots?.sources).filter(x=>x.pillar===pillar.position).length;
  return freeze({position:pillar.position,stem:freeze({...pillar.stem}),branch:freeze({...pillar.branch}),visibleTenGod:visibleCode?freeze({code:visibleCode,zh:pillar?.stemRole?.tenGodZh||null,en:pillar?.stemRole?.tenGodEn||null,functionGroup:visibleItem?.functionGroup||null}):freeze({code:null,zh:'日主',en:'Day Master',functionGroup:'DAY_MASTER'}),hiddenTenGodCodes:freeze(hiddenCodes),hiddenFunctionGroups:freeze(hiddenGroups),rootCount,isDayMaster:pillar.position==='DAY',isMonthCommand:pillar.position==='MONTH'});
 }));
}
function relationshipPriority(positions){const p=new Set(positions);if(p.has('DAY')&&p.has('MONTH'))return 'DAY_MASTER_MONTH_COMMAND_DIRECT';if(p.has('DAY'))return 'DAY_MASTER_DIRECT';if(p.has('MONTH'))return 'MONTH_COMMAND_DIRECT';if(p.size>=3)return 'MULTI_PILLAR_NETWORK';return 'SECONDARY_INTERFACE'}
function relationshipModule(readingIR,{tenGods,strength}={}){
 const section=readingIR?.sections?.relationships||{},pillarContexts=pillarRelationshipContext(readingIR,tenGods,strength),contextByPosition=new Map(pillarContexts.map(x=>[x.position,x]));
 const items=list(section.items).map((relation,index)=>{
  const meta=RELATION_META[relation?.type]||{layer:String(relation?.type||'').startsWith('STEM_')?'STEM':'BRANCH',family:'STRUCTURAL',themeCode:'STRUCTURAL_RELATION'};
  const positions=sortedPositions(relation?.positions),contexts=positions.map(x=>contextByPosition.get(x)).filter(Boolean);
  const visibleTenGods=contexts.map(x=>x.visibleTenGod).filter(x=>x?.code),hiddenTenGodCodes=uniq(contexts.flatMap(x=>x.hiddenTenGodCodes)),functionGroups=uniq([...visibleTenGods.map(x=>x.functionGroup),...contexts.flatMap(x=>x.hiddenFunctionGroups)].filter(Boolean));
  const rootCount=contexts.reduce((sum,x)=>sum+(Number(x.rootCount)||0),0),dayMasterDirect=positions.includes('DAY'),monthCommandDirect=positions.includes('MONTH');
  return freeze({relationId:`BAZI-CX-PRO-W5-REL-${String(index+1).padStart(2,'0')}`,type:relation.type,layer:meta.layer,relationFamily:meta.family,relationThemeCode:meta.themeCode,positionThemeCode:positionThemeCode(positions),priorityBand:relationshipPriority(positions),members:freeze(list(relation.members)),memberZh:freeze(list(relation.memberZh)),positions:freeze(positions),transformationEstablished:relation.transformationEstablished===true,dayMasterDirect,monthCommandDirect,context:freeze({visibleTenGods:freeze(visibleTenGods),hiddenTenGodCodes:freeze(hiddenTenGodCodes),functionGroups:freeze(functionGroups),rootCount,dayMasterCarryingTendency:dayMasterDirect?strength?.carriers?.overallTendency||null:null,supportVisible:dayMasterDirect?strength?.supportBalance?.supportVisible??null:null,outwardVisible:dayMasterDirect?strength?.supportBalance?.outwardVisible??null:null,pressureVisible:dayMasterDirect?strength?.supportBalance?.pressureVisible??null:null}),boundaries:freeze({relationPresenceIsEventPrediction:false,combinationMeansTransformation:false,relationMeansGoodBad:false})});
 });
 const pairMap=new Map();for(const item of items){const key=item.positions.join('__')||'UNPOSITIONED';if(!pairMap.has(key))pairMap.set(key,{pairKey:key,positions:item.positions,positionThemeCode:item.positionThemeCode,relationIds:[],relationTypes:[],relationFamilies:[],tenGodCodes:[],functionGroups:[],dayMasterDirect:false,monthCommandDirect:false,priorityBands:[]});const pair=pairMap.get(key);pair.relationIds.push(item.relationId);pair.relationTypes.push(item.type);pair.relationFamilies.push(item.relationFamily);pair.tenGodCodes.push(...item.context.visibleTenGods.map(x=>x.code),...item.context.hiddenTenGodCodes);pair.functionGroups.push(...item.context.functionGroups);pair.dayMasterDirect ||= item.dayMasterDirect;pair.monthCommandDirect ||= item.monthCommandDirect;pair.priorityBands.push(item.priorityBand)}
 const pairCards=freeze([...pairMap.values()].map(pair=>freeze({...pair,relationTypes:freeze(uniq(pair.relationTypes)),relationFamilies:freeze(uniq(pair.relationFamilies)),tenGodCodes:freeze(uniq(pair.tenGodCodes)),functionGroups:freeze(uniq(pair.functionGroups)),priorityBands:freeze(uniq(pair.priorityBands))})).sort((a,b)=>{const rank={DAY_MASTER_MONTH_COMMAND_DIRECT:0,DAY_MASTER_DIRECT:1,MONTH_COMMAND_DIRECT:2,MULTI_PILLAR_NETWORK:3,SECONDARY_INTERFACE:4};const ar=Math.min(...a.priorityBands.map(x=>rank[x]??9)),br=Math.min(...b.priorityBands.map(x=>rank[x]??9));return ar-br||a.pairKey.localeCompare(b.pairKey)}));
 const familyCounts=items.reduce((out,item)=>{out[item.relationFamily]=(out[item.relationFamily]||0)+1;return out},{}),typeCounts=items.reduce((out,item)=>{out[item.type]=(out[item.type]||0)+1;return out},{});
 const themeMap=new Map();for(const item of items){const key=item.positionThemeCode;if(!themeMap.has(key))themeMap.set(key,{themeCode:key,relationCount:0,relationIds:[],relationFamilies:[],tenGodCodes:[],functionGroups:[],dayMasterDirect:false,monthCommandDirect:false});const theme=themeMap.get(key);theme.relationCount++;theme.relationIds.push(item.relationId);theme.relationFamilies.push(item.relationFamily);theme.tenGodCodes.push(...item.context.visibleTenGods.map(x=>x.code),...item.context.hiddenTenGodCodes);theme.functionGroups.push(...item.context.functionGroups);theme.dayMasterDirect ||= item.dayMasterDirect;theme.monthCommandDirect ||= item.monthCommandDirect}
 const themes=freeze([...themeMap.values()].map(theme=>freeze({...theme,relationFamilies:freeze(uniq(theme.relationFamilies)),tenGodCodes:freeze(uniq(theme.tenGodCodes)),functionGroups:freeze(uniq(theme.functionGroups))})).sort((a,b)=>Number(b.dayMasterDirect)-Number(a.dayMasterDirect)||Number(b.monthCommandDirect)-Number(a.monthCommandDirect)||b.relationCount-a.relationCount||a.themeCode.localeCompare(b.themeCode)));
 return freeze({schemaVersion:'PHI-OS-BAZI-CX-PRO-RELATIONSHIP-PILLAR-INTERACTION-v1.0.0',work:'BAZI-CX-PRO-W5',sourceRelationshipOwnerRefs:freeze(list(section.ownerRefs)),pillarContexts,items:freeze(items),pairCards,themes,summary:freeze({relationCount:items.length,pairCardCount:pairCards.length,themeCount:themes.length,directToDayMasterCount:items.filter(x=>x.dayMasterDirect).length,directToMonthCommandCount:items.filter(x=>x.monthCommandDirect).length,relationFamilyCounts:freeze(familyCounts),relationTypeCounts:freeze(typeCounts)}),boundaries:freeze({structuralRelationshipOnly:true,relationPresenceDoesNotPredictEvent:true,combinationDoesNotEstablishTransformation:true,pillarThemeDoesNotEqualLifeEvent:true,goodBadScoreCreated:false,fortunePredictionCreated:false})});
}

const PATTERN_PROFESSIONAL_RULES=Object.freeze({
 ZHENG_GUAN:Object.freeze({formationClaimRef:'BZR-CLM-ZPZQ-09-ZHENGGUAN-FORMATION-013',formationPaths:Object.freeze([
  Object.freeze({pathCode:'OFFICER_WITH_WEALTH_OR_RESOURCE',requiredAll:['OFFICER'],requiredAny:['WEALTH','RESOURCE'],requiresNoMonthTension:true}),
 ]),defeatWatch:Object.freeze(['SHANG_GUAN','MONTH_COMMAND_TENSION']),rescueFocus:Object.freeze(['RESOURCE'])}),
 CAI:Object.freeze({formationClaimRef:'BZR-CLM-ZPZQ-09-CAI-FORMATION-014',formationPaths:Object.freeze([
  Object.freeze({pathCode:'WEALTH_GENERATES_OFFICER',requiredAll:['WEALTH','OFFICER']}),
  Object.freeze({pathCode:'WEALTH_RECEIVES_OUTPUT_WITH_CARRYING_SUPPORT',requiredAll:['WEALTH','OUTPUT'],requiresCarryingSupport:true}),
  Object.freeze({pathCode:'WEALTH_RESOURCE_POSITIONAL_ORDER',requiredAll:['WEALTH','RESOURCE'],requiresPositionalReview:true}),
 ]),defeatWatch:Object.freeze(['PEER','QI_SHA_VISIBLE']),rescueFocus:Object.freeze(['OUTPUT'])}),
 YIN:Object.freeze({formationClaimRef:'BZR-CLM-ZPZQ-09-YIN-FORMATION-015',formationPaths:Object.freeze([
  Object.freeze({pathCode:'RESOURCE_WITH_OFFICER_OR_SEVEN_KILLINGS',requiredAll:['RESOURCE','OFFICER']}),
  Object.freeze({pathCode:'RESOURCE_WITH_OUTPUT',requiredAll:['RESOURCE','OUTPUT']}),
  Object.freeze({pathCode:'RESOURCE_WEALTH_CONTROLLED_USE',requiredAll:['RESOURCE','WEALTH'],requiresPositionalReview:true}),
 ]),defeatWatch:Object.freeze(['WEALTH']),rescueFocus:Object.freeze(['PEER'])}),
 SHI_SHEN:Object.freeze({formationClaimRef:'BZR-CLM-ZPZQ-09-SHISHEN-FORMATION-016',formationPaths:Object.freeze([
  Object.freeze({pathCode:'EATING_GOD_GENERATES_WEALTH',requiredAll:['OUTPUT','WEALTH']}),
  Object.freeze({pathCode:'OUTPUT_SEVEN_KILLINGS_RESOURCE_PATH',requiredAll:['OUTPUT','OFFICER','RESOURCE'],requiresPositionalReview:true}),
 ]),defeatWatch:Object.freeze(['PIAN_YIN']),rescueFocus:Object.freeze(['WEALTH','RESOURCE'])}),
 QI_SHA:Object.freeze({formationClaimRef:'BZR-CLM-ZPZQ-09-QISHA-FORMATION-017',formationPaths:Object.freeze([
  Object.freeze({pathCode:'SEVEN_KILLINGS_WITH_CONTROL_AND_CARRYING',requiredAll:['OFFICER','OUTPUT'],requiresCarryingSupport:true}),
 ]),defeatWatch:Object.freeze(['WEALTH','CONTROL_PATH']),rescueFocus:Object.freeze(['OUTPUT','RESOURCE'])}),
 SHANG_GUAN:Object.freeze({formationClaimRef:'BZR-CLM-ZPZQ-09-SHANGGUAN-FORMATION-018',formationPaths:Object.freeze([
  Object.freeze({pathCode:'HURTING_OFFICER_GENERATES_WEALTH',requiredAll:['OUTPUT','WEALTH']}),
  Object.freeze({pathCode:'HURTING_OFFICER_WITH_RESOURCE',requiredAll:['OUTPUT','RESOURCE'],requiresCarryingSupport:true}),
 ]),defeatWatch:Object.freeze(['OFFICER']),rescueFocus:Object.freeze(['WEALTH','RESOURCE'])}),
 PEER_MONTH_COMMAND_REQUIRES_SPECIAL_RULE:Object.freeze({formationClaimRef:'BZR-CLM-ZPZQ-09-JIANLU-YUEJIE-FORMATION-019',formationPaths:Object.freeze([
  Object.freeze({pathCode:'JIANLU_YUEJIE_SELECT_EXTERNAL_OPERATIVE_FACTOR',requiredAny:['WEALTH','OFFICER','OUTPUT'],requiresPositionalReview:true}),
 ]),defeatWatch:Object.freeze(['PEER']),rescueFocus:Object.freeze(['WEALTH','OFFICER','OUTPUT'])})
});
const PATTERN_SOURCE_FRAMEWORK=Object.freeze({rulesetRef:'content/interpretation/bazi/rulesets/bazi-pattern-ruleset-v2.json',claimBatchRef:'content/interpretation/bazi/claims/bazi-source-claim-batch-bzr-r1-v2.1.json',defeatClaimRef:'BZR-CLM-ZPZQ-09-DEFEAT-TABLE-020',counterEvidenceClaimRef:'BZR-CLM-ZPZQ-09-TABOO-WITHIN-FORMATION-021',rescueClaimRef:'BZR-CLM-ZPZQ-09-RESCUE-TABLE-022',specialPathClaimRef:'BZR-CLM-ZPZQ-45-JIANLU-YUEJIE-DETAIL-023'});
const tenGodItem=(tenGods,code)=>list(tenGods?.items).find(x=>x.tenGodCode===code)||null;
const groupItem=(tenGods,groupCode)=>list(tenGods?.functionGroups).find(x=>x.groupCode===groupCode)||null;
const groupVisible=(tenGods,groupCode)=>(Number(groupItem(tenGods,groupCode)?.count)||0)>0;
const carryingSupportVisible=strength=>Boolean(strength?.carriers?.rooted)||(Number(strength?.supportBalance?.supportVisible)||0)>0;
function patternPathEvaluation(path,{tenGods,strength,relationships,upstreamPrimary=false}={}){
 const requiredAll=list(path?.requiredAll),requiredAny=list(path?.requiredAny),missingAll=requiredAll.filter(group=>!groupVisible(tenGods,group)),anyPresent=!requiredAny.length||requiredAny.some(group=>groupVisible(tenGods,group));
 const monthTensions=list(relationships?.items).filter(item=>item.monthCommandDirect===true&&item.relationFamily==='TENSION');
 let state='VISIBLE_SUPPORT_PATH';
 if(missingAll.length||!anyPresent)state='REQUIRED_FACTOR_NOT_VISIBLE';
 else if(path?.requiresCarryingSupport&&!carryingSupportVisible(strength))state='CARRYING_CONDITION_OPEN';
 else if(path?.requiresNoMonthTension&&monthTensions.length)state='RELATIONSHIP_CONDITION_REQUIRES_REVIEW';
 else if(path?.requiresPositionalReview)state='POSITIONAL_CONDITION_REQUIRES_REVIEW';
 if(upstreamPrimary)state='UPSTREAM_PRIMARY_ESTABLISHED';
 return freeze({pathCode:path.pathCode,state,requiredAll:freeze(requiredAll),requiredAny:freeze(requiredAny),visibleRequiredGroups:freeze(uniq([...requiredAll,...requiredAny].filter(group=>groupVisible(tenGods,group)))),missingRequiredGroups:freeze(uniq([...missingAll,...(requiredAny.length&&!anyPresent?requiredAny:[])])),carryingSupportVisible:carryingSupportVisible(strength),monthTensionRelationIds:freeze(monthTensions.map(x=>x.relationId)),positionalReviewRequired:path?.requiresPositionalReview===true});
}
function patternDefeatChecks(family,{tenGods,relationships}={}){
 const monthTensions=list(relationships?.items).filter(item=>item.monthCommandDirect===true&&item.relationFamily==='TENSION');
 const checks=[];
 const add=(code,visible,detail={})=>checks.push(freeze({checkCode:code,state:visible?'VISIBLE_REQUIRES_REVIEW':'NOT_FOREGROUNDED',...detail}));
 if(family==='ZHENG_GUAN'){add('HURTING_OFFICER_REVIEW',(Number(tenGodItem(tenGods,'SHANG_GUAN')?.count)||0)>0,{tenGodCode:'SHANG_GUAN'});add('MONTH_COMMAND_TENSION_REVIEW',monthTensions.length>0,{relationIds:freeze(monthTensions.map(x=>x.relationId))});}
 else if(family==='CAI'){add('PEER_COMPETITION_REVIEW',(Number(groupItem(tenGods,'PEER')?.count)||0)>0,{groupCode:'PEER'});add('EXPOSED_SEVEN_KILLINGS_REVIEW',(Number(tenGodItem(tenGods,'QI_SHA')?.visibleCount)||0)>0,{tenGodCode:'QI_SHA'});}
 else if(family==='YIN')add('WEALTH_RESOURCE_RELATION_REVIEW',(Number(groupItem(tenGods,'WEALTH')?.count)||0)>0,{groupCode:'WEALTH'});
 else if(family==='SHI_SHEN')add('INDIRECT_RESOURCE_REVIEW',(Number(tenGodItem(tenGods,'PIAN_YIN')?.count)||0)>0,{tenGodCode:'PIAN_YIN'});
 else if(family==='QI_SHA'){add('WEALTH_WITH_SEVEN_KILLINGS_REVIEW',(Number(groupItem(tenGods,'WEALTH')?.count)||0)>0,{groupCode:'WEALTH'});if((Number(groupItem(tenGods,'OUTPUT')?.count)||0)===0)add('CONTROL_PATH_REVIEW',true,{groupCode:'OUTPUT'});}
 else if(family==='SHANG_GUAN')add('OFFICER_RELATION_REVIEW',(Number(groupItem(tenGods,'OFFICER')?.count)||0)>0,{groupCode:'OFFICER'});
 else add('SPECIAL_PATH_REVIEW',true,{family});
 return freeze(checks);
}
function patternRescueFramework(family,{tenGods}={}){
 const rule=PATTERN_PROFESSIONAL_RULES[family]||PATTERN_PROFESSIONAL_RULES.PEER_MONTH_COMMAND_REQUIRES_SPECIAL_RULE,groups=list(rule.rescueFocus);
 return freeze({state:'FRAMEWORK_ONLY_CASE_MATCH_NOT_DECLARED',focusGroups:freeze(groups),visibleFocusGroups:freeze(groups.filter(group=>groupVisible(tenGods,group))),claimRef:PATTERN_SOURCE_FRAMEWORK.rescueClaimRef});
}
function patternCandidateProfessionalReading(candidate,{tenGods,strength,relationships,section}={}){
 const family=candidate.patternFamily,rule=PATTERN_PROFESSIONAL_RULES[family]||PATTERN_PROFESSIONAL_RULES.PEER_MONTH_COMMAND_REQUIRES_SPECIAL_RULE,tg=tenGodItem(tenGods,candidate.tenGodCode),upstreamPrimary=Boolean(section?.verdict?.primaryPattern&&(section.verdict.primaryPattern===family||section.verdict.primaryPattern===candidate.candidateId||section.verdict.primaryPattern===candidate.tenGodCode));
 const relationModifiers=list(relationships?.items).filter(item=>item.monthCommandDirect===true||list(candidate.visiblePillars).some(p=>list(item.positions).includes(p))).map(item=>freeze({relationId:item.relationId,type:item.type,relationFamily:item.relationFamily,positionThemeCode:item.positionThemeCode,positions:freeze(list(item.positions)),dayMasterDirect:item.dayMasterDirect,monthCommandDirect:item.monthCommandDirect}));
 const formationPaths=freeze(list(rule.formationPaths).map(path=>patternPathEvaluation(path,{tenGods,strength,relationships,upstreamPrimary})));
 const visiblePaths=formationPaths.filter(x=>x.state!=='REQUIRED_FACTOR_NOT_VISIBLE'),readingPriority=upstreamPrimary?'UPSTREAM_PRIMARY':candidate.visibleStemMatch?'VISIBLE_MONTH_COMMAND_CANDIDATE':candidate.hiddenOrder===1?'PRIMARY_HIDDEN_MONTH_COMMAND_CANDIDATE':'HIDDEN_MONTH_COMMAND_CANDIDATE';
 return freeze({
  readingPriority,
  candidateBasis:freeze({monthCommandHiddenOrder:candidate.hiddenOrder,hiddenStemZh:candidate.hiddenStemZh,tenGodCode:candidate.tenGodCode,tenGodZh:candidate.tenGodZh,patternFamily:family,treatmentClass:candidate.treatmentClass,visibleStemMatch:candidate.visibleStemMatch===true,visiblePillars:freeze(list(candidate.visiblePillars))}),
  tenGodContext:freeze({count:Number(tg?.count)||0,ratio:Number(tg?.ratio)||0,visibleCount:Number(tg?.visibleCount)||0,hiddenCount:Number(tg?.hiddenCount)||0,repeatState:tg?.repeatState||'ABSENT',functionGroup:tg?.functionGroup||TEN_GOD_GROUP[candidate.tenGodCode]||'UNAVAILABLE'}),
  carryingContext:freeze({overallTendency:strength?.carriers?.overallTendency||'MIXED_CARRY',rootCount:Number(strength?.roots?.total)||0,supportVisible:Number(strength?.supportBalance?.supportVisible)||0,outwardVisible:Number(strength?.supportBalance?.outwardVisible)||0,pressureVisible:Number(strength?.supportBalance?.pressureVisible)||0}),
  formation:freeze({claimRef:rule.formationClaimRef,paths:formationPaths,visiblePathCount:visiblePaths.length,formedPatternDeclared:upstreamPrimary}),
  relationshipModifiers:freeze(relationModifiers),
  defeatChecks:patternDefeatChecks(family,{tenGods,relationships}),
  rescueFramework:patternRescueFramework(family,{tenGods}),
  conclusionState:upstreamPrimary?'PRIMARY_ESTABLISHED_BY_UPSTREAM':visiblePaths.length&&candidate.visibleStemMatch?'OPEN_WITH_VISIBLE_FORMATION_SUPPORT':visiblePaths.length?'OPEN_WITH_PARTIAL_FORMATION_SUPPORT':'OPEN_REQUIRES_MORE_FORMATION_SUPPORT',
  sourceClaimRefs:freeze(uniq([rule.formationClaimRef,PATTERN_SOURCE_FRAMEWORK.defeatClaimRef,PATTERN_SOURCE_FRAMEWORK.counterEvidenceClaimRef,PATTERN_SOURCE_FRAMEWORK.rescueClaimRef,...(family==='PEER_MONTH_COMMAND_REQUIRES_SPECIAL_RULE'?[PATTERN_SOURCE_FRAMEWORK.specialPathClaimRef]:[])])),
  boundaries:freeze({formationPathVisibleDoesNotEqualPatternFormed:true,defeatCheckVisibleDoesNotEqualPatternDefeated:true,rescueFrameworkDoesNotEqualRescueMatched:true,readingPriorityIsNotQualityRank:true,lifeOutcomeCreated:false})
 });
}
function patternModule(readingIR,{tenGods,strength,relationships}={}){
 const section=readingIR?.sections?.patterns||{},owner=ownerFor(readingIR,'PATTERN_CANDIDATE_SET');
 const candidates=list(section.candidates).map(c=>freeze({...c,
   supportEvidence:freeze({monthCommandCandidate:true,visibleStemMatch:c.visibleStemMatch===true,visiblePillars:list(c.visiblePillars),treatmentClass:c.treatmentClass||null}),
   defeatEvaluation:freeze({state:'NOT_CASE_SPECIFICALLY_ESTABLISHED',reasonCode:'PPR_C1_W7_DEFEAT_CONDITION_NOT_EXPOSED_BY_CURRENT_READING_IR'}),
   rescueEvaluation:freeze({state:'NOT_CASE_SPECIFICALLY_ESTABLISHED',reasonCode:'PPR_C1_W7_RESCUE_CONDITION_NOT_EXPOSED_BY_CURRENT_READING_IR'}),
   unresolved:freeze({primaryPatternAssigned:Boolean(section.verdict?.primaryPattern),priorityVerdict:c.priorityVerdict??null}),
   professionalReading:patternCandidateProfessionalReading(c,{tenGods,strength,relationships,section})
  }));
 const priorityRank={UPSTREAM_PRIMARY:0,VISIBLE_MONTH_COMMAND_CANDIDATE:1,PRIMARY_HIDDEN_MONTH_COMMAND_CANDIDATE:2,HIDDEN_MONTH_COMMAND_CANDIDATE:3};
 const readingOrder=freeze(candidates.slice().sort((a,b)=>(priorityRank[a.professionalReading.readingPriority]??9)-(priorityRank[b.professionalReading.readingPriority]??9)||a.hiddenOrder-b.hiddenOrder).map(x=>x.candidateId));
 const visibleFormationSupportCount=candidates.filter(x=>x.professionalReading.formation.visiblePathCount>0).length;
 return freeze({
  schemaVersion:'PHI-OS-PPR-C1-BAZI-PATTERN-PROFESSIONAL-SURFACE-v1.0.0',work:'BAZI-CX-PRO-W6',professionalReadingVersion:'PHI-OS-BAZI-CX-PRO-PATTERN-PROFESSIONAL-READING-v1.0.0',
  state:owner?.resolutionState||'ALTERNATIVES_OPEN',qualifierCodes:list(owner?.qualifierCodes),unknownRefs:list(owner?.unknownRefs),counterEvidenceRefs:list(owner?.counterEvidenceRefs),evidenceRefs:list(owner?.evidenceRefs),authorityRefs:list(owner?.authorityRefs),
  sourceFramework:freeze({...PATTERN_SOURCE_FRAMEWORK}),
  summary:freeze({candidateCount:candidates.length,visibleStemCandidateCount:candidates.filter(x=>x.visibleStemMatch).length,visibleFormationSupportCount,primaryPatternEstablished:Boolean(section.verdict?.primaryPattern),readingOrder}),
  candidates:freeze(candidates),
  verdict:freeze({...section.verdict}),
  boundaries:freeze({rulesetPresenceIsNotCaseMatch:true,defeatInvented:false,rescueInvented:false,primaryPatternInvented:false,formationSupportIsNotFormationVerdict:true,readingOrderIsNotQualityRank:true,sourceAdmittedFrameworkComposed:true})
 });
}


const PRIORITY_TYPE_ORDER=Object.freeze({RELATIONSHIP:0,PATTERN:1,CARRYING:2,TEN_GOD_GROUP:3,TIMING:4});
function priorityCandidateSort(a,b){return (a.tier-b.tier)||(PRIORITY_TYPE_ORDER[a.themeType]-PRIORITY_TYPE_ORDER[b.themeType])||(b.salience-a.salience)||String(a.themeKey).localeCompare(String(b.themeKey))}
function wholeChartPriorityModule({tenGods,strength,relationships,pattern,timing,temporalState='UNAVAILABLE'}={}){
 const candidates=[];
 const push=(x)=>candidates.push(freeze(x));
 const carryMagnitude=(Number(strength?.roots?.total)||0)+(Number(strength?.supportBalance?.supportVisible)||0)+(Number(strength?.supportBalance?.outwardVisible)||0)+(Number(strength?.supportBalance?.pressureVisible)||0);
 if(carryMagnitude>0)push({themeType:'CARRYING',themeKey:'DAY_MASTER_CARRYING',tier:2,salience:carryMagnitude,reasonCodes:freeze(['DAY_MASTER_CARRYING_STRUCTURE','ROOT_SUPPORT_DRAIN_PRESSURE_COMPOSED']),sourceRefs:freeze(['dayMasterStrength']),facts:freeze({overallTendency:strength?.carriers?.overallTendency||'MIXED_CARRY',rootCount:Number(strength?.roots?.total)||0,supportVisible:Number(strength?.supportBalance?.supportVisible)||0,outwardVisible:Number(strength?.supportBalance?.outwardVisible)||0,pressureVisible:Number(strength?.supportBalance?.pressureVisible)||0})});
 const groupRank=list(tenGods?.functionGroups).filter(x=>(Number(x.count)||0)>0).slice().sort((a,b)=>(Number(b.ratio)||0)-(Number(a.ratio)||0)||(Number(b.count)||0)-(Number(a.count)||0)||String(a.groupCode).localeCompare(String(b.groupCode)));
 for(const [index,g] of groupRank.slice(0,2).entries()){
  const visibleTenGods=list(tenGods?.items).filter(x=>x.functionGroup===g.groupCode&&(Number(x.count)||0)>0).map(x=>freeze({tenGodCode:x.tenGodCode,count:x.count,ratio:x.ratio,visibleCount:x.visibleCount,hiddenCount:x.hiddenCount,repeatState:x.repeatState}));
  const patternLinked=list(pattern?.candidates).filter(x=>x.professionalReading?.tenGodContext?.functionGroup===g.groupCode).map(x=>x.candidateId);
  push({themeType:'TEN_GOD_GROUP',themeKey:g.groupCode,tier:index===0?1:3,salience:Number(g.ratio)||0,reasonCodes:freeze([index===0?'DOMINANT_FUNCTION_GROUP':'SECONDARY_FUNCTION_GROUP',patternLinked.length?'PATTERN_LINKED':'NOT_PATTERN_LINKED']),sourceRefs:freeze(['tenGods',...patternLinked.map(x=>`pattern:${x}`)]),facts:freeze({groupCode:g.groupCode,count:g.count,ratio:g.ratio,tenGods:freeze(visibleTenGods),patternLinkedCandidateIds:freeze(patternLinked)})});
 }
 const rel=list(relationships?.items).slice().sort((a,b)=>{const rank={DAY_MASTER_MONTH_COMMAND_DIRECT:0,DAY_MASTER_DIRECT:1,MONTH_COMMAND_DIRECT:2,MULTI_PILLAR_NETWORK:3,SECONDARY_INTERFACE:4};return (rank[a.priorityBand]??9)-(rank[b.priorityBand]??9)||String(a.relationId).localeCompare(String(b.relationId))})[0];
 if(rel)push({themeType:'RELATIONSHIP',themeKey:rel.positionThemeCode,tier:rel.priorityBand==='DAY_MASTER_MONTH_COMMAND_DIRECT'?1:2,salience:(rel.dayMasterDirect?4:0)+(rel.monthCommandDirect?3:0)+list(rel.context?.functionGroups).length,reasonCodes:freeze([rel.priorityBand,rel.relationFamily,rel.relationThemeCode]),sourceRefs:freeze([`relationship:${rel.relationId}`]),facts:freeze({relationId:rel.relationId,type:rel.type,relationFamily:rel.relationFamily,positionThemeCode:rel.positionThemeCode,positions:freeze(list(rel.positions)),memberZh:freeze(list(rel.memberZh)),functionGroups:freeze(list(rel.context?.functionGroups)),dayMasterDirect:rel.dayMasterDirect,monthCommandDirect:rel.monthCommandDirect})});
 const firstPattern=list(pattern?.summary?.readingOrder).map(id=>list(pattern?.candidates).find(x=>x.candidateId===id)).find(Boolean)||list(pattern?.candidates)[0];
 if(firstPattern){const pr=firstPattern.professionalReading||{},visibleSupport=(Number(pr.formation?.visiblePathCount)||0)>0;push({themeType:'PATTERN',themeKey:firstPattern.patternFamily,tier:pr.conclusionState==='PRIMARY_ESTABLISHED_BY_UPSTREAM'||visibleSupport?1:2,salience:(visibleSupport?5:2)+(firstPattern.visibleStemMatch?3:0)+(Number(pr.tenGodContext?.ratio)||0)/10,reasonCodes:freeze([pr.readingPriority||'PATTERN_CANDIDATE',pr.conclusionState||'OPEN',visibleSupport?'FORMATION_SUPPORT_VISIBLE':'FORMATION_SUPPORT_LIMITED']),sourceRefs:freeze([`pattern:${firstPattern.candidateId}`]),facts:freeze({candidateId:firstPattern.candidateId,patternFamily:firstPattern.patternFamily,tenGodCode:firstPattern.tenGodCode,tenGodZh:firstPattern.tenGodZh,visibleStemMatch:firstPattern.visibleStemMatch===true,visiblePathCount:Number(pr.formation?.visiblePathCount)||0,conclusionState:pr.conclusionState||null,relationshipModifierCount:list(pr.relationshipModifiers).length})});}
 if(temporalState==='EXPLICIT'&&timing?.targetContext){const crossCount=list(timing?.interactions?.crossLayerGroups).length,interactionCount=(Number(timing?.summary?.interactionCount)||0);push({themeType:'TIMING',themeKey:'CURRENT_TEMPORAL_ACTIVATION',tier:2,salience:crossCount*3+interactionCount,reasonCodes:freeze(['EXPLICIT_TARGET_CONTEXT',crossCount?'CROSS_LAYER_GROUP_VISIBLE':'CROSS_LAYER_GROUP_NOT_VISIBLE']),sourceRefs:freeze(['timing']),facts:freeze({targetContext:timing.targetContext,currentDaYun:timing.currentDaYun||null,annual:timing.annual||null,crossLayerGroupCount:crossCount,interactionCount})});}
 const sorted=candidates.slice().sort(priorityCandidateSort),selected=[],typeCounts={};
 for(const candidate of sorted){const maxForType=candidate.themeType==='TEN_GOD_GROUP'?2:1;if((typeCounts[candidate.themeType]||0)>=maxForType)continue;selected.push(candidate);typeCounts[candidate.themeType]=(typeCounts[candidate.themeType]||0)+1;if(selected.length===5)break;}
 if(selected.length<3){for(const candidate of sorted){if(selected.includes(candidate))continue;selected.push(candidate);if(selected.length===3)break;}}
 const themes=freeze(selected.slice(0,5).map((item,index)=>freeze({priorityId:`BAZI-CX-PRO-W7-PRI-${String(index+1).padStart(2,'0')}`,rank:index+1,themeType:item.themeType,themeKey:item.themeKey,reasonCodes:item.reasonCodes,sourceRefs:item.sourceRefs,facts:item.facts})));
 return freeze({schemaVersion:'PHI-OS-BAZI-CX-PRO-WHOLE-CHART-PRIORITY-v1.0.0',work:'BAZI-CX-PRO-W7',themeCount:themes.length,themes,boundaries:freeze({minimumThemes:3,maximumThemes:5,priorityIsReadingOrderNotFateRank:true,numericSalienceNotCustomerExposed:true,oneSymbolDoesNotBecomeWholeIdentity:true,eventPredictionCreated:false,goodBadScoreCreated:false})});
}

const TOPIC_SPECS=Object.freeze([
 Object.freeze({topicCode:'CAREER',primaryGroups:['OFFICER','OUTPUT'],secondaryGroups:['WEALTH','RESOURCE'],patternFamilies:['ZHENG_GUAN','QI_SHA','SHI_SHEN','SHANG_GUAN','CAI'],relationThemes:['ENVIRONMENT_SELF_INTERFACE','SELF_EXPRESSION_INTERFACE']}),
 Object.freeze({topicCode:'WEALTH',primaryGroups:['WEALTH','OUTPUT'],secondaryGroups:['PEER','OFFICER'],patternFamilies:['CAI','SHI_SHEN','SHANG_GUAN'],relationThemes:['OUTER_SELF_INTERFACE','ENVIRONMENT_SELF_INTERFACE']}),
 Object.freeze({topicCode:'RELATIONSHIPS',primaryGroups:['PEER','OFFICER','WEALTH'],secondaryGroups:['RESOURCE'],patternFamilies:['ZHENG_GUAN','QI_SHA','CAI'],relationThemes:['ENVIRONMENT_SELF_INTERFACE','OUTER_SELF_INTERFACE','SELF_EXPRESSION_INTERFACE','MULTI_PILLAR_NETWORK']}),
 Object.freeze({topicCode:'FAMILY',primaryGroups:['RESOURCE','PEER'],secondaryGroups:['OFFICER','WEALTH'],patternFamilies:['YIN','ZHENG_GUAN','CAI'],relationThemes:['OUTER_ENVIRONMENT_INTERFACE','OUTER_SELF_INTERFACE','ENVIRONMENT_SELF_INTERFACE','MULTI_PILLAR_NETWORK']}),
 Object.freeze({topicCode:'CAPABILITY',primaryGroups:['OUTPUT','RESOURCE','PEER'],secondaryGroups:['OFFICER'],patternFamilies:['SHI_SHEN','SHANG_GUAN','YIN','PEER_MONTH_COMMAND_REQUIRES_SPECIAL_RULE'],relationThemes:['SELF_EXPRESSION_INTERFACE','ENVIRONMENT_EXPRESSION_INTERFACE']}),
 Object.freeze({topicCode:'PRESSURE',primaryGroups:['OFFICER'],secondaryGroups:['OUTPUT','RESOURCE','PEER'],patternFamilies:['ZHENG_GUAN','QI_SHA','SHANG_GUAN'],relationThemes:['ENVIRONMENT_SELF_INTERFACE','MULTI_PILLAR_NETWORK']}),
 Object.freeze({topicCode:'LIFE_OPERATION',primaryGroups:['PEER','RESOURCE','OUTPUT','WEALTH','OFFICER'],secondaryGroups:[],patternFamilies:['ZHENG_GUAN','QI_SHA','CAI','YIN','SHI_SHEN','SHANG_GUAN','PEER_MONTH_COMMAND_REQUIRES_SPECIAL_RULE'],relationThemes:['ENVIRONMENT_SELF_INTERFACE','SELF_EXPRESSION_INTERFACE','OUTER_SELF_INTERFACE','MULTI_PILLAR_NETWORK']})
]);
function topicProfessionalModule({tenGods,strength,relationships,pattern,priority}={}){
 const groupByCode=new Map(list(tenGods?.functionGroups).map(x=>[x.groupCode,x])),tenGodByCode=new Map(list(tenGods?.items).map(x=>[x.tenGodCode,x]));
 const topics=TOPIC_SPECS.map(spec=>{
  const relevantGroups=uniq([...spec.primaryGroups,...spec.secondaryGroups]).map(code=>groupByCode.get(code)).filter(x=>(Number(x?.count)||0)>0).slice().sort((a,b)=>Number(!spec.primaryGroups.includes(a.groupCode))-Number(!spec.primaryGroups.includes(b.groupCode))||(Number(b.ratio)||0)-(Number(a.ratio)||0)||String(a.groupCode).localeCompare(String(b.groupCode)));
  const leadGroup=relevantGroups[0]||null;
  const relevantTenGods=list(tenGods?.items).filter(x=>(Number(x.count)||0)>0&&relevantGroups.some(g=>g.groupCode===x.functionGroup)).slice().sort((a,b)=>(Number(b.ratio)||0)-(Number(a.ratio)||0)||String(a.tenGodCode).localeCompare(String(b.tenGodCode))).map(x=>freeze({tenGodCode:x.tenGodCode,functionGroup:x.functionGroup,count:x.count,ratio:x.ratio,visibleCount:x.visibleCount,hiddenCount:x.hiddenCount,repeatState:x.repeatState}));
  const patternCandidates=list(pattern?.candidates).filter(x=>spec.patternFamilies.includes(x.patternFamily)).map(x=>freeze({candidateId:x.candidateId,patternFamily:x.patternFamily,tenGodCode:x.tenGodCode,tenGodZh:x.tenGodZh,visibleStemMatch:x.visibleStemMatch===true,conclusionState:x.professionalReading?.conclusionState||null,visiblePathCount:Number(x.professionalReading?.formation?.visiblePathCount)||0})).sort((a,b)=>Number(b.visibleStemMatch)-Number(a.visibleStemMatch)||b.visiblePathCount-a.visiblePathCount||String(a.candidateId).localeCompare(String(b.candidateId)));
  const relItems=list(relationships?.items).filter(x=>spec.relationThemes.includes(x.positionThemeCode)||list(x.context?.functionGroups).some(g=>spec.primaryGroups.includes(g))).map(x=>freeze({relationId:x.relationId,type:x.type,relationFamily:x.relationFamily,positionThemeCode:x.positionThemeCode,positions:freeze(list(x.positions)),functionGroups:freeze(list(x.context?.functionGroups)),dayMasterDirect:x.dayMasterDirect,monthCommandDirect:x.monthCommandDirect}));
  const relatedPriorityRefs=list(priority?.themes).filter(x=>(x.themeType==='TEN_GOD_GROUP'&&relevantGroups.some(g=>g.groupCode===x.themeKey))||(x.themeType==='PATTERN'&&spec.patternFamilies.includes(x.themeKey))||(x.themeType==='RELATIONSHIP'&&spec.relationThemes.includes(x.themeKey))||(x.themeType==='CARRYING'&&['CAPABILITY','PRESSURE','LIFE_OPERATION','CAREER'].includes(spec.topicCode))).map(x=>x.priorityId);
  const dimensions=['TEN_GODS','PATTERN','RELATIONSHIP','CARRYING'].filter(d=>d==='TEN_GODS'?relevantGroups.length:d==='PATTERN'?patternCandidates.length:d==='RELATIONSHIP'?relItems.length:true);
  const state=dimensions.length>=3?'COMPOSED_MULTI_FACTOR':dimensions.length===2?'COMPOSED_TWO_FACTOR':dimensions.length===1?'PARTIAL':'OPEN';
  const pressure=(Number(strength?.supportBalance?.pressureVisible)||0),support=(Number(strength?.supportBalance?.supportVisible)||0),outward=(Number(strength?.supportBalance?.outwardVisible)||0);
  return freeze({topicCode:spec.topicCode,state,leadGroup:leadGroup?freeze({groupCode:leadGroup.groupCode,count:leadGroup.count,ratio:leadGroup.ratio}):null,relevantGroups:freeze(relevantGroups.map(x=>freeze({groupCode:x.groupCode,count:x.count,ratio:x.ratio}))),relevantTenGods:freeze(relevantTenGods),patternCandidates:freeze(patternCandidates),relationshipInterfaces:freeze(relItems),carryingContext:freeze({overallTendency:strength?.carriers?.overallTendency||'MIXED_CARRY',rootCount:Number(strength?.roots?.total)||0,supportVisible:support,outwardVisible:outward,pressureVisible:pressure}),priorityRefs:freeze(relatedPriorityRefs),compositionDimensions:freeze(dimensions),boundaries:freeze({topicIsCompositionNotPrediction:true,topicDoesNotEqualSingleTenGod:true,pillarDoesNotEqualFamilyMember:true,relationshipDoesNotGuaranteeOutcome:true})});
 });
 return freeze({schemaVersion:'PHI-OS-BAZI-CX-PRO-PROFESSIONAL-TOPIC-READING-v1.0.0',work:'BAZI-CX-PRO-W8',topicCount:topics.length,topics:freeze(topics),boundaries:freeze({requiredTopics:freeze(TOPIC_SPECS.map(x=>x.topicCode)),singleSymbolVerdictAllowed:false,fortunePredictionCreated:false,goodBadScoreCreated:false,identityLabelCreated:false})});
}

function schoolModules(readingIR,report){
 const views=list(readingIR?.sections?.schoolViews?.views);
 return freeze(views.map(view=>{const owner=ownerFor(readingIR,'SCHOOL_QUALIFIED_VIEW',view.schoolCode),block=reportBlock(report,view.schoolCode);return freeze({
  schoolCode:view.schoolCode,rulesetId:view.rulesetId,rulesetRef:view.rulesetRef,sourceAuthorityState:view.sourceAuthorityState,sourceClaimRefs:list(view.sourceClaimRefs),evidence:freeze({...view.evidence}),verdict:freeze({...view.verdict}),customerText:block?.text||'',customerTitle:block?.title||'',resolutionState:owner?.resolutionState||'SCHOOL_VIEW_OPEN',qualifierCodes:list(owner?.qualifierCodes),unknownRefs:list(owner?.unknownRefs),evidenceRefs:list(owner?.evidenceRefs),authorityRefs:list(owner?.authorityRefs)
 })}));
}

function timingModule(readingIR,temporalState){
 const section=readingIR?.sections?.timing||{},owner=ownerFor(readingIR,'CURRENT_TEMPORAL_STRUCTURE');
 return freeze({
  schemaVersion:'PHI-OS-PPR-C1-BAZI-TEMPORAL-EXPERIENCE-v1.0.0',state:temporalState,targetContext:section.targetContext||null,currentDaYun:section.currentDaYun||null,annual:section.annual||null,allDaYun:freeze(list(section.allDaYun)),interactions:freeze(section.interactions||{liuNianToNatal:[],liuNianToCurrentDaYun:[],currentDaYunToNatal:[],crossLayerGroups:[]}),summary:freeze(section.summary||{}),resolutionState:owner?.resolutionState||'PARTIAL',qualifierCodes:list(owner?.qualifierCodes),unknownRefs:list(owner?.unknownRefs),evidenceRefs:list(owner?.evidenceRefs),authorityRefs:list(owner?.authorityRefs),boundaries:freeze({currentDateInferred:false,browserTimezoneInferred:false,combinationEqualsTransformation:false,eventPredictionCreated:false,goodBadScoreCreated:false})
 });
}

const REALITY_COMPARISON_ORDER=Object.freeze([
 Object.freeze({compositionType:'NATAL_FOUNDATION',questionKey:'FOUNDATION'}),
 Object.freeze({compositionType:'NATAL_RELATIONSHIP_STRUCTURE',questionKey:'RELATIONSHIPS'}),
 Object.freeze({compositionType:'PATTERN_CANDIDATE_SET',questionKey:'PATTERN'}),
 Object.freeze({compositionType:'SCHOOL_QUALIFIED_VIEW',schoolCode:'ZI_PING_MONTH_COMMAND_USE_v1',questionKey:'SCHOOL_ZIPING'}),
 Object.freeze({compositionType:'SCHOOL_QUALIFIED_VIEW',schoolCode:'DI_TIAN_SUI_TI_YONG_BALANCE_v1',questionKey:'SCHOOL_TIYONG'}),
 Object.freeze({compositionType:'SCHOOL_QUALIFIED_VIEW',schoolCode:'DI_TIAN_SUI_CLIMATE_TIAOHOU_v1',questionKey:'SCHOOL_TIAOHOU'}),
 Object.freeze({compositionType:'CURRENT_TEMPORAL_STRUCTURE',questionKey:'TIMING'})
]);

function realityComparisonModule(readingIR,temporalState){
 const owners=list(readingIR?.renderOwners).filter(owner=>owner?.renderMode==='PRIMARY_EXPLANATION');
 const byCluster=new Map();for(const owner of owners){if(!owner?.semanticClusterId)continue;if(byCluster.has(owner.semanticClusterId))throw Object.assign(new Error('PPR_C1_W11_DUPLICATE_PRIMARY_SEMANTIC_OWNER'),{code:'PPR_C1_W11_DUPLICATE_PRIMARY_SEMANTIC_OWNER',semanticClusterId:owner.semanticClusterId});byCluster.set(owner.semanticClusterId,owner)}
 const questions=[];
 for(const spec of REALITY_COMPARISON_ORDER){
  const owner=owners.find(item=>item.compositionType===spec.compositionType&&(!spec.schoolCode||item.schoolCode===spec.schoolCode));if(!owner)continue;
  questions.push(freeze({
   questionKey:spec.questionKey,compositionType:owner.compositionType,schoolCode:owner.schoolCode||null,sourceSemanticClusterId:owner.semanticClusterId,resolutionState:owner.resolutionState,
   temporalCorrespondenceEnabled:spec.questionKey==='TIMING'&&temporalState==='EXPLICIT',
   trace:freeze({evidenceCount:list(owner.evidenceRefs).length,authorityCount:list(owner.authorityRefs).length,unknownCount:list(owner.unknownRefs).length,counterEvidenceCount:list(owner.counterEvidenceRefs).length,qualifierCount:list(owner.qualifierCodes).length}),
   boundaries:freeze({customerResponseBecomesEvidence:false,customerResponseChangesMethodVerdict:false,repeatedPillarPromptCreated:false,sourceSemanticOwnerDuplicated:false})
  }));
 }
 const sourcePrimaryOwners=owners.filter(owner=>REALITY_COMPARISON_ORDER.some(spec=>spec.compositionType===owner.compositionType&&(!spec.schoolCode||spec.schoolCode===owner.schoolCode)));
 if(new Set(questions.map(x=>x.sourceSemanticClusterId)).size!==questions.length)throw Object.assign(new Error('PPR_C1_W11_REALITY_COMPARISON_CLUSTER_DUPLICATION'),{code:'PPR_C1_W11_REALITY_COMPARISON_CLUSTER_DUPLICATION'});
 return freeze({
  schemaVersion:'PHI-OS-PPR-C1-BAZI-REALITY-COMPARISON-v1.0.0',work:'PPR-C1-W11',sourceReadingIrSchema:readingIR?.schemaVersion||null,sourceReadingDigest:readingIR?.readingDigest||null,
  questionCount:questions.length,sourcePrimaryOwnerCount:sourcePrimaryOwners.length,questions:freeze(questions),
  boundaries:freeze({derivedFromDeduplicatedSemanticOwners:true,observableSignalsConsumed:false,pillarByPillarQuestionGeneration:false,customerResonanceIsEvidence:false,customerAnswerPromotesVerdict:false,eventPredictionCreated:false,goodBadScoreCreated:false})
 });
}

export function buildBaziProfessionalSurfaceModules({readingIR,report,temporalState='UNAVAILABLE'}={}){
 if(readingIR?.schemaVersion!=='PHI-OS-BAZI-FULL-READING-IR-v1.0.0')throw Object.assign(new Error('PPR_C1_W7_W12_BAZI_READING_IR_REQUIRED'),{code:'PPR_C1_W7_W12_BAZI_READING_IR_REQUIRED'});
 const fiveElements=fiveElementModule(readingIR),tenGods=tenGodModule(readingIR),dayMasterStrength=dayMasterStrengthModule(readingIR),relationships=relationshipModule(readingIR,{tenGods,strength:dayMasterStrength}),pattern=patternModule(readingIR,{tenGods,strength:dayMasterStrength,relationships}),timing=timingModule(readingIR,temporalState);
 const wholeChartPriority=wholeChartPriorityModule({tenGods,strength:dayMasterStrength,relationships,pattern,timing,temporalState});
 const professionalTopics=topicProfessionalModule({tenGods,strength:dayMasterStrength,relationships,pattern,priority:wholeChartPriority});
 return freeze({
  schemaVersion:'PHI-OS-PPR-C1-BAZI-PROFESSIONAL-SURFACE-MODULES-v1.0.0',moduleVersion:'BAZI-CX-PRO-W6-v1.0.0',extensionVersion:'BAZI-CX-PRO-W8-v1.0.0',
  fiveElements,tenGods,dayMasterStrength,relationships,pattern,wholeChartPriority,professionalTopics,schools:schoolModules(readingIR,report),timing,
  customerSafeGraph:buildBaziCustomerSafeStructureGraph({readingIR,temporalState}),
  realityComparison:realityComparisonModule(readingIR,temporalState),
  boundaries:freeze({createsMeaning:false,recalculatesBazi:false,mergesSchools:false,resolvesUnresolvedPattern:false,infersTemporalContext:false,recalculatesEvidenceGraph:false,exposesRawEvidenceGraphIds:false,usesPprR3SpecialistPort:true,modifiesSharedPersonalRealitySurface:false})
 });
}
export default Object.freeze({buildBaziProfessionalSurfaceModules});
