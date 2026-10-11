export const MANUSCRIPT_SOURCE_RUNTIME_CODE = 'MANUSCRIPT_KNOWLEDGE_SOURCE_RUNTIME';
export const MANUSCRIPT_SOURCE_RUNTIME_VERSION = '1.1.0';

const MAX_RESULTS = 4;
const MAX_EXCERPT_CHARS = 1200;
const MAX_TOTAL_EXCERPT_CHARS = 3600;

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

function scoreRecord(record, query, terms, profile, specificity = null) {
  if (record.retrievalEligible === false || record.segmentType === 'FRONT_MATTER') return 0;
  const heading = normalized(record.heading);
  const text = normalized(record.text);
  const q = normalized(query);
  let score = 0;
  const headingLabel = heading.split(/[|｜]/u)[0].trim();
  if (q && headingLabel === q) score += 4000;
  const exactProfileQuestion = [...(profile?.naturalQuestions || []), ...(profile?.userLanguage || []), ...(profile?.aliases || [])].some(value => normalized(value) === q);
  if (exactProfileQuestion) score += 1400;
  if (q && heading.includes(q)) score += 1200;
  if (q && text.includes(q)) score += 800;
  const meaningfulTerms = terms.filter(term => !/^(?:why|what|how|does|do|is|are|the|a|an|of|in|to|and|can|为什么|为何|什么|怎么|如何|请问|现实|运行|一个|以后|能够|需要|形成|持续|个人|people)$/i.test(term));
  if (!meaningfulTerms.length) return 0;
  let specificMatches = 0;
  for (const term of meaningfulTerms) {
    const weight = specificity?.get(term) || 1;
    if ((specificity ? headingLabel : heading).includes(term)) score += 70 * weight;
    if (text.includes(term)) { score += 12 * weight; specificMatches++; }
  }
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
  const specificity = source.version?.startsWith('owner-final-20261011-') ? new Map(terms.map(term => [term,Math.log(1 + corpus.records.length / (1 + corpus.records.filter(record => normalized(record.text).includes(term)).length))])) : null;
  const ranked = corpus.records
    .map(rawRecord => {
      const record = correctedRecord(rawRecord, corrections);
      const profile = profiles.find(candidate => candidate.bookCode === source.bookCode && candidate.productionEligible === true && candidate.bookSources?.some(ref => ref.sectionCode === record.sectionCode));
      return { record, score: scoreRecord(record, query, terms, profile, specificity), profile };
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
  const corpus = JSON.parse(text);
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
  return corpus;
}

export const MANUSCRIPT_SOURCE_LIMITS = Object.freeze({
  maximumResults: MAX_RESULTS,
  maximumExcerptCharsPerResult: MAX_EXCERPT_CHARS,
  maximumTotalExcerptChars: MAX_TOTAL_EXCERPT_CHARS
});
