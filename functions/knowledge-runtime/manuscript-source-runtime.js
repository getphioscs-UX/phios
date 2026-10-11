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
    const max = Math.min(run.length - 1, 24);
    for (let index = 0; index < max; index += 1) cjk.push(run.slice(index, index + 2));
  }
  return unique([...latin, ...cjk]).slice(0, 40);
}

export function manuscriptQueryTerms(value) {
  return queryTerms(String(value || '').replace(/为什么|为何|是什么|是什么意思|如何|怎么|请问|这样|那样|这个|那个|\b(?:why|what|how|does|do|is|are|the|a|an|of|in|to|and|can|could|would|please)\b/gi, ' ')).filter(term=>term.length>1);
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
  let score = 0;
  const headingLabel = heading.split(/[|｜]/u)[0].trim();
  const temporalSubject = q.match(/^([\u3400-\u9fff]{2,8}?)(?:是否|是不是|是|会|能)/u)?.[1];
  const temporalConditionMatch = temporalSubject && /瞬间|单次|一次性|固定|静止|永久/u.test(q) && nativeHeader.includes(temporalSubject) && /持续|过程|固定|静止|变化/u.test(nativeHeader);
  if (temporalConditionMatch) score += 1200;
  const perspectiveCompletenessMatch = /全部|完整|唯一/u.test(q) && /我(?:看到|看见|感受)|自己的(?:现实|世界)|个人(?:理解|经验)/u.test(q) && /全部|完整/u.test(nativeHeader) && /意识|理解|经验/u.test(nativeHeader);
  if (perspectiveCompletenessMatch) score += 1200;
  if (q && headingLabel === q) score += 4000;
  const exactProfileQuestion = [...(profile?.naturalQuestions || []), ...(profile?.userLanguage || []), ...(profile?.aliases || [])].some(value => normalized(value) === q);
  if (exactProfileQuestion) score += 1400;
  if (q && heading.includes(q)) score += 1200;
  if (q && text.includes(q)) score += 800;
  const nativeIntroductionMatch=compactQuestion.length>=4&&compact(record.text.slice(0,350)).includes(compactQuestion);
  if(nativeIntroductionMatch)score+=1600;
  const meaningfulTerms = terms.filter(term => !/^(?:why|what|how|does|do|is|are|the|a|an|of|in|to|and|can|为什么|为何|什么|怎么|如何|请问|现实|运行|一个|以后|能够|需要|形成|持续|个人|people)$/i.test(term));
  if (!meaningfulTerms.length) return 0;
  let specificMatches = 0;
  for (const term of meaningfulTerms) {
    const weight = specificity?.get(term) || 1;
    if ((specificity ? headingLabel : heading).includes(term)) score += 70 * weight;
    if (text.includes(term)) { score += 12 * weight; specificMatches++; }
  }
  const totalWeight=meaningfulTerms.reduce((sum,term)=>sum+(specificity?.get(term)||1),0);
  const matchedWeight=meaningfulTerms.filter(term=>text.includes(term)||compactText.includes(compact(term))).reduce((sum,term)=>sum+(specificity?.get(term)||1),0);
  if(!record.supportRange&&!exactProfileQuestion&&!nativeIntroductionMatch&&!temporalConditionMatch&&!perspectiveCompletenessMatch&&!q.includes(headingLabel)&&matchedWeight/Math.max(1,totalWeight)<0.35)return 0;
    if (specificity) {
      const subtitle = heading.slice(headingLabel.length);
      const comparison = q.match(/^(.+?)(?:与|和)(.+?)(?:有什么区别|有何区别|的区别|区别)/);
      const definedConcept = headingLabel.replace(/^什么是/, '');
      if (comparison && [comparison[1],comparison[2]].some(value=>value===definedConcept)) score += 900;
      for (const term of meaningfulTerms) if (subtitle.includes(term)) score += 35 * (specificity.get(term) || 1);
      // The question and the chapter subtitle must describe the same limitation,
      // rather than merely sharing a broad noun such as scale or capacity.
      if (/(?:不再|无法|不能).*(?:产生|带来|形成).*(?:能力|收益)/.test(q) && /(?:不再|无法|不能).*(?:产生|形成).*能力/.test(subtitle)) score += 220;
      const sentences = text.split(/[。！？!?]/u);
    const bestSentence = Math.max(0,...sentences.map(sentence => meaningfulTerms.reduce((sum,term)=>sum+(sentence.includes(term)?specificity.get(term)||1:0),0)));
    score += 100 * bestSentence;
  }
  return specificMatches >= Math.min(2, meaningfulTerms.length) || score >= 800 ? score : 0;
}

function excerptFor(record, query, terms, maximum = MAX_EXCERPT_CHARS) {
    const text = clean(record.text);
    if (record.supportRange) return text.length<=maximum?text:text.slice(0,maximum).replace(/[^。！？!?]*$/u,'')+'…';
  if (text.length <= maximum) return text;
  let anchor = text.indexOf(clean(query));
  const concept = clean(record.heading).split(/[|｜]/u)[0].replace(/^[✦◈◆◇❖]\s*/u,'').trim();
  // A named concept question needs its introductory definition, not whichever
  // incidental word happens to occur earliest in the query-term list.
  if (concept.length >= 2 && clean(query).includes(concept)) anchor = 0;
  if (anchor < 0) {
    for (const term of terms) {
      anchor = text.toLocaleLowerCase().indexOf(term);
      if (anchor >= 0) break;
    }
  }
  if (anchor < 0) anchor = 0;
  const before = Math.floor(maximum * 0.35);
  let start = Math.max(0, anchor - before);
  let end = Math.min(text.length, start + maximum);
  start = Math.max(0, end - maximum);
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
  maximumTotalExcerptChars = MAX_TOTAL_EXCERPT_CHARS
}) {
  if (!corpus || !Array.isArray(corpus.records)) return [];
  const terms = manuscriptQueryTerms(query);
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
  const specificity = new Map(terms.map(term => [term,Math.log(1 + corpus.records.length / (1 + preparedRecords.filter(item => item.prepared.dfText.includes(term)).length))]));
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
    const excerpt = excerptFor(item.record, query, terms, allowance);
    totalChars += excerpt.length;
    results.push({
      sourceType: 'COMPLETED_MANUSCRIPT',
      sourceCode: source.sourceCode,
      sourceVersion: source.version || source.sourceCode,
      sourceBinaryDigest: source.sourceSha256,
      sourceAcceptanceDigest: source.acceptanceSha256 || source.sourceAcceptanceSha256 || null,
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
        supportRange: item.record.supportRange || null,
        admissionScope: item.record.admissionScope || null,
      canonicalBinding: bindingFor(item.record.sectionCode, bindings),
      conceptBinding: item.profile ? { profileId: item.profile.profileId, nodeCode: item.profile.nodeCode, authorityRefs: item.profile.authorityRefs, createsCanonicalAuthority: false } : null,
      editorialCorrections: item.record.editorialCorrections,
      publicationState: 'SOURCE_NOT_CANONICAL_ARTICLE'
    });
  }
  return results;
}

export async function loadR2RetrievalCorpus(binding, source) {
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
