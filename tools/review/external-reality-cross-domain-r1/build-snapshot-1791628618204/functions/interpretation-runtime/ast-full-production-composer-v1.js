/**
 * AST strategy of the existing shared composition owner, not a second meaning
 * or calculation authority. Explicit review profile; never live-admitted.
 */
export const AST_FP_COMPOSITION_VERSION='AST-FP-COMPOSITION-CANDIDATE-v1.0.0';
export const AST_FP_RULES=Object.freeze(['AST-FP-PLACEMENT-v1','AST-FP-ASPECT-DYAD-v1']);
export const AST_FP_ASPECT_POLICY=Object.freeze({
  CONJUNCTION:{angle:0,orb:8,relation:'DEPENDENCY'},
  SEXTILE:{angle:60,orb:4,relation:'SUPPORT'},
  SQUARE:{angle:90,orb:6,relation:'TENSION'},
  TRINE:{angle:120,orb:6,relation:'SUPPORT'},
  OPPOSITION:{angle:180,orb:8,relation:'TENSION'}
});
const CORE=['SUN','MOON','MERCURY','VENUS','MARS','JUPITER','SATURN','URANUS','NEPTUNE','PLUTO'];
const BODIES=[...CORE,'NORTH_NODE','SOUTH_NODE'];
const SIGNS=[['Aries','白羊座'],['Taurus','金牛座'],['Gemini','双子座'],['Cancer','巨蟹座'],['Leo','狮子座'],['Virgo','处女座'],['Libra','天秤座'],['Scorpio','天蝎座'],['Sagittarius','射手座'],['Capricorn','摩羯座'],['Aquarius','水瓶座'],['Pisces','双鱼座']];
const ASPECT_NAMES={CONJUNCTION:['conjunction','合相'],SEXTILE:['sextile','六合'],SQUARE:['square','刑相'],TRINE:['trine','三合'],OPPOSITION:['opposition','对分相']};
const list=v=>Array.isArray(v)?v:[];
const uniq=values=>[...new Set(values.filter(Boolean))];
const fail=code=>{throw Object.assign(new Error(code),{code});};
const numeric=v=>typeof v==='number'&&Number.isFinite(v);
const separation=(a,b)=>Math.min(Math.abs(a-b),360-Math.abs(a-b));
const group=(p,code)=>list(p.calculation?.structures).find(g=>g.code===code)?.items||[];

/** Validate the supplied graph against the supplied longitudes; no ephemeris,
 * new aspect, house, pattern, ruler or dominant is calculated here. */
export function inspectAstEvidence(projection){
  const groups=list(projection?.calculation?.structures);
  if(new Set(groups.map(g=>g.code)).size!==groups.length)fail('AST_FP_STRUCTURE_GROUP_DUPLICATE');
  const positions=list(projection?.calculation?.positions),byBody=new Map();
  for(const p of positions){
    if(!BODIES.includes(p.code)||!numeric(p.value)||p.value<0||p.value>=360)fail('AST_FP_POSITION_INVALID');
    if(byBody.has(p.code))fail('AST_FP_POSITION_DUPLICATE');
    byBody.set(p.code,p);
  }
  if(!positions.length)fail('AST_FP_POSITIONS_REQUIRED');
  const cusps=group(projection,'HOUSE_CUSPS'),placements=group(projection,'HOUSE_PLACEMENTS');
  const houseSystem=cusps[0]?.meta?.houseSystemCode||null;
  if(cusps.length){
    if(cusps.length!==12||!['PLACIDUS_V1','WHOLE_SIGN_V1'].includes(houseSystem))fail('AST_FP_HOUSES_INVALID');
    if(new Set(cusps.map(c=>c.code)).size!==12)fail('AST_FP_HOUSE_DUPLICATE');
    for(let i=1;i<=12;i++){
      const c=cusps.find(x=>x.code===`HOUSE_${i}`);
      if(!c||!numeric(c.value)||c.value<0||c.value>=360||c.meta?.houseSystemCode!==houseSystem)fail('AST_FP_HOUSES_INVALID');
    }
  }else if(placements.length)fail('AST_FP_HOUSE_PLACEMENT_WITHOUT_CUSPS');
  const houses=new Map();
  for(const place of placements){
    if(!byBody.has(place.code)||!Number.isInteger(place.value)||place.value<1||place.value>12||place.meta?.houseSystemCode!==houseSystem)fail('AST_FP_HOUSE_PLACEMENT_INVALID');
    if(houses.has(place.code))fail('AST_FP_HOUSE_PLACEMENT_DUPLICATE');
    houses.set(place.code,place.value);
  }
  const aspects=[],seenPairs=new Set(),seenCodes=new Set();
  for(const edge of group(projection,'ASPECTS')){
    const {fromCode:a,toCode:b,type,orb,authorizedOrbDegrees,applyingState}=edge.meta||{};
    const policy=AST_FP_ASPECT_POLICY[type];
    if(!policy)fail('AST_FP_ASPECT_TYPE_UNSUPPORTED');
    if(!CORE.includes(a)||!CORE.includes(b)||a===b||!byBody.has(a)||!byBody.has(b))fail('AST_FP_ASPECT_ENDPOINT_INVALID');
    const pair=[a,b].sort().join('|');
    if(seenPairs.has(pair)||!edge.code||seenCodes.has(edge.code))fail('AST_FP_ASPECT_DUPLICATE');
    if(!numeric(orb)||orb<0||orb>policy.orb||authorizedOrbDegrees!==policy.orb)fail('AST_FP_ASPECT_ORB_INVALID');
    const actual=separation(byBody.get(a).value,byBody.get(b).value);
    if(!numeric(edge.value)||Math.abs(actual-edge.value)>1e-7||Math.abs(Math.abs(actual-policy.angle)-orb)>1e-7)fail('AST_FP_ASPECT_GEOMETRY_MISMATCH');
    if(applyingState!=='UNDETERMINED')fail('AST_FP_APPLYING_STATE_UNSUPPORTED');
    seenPairs.add(pair);seenCodes.add(edge.code);
    aspects.push({...edge,pairKey:pair,relation:policy.relation});
  }
  aspects.sort((a,b)=>a.meta.orb/a.meta.authorizedOrbDegrees-b.meta.orb/b.meta.authorizedOrbDegrees||a.pairKey.localeCompare(b.pairKey));
  return {positions:[...positions].sort((a,b)=>BODIES.indexOf(a.code)-BODIES.indexOf(b.code)),byBody,houses,houseSystem,aspects};
}

function relationalText(type,a,b,locale){
  const zh=locale==='zh-Hans';
  const texts={
    CONJUNCTION:[
      [`${a} and ${b} are brought into the same response; closeness does not establish that the combination is easy.`,`${a}与${b}容易在同一个反应中被一起调动；接近并不等于彼此轻松支持。`],
      [`Try giving both functions an explicit place in the same task, checking whether one is speaking for the other.`,`可以观察：在同一件事中分别给${a}和${b}留出位置，是否比让其中一项代替另一项更清楚。`],
      [`Fusion may make it difficult to tell which need is driving the response; separate the two before drawing a conclusion.`,`摩擦点在于两种需要可能混在一起，难以辨认是谁在主导反应；先区分${a}与${b}，再判断这段描述是否贴合。`]
    ],
    SEXTILE:[
      [`${a} and ${b} offer a possible connection to practise, not an automatic advantage.`,`${a}与${b}之间有可尝试建立的联系，但不会自动变成优势。`],
      [`Look for a small situation in which deliberately using one function makes room for the other.`,`可以从一个小情境核对：主动运用${a}时，是否也给${b}创造了空间。`],
      [`An available connection may remain unused; opportunity in the chart is not evidence of an acquired skill.`,`如果缺少练习或情境不允许，${a}与${b}之间的联系也可能没有被运用；结构机会不等于已经具备的能力。`]
    ],
    TRINE:[
      [`${a} and ${b} can be considered as a potentially fluent connection; ease is not proof of an outcome.`,`${a}与${b}可作为较顺畅的联系来观察；顺畅不代表结果已经得到保证。`],
      [`Notice where moving between these two functions takes less deliberate effort, then compare it with actual feedback.`,`留意从${a}转到${b}时，哪些事情较少需要刻意用力，并用实际反馈核对，而非只凭熟悉感判断。`],
      [`A familiar response can go unexamined; apparent ease may also conceal a habit that no longer fits.`,`较熟悉的${a}—${b}回应也可能不再被检查；看似顺手，不代表它仍适合现在的情境。`]
    ],
    SQUARE:[
      [`${a} and ${b} may make competing demands on the same situation; neither function is inherently wrong.`,`${a}与${b}可能对同一情境提出不同要求；其中任何一项都不因此是错误的。`],
      [`Test whether giving these demands separate steps, time or boundaries lets both be addressed.`,`可以试着把${a}与${b}的要求分成不同步骤、时段或边界，核对是否更容易兼顾。`],
      [`Trying to satisfy both at once may create friction; suppressing one can hide the trade-off rather than resolve it.`,`若同时满足${a}与${b}会互相干扰，压下其中一项可能只是隐藏取舍，并未解决它。`]
    ],
    OPPOSITION:[
      [`${a} and ${b} are read as contrasting poles; this does not identify another person as the cause.`,`${a}与${b}从两端形成对照；不能据此认定另一个人是问题的原因。`],
      [`Compare situations in which each pole is useful, and whether a workable exchange is possible between them.`,`分别找出${a}与${b}各自有帮助的情境，再观察两端是否能协商出可行的交换。`],
      [`Moving entirely to one pole may make the other harder to recognise; alternating between them is not the same as integrating them.`,`完全偏向${a}或${b}时，另一端可能更难被看见；在两端来回摆动，也不等于已经整合。`]
    ]
  };
  return texts[type].map(pair=>pair[zh?1:0]);
}

export function composeAstFullProductionCandidate(input,context,projectionDigest,helpers){
  const {unit,canonicalRef,labelForAst,selectMeanings,t}=helpers;
  const p=input.canonicalMethodProjection,locale=input.locale;
  if(context.refs.some(r=>r.sourceProjectionRef?.projectionId!==p.projectionId))fail('AST_FP_MEANING_PROJECTION_MISMATCH');
  if(context.localeProjection?.locale!==locale)fail('AST_FP_MEANING_LOCALE_MISMATCH');
  const evidence=inspectAstEvidence(p),{positions,byBody,houses,houseSystem,aspects}=evidence;
  const omitted=[],units=[];
  const meanings=(body,kind,house)=>selectMeanings(context,{methodId:'AST',projection:p,subject:body.code,house},{limit:context.refs.length}).filter(r=>{
    const s=r.selector;return kind==='function'?s?.operator==='position_code_match':kind==='sign'?s?.operator==='position_longitude_segment':s?.operator==='structure_item_code_match'&&s.groupCode==='HOUSE_CUSPS';
  });
  const components=body=>({function:meanings(body,'function')[0],sign:meanings(body,'sign')[0],house:houses.has(body.code)?meanings(body,'house',houses.get(body.code))[0]:null});
  const atomCache=new Map(positions.map(b=>[b.code,components(b)]));
  const houseLabel=number=>t(locale,`House ${number}`,`第${number}宫`);
  const signLabel=body=>SIGNS[Math.floor(body.value/30)][locale==='zh-Hans'?1:0];
  const placementLabel=body=>`${labelForAst(body.code,locale)} · ${signLabel(body)}${houses.has(body.code)?` · ${houseLabel(houses.get(body.code))}`:''}`;
  const refsFor=body=>[canonicalRef(p,`POSITION:${body.code}`),...(houses.has(body.code)?[canonicalRef(p,`HOUSE_PLACEMENT:${body.code}`),canonicalRef(p,`HOUSE_CUSP:HOUSE_${houses.get(body.code)}`),canonicalRef(p,`HOUSE_SYSTEM:${houseSystem}`)]:[])];
  const uncertainties=uniq([...list(p.unknown).map(x=>x.code),...(!houseSystem?['AST_HOUSE_CONTEXT_UNAVAILABLE']:[]),'AST_FP_RELATIONAL_POLICY_PENDING_REVIEW']);
  function add(config,metadata){
    const result=unit({...config,index:units.length,methodId:'AST',projection:p,projectionDigest,locale,priority:'SECONDARY',uncertainties});
    const stableKey=metadata.kind==='PLACEMENT'?`PLACEMENT-${metadata.bodyCode}`:`ASPECT-${metadata.endpointCodes.join('-')}-${metadata.aspectType}`;
    units.push({...result,
      interpretationUnitId:`ASTFP-${projectionDigest.slice(0,12).toUpperCase()}-${stableKey}`,
      activationConditions:[t(locale,`A situation in which ${config.title} can be compared with specific actions and feedback; this condition is not established by the chart itself.`,`仅在能把「${config.title}」与具体行动及反馈对照的情境中使用；星盘本身不能证明这个条件已经成立。`)],
      alternativeInterpretations:[t(locale,`If the described response does not occur in comparable situations, do not force the experience to fit ${config.title}. Context or a different response may matter more.`,`若相近情境里没有出现所描述的回应，不必强行把经历套入「${config.title}」；实际条件或另一种应对方式可能更重要。`)],
      evidenceDetail:metadata});
  }
  for(const body of positions){
    const c=atomCache.get(body.code),bodyName=labelForAst(body.code,locale),house=houses.get(body.code);
    if(!c.function||!c.sign||(house&&!c.house)){omitted.push({kind:'PLACEMENT',code:body.code,reason:'REQUIRED_ADMITTED_MEANING_MISSING'});continue;}
    const domain=c.house?.label||null;
    const reason=t(locale,
      `${placementLabel(body)} connects ${c.function.label} with the expression ${c.sign.label}${domain?` in the area of ${domain}`:''}. Function, expression and life area are different layers.`,
      `${placementLabel(body)}：把「${c.function.label}」这一功能，放在「${c.sign.label}」的表达方式中${domain?`，并落到「${domain}」这个生活领域`:''}。功能、表达方式与生活领域是不同层次，不能互相替代。`);
    const contextText=t(locale,
      `${c.function.definition} ${c.sign.definition}${c.house?` ${c.house.definition}`:' No house or angle interpretation is added without a recorded house context.'}`,
      `${c.function.definition}${c.sign.definition}${c.house?c.house.definition:'本次没有可用的宫位资料，不补写宫位或四轴解释。'}`);
    add({title:placementLabel(body),subject:body.code,relation:'DEPENDENCY',projectionRefs:refsFor(body),meanings:[c.function,c.sign,c.house].filter(Boolean),ruleRefs:['AST-FP-PLACEMENT-v1'],structuralReason:reason,relationContext:contextText,
      constructiveExpression:t(locale,`A useful question is how ${c.function.label} can use ${c.sign.label}${domain?` when dealing with ${domain}`:''}; compare a concrete example before treating it as your pattern.`,`可核对的是：${domain?`在「${domain}」相关事情里，`:''}「${c.function.label}」能否借由「${c.sign.label}」表达出来？先找一个具体例子，不急着把它定成自己的固定模式。`),
      frictionExpression:t(locale,`If ${c.sign.label} becomes the only available response, ask what ${c.function.label} needs that this response leaves out. A different lived example can limit this interpretation.`,`当「${c.sign.label}」成了唯一回应方式时，可以追问「${c.function.label}」还有哪些需要没有被照顾。与此不同的实际经历，会限制这条解释的适用范围。`),
      observableSignals:[t(locale,`Compare two situations involving ${c.function.label}; does the same expression appear in both?`,`对照两次涉及「${c.function.label}」的实际情境：是否都出现了相近的表达方式？`)],
      question:t(locale,`Where does ${placementLabel(body)} describe a recognisable pattern, and where does it not?`,`「${placementLabel(body)}」在哪个真实情境中容易辨认，在哪个情境中并不符合？`)},
      {kind:'PLACEMENT',bodyCode:body.code,signIndex:Math.floor(body.value/30),houseNumber:house||null,houseSystem,incidentAspectRefs:aspects.filter(e=>[e.meta.fromCode,e.meta.toCode].includes(body.code)).map(e=>canonicalRef(p,`ASPECT:${e.code}`))});
  }
  for(const edge of aspects){
    const endpoints=[edge.meta.fromCode,edge.meta.toCode].sort((a,b)=>BODIES.indexOf(a)-BODIES.indexOf(b));
    const [a,b]=endpoints.map(code=>byBody.get(code)),ca=atomCache.get(a.code),cb=atomCache.get(b.code);
    const ar=selectMeanings(context,{methodId:'AST',projection:p,aspect:edge},{limit:context.refs.length}).find(r=>r.selector?.groupCode==='ASPECTS');
    if(!ca.function||!cb.function||!ar){omitted.push({kind:'ASPECT',code:edge.code,reason:'REQUIRED_ADMITTED_MEANING_MISSING'});continue;}
    const name=ASPECT_NAMES[edge.meta.type][locale==='zh-Hans'?1:0],aName=labelForAst(a.code,locale),bName=labelForAst(b.code,locale);
    const [relationContext,constructive,friction]=relationalText(edge.meta.type,ca.function.label,cb.function.label,locale);
    const balance=aspects.filter(other=>other!==edge&&[other.meta.fromCode,other.meta.toCode].some(code=>endpoints.includes(code))&&((edge.relation==='SUPPORT'&&other.relation==='TENSION')||(edge.relation==='TENSION'&&other.relation==='SUPPORT'))).map(other=>canonicalRef(p,`ASPECT:${other.code}`));
    add({title:`${aName}—${bName} · ${name}`,subject:endpoints.join('_'),relation:edge.relation,projectionRefs:[...refsFor(a),...refsFor(b),canonicalRef(p,`ASPECT:${edge.code}`)],meanings:[ca.function,cb.function,ar],ruleRefs:['AST-FP-ASPECT-DYAD-v1'],
      structuralReason:t(locale,`${placementLabel(a)} and ${placementLabel(b)} form a ${name} (orb ${edge.meta.orb.toFixed(2)}°). This joins ${ca.function.label} and ${cb.function.label}: ${ar.definition}`,`${placementLabel(a)}与${placementLabel(b)}形成${name}，容许度偏差为${edge.meta.orb.toFixed(2)}°；这里联系的是「${ca.function.label}」与「${cb.function.label}」两项功能。${ar.definition}`),
      relationContext,constructiveExpression:constructive,frictionExpression:friction,
      observableSignals:[t(locale,`Notice whether ${ca.function.label} and ${cb.function.label} occur together, take turns, or compete in a specific situation.`,`在同一具体情境中，观察「${ca.function.label}」与「${cb.function.label}」是一起出现、轮流出现，还是相互争夺空间。`)],
      question:t(locale,`Which recent example supports this ${aName}–${bName} connection, and which example challenges it?`,`最近哪件事支持这条${aName}—${bName}联系，又有哪件事并不符合？`)},
      {kind:'ASPECT',aspectRef:canonicalRef(p,`ASPECT:${edge.code}`),endpointCodes:endpoints,aspectType:edge.meta.type,orb:edge.meta.orb,authorizedOrbDegrees:edge.meta.authorizedOrbDegrees,applyingState:'UNDETERMINED',balancingAspectRefs:balance,balancingEvidenceIsNotRefutation:true});
  }
  return {units,coverage:{
    positionCount:positions.length,placementUnitCount:units.filter(u=>u.evidenceDetail.kind==='PLACEMENT').length,
    aspectCount:aspects.length,aspectUnitCount:units.filter(u=>u.evidenceDetail.kind==='ASPECT').length,
    omitted,completeWithinExistingMeaningScope:omitted.length===0,
    houseSystem,angleMeaning:'NOT_ADMITTED_IN_EXISTING_41',
    higherOrderPatterns:'NOT_INFERRED',rulership:'NOT_INFERRED',elementDominance:'NOT_INFERRED',
    priorityOwner:'SMR_R2_EXISTING_CUSTOMER_PRIORITY_RESOLVER',
    aspectOrder:'RELATIVE_ORB_THEN_PAIR_FOR_REVIEW_NOT_PERSONALITY_IMPORTANCE',
    evidenceCountsAreIndependent:'ONE_PLACEMENT_PER_BODY_ONE_RELATION_PER_PAIR',
    sourceBooksConsumed:[],humanReviewed:false,productionAllowed:false
  }};
}
