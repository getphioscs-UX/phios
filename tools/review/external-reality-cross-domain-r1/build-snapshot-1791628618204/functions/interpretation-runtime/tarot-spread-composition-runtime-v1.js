/** TSCP-W2-W5 deterministic Tarot spread composition. No model inference or prediction authority. */
export const TAROT_SPREAD_COMPOSITION_RUNTIME_VERSION='1.0.0';
const arr=v=>Array.isArray(v)?v:[];
const clean=v=>String(v??'').trim();
const clone=v=>structuredClone(v);
function requireAuthority(a,key){if(!a?.[key]||typeof a[key]!=='object')throw new TypeError(`TAROT_TSCP_AUTHORITY_REQUIRED:${key}`);return a[key];}
function localized(en,zhHans){return Object.freeze({en,zhHans});}
function sentenceCardPosition({title,position,lens,productLead,prompt}){
  const en=`At “${position.labelEn}”, ${title} brings ${lens.en} into focus. ${productLead.en} In this position, the reading is asking: ${prompt.en}`;
  const zh=`在「${position.labelZhHans}」这个位置，${title} 把「${lens.zhHans}」带到焦点。${productLead.zhHans} 放在这个牌位里，更值得继续追问的是：${prompt.zhHans}`;
  return localized(en,zh);
}
function relationSignals(cards,cardById){
  const metas=cards.map(c=>cardById.get(c.cardId)||{});
  const majorCount=metas.filter(x=>x.arcana==='MAJOR').length;
  const suitCounts={}; for(const m of metas){if(m.suit)suitCounts[m.suit]=(suitCounts[m.suit]||0)+1;}
  const repeated=Object.entries(suitCounts).filter(([,n])=>n>=2).sort((a,b)=>b[1]-a[1]);
  const courts=metas.filter(x=>['PAGE','KNIGHT','QUEEN','KING'].includes(String(x.rank||'').toUpperCase()));
  const out=[];
  if(majorCount>=2)out.push(Object.freeze({signalId:'MAJOR_ARCANA_WEIGHT',strength:majorCount/cards.length,statement:localized(`${majorCount} of ${cards.length} cards are Major Arcana. Treat that as structural emphasis across several positions, not as proof that events are predetermined.`,`${cards.length} 张牌中有 ${majorCount} 张大阿尔卡那。可以把它视为多个牌位共同出现的结构性强调，而不是“事情已经注定”的证据。`)}));
  if(repeated.length){const [suit,n]=repeated[0];out.push(Object.freeze({signalId:'SAME_SUIT_PATTERN',strength:n/cards.length,statement:localized(`${clean(suit)} appears ${n} times. Compare how the repeated suit shows up in different positions instead of reducing it to one universal meaning.`,`${clean(suit)} 在这次牌阵中出现 ${n} 次。重点不是套用一个统一牌义，而是比较同一组牌在不同牌位里怎样重复出现。`)}));}
  if(courts.length>=2)out.push(Object.freeze({signalId:'COURT_CARD_PATTERN',strength:courts.length/cards.length,statement:localized(`${courts.length} court cards appear. Read them as a repeated structural pattern and keep any claims about another person’s hidden state explicitly unresolved.`,`这次出现 ${courts.length} 张宫廷牌。可以把它们视为重复的结构模式，但不要因此推断他人的隐藏心理状态。`)}));
  if(cards.length>1){const first=cards[0],last=cards[cards.length-1];out.push(Object.freeze({signalId:'POSITIONAL_FLOW',strength:1,statement:localized(`Compare the opening position “${first.position.labelEn}” with the closing position “${last.position.labelEn}”. The useful question is what changes between those two lenses, not whether the last card guarantees an outcome.`,`把开端的「${first.position.labelZhHans}」与最后的「${last.position.labelZhHans}」放在一起比较。真正有用的是看两种视角之间发生了什么变化，而不是把最后一张牌当作保证结果。`)}));}
  return Object.freeze(out);
}
function synthesis({spread,cards,relationships}){
  const first=cards[0],last=cards[cards.length-1];
  const middle=cards.slice(1,-1);
  const midEn=middle.length?` Between them, ${middle.map(c=>`${c.canonicalTitle} at “${c.position.labelEn}”`).join(', ')} add intermediate lenses that should be read in relation to the question.`:'';
  const midZh=middle.length?` 中间的${middle.map(c=>`${c.canonicalTitle}（${c.position.labelZhHans}）`).join('、')}则提供了需要与原问题一起理解的中间视角。`:'';
  const relEn=relationships.length?` The structural patterns above are comparison cues, not additional facts.`:'';
  const relZh=relationships.length?` 上述多牌结构只用于比较，不会因此产生新的现实事实。`:'';
  return Object.freeze({
    headline:localized(spread.summaryEn,spread.summaryZhHans),
    narrative:localized(`This ${spread.cardCount}-card reading opens with ${first.canonicalTitle} at “${first.position.labelEn}” and closes with ${last.canonicalTitle} at “${last.position.labelEn}”.${midEn} Read the spread as a sequence of perspectives on the same question rather than ${spread.cardCount} independent verdicts.${relEn}`,`这次 ${spread.cardCount} 张牌的读取从 ${first.canonicalTitle}（「${first.position.labelZhHans}」）开始，以 ${last.canonicalTitle}（「${last.position.labelZhHans}」）收束。${midZh}重点是把整副牌当成同一个问题上的连续视角，而不是 ${spread.cardCount} 个彼此独立的判决。${relZh}`),
    decisionBoundary:localized('The spread may organize reflection; it does not choose for you, diagnose anyone, reveal hidden facts, or guarantee a future event.','牌阵可以帮助组织反思，但不会替你做决定、诊断任何人、揭示隐藏事实或保证未来事件。')
  });
}
function realityComparison(readingIr){
  const used=readingIr.contextDisclosure?.currentRealityContextUsed===true;
  const r=readingIr.rcc||{};
  if(!used)return Object.freeze({mode:'NO_CURRENT_REALITY_CONTEXT',summary:localized('No current Reality context was used. Treat the reading as a set of symbolic hypotheses and look for real observations that could support, contradict, or leave them unresolved.','这次没有使用当前 Reality context。请把读取视为一组象征性的待验证假设，再回到现实中寻找能够支持、反驳，或让它继续保持未定的观察。'),supportingEvidence:[],contradictoryEvidence:[],observations:[],unknowns:[]});
  return Object.freeze({mode:'EXPLICIT_REALITY_COMPARISON',summary:localized('The symbolic reading is being compared with the Reality context you explicitly chose to use. Reality evidence may support, complicate, contradict, or leave the reflection unresolved.','这次象征读取会与你明确选择使用的 Reality context 进行比较。现实证据可以支持、复杂化、反驳，或让这份反思继续保持未定。'),supportingEvidence:clone(arr(r.supportingEvidence)),contradictoryEvidence:clone(arr(r.contradictoryEvidence)),observations:clone(arr(r.observation)),unknowns:clone(arr(r.unknown))});
}
export function composeTarotSpread({readingIr,authorities={}}={}){
  if(readingIr?.methodCode!=='TAROT')throw new TypeError('TAROT_READING_IR_REQUIRED_FOR_TSCP');
  const spreadRegistry=requireAuthority(authorities,'spreadRegistry');
  const semanticsRegistry=requireAuthority(authorities,'positionSemanticsRegistry');
  const contract=requireAuthority(authorities,'spreadCompositionContract');
  const cardRegistry=requireAuthority(authorities,'cardRegistry');
  const editorial=requireAuthority(authorities,'editorialCorpus');
  if(contract?.rules?.decisionAuthority!=='USER'||contract?.rules?.wholeSpreadMayGuaranteeOutcome!==false)throw new TypeError('TAROT_TSCP_BOUNDARY_CONTRACT_INVALID');
  const spreadId=readingIr.drawEvidence?.spread?.spreadId;
  const spread=arr(spreadRegistry.entries).find(x=>x.spreadId===spreadId)||arr(spreadRegistry.entries).find(x=>arr(x.legacyAliases).includes(spreadId));
  if(!spread)throw new TypeError(`TAROT_TSCP_SPREAD_NOT_FOUND:${spreadId}`);
  const roleById=new Map(arr(semanticsRegistry.roles).map(x=>[x.semanticRole,x]));
  const cardById=new Map(arr(cardRegistry.entries).map(x=>[x.cardId,x]));
  const editorialByCard=new Map(arr(editorial.entries).map(x=>[x.cardId,x]));
  const productByCard=new Map(arr(readingIr.sourcePerspectives).map(x=>[x.cardId,x.productInterpretation||{}]));
  const reflectiveByCard=new Map(arr(readingIr.reflectiveComposition?.questions).map(x=>[x.cardId,x]));
  const cards=Object.freeze(arr(readingIr.cardObservations).map((card,index)=>{
    const position=spread.positions[index]; if(!position||card.position?.order!==index+1)throw new TypeError(`TAROT_TSCP_POSITION_DRIFT:${index+1}`);
    const role=roleById.get(position.semanticRole); if(!role)throw new TypeError(`TAROT_TSCP_POSITION_ROLE_UNKNOWN:${position.semanticRole}`);
    const ed=editorialByCard.get(card.cardId)||{}; const prod=productByCard.get(card.cardId)||{}; const refl=reflectiveByCard.get(card.cardId)||{};
    const lens=localized(clean(ed.lensLabelEn)||clean(card.canonicalTitle),clean(ed.lensLabelZhHans)||clean(card.canonicalTitle));
    const productLead=localized(clean(prod.productLeadEn)||`Use ${card.canonicalTitle} as a symbolic perspective, then compare it with reality.`,clean(prod.productLeadZhHans)||`把「${card.canonicalTitle}」作为一个象征视角，再与现实进行比较。`);
    const prompt=localized(role.promptEn,role.promptZhHans);
    return Object.freeze({cardId:card.cardId,canonicalTitle:card.canonicalTitle,orientation:card.orientation,position:Object.freeze(clone(position)),semanticRole:position.semanticRole,lens,sourceBoundParaphrase:localized(clean(ed.paraphraseEn),clean(ed.paraphraseZhHans)),productLead,positionPrompt:prompt,cardSpecificReflectiveQuestion:localized(clean(refl.questionEn),clean(refl.questionZhHans)),composedReading:sentenceCardPosition({title:card.canonicalTitle,position,lens,productLead,prompt}),realityTruth:false,prediction:false,hiddenStateFact:false});
  }));
  const relationships=relationSignals(cards,cardById);
  return Object.freeze({schemaVersion:'PHI-OS-TAROT-SPREAD-COMPOSITION-v1.0.0',runtimeVersion:TAROT_SPREAD_COMPOSITION_RUNTIME_VERSION,spread:Object.freeze({spreadId:spread.spreadId,spreadVersion:spread.spreadVersion,cardCount:spread.cardCount,category:spread.category,titleEn:spread.titleEn,titleZhHans:spread.titleZhHans,summaryEn:spread.summaryEn,summaryZhHans:spread.summaryZhHans}),positionReadings:cards,relationships,wholeSpreadSynthesis:synthesis({spread,cards,relationships}),realityComparison:realityComparison(readingIr),boundaries:Object.freeze({decisionAuthority:'USER',guaranteedPrediction:false,diagnosis:false,thirdPartyHiddenStateInference:false,sourceDisclosureCustomerDefault:false,realityMayContradictReading:true})});
}
