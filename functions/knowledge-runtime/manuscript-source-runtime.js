import {corpusSourceAllowed,manuscriptSourceAllowed} from '../_lib/knowledge-source-eligibility.js';
import {selectSourceBoundExplanation,explanationQueryTerms} from './source-bound-explanation-units.js';
export const MANUSCRIPT_SOURCE_RUNTIME_CODE = 'MANUSCRIPT_KNOWLEDGE_SOURCE_RUNTIME';
export const MANUSCRIPT_SOURCE_RUNTIME_VERSION = '1.1.0';

const MAX_RESULTS = 4;
const MAX_EXCERPT_CHARS = 1200;
const MAX_TOTAL_EXCERPT_CHARS = 3600;
const parsedCorpusCache = new Map();
const MAX_PARSED_CORPUS_CACHE_BYTES = 3 * 1024 * 1024;
let parsedCorpusCacheBytes = 0;
const preparedCorpusCache = new WeakMap();

const clean = value => String(value ?? '')
  .normalize('NFKC')
  .replace(/\u000c/g, '\n')
  .replace(/[\t ]+/g, ' ')
  .replace(/\n{3,}/g, '\n\n')
  .trim();

const normalized = value => clean(value).toLocaleLowerCase();
const conceptQuery=value=>normalized(value).replace(/垮台|倒台/gu,'终结');
const conceptQueryMatch=(concept,query)=>concept.aliases?.some(alias=>conceptQuery(query).includes(normalized(alias)))||(concept.termSets||[]).some(set=>set.every(term=>conceptQuery(query).includes(normalized(term))));
const inferenceConstruction=q=>/(?:是否|能否|可以|能够|据此|仅凭|凭|从|就能|就可以).*(?:推断|断定|断言|认定|得出|判定)/u.test(q);

function unique(values) {
  return [...new Set(values.filter(Boolean))];
}

export function queryTerms(value) {
  const input = normalized(value);
  const latin = input.match(/[a-z0-9][a-z0-9-]{1,}/g) || [];
  const cjkRuns = input.match(/[\u3400-\u4dbf\u4e00-\u9fff\uf900-\ufaff]+/gu) || [];
  const cjk = [];
  for (const run of cjkRuns) {
    if (run.length <= 8) cjk.push(run);
    // Questions often put the actual limitation near the end. Traverse the
    // complete run; the bounded term budget is applied after deduplication.
    const max = run.length - 1;
    for (let index = 0; index < max; index += 1) cjk.push(run.slice(index, index + 2));
  }
  const terms=unique([...latin,...cjk]);
  if(terms.length<=40)return terms;
  // Keep deterministic coverage of beginning, middle and end rather than
  // silently discarding the latter half of longer questions.
  return Array.from({length:40},(_,i)=>terms[Math.round(i*(terms.length-1)/39)]);
}

export function manuscriptQueryTerms(value) {
  // Separate grammatical scaffolding before producing Chinese bigrams. A
  // comparison must not acquire high-specificity invented terms such as 和差.
  // This is shared query analysis, not a per-question answer table.
  const input=String(value||'').replace(/第[一二三四五六七八九十\d]+册(?:中|里|的)?/gu,' ');
  const aliases=/(?:售卖|销售|出售|购买|不卖|卖不卖|卖吗|公开卖|卖的(?:书|商品))/u.test(input)?['出售']:[];
  // Do not delete single Chinese characters: 和平 and 面对 are concepts, not
  // conjunction/preposition noise. Remove complete grammatical phrases only.
  const stopwords = new Set(['为什么','为何','什么','如何','怎样','怎么','请问','究竟','一个','一种','这样','那样','这个','那个','以及','why','what','how','does','do','is','are','the','a','an','of','in','to','and','please']);
  // Filtering is at word boundaries only. The original question remains
  // intact for polarity, conditions, comparisons and temporal assessment.
  // Never replace substrings inside Chinese words or across their boundaries.
  const words = [...new Intl.Segmenter('zh', {granularity:'word'}).segment(normalized(input))]
    .filter(part => part.isWordLike).map(part => part.segment)
    .filter(word => !stopwords.has(word));
  return unique([...words.flatMap(word => word.length > 4 ? [word,...queryTerms(word)] : [word]),...aliases]).filter(term=>term.length>1);
}

function correctionRows(sectionCode, corrections) {
  return (corrections?.records || []).filter(record =>
    record.sectionCode === sectionCode &&
    String(record.status || '').toUpperCase() === 'APPROVED'
  );
}

function correctedRecord(record, corrections) {
  const rows = correctionRows(record.sectionCode, corrections);
  if (!rows.length) return { ...record, editorialCorrections: [] };
  let heading = String(record.heading ?? '');
  let text = String(record.text ?? '');
  for (const row of rows) {
    if (row.field === 'heading' && (!row.rawValue || heading === row.rawValue)) {
      heading = row.correctedValue || heading;
    }
    const from = row.textReplacement?.from;
    const to = row.textReplacement?.to;
    if (from && to) text = text.split(from).join(to);
  }
  return {
    ...record,
    heading,
    text,
    editorialCorrections: rows.map(row => ({
      correctionCode: row.correctionCode,
      status: 'APPROVED',
      rawSourcePreserved: row.rawSourcePreserved !== false
    }))
  };
}

function scoreRecord(record, query, terms, profile, specificity = null, prepared = null) {
  if (record.retrievalEligible === false || record.segmentType === 'FRONT_MATTER') return 0;
  const heading = prepared?.heading ?? normalized(record.heading);
  const nativeHeaderBreak = String(record.text).indexOf('\n\n');
  const nativeHeader = nativeHeaderBreak >= 0 && nativeHeaderBreak < 200 && !String(record.text).slice(0,nativeHeaderBreak).includes('\f')
    ? normalized(String(record.text).slice(0,nativeHeaderBreak)).replace(/([\u3400-\u9fff])\s+(?=[\u3400-\u9fff])/g,'$1') : heading;
  const text = prepared?.text ?? normalized(record.text);
  const q = normalized(query);
  const compact = value => normalized(value).replace(/[\p{P}\p{S}\s]+/gu,'');
  const compactQuestion = compact(query);
  const compactText = prepared?.compactText ?? compact(text);
  const explicitSubject=q.match(/^(?:既然|虽然|即使)?([\u3400-\u9fff]{1,8}?)(?:还在|仍然|正在|依然)/u)?.[1];
  if(explicitSubject&&!compactText.includes(explicitSubject))return 0;
  let score = 0;
  const headingLabel = heading.split(/[|｜]/u)[0].replace(/^[✦◈◆◇❖]+\s*/u,'').trim();
  const nativeConceptLabel = headingLabel.match(/^[\u3400-\u9fff]{2,}(?=\s*[a-z]|$)/u)?.[0];
  if (nativeConceptLabel && q.includes(nativeConceptLabel)) score += 900;
  if (nativeConceptLabel && q.startsWith(nativeConceptLabel)) score += 1000;
  const temporalSubject = q.match(/^([\u3400-\u9fff]{2,8}?)(?:是否|是不是|是|会|能)/u)?.[1];
  const temporalConditionMatch = temporalSubject && /瞬间|单次|一次性|固定|静止|永久/u.test(q) && nativeHeader.includes(temporalSubject) && /持续|过程|固定|静止|变化/u.test(nativeHeader);
  if (temporalConditionMatch) score += 1200;
  const perspectiveCompletenessMatch = /全部|完整|唯一/u.test(q) && /我(?:看到|看见|感受)|自己的(?:现实|世界)|个人(?:理解|经验)/u.test(q) && /全部|完整/u.test(nativeHeader) && /意识|理解|经验/u.test(nativeHeader);
  if (perspectiveCompletenessMatch) score += 1200;
  const divergentExperienceMatch = /同一|同样|相同/u.test(q) && /不同|各人|每个人/u.test(q) && /感受|经验|体验|看法|理解/u.test(q) && /不同/u.test(nativeHeader) && /生命|意识|主观/u.test(nativeHeader) && /现实|经验|世界/u.test(nativeHeader);
  if (divergentExperienceMatch) score += 1200;
  const unlimitedBoundaryMatch = /无限|无穷/u.test(q) && /不能|无法|有限|边界|限制/u.test(q) && /无限|有限|边界|限制/u.test(nativeHeader);
  if (unlimitedBoundaryMatch) score += 1200;
  // Duration questions concern the conditions of continuing an activity,
  // rather than a generic capacity definition that happens to share a verb.
  // Only boost an activity explicitly present in the source heading.
  const durationActivity=q.match(/(?:永远|一直|长久|长期|持续)(?:维持|保持|继续)?(运行|存在|发展|增长)/u)?.[1];
  const durationActivityMatch=durationActivity&&new RegExp('(?:持续|长期|连续)'+durationActivity,'u').test(nativeHeader);
  if(durationActivityMatch)score+=1200;
  const boundaryRemoval=/(?:限制|边界).*(?:消失|解除|不再存在)|(?:没有|不再有).*(?:限制|边界)/u.test(q);
  const boundarySubjectMatch=boundaryRemoval&&terms.some(term=>term.length>=2&&nativeHeader.includes(term))&&/有限|限制|边界|瓶颈/u.test(compactText);
  if(boundarySubjectMatch)score+=1200;
  const matchedConceptAliases=(record.retrievalConcepts||[]).filter(c=>conceptQueryMatch(c,q)).flatMap(c=>[...(c.aliases||[]).filter(a=>conceptQuery(q).includes(normalized(a))),...(c.termSets||[]).filter(set=>set.every(t=>conceptQuery(q).includes(normalized(t)))).map(set=>set.join(''))]);
  const chapterConceptMatch=matchedConceptAliases.length>0;
  const supportedExplanation=selectSourceBoundExplanation(record,query,terms,MAX_EXCERPT_CHARS);
  if(supportedExplanation)score+=500+supportedExplanation.score*15;
  if(chapterConceptMatch)score+=1200+Math.max(...matchedConceptAliases.map(alias=>alias.length))*300;
  if (q && headingLabel === q) score += 4000;
  const exactProfileQuestion = [...(profile?.naturalQuestions || []), ...(profile?.userLanguage || []), ...(profile?.aliases || []),...(record.approvedQuestions||[])].some(value => normalized(value) === q);
  if (exactProfileQuestion) score += 1400;
  if (q && heading.includes(q)) score += 1200;
  if (q && text.includes(q)) score += 800;
  const nativeIntroductionMatch=compactQuestion.length>=4&&compact(record.text.slice(0,350)).includes(compactQuestion);
  if(nativeIntroductionMatch)score+=1600;
  // Inference scaffolding must not dilute content relevance. Keep the original
  // question unchanged (including negation); this affects recall, not entailment.
  // In an inference question these are grammatical operators, not its topic.
  // In a definition question (e.g. 推断是什么) they remain searchable content.
  const inferenceQuestion=inferenceConstruction(q);
  const meaningfulTerms = terms.filter(term => !(inferenceQuestion&&/^(?:从未|直接|推断)$/u.test(term))&&!/^(?:why|what|how|does|do|is|are|the|a|an|of|in|to|and|can|为什么|为何|什么|怎么|如何|请问|现实|运行|一个|以后|能够|需要|形成|持续|个人|people|可以|据此|断定|断言|认定|判定|认为|证明|足以|得出|结论|某个|某种|不到|仅凭|就能)$/i.test(term));
  if (!meaningfulTerms.length) return 0;
  let specificMatches = 0;
  for (const term of meaningfulTerms) {
    const weight = specificity?.get(term) || 1;
    if ((specificity ? headingLabel : heading).includes(term)) score += 180 * weight;
    if (compactText.includes(compact(term))) { score += 12 * weight; specificMatches++; }
  }
  const totalWeight=meaningfulTerms.reduce((sum,term)=>sum+(specificity?.get(term)||1),0);
  const matchedWeight=meaningfulTerms.filter(term=>text.includes(term)||compactText.includes(compact(term))).reduce((sum,term)=>sum+(specificity?.get(term)||1),0);
  // A natural question contains grammatical and cross-word bigrams that are
  // absent from the source. Require concentrated evidence in a bounded
  // passage before allowing that mismatch; scattered broad words are weaker.
  const contentTerms=meaningfulTerms.filter(term=>!/^(?:不是|是不是|代表|没有|存在|任何|还能|还在|保持|是否|可以|就是|已经)$/u.test(term));
  let localMatches=0;
  for(let offset=0;offset<compactText.length;offset+=250){
    const passage=compactText.slice(offset,offset+500);
    localMatches=Math.max(localMatches,contentTerms.filter(term=>passage.includes(compact(term))).length);
  }
  const nativeTitle=compact(heading);
  const contentQuestion=compactQuestion.replace(/有什么不同|有什么区别|什么关系|为什么|如何|怎样|是不是|是否|代表|没有|还会|还能|既然|究竟|任何/g,' ');
  const titlePhraseMatch=(contentQuestion.match(/[\u3400-\u9fff]+/gu)||[]).some(run=>{
    for(let n=0;n<=run.length-4;n++)if(nativeTitle.includes(run.slice(n,n+4)))return true;
    return false;
  });
  if(titlePhraseMatch)score+=900;
  const questionRuns=(q.replace(/为什么|为何|如何|怎样|是否|是不是/gu,' ').match(/[\u3400-\u9fff]+/gu)||[]);
  let sharedPhraseLength=0;
  for(const run of questionRuns)for(let length=Math.min(12,run.length);length>=6;length--){
    if(sharedPhraseLength>=length)break;
    for(let offset=0;offset<=run.length-length;offset++)if(compactText.includes(run.slice(offset,offset+length))){sharedPhraseLength=length;break;}
  }
  if(sharedPhraseLength>=6)score+=sharedPhraseLength*100;
  const temporalPredicate=/(?:已经|已|以后|之后|仍然|还会)/u.test(q)?q.match(/结束|形成|增长|停止|恢复|改变/u)?.[0]:null;
  if(temporalPredicate&&nativeTitle.includes(temporalPredicate))score+=800;
  const matchedContentWeight=contentTerms.filter(term=>compactText.includes(compact(term))).reduce((sum,term)=>sum+(specificity?.get(term)||1),0);
  if(explicitSubject&&localMatches>=3)score+=500;
  const explicitSubjectEvidence=explicitSubject&&localMatches>=3;
  const conditionSubject=q.match(/^(.{2,20}?)(?:是不是|是否|就代表|就意味着)/u)?.[1]?.replace(/\s+/gu,'');
  const conditionEvidence=conditionSubject&&conditionSubject.length>=4&&compactText.includes(conditionSubject);
  const namedBook=q.match(/第[一二三四五六七八九十\d]+册/u)?.[0]||q.match(/《([^》]+)》/u)?.[1];
  const namedStatusEvidence=namedBook&&compactText.includes(compact(namedBook))&&terms.includes('出售')&&compactText.includes('出售');
  if(!supportedExplanation&&!chapterConceptMatch&&!boundarySubjectMatch&&!exactProfileQuestion&&!nativeIntroductionMatch&&!temporalConditionMatch&&!(durationActivityMatch&&localMatches>=2)&&!perspectiveCompletenessMatch&&!divergentExperienceMatch&&!titlePhraseMatch&&sharedPhraseLength<6&&!explicitSubjectEvidence&&!conditionEvidence&&!namedStatusEvidence&&!(localMatches>=3&&matchedContentWeight>=6)&&!(nativeConceptLabel&&q.includes(nativeConceptLabel))&&!q.includes(headingLabel)&&matchedWeight/Math.max(1,totalWeight)<0.35)return 0;
    if (specificity) {
      const subtitle = heading.slice(headingLabel.length);
      const comparison = q.match(/^(.+?)(?:与|和)(.+?)(?:有什么区别|有何区别|的区别|区别)/);
      const definedConcept = headingLabel.replace(/^什么是/, '');
      if (comparison && [comparison[1],comparison[2]].some(value=>value===definedConcept)) score += 900;
      for (const term of meaningfulTerms) if (subtitle.includes(term)) score += 180 * (specificity.get(term) || 1);
      // The question and the chapter subtitle must describe the same limitation,
      // rather than merely sharing a broad noun such as scale or capacity.
      if (/(?:不再|无法|不能).*(?:产生|带来|形成).*(?:能力|收益)/.test(q) && /(?:不再|无法|不能).*(?:产生|形成).*能力/.test(subtitle)) score += 220;
      const sentences = text.split(/[。！？!?]/u);
    const bestSentence = Math.max(0,...sentences.map(sentence => meaningfulTerms.reduce((sum,term)=>sum+(compact(sentence).includes(compact(term))?specificity.get(term)||1:0),0)));
    // A passing mention deep inside a chapter must not outweigh a chapter
    // whose stated subject directly matches the customer's question.
    score += 35 * bestSentence;
  }
  return specificMatches >= Math.min(2, meaningfulTerms.length) || score >= 800 ? score : 0;
}

function selectArgumentUnit(record,query,terms,maximum){
    const explained=selectSourceBoundExplanation(record,query,terms,maximum);
    if(explained)return explained;
    const pair=String(query).match(/^(.+?)(?:和|与)(.+?)(?:有什么区别|有何区别|的区别|区别)/u);
    const subjects=pair?[pair[1],pair[2]].map(x=>normalized(x).replace(/^(?:请问|第[一二三四五六七八九十\d]+册(?:中|里|的)?)/u,'').trim()):[];
    const contrastUnit=unit=>unit.type==='DISTINCTION'&&subjects.length===2&&subjects.every(s=>s.length>=2&&normalized(record.text.slice(unit.startOffset,unit.endOffset)).replace(/\s+/gu,'').includes(s));
    if(record.argumentUnits?.length){
      const informative=terms.filter(t=>!/^(?:维护|长期|文明|国家|为什么|如何|哪些|层次|才能|能够|之后|以后|仍然|已经|是否|是不是|不能|可以|不是|而不是|需要|讨论)$/u.test(t));
      const definitions=/是什么意思|什么是|是什么|定义|指什么/u.test(query);
      const necessity=/多此一举|没必要|用不着|是否必要|还需要/u.test(query);
      const enumeration=/哪些|包括|层次|几种/u.test(query);
      const guaranteeBoundary=/保证|一定|必然/u.test(query)&&/不能|不|吗|是否|是不是/u.test(query);
      const ranked=record.argumentUnits.map(unit=>{const text=record.text.slice(unit.startOffset,unit.endOffset),body=normalized(text).replace(/\s+/gu,'');let matches=0;const necessaryMechanism=necessity&&unit.type==='MECHANISM'&&/需求|需要|根本原因|必然/u.test(body);const score=informative.reduce((n,t)=>{if(!body.includes(t))return n;matches++;const df=record.argumentUnits.filter(u=>normalized(record.text.slice(u.startOffset,u.endOffset)).replace(/\s+/gu,'').includes(t)).length;return n+t.length/(1+df);},0)+(definitions&&unit.type==='DEFINITION'?20:0)+(contrastUnit(unit)?100:0)+(necessaryMechanism?20:0)+(enumeration&&unit.type==='DEFINITION'&&/至少|包括|分别|分为|可以是/u.test(body)?20:0)+(guaranteeBoundary&&unit.type==='BOUNDARY'&&matches>=2?20:0);return{unit,text,score,matches,necessaryMechanism};}).filter(r=>r.matches>=2||(definitions&&r.unit.type==='DEFINITION')||contrastUnit(r.unit)||r.necessaryMechanism).sort((a,b)=>b.score-a.score);
      if(ranked.length){const selected=ranked[0];if(selected.text.length<=maximum)return selected;}
    }
    return null;
}
function excerptFor(record, query, terms, maximum = MAX_EXCERPT_CHARS) {
    const argument=selectArgumentUnit(record,query,terms,maximum);if(argument)return clean(argument.text);
    const lines=String(record.text).split('\n'),compactHeading=value=>normalized(value).replace(/[\p{P}\p{S}\s]+/gu,'');
    const exactHeader=/^[\s✦◈◆◇❖]+/u.test(lines[0])&&compactHeading(lines[0])===compactHeading(record.heading);
    const text = clean(exactHeader?lines.slice(1).join('\n'):record.text);
    if (record.supportRange&&record.answerProjectionPolicy!=='QUESTION_ANCHORED_CONTIGUOUS') {
      if(text.length<=maximum)return text;
      const complete=text.slice(0,maximum).replace(/[^。！？!?]*$/u,'');
      return complete ? complete+'…' : '';
    }
  if (text.length <= maximum) return text;
  let anchor = text.indexOf(clean(query));
  const concept = clean(record.heading).split(/[|｜]/u)[0].replace(/^[✦◈◆◇❖]\s*/u,'').trim();
  // A named concept question needs its introductory definition, not whichever
  // incidental word happens to occur earliest in the query-term list.
  if (concept.length >= 2 && clean(query).includes(concept)) anchor = 0;
  if (anchor < 0) {
    let bestScore=0;
    for(const match of text.matchAll(/[^。！？!?]+[。！？!?]?/gu)){
      const sentence=normalized(match[0]).replace(/\s+/gu,'');
      const informativeTerms=terms.filter(term=>!/^(?:存在|不是|表示|已经|没有|代表|还在|还能|不是|保持)$/u.test(term));
      const namedSubject=clean(query).match(/第[一二三四五六七八九十\d]+册/u)?.[0];
      const literalSubject=clean(query).match(/^(?:既然|虽然|即使)?([\u3400-\u9fff]{1,8}?)(?:还在|仍然|正在|依然)/u)?.[1];
      const condition=clean(query).match(/^(.{2,20}?)(?:是不是|是否|就代表|就意味着)/u)?.[1]?.slice(-2);
      let score=informativeTerms.reduce((sum,term)=>sum+(sentence.includes(term)?term.length:0),0)+(namedSubject&&sentence.includes(namedSubject)?20:0)+(literalSubject&&sentence.includes(literalSubject)?20:0)+(condition&&sentence.includes(condition)?12:0)+(terms.includes('出售')&&sentence.includes('出售')?15:0);
      if(score>0&&/哪些|包括|层次|几种/u.test(query)&&/至少|可以是|包括|分别|分为/u.test(sentence))score+=12;
      if(!/如果|假如|假设/u.test(query)&&/^如果.*如果/u.test(sentence))score-=18;
      if(score>bestScore){bestScore=score;anchor=match.index;}
    }
  }
  if (anchor < 0) anchor = 0;
  const before = Math.floor(maximum * 0.35);
  let start = Math.max(0, anchor - before);
  let end = Math.min(text.length, start + maximum);
  start = Math.max(0, end - maximum);
  // Avoid returning partial clauses. This also keeps nearby qualifications
  // together instead of forcing the answer organizer into isolated sentences.
  if (start > 0) {
    const boundary = text.slice(start).search(/[。！？!?]/u);
    if (boundary >= 0 && start + boundary + 1 < end) start += boundary + 1;
  }
  if (end < text.length) {
    const window = text.slice(start,end);
    const lastBoundary = Math.max(...['。','！','？','!','?'].map(mark=>window.lastIndexOf(mark)));
    if (lastBoundary >= 0) end = start + lastBoundary + 1;
    else return ''; // A budget cannot turn an unfinished sentence into evidence.
  }
  const prefix = start > 0 ? '…' : '';
  const suffix = end < text.length ? '…' : '';
  return `${prefix}${text.slice(start, end).trim()}${suffix}`;
}

function bindingFor(sectionCode, bindings) {
  const rows = (bindings?.records || []).filter(record =>
    record.sectionCode === sectionCode &&
    String(record.status || record.authorityStatus || '').toUpperCase() === 'APPROVED'
  );
  if (!rows.length) return { status: 'PENDING', nodeCodes: [] };
  return {
    status: 'APPROVED',
    nodeCodes: unique(rows.map(row => row.nodeCode)),
    mappingCodes: unique(rows.map(row => row.mappingCode))
  };
}

export function searchManuscriptCorpus({
  corpus,
  source,
  bindings = { records: [] },
  corrections = { records: [] },
  profiles = [],
  query,
  maximumResults = MAX_RESULTS,
  maximumExcerptChars = MAX_EXCERPT_CHARS,
  maximumTotalExcerptChars = MAX_TOTAL_EXCERPT_CHARS,
  experimentAccess = null
}) {
  if (!corpus || !Array.isArray(corpus.records)) return [];
  // Apply the same recall vocabulary before chapter ranking, not only after
  // a chapter has survived selection. Original query remains unchanged.
  const terms = explanationQueryTerms(query,manuscriptQueryTerms(query));
  corpus={...corpus,records:corpus.records.filter(r=>manuscriptSourceAllowed({...source,...r,sourceSha256:source.sourceSha256,sectionSha256:r.reviewStatus==='HUMAN_APPROVED_FINAL'?r.textSha256:(r.sourceTextSha256||r.textSha256)},experimentAccess))};
  // Normalize each chapter once, rather than once per query term and again
  // during every coverage check. No corpus text or ranking rule changes.
  const correctionKey = JSON.stringify(corrections?.records || []);
  const cachedPrepared = preparedCorpusCache.get(corpus);
  const preparedRecords = cachedPrepared?.correctionKey === correctionKey ? cachedPrepared.records : corpus.records.map(rawRecord => {
    const record = correctedRecord(rawRecord, corrections);
    const text = normalized(record.text), heading = normalized(record.heading);
    return {record, prepared:{text,heading,dfText:record.text === rawRecord.text ? text : normalized(rawRecord.text),compactText:text.replace(/[\p{P}\p{S}\s]+/gu,'')}};
  });
  if (cachedPrepared?.correctionKey !== correctionKey) preparedCorpusCache.set(corpus,{correctionKey,records:preparedRecords});
  // Out-of-vocabulary query words are not rare evidence. Giving an absent
  // grammatical noun the highest IDF used to suppress the actual source.
  // Keep a nonzero mismatch weight; do not discard the original query or
  // weaken the minimum evidence / passage checks below.
  const specificity = new Map(terms.map(term => {const frequency=preparedRecords.filter(item => item.prepared.dfText.includes(term)).length;return [term,!frequency&&inferenceConstruction(normalized(query))?0.25:Math.log(1+corpus.records.length/(1+frequency))];}));
  const ranked = preparedRecords
    .map(({record, prepared}) => {
      const profile = profiles.find(candidate => candidate.bookCode === source.bookCode && candidate.productionEligible === true && candidate.bookSources?.some(ref => ref.sectionCode === record.sectionCode));
      return { record, score: scoreRecord(record, query, terms, profile, specificity, prepared), profile };
    })
    .filter(item => item.score > 0)
    .sort((a, b) => b.score - a.score || a.record.sequence - b.record.sequence);

  const results = [];
  let totalChars = 0;
  for (const item of ranked) {
    if (results.length >= maximumResults || totalChars >= maximumTotalExcerptChars) break;
    const allowance = Math.min(maximumExcerptChars, maximumTotalExcerptChars - totalChars);
    if (allowance <= 0) break;
    const isolatedArgument=item.record.experimentFragmentsOnly?selectArgumentUnit(item.record,query,terms,allowance):null;
    if(item.record.experimentFragmentsOnly&&!isolatedArgument)continue;
    const excerpt = isolatedArgument?clean(isolatedArgument.text):excerptFor(item.record, query, terms, allowance);
    if(!excerpt)continue;
    let selectedArgument=selectArgumentUnit(item.record,query,terms,allowance);
    if(selectedArgument&&!selectedArgument.explanationUnit&&item.record.experimentFragmentsOnly){const text=item.record.text.slice(selectedArgument.unit.startOffset,selectedArgument.unit.endOffset);selectedArgument={...selectedArgument,explanationUnit:{sourceSectionId:item.record.sectionCode,locale:source.locale,mainArgument:text,support:{startOffset:selectedArgument.unit.startOffset,endOffset:selectedArgument.unit.endOffset,textSha256:selectedArgument.unit.textSha256},sourceTextKind:'VERIFIED_EXPERIMENT_FRAGMENT_NOT_WHOLE_CHAPTER'}};}
    // Accepted knowledge projections are bounded explanation units already;
    // this does not expose the protected native manuscript or accept a new text.
    if(!selectedArgument&&source.contentKind==='ACCEPTED_PUBLIC_KNOWLEDGE_UNITS_ONLY'&&item.record.reviewStatus==='HUMAN_APPROVED_FINAL'&&item.record.text.length<=allowance){
      selectedArgument={unit:{argumentId:'ACCEPTED_KNOWLEDGE_PROJECTION',type:'BOUNDARY',startOffset:0,endOffset:item.record.text.length,textSha256:item.record.textSha256},explanationUnit:{sourceSectionId:item.record.sectionCode,locale:source.locale,mainArgument:item.record.text,support:{startOffset:0,endOffset:item.record.text.length,textSha256:item.record.textSha256},sourceTextKind:'ACCEPTED_KNOWLEDGE_PROJECTION_NOT_NATIVE_PDF_EXCERPT'}};
    }
    totalChars += excerpt.length;
    results.push({
      sourceType: 'COMPLETED_MANUSCRIPT',
      ...(source.contentKind==='ACCEPTED_PUBLIC_KNOWLEDGE_UNITS_ONLY'?{approvedPublicProjection:item.record.approvedPublicProjection,projectionKind:'ACCEPTED_KNOWLEDGE_UNIT_NOT_NATIVE_PDF_EXCERPT'}:{}),
      sourceCode: source.sourceCode,
      sourceVersion: source.version || source.sourceCode,
      sourceBinaryDigest: source.sourceSha256,
      sourceAcceptanceDigest: source.acceptanceSha256 || source.sourceAcceptanceSha256 || source.sourceIdentitySha256 || null,
      sourceAcceptanceBasis:source.sourceIdentitySha256&&!source.acceptanceSha256&&!source.sourceAcceptanceSha256?'VERIFIED_CURRENT_SOURCE_IDENTITY_INHERITANCE_NOT_NEW_TEXT_ACCEPTANCE':'EXISTING_SOURCE_ACCEPTANCE',
      sourceScopeAdmissionDigest: source.scopeAdmissionSha256 || null,
      wholeChapterQualified:item.record.wholeChapterQualified===true,
      sourceConceptAliases:(item.record.retrievalConcepts||[]).flatMap(c=>c.aliases||[]),
      selectedArgumentUnit:selectedArgument?{argumentId:selectedArgument.unit.argumentId,type:selectedArgument.unit.type,startOffset:selectedArgument.unit.startOffset,endOffset:selectedArgument.unit.endOffset,textSha256:selectedArgument.unit.textSha256,comparisonSubjects:selectedArgument.unit.comparisonSubjects||null}:null,
      explanationUnit:selectedArgument?.explanationUnit||null,
      scopeMatch:Boolean(selectedArgument&&((item.record.retrievalConcepts||[]).some(c=>conceptQueryMatch(c,query))||selectedArgument.evidenceMatch?.distinctiveAnchors?.length)),
      bookCode: source.bookCode,
      bookTitle: source.title,
      bookTitleEn: source.titleEn,
      bookRoute: source.bookRoute,
      partCode: item.record.partCode,
      sectionCode: item.record.sectionCode,
      heading: item.record.heading,
      pageRange: { start: item.record.startPage, end: item.record.endPage },
      sourceDigest: item.record.textSha256,
      sourceMaterializationDigest: item.record.sourceTextSha256 || item.record.textSha256,
      humanReadabilityStatus: item.record.reviewStatus || source.humanReadabilityStatus || 'UNKNOWN',
      corpusAuthority: source.activeCorpusAuthority || source.sourceAuthority,
      score: item.score,
        excerpt,
        excerptBoundaryState: item.record.supportRange ? 'GOVERNED_FIXED_RANGE' : 'COMPLETE_SENTENCES_WITH_OMISSION_MARKERS',
        supportRange: item.record.supportRange || null,
        answerProjectionPolicy:item.record.answerProjectionPolicy||null,
        causalExplanationAvailable:item.record.causalExplanationAvailable,
        admissionScope: item.record.admissionScope || null,
      canonicalBinding: bindingFor(item.record.sectionCode, bindings),
      conceptBinding: item.profile ? { profileId: item.profile.profileId, nodeCode: item.profile.nodeCode, authorityRefs: item.profile.authorityRefs, createsCanonicalAuthority: false } : null,
      editorialCorrections: item.record.editorialCorrections,
      publicationState: 'SOURCE_NOT_CANONICAL_ARTICLE'
    });
  }
  return results;
}

export async function loadR2RetrievalCorpus(binding, source, experimentAccess=null) {
  if(!corpusSourceAllowed(source,experimentAccess))return null;
  if (!binding?.get) {
    const error = new Error('MANUSCRIPT_SOURCE_STORAGE_UNAVAILABLE');
    error.code = 'MANUSCRIPT_SOURCE_STORAGE_UNAVAILABLE';
    throw error;
  }
  const object = await binding.get(source.r2ObjectKey);
  if (!object?.body) {
    const error = new Error('MANUSCRIPT_RETRIEVAL_CORPUS_NOT_FOUND');
    error.code = 'MANUSCRIPT_RETRIEVAL_CORPUS_NOT_FOUND';
    error.sourceCode = source.sourceCode;
    throw error;
  }
  const text = await new Response(object.body).text();
  const actualBytesSha256 = [...new Uint8Array(
    await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text))
  )].map(byte => byte.toString(16).padStart(2, '0')).join('');
  if (
    source.retrievalCorpusSha256 &&
    actualBytesSha256 !== source.retrievalCorpusSha256
  ) {
    const error = new Error('MANUSCRIPT_RETRIEVAL_CORPUS_BYTES_MISMATCH');
    error.code = 'MANUSCRIPT_RETRIEVAL_CORPUS_BYTES_MISMATCH';
    throw error;
  }
  // Every request still reads R2 and verifies current bytes before any cache
  // reuse. Missing objects or changed bytes cannot inherit an old PASS.
  const cachedCorpus = parsedCorpusCache.get(actualBytesSha256);
  const corpus = cachedCorpus?.corpus || JSON.parse(text);
  if (corpus.bookCode !== source.bookCode || corpus.locale !== source.locale) {
    const error = new Error('MANUSCRIPT_RETRIEVAL_CORPUS_IDENTITY_MISMATCH');
    error.code = 'MANUSCRIPT_RETRIEVAL_CORPUS_IDENTITY_MISMATCH';
    throw error;
  }
  if (corpus.sourceSha256 !== source.sourceSha256 || corpus.corpusSha256 !== source.corpusSha256) {
    const error = new Error('MANUSCRIPT_RETRIEVAL_CORPUS_SOURCE_MISMATCH');
    error.code = 'MANUSCRIPT_RETRIEVAL_CORPUS_SOURCE_MISMATCH';
    throw error;
  }
  if (Number(corpus.recordCount) !== Number(source.recordCount)) {
    const error = new Error('MANUSCRIPT_RETRIEVAL_CORPUS_COUNT_MISMATCH');
    error.code = 'MANUSCRIPT_RETRIEVAL_CORPUS_COUNT_MISMATCH';
    throw error;
  }
  if (!Array.isArray(corpus.records) || corpus.records.length !== Number(source.recordCount) || new Set(corpus.records.map(record => record.sectionCode)).size !== corpus.records.length) {
    const error = new Error('MANUSCRIPT_RETRIEVAL_SECTION_STRUCTURE_MISMATCH');
    error.code = 'MANUSCRIPT_RETRIEVAL_SECTION_STRUCTURE_MISMATCH';
    throw error;
  }
  if (!cachedCorpus) {
    const byteSize = new TextEncoder().encode(text).byteLength;
    if (byteSize <= MAX_PARSED_CORPUS_CACHE_BYTES) {
      while(parsedCorpusCacheBytes + byteSize > MAX_PARSED_CORPUS_CACHE_BYTES){const key=parsedCorpusCache.keys().next().value;parsedCorpusCacheBytes-=parsedCorpusCache.get(key).byteSize;parsedCorpusCache.delete(key);}
      parsedCorpusCache.set(actualBytesSha256,{corpus,byteSize});parsedCorpusCacheBytes+=byteSize;
    }
  }
  return corpus;
}

export const MANUSCRIPT_SOURCE_LIMITS = Object.freeze({
  maximumResults: MAX_RESULTS,
  maximumExcerptCharsPerResult: MAX_EXCERPT_CHARS,
  maximumTotalExcerptChars: MAX_TOTAL_EXCERPT_CHARS
});
