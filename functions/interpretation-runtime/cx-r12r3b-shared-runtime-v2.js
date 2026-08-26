/**
 * CX-R12R3B shared Method Interpretation successor.
 *
 * One composition and graph authority consumes four independently calculated
 * CanonicalMethodProjections. Method strategies select projection facts; they
 * do not become independent interpretation systems or meaning authorities.
 */
import {assertDepth,assertLocale,clone,deepFreeze,sha256Stable,stableStringify,uniq} from './mir7-utils.js';

export const CX_R12R3B_RUNTIME_VERSION='2.0.0';
export const CX_R12R3B_COMPOSITION_VERSION='CX-R12R3B-COMPOSITION-RULES-v1.0.0';
export const CX_R12R3B_GRAPH_VERSION='PHI-OS-METHOD-GRAPH-VIEW-MODEL-v1.0.0';
export const CX_R12R3B_RESULT_SCHEMA='PHI-OS-CANONICAL-INTERPRETATION-RESULT-v2.0.0';
export const CX_R12R3B_LIFECYCLE=Object.freeze([
  'CALCULATED','PROJECTED','MEANING_AVAILABLE','SOURCE_ADMITTED',
  'LOCALE_COMPLETE','COMPOSITION_SUPPORTED','HUMAN_REVIEWED','CUSTOMER_PUBLISHABLE'
]);

const METHODS=Object.freeze({
  AST:Object.freeze({publicMethodCode:'ASTROLOGY_PROJECTION',graphType:'NATAL_CHART',labels:{en:'Astrology', 'zh-Hans':'占星'}}),
  NUM:Object.freeze({publicMethodCode:'NUMEROLOGY_PROJECTION',graphType:'NUMBER_DERIVATION',labels:{en:'Numerology','zh-Hans':'数字学'}}),
  BZR:Object.freeze({publicMethodCode:'BAZI_PROJECTION',graphType:'FOUR_PILLARS',labels:{en:'BaZi','zh-Hans':'八字'}}),
  ZWR:Object.freeze({publicMethodCode:'ZI_WEI_PROJECTION',graphType:'TWELVE_PALACES',labels:{en:'Zi Wei','zh-Hans':'紫微斗数'}})
});
const METHOD_BY_PUBLIC=new Map(Object.entries(METHODS).map(([id,x])=>[x.publicMethodCode,id]));
const RELATIONS=new Set(['SUPPORT','TENSION','REINFORCEMENT','COUNTERBALANCE','REPETITION','DEPENDENCY','ACTIVATION','TRANSITION']);
const DEPTHS=Object.freeze({SHORT:1,STANDARD:2,DETAILED:3,PROFESSIONAL:4});
const RAW_PINYIN_CODES=/\b(?:WU|CHEN|JIA|YI|BING|DING|JI|GENG|XIN|REN|GUI|ZI|CHOU|YIN|MAO|SI|WEI|SHEN|YOU|XU|HAI)\b/;
const RAW_TECHNICAL_COPY=/\b(?:DETERMINISTIC|projection item|canonical item|unknown code)\b/i;
const SENSITIVE=/\b(?:diagnos(?:e|is)|guaranteed event|will die|death prediction|pregnancy prediction|certain relationship|buy|sell|legal conclusion)\b/i;
const THEMES=new Set(['AUTONOMY','RELATIONSHIP','STABILITY','CHANGE','EXPRESSION','RESPONSIBILITY','BOUNDARY','DIRECTION']);
const COMPOSITION_RULES=new Set([
  'CX-COMP-AST-PLANET-SIGN-HOUSE-v1','CX-COMP-AST-ASPECT-v1','CX-COMP-AST-PLACEMENT-v1',
  'CX-COMP-NUM-ROLE-NUMBER-PATH-v1','CX-COMP-NUM-CYCLE-v1','CX-COMP-BZR-PILLAR-DAY-SEASON-v1',
  'CX-COMP-ZWR-PALACE-NETWORK-v1','CX-COMP-ZWR-FOUR-TRANSFORMATION-v1'
]);
const THEME_RULES=Object.freeze([
  Object.freeze({ruleRef:'CX-THEME-RELATION-SUPPORT-v1',relationTypes:Object.freeze(['SUPPORT','REINFORCEMENT']),theme:'STABILITY'}),
  Object.freeze({ruleRef:'CX-THEME-RELATION-TENSION-v1',relationTypes:Object.freeze(['TENSION','COUNTERBALANCE']),theme:'BOUNDARY'}),
  Object.freeze({ruleRef:'CX-THEME-RELATION-MOTION-v1',relationTypes:Object.freeze(['ACTIVATION','TRANSITION']),theme:'CHANGE'}),
  Object.freeze({ruleRef:'CX-THEME-RELATION-DEPENDENCY-v1',relationTypes:Object.freeze(['DEPENDENCY']),theme:'RESPONSIBILITY'}),
  Object.freeze({ruleRef:'CX-THEME-RELATION-REPETITION-v1',relationTypes:Object.freeze(['REPETITION']),theme:'DIRECTION'})
]);

const STEM_ZH=Object.freeze({JIA:'甲',YI:'乙',BING:'丙',DING:'丁',WU:'戊',JI:'己',GENG:'庚',XIN:'辛',REN:'壬',GUI:'癸'});
const STEM_EN=Object.freeze({JIA:'Yang Wood',YI:'Yin Wood',BING:'Yang Fire',DING:'Yin Fire',WU:'Yang Earth',JI:'Yin Earth',GENG:'Yang Metal',XIN:'Yin Metal',REN:'Yang Water',GUI:'Yin Water'});
const BRANCH_ZH=Object.freeze({ZI:'子',CHOU:'丑',YIN:'寅',MAO:'卯',CHEN:'辰',SI:'巳',WU:'午',WEI:'未',SHEN:'申',YOU:'酉',XU:'戌',HAI:'亥'});
const BRANCH_EN=Object.freeze({ZI:'Rat',CHOU:'Ox',YIN:'Tiger',MAO:'Rabbit',CHEN:'Dragon',SI:'Snake',WU:'Horse',WEI:'Goat',SHEN:'Monkey',YOU:'Rooster',XU:'Dog',HAI:'Pig'});
const AST_LABELS=Object.freeze({
  en:Object.freeze({SUN:'Sun',MOON:'Moon',MERCURY:'Mercury',VENUS:'Venus',MARS:'Mars',JUPITER:'Jupiter',SATURN:'Saturn',URANUS:'Uranus',NEPTUNE:'Neptune',PLUTO:'Pluto',NORTH_NODE:'North Node',SOUTH_NODE:'South Node'}),
  'zh-Hans':Object.freeze({SUN:'太阳',MOON:'月亮',MERCURY:'水星',VENUS:'金星',MARS:'火星',JUPITER:'木星',SATURN:'土星',URANUS:'天王星',NEPTUNE:'海王星',PLUTO:'冥王星',NORTH_NODE:'北交点',SOUTH_NODE:'南交点'})
});
const PALACE_LABELS=Object.freeze({
  LIFE:['Life Palace','命宫'],SIBLINGS:['Siblings Palace','兄弟宫'],SPOUSE:['Partnership Palace','夫妻宫'],CHILDREN:['Children Palace','子女宫'],WEALTH:['Resources Palace','财帛宫'],HEALTH:['Well-being Palace','疾厄宫'],TRAVEL:['Movement Palace','迁移宫'],FRIENDS:['Network Palace','仆役宫'],CAREER:['Career Palace','官禄宫'],PROPERTY:['Property Palace','田宅宫'],FORTUNE:['Inner Life Palace','福德宫'],PARENTS:['Parents Palace','父母宫']
});

function fail(code){throw Object.assign(new Error(code),{code});}
function object(value,code){if(!value||typeof value!=='object'||Array.isArray(value))fail(code);return value;}
function list(value){return Array.isArray(value)?value:[];}
function clean(value){return String(value??'').trim();}
function codeLabel(code,locale){return clean(code).toLowerCase().replaceAll('_',' ').replace(/\b\w/g,x=>locale==='en'?x.toUpperCase():x);}
function group(projection,code){return list(projection?.calculation?.structures).find(x=>x?.code===code)||null;}
function projectionMethodId(projection){return METHOD_BY_PUBLIC.get(projection?.method?.publicMethodCode)||null;}
function projectionVersion(projection){return projection?.version?.projectionContractVersion||projection?.schemaVersion||null;}
function houseSystemId(projection){return group(projection,'HOUSE_CUSPS')?.items?.find(x=>x?.meta?.houseSystemCode)?.meta?.houseSystemCode||null;}
function houseSystemLabel(projection,locale){const id=houseSystemId(projection);if(id==='PLACIDUS_V1')return t(locale,'Placidus','普拉西德宫制');if(id==='WHOLE_SIGN_V1')return t(locale,'Whole Sign','整宫制');return t(locale,'the recorded house system','本次记录的宫制');}
function t(locale,en,zh){return locale==='zh-Hans'?zh:en;}
function labelForAst(code,locale){return AST_LABELS[locale]?.[code]||codeLabel(code,locale);}
function labelForBzr(value,locale){return locale==='zh-Hans'?(STEM_ZH[value]||BRANCH_ZH[value]||codeLabel(value,locale)):(STEM_EN[value]||BRANCH_EN[value]||codeLabel(value,locale));}
function labelForPalace(code,locale){const pair=PALACE_LABELS[code];return pair?(locale==='zh-Hans'?pair[1]:pair[0]):codeLabel(code,locale);}
function canonicalRef(projection,suffix){return `${projection.projectionId}#${suffix}`;}

async function digestProjection(projection){
  return sha256Stable({
    schemaVersion:projection.schemaVersion,
    projectionId:projection.projectionId,
    method:projection.method,
    calculation:projection.calculation,
    projection:projection.projection,
    unknown:projection.unknown,
    version:projection.version,
    houseSystemId:houseSystemId(projection)
  });
}

function validateProjection(projection,methodId){
  object(projection,'CX_R12R3B_CANONICAL_METHOD_PROJECTION_REQUIRED');
  const spec=METHODS[methodId];
  if(!spec||projection.method?.publicMethodCode!==spec.publicMethodCode)fail('CX_R12R3B_METHOD_PROJECTION_MISMATCH');
  const expected=methodId==='AST'?'PHI-OS-CANONICAL-METHOD-PROJECTION-v2.0.0':'PHI-OS-CANONICAL-METHOD-PROJECTION-v1.0.0';
  if(projection.schemaVersion!==expected||!projection.projectionId)fail('CX_R12R3B_CANONICAL_METHOD_PROJECTION_INVALID');
  if(projection.interpretation?.included!==false||projection.interpretation?.meaningAuthorityCreated!==false)fail('CX_R12R3B_UPSTREAM_INTERPRETATION_BOUNDARY_INVALID');
  if(methodId==='AST'&&group(projection,'HOUSE_CUSPS')){
    const used=houseSystemId(projection);
    if(!['PLACIDUS_V1','WHOLE_SIGN_V1'].includes(used))fail('CX_R12R3B_AST_HOUSE_SYSTEM_ID_REQUIRED');
    if(list(group(projection,'HOUSE_CUSPS')?.items).some(x=>x?.meta?.houseSystemCode!==used))fail('CX_R12R3B_AST_HOUSE_SYSTEM_MIXED');
  }
}

export async function createMethodInterpretationInput({canonicalProjection,methodId=projectionMethodId(canonicalProjection),locale='en',requestedDepth='STANDARD',availableContext={},authorityState={}}={}){
  assertLocale(locale);assertDepth(requestedDepth);validateProjection(canonicalProjection,methodId);
  const calculationDigest=await digestProjection(canonicalProjection);
  return deepFreeze({
    canonicalMethodProjection:clone(canonicalProjection),
    projectionVersion:projectionVersion(canonicalProjection),
    calculationDigest,
    methodId,
    locale,
    requestedDepth,
    availableContext:clone(availableContext),
    authorityState:clone(authorityState)
  });
}

function assertInterpretationInput(input){
  object(input,'CX_R12R3B_INTERPRETATION_INPUT_REQUIRED');
  const allowed=new Set(['canonicalMethodProjection','projectionVersion','calculationDigest','methodId','locale','requestedDepth','availableContext','authorityState']);
  for(const key of Object.keys(input))if(!allowed.has(key))fail(`CX_R12R3B_INTERPRETATION_INPUT_FIELD_FORBIDDEN:${key}`);
  assertLocale(input.locale);assertDepth(input.requestedDepth);validateProjection(input.canonicalMethodProjection,input.methodId);
}

function meaningContext(payload){
  const bundle=payload?.meaningBundle||payload?.bundle;
  const localeProjection=payload?.localeProjection;
  const localeItems=list(localeProjection?.items);
  const byCode=new Map(localeItems.map(x=>[x.meaningCode,x]));
  const refs=list(bundle?.items).map(item=>{
    const localized=byCode.get(item.meaningCode)||{};
    return deepFreeze({
      meaningRef:`${item.meaningCode}@${item.meaningVersion||'1.0.0'}`,
      meaningCode:item.meaningCode,
      label:localized.label||null,
      definition:localized.definition||null,
      sourceRefs:uniq([
        bundle?.bundleCode?`CMP:${bundle.bundleCode}`:null,
        item?.mappingLineage?.mappingCode?`MAP:${item.mappingLineage.mappingCode}`:null,
        item?.sourceProjectionRef?.projectionId?`PROJECTION:${item.sourceProjectionRef.projectionId}`:null
      ]),
      productionStatus:item.status||bundle?.status||null
    });
  });
  const sourceAdmitted=refs.length>0&&refs.every(x=>x.productionStatus==='PRODUCTION')&&Boolean(bundle?.bundleCode);
  const localeComplete=refs.length>0&&refs.every(x=>x.label&&x.definition)&&localeItems.length===list(bundle?.items).length;
  return deepFreeze({bundle,localeProjection,refs,sourceAdmitted,localeComplete});
}

function projectionReferenceCatalog(projection,methodId){
  const refs=[];
  if(methodId==='AST'){
    refs.push(...list(projection.calculation?.positions).map(x=>canonicalRef(projection,`POSITION:${x.code}`)));
    refs.push(...list(group(projection,'ASPECTS')?.items).map(x=>canonicalRef(projection,`ASPECT:${x.code}`)));
    if(houseSystemId(projection))refs.push(canonicalRef(projection,`HOUSE_SYSTEM:${houseSystemId(projection)}`));
  }else if(methodId==='NUM'){
    for(const value of list(projection.calculation?.values)){
      refs.push(canonicalRef(projection,`VALUE:${value.code}`));
      const steps=list(value.reductionSteps).length?value.reductionSteps:[value.rawValue,value.value].filter(x=>x!==null&&x!==undefined);
      steps.forEach((_,index)=>refs.push(canonicalRef(projection,`VALUE:${value.code}:STEP:${index+1}`)));
    }
  }else if(methodId==='BZR'){
    refs.push(...list(group(projection,'FOUR_PILLARS')?.items).map(x=>canonicalRef(projection,`FOUR_PILLARS:${x.code}`)));
  }else if(methodId==='ZWR'){
    refs.push(...list(group(projection,'ZI_WEI_PALACES')?.items).map(x=>canonicalRef(projection,`PALACE:${x.code}`)));
    refs.push(...list(group(projection,'ZI_WEI_STARS')?.items).map(x=>canonicalRef(projection,`STAR:${x.code}`)));
    refs.push(...list(group(projection,'ZI_WEI_TRANSFORMATIONS')?.items).map(x=>canonicalRef(projection,`TRANSFORMATION:${x.code}`)));
  }
  return new Set(refs);
}

function resolveCandidateReferences(candidate,projection,meaning){
  const failures=[],projectionRefs=projectionReferenceCatalog(projection,candidate.methodId),meaningRefs=new Set(meaning.refs.map(x=>x.meaningRef));
  for(const item of list(candidate.interpretationUnits)){
    for(const ref of item.projectionRefs)if(!projectionRefs.has(ref))failures.push(`PROJECTION_REF_UNRESOLVED:${ref}`);
    for(const ref of item.meaningRefs)if(!meaningRefs.has(ref))failures.push(`MEANING_REF_UNRESOLVED:${ref}`);
    for(const ref of item.ruleRefs)if(!COMPOSITION_RULES.has(ref))failures.push(`RULE_REF_UNRESOLVED:${ref}`);
  }
  return uniq(failures);
}

function pickMeanings(context,count=4){return context.refs.slice(0,Math.max(1,count));}
function meaningText(refs,locale){
  const definitions=refs.map(x=>clean(x.definition)).filter(Boolean).slice(0,3);
  if(definitions.length)return definitions.join(locale==='zh-Hans'?'；':' ');
  return t(locale,'The admitted meaning is not complete enough for a customer interpretation.','现有获准意义尚不足以形成客户解释。');
}

function unit({index,methodId,projection,projectionDigest,locale,title,subject,relation,projectionRefs,meanings,ruleRefs,priority='PRIMARY',structuralReason,relationContext,constructiveExpression,frictionExpression,observableSignals,question,uncertainties=[]}){
  const meaningRefs=meanings.map(x=>x.meaningRef);
  const sourceLineage=uniq(meanings.flatMap(x=>x.sourceRefs));
  const alternative=t(locale,`Another expression is possible when ${relation.toLowerCase()} is not active in the same context.`,`当${relationContext}没有在同一情境启动时，也可能出现另一种表现。`);
  return deepFreeze({
    interpretationUnitId:`CXI-${methodId}-${projectionDigest.slice(0,12).toUpperCase()}-${String(index+1).padStart(2,'0')}`,
    methodId,
    projectionRefs:uniq(projectionRefs),
    meaningRefs,
    ruleRefs:uniq(ruleRefs),
    title,
    plainLanguageExplanation:`${structuralReason} ${constructiveExpression} ${frictionExpression}`.trim(),
    structuralReason,
    relationContext,
    constructiveExpression,
    frictionExpression,
    activationConditions:[relationContext],
    observableSignals,
    alternativeInterpretations:[alternative],
    uncertainties,
    confidenceBoundary:t(locale,'This is a conditional structural interpretation, not a fact about lived reality.','这是有条件的结构解释，不是对现实经历的事实判定。'),
    sourceLineage,
    priority,
    subject,
    relationType:RELATIONS.has(relation)?relation:'DEPENDENCY',
    realityComparisonQuestions:[question],
    customerPublicationStatus:'HUMAN_REVIEW_REQUIRED'
  });
}

function composeAst(input,context,projectionDigest){
  const p=input.canonicalMethodProjection,locale=input.locale,positions=list(p.calculation?.positions),aspects=list(group(p,'ASPECTS')?.items),placements=new Map(list(group(p,'HOUSE_PLACEMENTS')?.items).map(x=>[x.code,x.value]));
  const preferred=['SUN','MOON','ASC'];
  const subjects=[...positions.filter(x=>preferred.includes(x.code)),...positions.filter(x=>!preferred.includes(x.code))].slice(0,Math.min(3,positions.length));
  return subjects.map((body,index)=>{
    const aspect=aspects.find(x=>x?.meta?.fromCode===body.code||x?.meta?.toCode===body.code)||aspects[index%Math.max(aspects.length,1)];
    const other=aspect?.meta?.fromCode===body.code?aspect?.meta?.toCode:aspect?.meta?.fromCode;
    const bodyLabel=labelForAst(body.code,locale),otherLabel=other?labelForAst(other,locale):t(locale,'the wider chart','全盘其他位置');
    const house=placements.get(body.code)||null,relation=aspect?.meta?.type==='SQUARE'||aspect?.meta?.type==='OPPOSITION'?'TENSION':aspect?'SUPPORT':'DEPENDENCY';
    const refs=pickMeanings(context,4);
    const structuralReason=t(locale,
      `This theme comes from ${bodyLabel}${house?` in House ${house}`:''} read together with ${otherLabel}, using ${houseSystemLabel(p,locale)}, rather than from one symbol alone.`,
      `这一主题来自${bodyLabel}${house?`落在第 ${house} 宫`:''}与${otherLabel}的共同关系，并严格采用${houseSystemId(p)==='PLACIDUS_V1'?'普拉西德宫制':'本次记录的宫制'}，不是从单一符号直接推断。`);
    const relationContext=t(locale,`${bodyLabel} and ${otherLabel} are read in the context of ${aspect?.meta?.type?codeLabel(aspect.meta.type,locale):'their recorded placement'}.`,`${bodyLabel}与${otherLabel}需放在${aspect?.meta?.type?codeLabel(aspect.meta.type,locale):'本次实际落位'}的关系情境中阅读。`);
    const constructive=t(locale,`When the two functions can coordinate, one possible expression is: ${meaningText(refs,locale)}`,`当两项功能能够协调时，一种可能的建设性表现是：${meaningText(refs,locale)}`);
    const friction=t(locale,`Under pressure, the same configuration may make one function crowd out the other; this is an alternative expression to observe, not a fixed trait.`,`压力升高时，同一结构也可能让一项功能压过另一项；这是需要观察的另一种表现，不是固定性格。`);
    return unit({index,methodId:'AST',projection:p,projectionDigest,locale,title:t(locale,`${bodyLabel} in a connected configuration`,`${bodyLabel}所在的关联结构`),subject:body.code,relation,projectionRefs:[canonicalRef(p,`POSITION:${body.code}`),other?canonicalRef(p,`POSITION:${other}`):null,aspect?canonicalRef(p,`ASPECT:${aspect.code}`):null,canonicalRef(p,`HOUSE_SYSTEM:${houseSystemId(p)}`)],meanings:refs,ruleRefs:['CX-COMP-AST-PLANET-SIGN-HOUSE-v1',aspect?'CX-COMP-AST-ASPECT-v1':'CX-COMP-AST-PLACEMENT-v1'],priority:index<3?'PRIMARY':'SECONDARY',structuralReason,relationContext,constructiveExpression:constructive,frictionExpression:friction,observableSignals:[t(locale,`Notice when ${bodyLabel} and ${otherLabel} support the same response.`,`观察${bodyLabel}与${otherLabel}何时支持同一种应对方式。`)],question:t(locale,`In which situations do you notice the difference between coordination and friction in this configuration?`,`在什么情境里，你最容易看见这个结构由协调转为拉扯的差别？`),uncertainties:list(p.unknown).map(x=>x.code)});
  });
}

function composeNum(input,context,projectionDigest){
  const p=input.canonicalMethodProjection,locale=input.locale,values=list(p.calculation?.values),cycles=list(p.calculation?.cycles),refs=pickMeanings(context,3);
  return values.slice(0,5).map((value,index)=>{
    const role=codeLabel(value.code,locale),path=list(value.reductionSteps).length?value.reductionSteps:[value.rawValue,value.value].filter(x=>x!==null&&x!==undefined);
    const relation=path.length>1?'TRANSITION':cycles.length?'ACTIVATION':'DEPENDENCY';
    const structuralReason=t(locale,`This theme comes from the ${role} role and its recorded path ${path.join(' → ')||value.value}; it is not a free-standing meaning for the final digit.`,`这一主题来自“${role}”这一计算角色及其实际推导路径 ${path.join(' → ')||value.value}，不是只看最终数字的独立标签。`);
    const relationContext=t(locale,cycles.length?`The role is read alongside the authorised cycle context without predicting an event.`:`The role is read against its compound and reduction context; no active cycle was established.`,cycles.length?'这一角色与已获准的周期情境共同阅读，但不预测具体事件。':'这一角色需结合原数和化简路径阅读；本次没有建立获准的活动周期。');
    return unit({index,methodId:'NUM',projection:p,projectionDigest,locale,title:t(locale,`${role}: role and derivation`,`${role}：角色与推导`),subject:value.code,relation,projectionRefs:[canonicalRef(p,`VALUE:${value.code}`),...path.map((_,i)=>canonicalRef(p,`VALUE:${value.code}:STEP:${i+1}`))],meanings:refs,ruleRefs:['CX-COMP-NUM-ROLE-NUMBER-PATH-v1',cycles.length?'CX-COMP-NUM-CYCLE-v1':null],priority:index<3?'PRIMARY':'SECONDARY',structuralReason,relationContext,constructiveExpression:t(locale,`A constructive expression may be to use the role deliberately while retaining the nuance of its derivation: ${meaningText(refs,locale)}`,`建设性的表现可能是有意识地运用这一角色，同时保留推导路径的差异：${meaningText(refs,locale)}`),frictionExpression:t(locale,'When the final number is treated as a complete identity, context is lost and the reading can become too rigid.','若把最终数字当成完整身份，推导情境会被抹去，解释也容易变得僵化。'),observableSignals:[t(locale,`Observe whether the ${role} pattern appears differently across distinct responsibilities.`,`观察“${role}”在不同责任情境中是否以不同方式出现。`)],question:t(locale,`Which real situation best shows how this role operates, rather than merely matching the number label?`,`哪一个现实情境最能说明这个角色如何运作，而不只是“对上数字标签”？`),uncertainties:list(p.unknown).map(x=>x.code)});
  });
}

function bzrPairs(p){
  const items=list(group(p,'FOUR_PILLARS')?.items),prefixes=['YEAR','MONTH','DAY','HOUR'];
  return prefixes.map(prefix=>({prefix,stem:items.find(x=>x.code===`${prefix}_STEM`),branch:items.find(x=>x.code===`${prefix}_BRANCH`)})).filter(x=>x.stem||x.branch);
}
function composeBzr(input,context,projectionDigest){
  const p=input.canonicalMethodProjection,locale=input.locale,pairs=bzrPairs(p),refs=pickMeanings(context,4);const month=pairs.find(x=>x.prefix==='MONTH'),day=pairs.find(x=>x.prefix==='DAY');
  return pairs.slice(0,4).map((pair,index)=>{
    const pillar=t(locale,`${codeLabel(pair.prefix,locale)} Pillar`,`${{YEAR:'年柱',MONTH:'月柱',DAY:'日柱',HOUR:'时柱'}[pair.prefix]}`),stem=labelForBzr(pair.stem?.value,locale),branch=labelForBzr(pair.branch?.value,locale),dayStem=labelForBzr(day?.stem?.value,locale),monthBranch=labelForBzr(month?.branch?.value,locale);
    const structuralReason=t(locale,`This theme comes from the role of the ${pillar}, its stem ${stem}, its branch ${branch}, and its relationship to the day reference ${dayStem} under the month context ${monthBranch}.`,`这一主题来自${pillar}的柱位角色、天干${stem}、地支${branch}，以及它与日主${dayStem}在月令${monthBranch}之下的关系，不是由单一干支直接推断。`);
    const relationContext=t(locale,`The ${pillar} is interpreted through day-reference and seasonal context; roots, ten-god or clash claims are omitted unless present in the projection.`,`${pillar}必须经日主与季节情境组合；若投射中没有根气、十神或合冲刑害，就不会补写相关结论。`);
    return unit({index,methodId:'BZR',projection:p,projectionDigest,locale,title:t(locale,`${pillar} in the four-pillar structure`,`${pillar}在四柱结构中的作用`),subject:pair.prefix,relation:index===2?'DEPENDENCY':'SUPPORT',projectionRefs:[pair.stem?canonicalRef(p,`FOUR_PILLARS:${pair.stem.code}`):null,pair.branch?canonicalRef(p,`FOUR_PILLARS:${pair.branch.code}`):null,day?.stem?canonicalRef(p,`FOUR_PILLARS:${day.stem.code}`):null,month?.branch?canonicalRef(p,`FOUR_PILLARS:${month.branch.code}`):null],meanings:refs,ruleRefs:['CX-COMP-BZR-PILLAR-DAY-SEASON-v1'],priority:index<3?'PRIMARY':'SECONDARY',structuralReason,relationContext,constructiveExpression:t(locale,`When the role, season and day reference support one another, a constructive expression may be: ${meaningText(refs,locale)}`,`当柱位、月令与日主关系能够互相支持时，一种建设性表现可能是：${meaningText(refs,locale)}`),frictionExpression:t(locale,'When one layer is overemphasised, the same structure may become narrow or reactive; this remains an alternative expression, not a verdict.','若其中一层被过度强调，同一结构可能变得狭窄或反应性较强；这只是另一种可能表现，不是定论。'),observableSignals:[t(locale,`Observe when the ${pillar} role becomes more visible than the other pillar roles.`,`观察${pillar}在什么情境下比其他柱位更明显。`)],question:t(locale,`Where in lived experience does this pillar role appear, and where does it not?`,`在真实经历中，这个柱位角色在哪里较明显，又在哪里并不成立？`),uncertainties:list(p.unknown).map(x=>x.code)});
  });
}

function zwiPalaces(p){return list(group(p,'ZI_WEI_PALACES')?.items);}
function composeZwr(input,context,projectionDigest){
  const p=input.canonicalMethodProjection,locale=input.locale,palaces=zwiPalaces(p),stars=list(group(p,'ZI_WEI_STARS')?.items),transformations=list(group(p,'ZI_WEI_TRANSFORMATIONS')?.items),refs=pickMeanings(context,4);
  const selected=[...palaces.filter(x=>x.meta?.isLifePalace||x.meta?.isBodyPalace),...palaces].filter((x,i,a)=>a.findIndex(y=>y.code===x.code)===i).slice(0,3);
  return selected.map((palace,index)=>{
    const label=labelForPalace(palace.code,locale),here=stars.filter(x=>x.meta?.palaceCode===palace.code),opposite=palaces[(palaces.indexOf(palace)+6)%Math.max(palaces.length,1)],changes=transformations.filter(x=>x.meta?.palaceCode===palace.code);
    const other=opposite?labelForPalace(opposite.code,locale):t(locale,'the palace network','宫位网络');
    const structuralReason=t(locale,`This theme comes from ${label}, its ${here.length} admitted star placement(s), ${changes.length} recorded transformation(s), and its network relation with ${other}; the palace is not interpreted in isolation.`,`这一主题来自${label}、其中 ${here.length} 个已纳入的星曜落位、${changes.length} 个已记录的四化，以及它与${other}的宫位网络关系；不会把单一宫位孤立解释。`);
    const relationContext=t(locale,`The palace is read through life/body emphasis and the recorded opposite or triad network; no unapproved school or time overlay is mixed in.`,`该宫位经命身重点及已记录的对宫／三方网络阅读；不会混入未经批准的流派或时间叠层。`);
    return unit({index,methodId:'ZWR',projection:p,projectionDigest,locale,title:t(locale,`${label} in the palace network`,`${label}在宫位网络中的位置`),subject:palace.code,relation:changes.length?'ACTIVATION':'DEPENDENCY',projectionRefs:[canonicalRef(p,`PALACE:${palace.code}`),...here.map(x=>canonicalRef(p,`STAR:${x.code}`)),...changes.map(x=>canonicalRef(p,`TRANSFORMATION:${x.code}`)),opposite?canonicalRef(p,`PALACE:${opposite.code}`):null],meanings:refs,ruleRefs:['CX-COMP-ZWR-PALACE-NETWORK-v1',changes.length?'CX-COMP-ZWR-FOUR-TRANSFORMATION-v1':null],priority:'PRIMARY',structuralReason,relationContext,constructiveExpression:t(locale,`When the network functions coherently, one constructive expression may be: ${meaningText(refs,locale)}`,`当宫位网络能够协调运作时，一种建设性表现可能是：${meaningText(refs,locale)}`),frictionExpression:t(locale,'When one palace demand dominates the network, support from the opposite or triad context may be harder to use; this is a conditional alternative.','当某一宫位需求压过整体网络时，对宫或三方的支持可能较难运用；这是有条件的另一种表现。'),observableSignals:[t(locale,`Observe whether ${label} and ${other} become active in the same situation or at different times.`,`观察${label}与${other}是在同一情境同时出现，还是在不同时间启动。`)],question:t(locale,`Which real situation shows the relationship between ${label} and ${other} most clearly?`,`哪一个现实情境最能看见${label}与${other}之间的关系？`),uncertainties:list(p.unknown).map(x=>x.code)});
  });
}

const COMPOSERS=Object.freeze({AST:composeAst,NUM:composeNum,BZR:composeBzr,ZWR:composeZwr});

function lifecycleFor(projection,meaning,units,humanReview=null){
  const flags={
    CALCULATED:['COMPLETE','PARTIAL'].includes(projection?.calculation?.status),
    PROJECTED:Boolean(projection?.projectionId),
    MEANING_AVAILABLE:meaning.refs.length>0,
    SOURCE_ADMITTED:meaning.sourceAdmitted,
    LOCALE_COMPLETE:meaning.localeComplete,
    COMPOSITION_SUPPORTED:units.length>0,
    HUMAN_REVIEWED:Boolean(humanReview?.methodFidelityAccepted===true&&humanReview?.customerClarityAccepted===true&&clean(humanReview?.evidenceRef)),
    CUSTOMER_PUBLISHABLE:false
  };
  flags.CUSTOMER_PUBLISHABLE=flags.HUMAN_REVIEWED&&CX_R12R3B_LIFECYCLE.slice(0,-1).every(x=>flags[x]);
  let current='CALCULATED';for(const stage of CX_R12R3B_LIFECYCLE){if(!flags[stage])break;current=stage;}
  return deepFreeze({sequence:CX_R12R3B_LIFECYCLE,flags,currentStage:current,customerPublishable:flags.CUSTOMER_PUBLISHABLE});
}

function customerText(unit){return [unit.title,unit.plainLanguageExplanation,unit.structuralReason,unit.relationContext,unit.constructiveExpression,unit.frictionExpression,...unit.observableSignals,...unit.alternativeInterpretations,...unit.realityComparisonQuestions].join(' ');}

export function validateInterpretationCandidate(candidate){
  const failures=[];const seen=new Set();
  if(candidate?.schemaVersion!=='PHI-OS-METHOD-INTERPRETATION-CANDIDATE-v2.0.0')failures.push('CANDIDATE_SCHEMA_INVALID');
  if(!METHODS[candidate?.methodId])failures.push('METHOD_INVALID');
  if(!candidate?.projectionDigest||candidate?.projectionDigest!==candidate?.sourceReference?.projectionDigest)failures.push('PROJECTION_DIGEST_MISMATCH');
  for(const item of list(candidate?.interpretationUnits)){
    if(item?.methodId!==candidate?.methodId)failures.push('UNIT_METHOD_MISMATCH');
    for(const field of ['interpretationUnitId','methodId','title','plainLanguageExplanation','structuralReason','relationContext','constructiveExpression','frictionExpression','confidenceBoundary'])if(!clean(item?.[field]))failures.push(`UNIT_${field.toUpperCase()}_MISSING`);
    for(const field of ['projectionRefs','meaningRefs','ruleRefs','activationConditions','observableSignals','alternativeInterpretations','sourceLineage','realityComparisonQuestions'])if(!list(item?.[field]).length)failures.push(`UNIT_${field.toUpperCase()}_MISSING`);
    for(const ref of list(item?.projectionRefs))if(!clean(candidate?.sourceReference?.projectionId)||!ref.startsWith(`${candidate.sourceReference.projectionId}#`))failures.push('UNIT_PROJECTION_REF_INVALID');
    for(const ref of list(item?.meaningRefs))if(!/^.+@\d+\.\d+\.\d+$/.test(ref))failures.push('UNIT_MEANING_REF_INVALID');
    for(const ref of list(item?.ruleRefs))if(!COMPOSITION_RULES.has(ref))failures.push('UNIT_RULE_REF_INVALID');
    for(const ref of list(item?.sourceLineage))if(!/^(?:CMP|MAP|PROJECTION):/.test(ref))failures.push('UNIT_SOURCE_LINEAGE_INVALID');
    if(item.priority==='PRIMARY'&&(!item.structuralReason||!item.relationContext||!item.constructiveExpression||!item.frictionExpression||!item.observableSignals?.length||!item.realityComparisonQuestions?.length))failures.push('INTERPRETATION_QUALITY_FLOOR_FAILED');
    const text=customerText(item);if(RAW_PINYIN_CODES.test(text)||RAW_TECHNICAL_COPY.test(text)||text.includes('结构项'))failures.push('RAW_CUSTOMER_CODE');if(SENSITIVE.test(text))failures.push('SENSITIVE_DOMAIN_LANGUAGE');
    const semantic=item.plainLanguageExplanation.toLowerCase().replace(/\s+/g,' ').trim();if(seen.has(semantic))failures.push('SEMANTIC_DUPLICATION');seen.add(semantic);
  }
  if(candidate?.atomicMeaningPublishedDirectly===true)failures.push('ATOMIC_MEANING_DIRECT_PUBLICATION');
  return deepFreeze({valid:failures.length===0,failures:uniq(failures),failureMode:failures.length?'STRUCTURE_ONLY':'NONE'});
}

export async function createMethodInterpretationCandidate({input,meaningPayload,humanReview=null}={}){
  assertInterpretationInput(input);
  const projection=input.canonicalMethodProjection;
  const calculated=await digestProjection(projection);if(calculated!==input.calculationDigest)fail('CX_R12R3B_CALCULATION_DIGEST_MISMATCH');
  const meaning=meaningContext(meaningPayload);
  const projectionDigest=calculated;
  const composer=COMPOSERS[input.methodId];
  const units=meaning.refs.length&&meaning.sourceAdmitted&&meaning.localeComplete?composer(input,meaning,projectionDigest):[];
  const semanticCore=units.map(x=>({methodId:x.methodId,projectionRefs:x.projectionRefs,meaningRefs:x.meaningRefs,ruleRefs:x.ruleRefs,priority:x.priority,subject:x.subject,relationType:x.relationType}));
  const semanticDigest=await sha256Stable({methodId:input.methodId,projectionDigest,compositionVersion:CX_R12R3B_COMPOSITION_VERSION,semanticCore});
  const interpretationDigest=await sha256Stable({semanticDigest,locale:input.locale,requestedDepth:input.requestedDepth,units});
  const lifecycle=lifecycleFor(projection,meaning,units,humanReview);
  const base={
    schemaVersion:'PHI-OS-METHOD-INTERPRETATION-CANDIDATE-v2.0.0',
    candidateId:`CXIC-${input.methodId}-${interpretationDigest.slice(0,20).toUpperCase()}`,
    methodId:input.methodId,
    publicMethodCode:METHODS[input.methodId].publicMethodCode,
    locale:input.locale,
    requestedDepth:input.requestedDepth,
    projectionDigest,
    calculationDigest:input.calculationDigest,
    houseSystemId:input.methodId==='AST'?houseSystemId(projection):null,
    sourceReference:{projectionId:projection.projectionId,projectionVersion:input.projectionVersion,projectionDigest},
    compositionVersion:CX_R12R3B_COMPOSITION_VERSION,
    interpretationUnits:units,
    atomicMeaningPublishedDirectly:false,
    lifecycle,
    semanticDigest,
    interpretationDigest,
    authority:{calculationOwner:'UPSTREAM_METHOD_RUNTIME',projectionOwner:'CANONICAL_METHOD_PROJECTION',meaningOwner:'CANONICAL_MEANING_PRODUCTION',compositionOwner:'SHARED_CX_R12R3B_RUNTIME',rendererMayCreateMeaning:false,aiMayCreateMeaning:false},
    status:lifecycle.customerPublishable?'CUSTOMER_PUBLISHABLE':units.length?'HUMAN_REVIEW_REQUIRED':'STRUCTURE_ONLY'
  };
  const structuralValidation=validateInterpretationCandidate(base);
  const referenceFailures=resolveCandidateReferences(base,projection,meaning);
  const failures=uniq([...structuralValidation.failures,...referenceFailures]);
  const validation=deepFreeze({valid:failures.length===0,failures,failureMode:failures.length?'STRUCTURE_ONLY':'NONE'});
  return deepFreeze({...base,validation,status:validation.valid?base.status:'STRUCTURE_ONLY'});
}

export async function promoteAcceptedInterpretation(candidate,humanReview){
  const validation=validateInterpretationCandidate(candidate);
  if(!validation.valid||candidate?.validation?.valid!==true)fail('CX_R12R3B_CANDIDATE_VALIDATION_REQUIRED');
  if(!CX_R12R3B_LIFECYCLE.slice(0,6).every(stage=>candidate?.lifecycle?.flags?.[stage]===true))fail('CX_R12R3B_CANDIDATE_LIFECYCLE_INCOMPLETE');
  if(humanReview?.methodFidelityAccepted!==true||humanReview?.customerClarityAccepted!==true||!clean(humanReview?.evidenceRef))fail('CX_R12R3B_DUAL_HUMAN_ACCEPTANCE_EVIDENCE_REQUIRED');
  const lifecycle=lifecycleFor({calculation:{status:'COMPLETE'},projectionId:candidate.sourceReference.projectionId},{refs:[{}],sourceAdmitted:true,localeComplete:true},candidate.interpretationUnits,humanReview);
  const result={schemaVersion:CX_R12R3B_RESULT_SCHEMA,interpretationResultId:`CIR2-${candidate.interpretationDigest.slice(0,24).toUpperCase()}`,resultVersion:'2.0.0',resultStatus:'CUSTOMER_PUBLISHABLE',methodId:candidate.methodId,sourceReference:clone(candidate.sourceReference),locale:candidate.locale,requestedDepth:candidate.requestedDepth,interpretationUnits:clone(candidate.interpretationUnits),lifecycle,humanAcceptance:{methodFidelityAccepted:true,customerClarityAccepted:true,evidenceRef:humanReview.evidenceRef,reviewerRefs:clone(humanReview.reviewerRefs||[])},semanticDigest:candidate.semanticDigest,derivationDigest:candidate.interpretationDigest,authority:clone(candidate.authority)};
  return deepFreeze(result);
}

function graphBase(methodId,projection,projectionDigest,locale,nodes,edges,groups=[],overlays=[]){
  return {schemaVersion:CX_R12R3B_GRAPH_VERSION,methodId,projectionDigest,graphType:METHODS[methodId].graphType,nodes,edges,groups,overlays,legend:uniq(nodes.map(x=>x.role)).map(role=>({code:role,label:codeLabel(role,locale)})),interpretationBindings:[],accessibilitySummary:t(locale,`A text-equivalent ${METHODS[methodId].labels.en} structure graph with ${nodes.length} nodes and ${edges.length} relationships.`,`一张可由文字等价读取的${METHODS[methodId].labels['zh-Hans']}结构图，共有 ${nodes.length} 个节点和 ${edges.length} 条关系。`),textEquivalent:{summary:t(locale,'Every node and relationship is also available in the table fallback.','每个节点和关系都可在表格后备视图中读取。'),nodeCount:nodes.length,edgeCount:edges.length},tableFallback:{columns:['label','role','value','state'],rows:nodes.map(x=>({label:x.localizedLabel,role:x.role,value:x.value,state:x.state}))},sourceRefs:[`PROJECTION:${projection.projectionId}`],layoutStrategy:`${methodId}_EXISTING_RENDERER_STRATEGY`,rendererAuthorityCreated:false};
}

function astGraph(p,digest,locale){
  const nodes=list(p.calculation?.positions).map((x,i)=>({nodeId:`AST-BODY-${x.code}`,canonicalRef:canonicalRef(p,`POSITION:${x.code}`),label:x.code,localizedLabel:labelForAst(x.code,locale),role:x.meta?.nodeType&&x.meta.nodeType!=='NONE'?'NODE':'BODY',value:x.value,state:'CALCULATED',priority:i<3?'PRIMARY':'SUPPORTING',interpretationUnitRefs:[]}));
  const nodeSet=new Set(nodes.map(x=>x.label));
  const edges=list(group(p,'ASPECTS')?.items).filter(x=>nodeSet.has(x.meta?.fromCode)&&nodeSet.has(x.meta?.toCode)).map((x,i)=>({edgeId:`AST-ASPECT-${i+1}`,sourceNodeId:`AST-BODY-${x.meta.fromCode}`,targetNodeId:`AST-BODY-${x.meta.toCode}`,relationType:['SQUARE','OPPOSITION'].includes(x.meta.type)?'TENSION':'SUPPORT',canonicalRelationRef:canonicalRef(p,`ASPECT:${x.code}`),interpretationUnitRefs:[]}));
  const houses=list(group(p,'HOUSE_CUSPS')?.items).map(x=>({groupId:`AST-HOUSE-${x.meta?.houseNumber}`,label:t(locale,`House ${x.meta?.houseNumber}`,`第 ${x.meta?.houseNumber} 宫`),canonicalRef:canonicalRef(p,`HOUSE:${x.meta?.houseNumber}`),longitude:x.value,houseSystemId:x.meta?.houseSystemCode}));
  return graphBase('AST',p,digest,locale,nodes,edges,houses,[]);
}
function numGraph(p,digest,locale){
  const nodes=[],edges=[];
  for(const value of list(p.calculation?.values)){
    const steps=list(value.reductionSteps).length?value.reductionSteps:[value.rawValue,value.value].filter(x=>x!==null&&x!==undefined);
    steps.forEach((step,index)=>nodes.push({nodeId:`NUM-${value.code}-${index+1}`,canonicalRef:canonicalRef(p,`VALUE:${value.code}:STEP:${index+1}`),label:`${value.code}:${index+1}`,localizedLabel:index===steps.length-1?codeLabel(value.code,locale):t(locale,`Step ${index+1}`,`步骤 ${index+1}`),role:index===steps.length-1?'CALCULATION_ROLE':'DERIVATION_STEP',value:step,state:'CALCULATED',priority:index===steps.length-1?'PRIMARY':'SUPPORTING',interpretationUnitRefs:[]}));
    for(let i=1;i<steps.length;i++)edges.push({edgeId:`NUM-${value.code}-REDUCE-${i}`,sourceNodeId:`NUM-${value.code}-${i}`,targetNodeId:`NUM-${value.code}-${i+1}`,relationType:'TRANSITION',canonicalRelationRef:canonicalRef(p,`VALUE:${value.code}:REDUCTION:${i}`),interpretationUnitRefs:[]});
  }
  return graphBase('NUM',p,digest,locale,nodes,edges,[],list(p.calculation?.cycles).map(x=>({overlayId:`NUM-CYCLE-${x.cycleNumber}`,canonicalRef:canonicalRef(p,`CYCLE:${x.cycleNumber}`),label:codeLabel(x.code,locale),active:false})));
}
function bzrGraph(p,digest,locale){
  const nodes=[],edges=[],groups=[];
  for(const pair of bzrPairs(p)){
    const groupId=`BZR-${pair.prefix}`;groups.push({groupId,label:t(locale,`${codeLabel(pair.prefix,locale)} Pillar`,`${{YEAR:'年柱',MONTH:'月柱',DAY:'日柱',HOUR:'时柱'}[pair.prefix]}`)});
    for(const [kind,item] of [['STEM',pair.stem],['BRANCH',pair.branch]])if(item)nodes.push({nodeId:`${groupId}-${kind}`,canonicalRef:canonicalRef(p,`FOUR_PILLARS:${item.code}`),label:item.code,localizedLabel:labelForBzr(item.value,locale),role:kind,value:labelForBzr(item.value,locale),state:'CALCULATED',priority:pair.prefix==='DAY'?'PRIMARY':'SUPPORTING',interpretationUnitRefs:[],groupId});
    if(pair.stem&&pair.branch)edges.push({edgeId:`${groupId}-PAIR`,sourceNodeId:`${groupId}-STEM`,targetNodeId:`${groupId}-BRANCH`,relationType:'DEPENDENCY',canonicalRelationRef:canonicalRef(p,`FOUR_PILLARS:${pair.prefix}:PAIR`),interpretationUnitRefs:[]});
  }
  return graphBase('BZR',p,digest,locale,nodes,edges,groups,list(p.calculation?.cycles).map(x=>({overlayId:`BZR-CYCLE-${x.cycleNumber}`,canonicalRef:canonicalRef(p,`CYCLE:${x.cycleNumber}`),label:t(locale,`Cycle ${x.cycleNumber}`,`第 ${x.cycleNumber} 运`),active:false})));
}
function meaningLabelBySourceCode(payload,locale){
  const localized=new Map(list(payload?.localeProjection?.items).map(x=>[x.meaningCode,x.label]));
  return new Map(list(payload?.meaningBundle?.items).map(item=>[item?.sourceProjectionRef?.selector?.code,localized.get(item.meaningCode)]).filter(([code,label])=>code&&label).map(([code,label])=>[code,locale==='zh-Hans'?label.split('｜')[0].trim():label]));
}
function zwrGraph(p,digest,locale,meaningPayload){
  const palaces=zwiPalaces(p),stars=list(group(p,'ZI_WEI_STARS')?.items),transformations=list(group(p,'ZI_WEI_TRANSFORMATIONS')?.items),nodes=[],edges=[];
  const governedLabels=meaningLabelBySourceCode(meaningPayload,locale);
  palaces.forEach(x=>nodes.push({nodeId:`ZWR-PALACE-${x.code}`,canonicalRef:canonicalRef(p,`PALACE:${x.code}`),label:x.code,localizedLabel:labelForPalace(x.code,locale),role:x.meta?.isLifePalace?'LIFE_PALACE':x.meta?.isBodyPalace?'BODY_PALACE':'PALACE',value:labelForBzr(x.value,locale),state:'CALCULATED',priority:x.meta?.isLifePalace||x.meta?.isBodyPalace?'PRIMARY':'SUPPORTING',interpretationUnitRefs:[]}));
  stars.forEach(x=>{nodes.push({nodeId:`ZWR-STAR-${x.code}`,canonicalRef:canonicalRef(p,`STAR:${x.code}`),label:x.code,localizedLabel:governedLabels.get(x.code)||codeLabel(x.code,locale),role:x.meta?.starClass==='MAIN'?'MAIN_STAR':'SUPPORT_STAR',value:labelForBzr(x.value,locale),state:'CALCULATED',priority:x.meta?.starClass==='MAIN'?'SECONDARY':'SUPPORTING',interpretationUnitRefs:[]});if(x.meta?.palaceCode)edges.push({edgeId:`ZWR-PLACEMENT-${x.code}`,sourceNodeId:`ZWR-STAR-${x.code}`,targetNodeId:`ZWR-PALACE-${x.meta.palaceCode}`,relationType:'DEPENDENCY',canonicalRelationRef:canonicalRef(p,`STAR_PLACEMENT:${x.code}`),interpretationUnitRefs:[]});});
  transformations.forEach(x=>{const star=stars.find(s=>s.code===x.meta?.targetStarCode);if(star&&x.meta?.palaceCode)edges.push({edgeId:`ZWR-TRANSFORMATION-${x.code}-${x.meta.targetStarCode}`,sourceNodeId:`ZWR-STAR-${x.meta.targetStarCode}`,targetNodeId:`ZWR-PALACE-${x.meta.palaceCode}`,relationType:'ACTIVATION',canonicalRelationRef:canonicalRef(p,`TRANSFORMATION:${x.code}:${x.meta.targetStarCode}`),interpretationUnitRefs:[]});});
  for(let i=0;i<palaces.length/2;i++)edges.push({edgeId:`ZWR-OPPOSITE-${i+1}`,sourceNodeId:`ZWR-PALACE-${palaces[i].code}`,targetNodeId:`ZWR-PALACE-${palaces[i+6].code}`,relationType:'COUNTERBALANCE',canonicalRelationRef:canonicalRef(p,`OPPOSITE:${palaces[i].code}:${palaces[i+6].code}`),interpretationUnitRefs:[]});
  return graphBase('ZWR',p,digest,locale,nodes,edges,palaces.map(x=>({groupId:`ZWR-GROUP-${x.code}`,label:labelForPalace(x.code,locale),canonicalRef:canonicalRef(p,`PALACE:${x.code}`)})),[]);
}
const GRAPHERS=Object.freeze({AST:astGraph,NUM:numGraph,BZR:bzrGraph,ZWR:zwrGraph});

export async function projectMethodGraph({input,acceptedInterpretation=null,candidate=null,meaningPayload=null}={}){
  assertInterpretationInput(input);const digest=await digestProjection(input.canonicalMethodProjection);if(digest!==input.calculationDigest)fail('CX_R12R3B_GRAPH_PROJECTION_DIGEST_MISMATCH');
  const graph=GRAPHERS[input.methodId](input.canonicalMethodProjection,digest,input.locale,meaningPayload);
  const accepted=acceptedInterpretation?.schemaVersion===CX_R12R3B_RESULT_SCHEMA&&acceptedInterpretation?.resultStatus==='CUSTOMER_PUBLISHABLE'&&acceptedInterpretation?.lifecycle?.customerPublishable===true&&acceptedInterpretation?.methodId===input.methodId;
  const source=accepted?acceptedInterpretation:candidate;
  if(source?.sourceReference?.projectionDigest!==digest)fail('CX_R12R3B_GRAPH_INTERPRETATION_PROJECTION_MISMATCH');
  const units=list(source?.interpretationUnits),bindings=units.flatMap(u=>u.projectionRefs.map(ref=>({canonicalRef:ref,interpretationUnitRef:u.interpretationUnitId,acceptance:accepted?'CUSTOMER_ACCEPTED':'DEVELOPMENT_ONLY_NOT_CUSTOMER_ACCEPTED'})));
  const nodeBindings=new Map(),edgeBindings=new Map();for(const b of bindings){if(!nodeBindings.has(b.canonicalRef))nodeBindings.set(b.canonicalRef,[]);nodeBindings.get(b.canonicalRef).push(b.interpretationUnitRef);if(!edgeBindings.has(b.canonicalRef))edgeBindings.set(b.canonicalRef,[]);edgeBindings.get(b.canonicalRef).push(b.interpretationUnitRef);}
  const withBindings={...graph,nodes:graph.nodes.map(x=>({...x,interpretationUnitRefs:uniq(nodeBindings.get(x.canonicalRef)||[])})),edges:graph.edges.map(x=>({...x,interpretationUnitRefs:uniq(edgeBindings.get(x.canonicalRelationRef)||[])})),interpretationBindings:bindings};
  const graphDigest=await sha256Stable({contractVersion:CX_R12R3B_GRAPH_VERSION,locale:input.locale,projectionDigest:digest,nodes:withBindings.nodes,edges:withBindings.edges,groups:withBindings.groups,overlays:withBindings.overlays});
  return deepFreeze({...withBindings,graphDigest,houseSystemId:input.methodId==='AST'?houseSystemId(input.canonicalMethodProjection):null,customerInterpretationBindingsAccepted:Boolean(accepted)});
}

function projectAcceptedInterpretationToThemes(result){
  if(result?.schemaVersion!==CX_R12R3B_RESULT_SCHEMA||result?.resultStatus!=='CUSTOMER_PUBLISHABLE'||result?.lifecycle?.customerPublishable!==true)fail('CX_R12R3B_ACCEPTED_METHOD_INTERPRETATION_REQUIRED');
  return list(result.interpretationUnits).map(item=>{
    const rule=THEME_RULES.find(candidate=>candidate.relationTypes.includes(item.relationType));
    if(!rule||!THEMES.has(rule.theme))fail('CX_R12R3B_SHARED_THEME_PROJECTION_RULE_REQUIRED');
    return {theme:rule.theme,methodSource:result.methodId,interpretationUnitRefs:[item.interpretationUnitId],projectionRefs:clone(item.projectionRefs),registryRuleRef:rule.ruleRef,sourceSemanticDigest:result.semanticDigest,sharedThemeProjectionOnly:true};
  });
}

export function createCrossPerspectiveMap(acceptedResults,{locale='en'}={}){
  assertLocale(locale);if(!Array.isArray(acceptedResults)||acceptedResults.length!==4)fail('CX_R12R3B_FOUR_ACCEPTED_METHOD_INTERPRETATIONS_REQUIRED');
  const seen=new Set();const themes=[];
  for(const result of acceptedResults){
    if(seen.has(result.methodId))fail('CX_R12R3B_DUPLICATE_METHOD_RESULT');seen.add(result.methodId);
    themes.push(...projectAcceptedInterpretationToThemes(result));
  }
  if([...METHOD_BY_PUBLIC.values()].some(methodId=>!seen.has(methodId)))fail('CX_R12R3B_ALL_METHOD_INTERPRETATIONS_REQUIRED');
  const grouped=[...THEMES].map(theme=>({theme,sources:themes.filter(x=>x.theme===theme)})).filter(x=>x.sources.length>1);
  return deepFreeze({schemaVersion:'PHI-OS-CROSS-PERSPECTIVE-THEME-MAP-v1.0.0',locale,status:'ACCEPTED_INTERPRETATIONS_ONLY',themes:grouped,rawMethodSymbolsCompared:false,authority:{mayCreateUnifiedPersonalityConclusion:false,sharedRealityThemeRegistry:'CX-R12R3B-SHARED-REALITY-THEME-REGISTRY-v1'}});
}

export function semanticEquality(a,b){return Boolean(a?.semanticDigest&&a.semanticDigest===b?.semanticDigest);}
export function stableRuntimeSnapshot(value){return stableStringify(value);}
