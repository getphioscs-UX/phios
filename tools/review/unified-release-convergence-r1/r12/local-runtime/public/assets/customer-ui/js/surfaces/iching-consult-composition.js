const arr=value=>Array.isArray(value)?value:[];
const str=value=>String(value??'').normalize('NFC').trim();
const isZh=locale=>String(locale||'').toLowerCase().startsWith('zh');
const tt=(locale,en,zh)=>isZh(locale)?zh:en;

const sentence=value=>str(value).replace(/\s+/g,' ');
const trimTerminal=value=>sentence(value).replace(/[。.!！?？]+$/,'');

function removeInternalReviewLanguage(value,locale){
  let out=sentence(value);
  if(!out)return '';
  if(isZh(locale)){
    out=out
      .replace(/候选逐爻解释/g,'逐爻解读')
      .replace(/候选解释/g,'解读')
      .replace(/；?它不替用户断定现实，也不预测结果。?$/,'')
      .replace(/；?卦爻只提供反思镜头。?$/,'')
      .replace(/；?它不把爻辞变成行动命令。?$/,'');
  }else{
    out=out
      .replace(/^This candidate for line (\d+) of ([^ ]+) /,'This reading of line $1 of $2 ')
      .replace(/^This candidate for ([^ ]+) /,'This reading of $1 ')
      .replace(/ It does not determine reality or predict an outcome\.?$/,'')
      .replace(/; the line supplies only a reflective lens\.?$/,'')
      .replace(/ It does not turn the line text into an action command\.?$/,'');
  }
  return sentence(out);
}

export function customerCopy(value,locale='en',role='body'){
  let out=removeInternalReviewLanguage(value,locale);
  if(!out)return '';
  if(isZh(locale)){
    if(role==='situation') out=out.replace(/^先观察/,'先看');
    if(role==='tension'){
      out=out.replace(/^核心张力不在[^，]+，而在/,'真正要判断的是：');
      out=out.replace(/^当前张力在于：?/,'关键在于：');
    }
    if(role==='direction'){
      out=out.replace(/^较有建设性的使用方式，是/,'现在更适合：');
      out=out.replace(/^较有建设性的方向是/,'现在更适合：');
      out=out.replace(/；?卦爻只提供反思镜头。?$/,'');
    }
    if(role==='condition'){
      if(/这里的时间只指条件成熟度与发展阶段/.test(out)) out='重点看条件是否成熟，以及事情正处在哪个发展阶段。';
      out=out.replace(/第(\d+)爻表达的是结构阶段而非日期；是否适用必须由当前事实核对。/,'这表示事情正处在第$1阶段；重点是核对这个阶段是否已经真实出现。');
    }
    if(role==='risk'){
      out=out
        .replace(/^若把([^，]+)直接当作命运结论、行动命令或他人内心的证明，象征镜头就会越过它的权限。$/,'最容易误判的是：把$1直接当成已经确定的结局。')
        .replace(/^若忽略爻位阶段，或把单一爻辞当成必然结果、他人意图证明或专业指令，解释就会失真。$/,'最容易误判的是：忽略当前所处阶段，直接把单一爻辞当成结果。');
    }
  }else{
    if(role==='situation') out=out.replace(/^Observe /,'Look at ');
    if(role==='tension'){
      out=out.replace(/^The central tension is not [^,]+, but whether /,'The key question is whether ');
      out=out.replace(/^The current tension is whether /,'The key question is whether ');
    }
    if(role==='direction'){
      out=out.replace(/^A constructive use converts /,'A better next move is to turn ');
      out=out.replace(/; the line supplies only a reflective lens\.?$/,'');
    }
    if(role==='condition'){
      if(/Timing refers only to maturity of conditions and stage of development/.test(out)) out='Focus on whether the conditions are mature and what stage the situation has actually reached.';
      out=out.replace(/Line (\d+) identifies a structural stage rather than a date; its relevance must be checked against present facts\.?/,'This is stage $1 of the six-line process; check whether that stage is actually present now.');
    }
    if(role==='risk'){
      out=out
        .replace(/^Treating ([^,]+) as fate, an action command, or proof of another person's inner state would exceed the authority of the symbolic lens\.?$/,'The easiest mistake is to treat $1 as a fixed outcome.')
        .replace(/^Ignoring line position, or treating one line as an inevitable outcome, proof of another person’s intention, or a professional directive, distorts the interpretation\.?$/,'The easiest mistake is to ignore the current stage and treat one line as the outcome.');
    }
  }
  return sentence(out);
}

function primaryName(primary,locale){
  const zhName=str(primary?.chineseNameZhHans||primary?.chineseName);
  const enName=str(primary?.canonicalName);
  if(isZh(locale)) return zhName?`第${primary?.number||'—'}卦「${zhName}」`:`第${primary?.number||'—'}卦`;
  return enName?`Hexagram ${primary?.number||'—'} · ${enName}`:`Hexagram ${primary?.number||'—'}`;
}

function shortQuestion(question){
  const q=sentence(question);
  return q.length>90?`${q.slice(0,88)}…`:q;
}

function unique(items){return [...new Set(arr(items).map(sentence).filter(Boolean))];}

export function composeIChingCustomerReading({locale='en',question='',primary={},relating={},changing=[],hexContent={},lineDepth=[]}={}){
  const situation=customerCopy(hexContent?.situationOrStage,locale,'situation');
  const tension=customerCopy(hexContent?.centralTension,locale,'tension');
  const direction=customerCopy(hexContent?.constructiveExpressionOrMovement,locale,'direction');
  const condition=customerCopy(hexContent?.timingOrCondition,locale,'condition');
  const risk=customerCopy(hexContent?.distortionOrFailureRisk,locale,'risk');
  const name=primaryName(primary,locale);
  const q=isZh(locale)?shortQuestion(question).replace(/\?/g,'？'):shortQuestion(question);
  const focus=tension||situation||customerCopy(hexContent?.plainMeaning,locale,'body');
  const opening=situation||focus;
  const answerLead=isZh(locale)
    ?`围绕「${q}」，${name}先提醒你看清：${trimTerminal(opening)}。`
    :`For “${q}”, ${name} first asks you to look at this: ${trimTerminal(opening)}.`;
  const practicalLead=[tension,direction].filter(Boolean).join(isZh(locale)?' ':' ');
  const lineSummaries=[...arr(lineDepth)].sort((a,b)=>Number(a?.linePosition)-Number(b?.linePosition)).map(unit=>{
    const content=unit?.content||{};
    const position=Number(unit?.linePosition)||null;
    return Object.freeze({
      position,
      stage:customerCopy(content.situationOrStage,locale,'situation'),
      focus:customerCopy(content.centralTension,locale,'tension'),
      direction:customerCopy(content.constructiveExpressionOrMovement,locale,'direction'),
      condition:customerCopy(content.timingOrCondition,locale,'condition'),
      risk:customerCopy(content.distortionOrFailureRisk,locale,'risk'),
      observe:unique(content.whatToObserve),
      reflect:unique(content.reflectionQuestions)
    });
  });
  const moving=arr(changing).map(Number).filter(Number.isFinite);
  const transitionText=moving.length
    ?(isZh(locale)
      ?`这次不是静态卦。变化集中在第${moving.join('、')}爻；先用本卦看当前结构，再用变爻看正在发生的变化点，之卦作为变化后的结构参照。`
      :`This is not a static cast. Change is concentrated in line${moving.length>1?'s':''} ${moving.join(', ')}; read the primary hexagram as the current structure, the moving line${moving.length>1?'s':''} as the active point of change, and the relating hexagram as the structural reference after that change.`)
    :(isZh(locale)?'这次没有变爻，重点放在本卦所描述的当前结构。':'There are no changing lines in this cast, so the primary hexagram carries the main reading.');
  return Object.freeze({
    answerLead,practicalLead,situation,tension,direction,condition,risk,lineSummaries,transitionText,
    observation:unique([...(hexContent?.whatToObserve||[]),...lineSummaries.flatMap(item=>item.observe)]),
    reflection:unique([...(hexContent?.reflectionQuestions||[]),...lineSummaries.flatMap(item=>item.reflect)]),
    copyPolicy:Object.freeze({newMeaningCreated:false,sourceBound:true,governanceLabelsOmitted:true,boundaryRepeatedInMainReading:false})
  });
}
