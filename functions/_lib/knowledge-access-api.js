import {experimentFragments,isolatedExperimentRegistry} from '../knowledge-runtime/manuscript-experiment-access.js';
import { handlePublicKnowledgeRequest } from './public-knowledge-api.js';
import {
  MANUSCRIPT_SOURCE_LIMITS,
  loadR2RetrievalCorpus,
  queryTerms,
  manuscriptQueryTerms,
  searchManuscriptCorpus
} from '../knowledge-runtime/manuscript-source-runtime.js';
import {retrieveAtlasScope} from './atlas-retrieval-scope.js';
import {manuscriptMetadataRaw} from '../knowledge-runtime/current-manuscript-server-metadata.js';
import {isBookViiManuscriptRequest} from './knowledge-epistemic-reading.js';
import {admittedManuscriptScopes} from './manuscript-current-admission.js';
import {selectSourceBoundExplanation} from '../knowledge-runtime/source-bound-explanation-units.js';

const MODES = new Set(['auto', 'overview', 'focused', 'full_article', 'continuity']);
const SOURCES = new Set(['auto', 'hybrid', 'published', 'manuscript']);
const LOCALES = new Set(['zh-Hans', 'en']);
const MAX_QUERY_LENGTH = 500;
const MAX_ANSWER_CHARS = 1600;

const response = (body, status = 200) => Response.json(body, {
  status,
  headers: {
    'Cache-Control': 'no-store',
    'Content-Type': 'application/json; charset=utf-8',
    'X-Content-Type-Options': 'nosniff'
  }
});

async function readAssetJson(env, path) {
  if (Object.hasOwn(manuscriptMetadataRaw,path)) return JSON.parse(manuscriptMetadataRaw[path]);
  if (!env?.ASSETS?.fetch) throw new Error('KNOWLEDGE_ACCESS_ASSETS_UNAVAILABLE');
  const result = await env.ASSETS.fetch(new Request(`https://assets.local/${path}`));
  if (!result.ok) throw new Error(`KNOWLEDGE_ACCESS_ASSET_UNAVAILABLE:${path}`);
  return result.json();
}

async function validateSourceAcceptance(env, source) {
  if (!source.acceptancePath || !source.acceptanceSha256) throw new Error('MANUSCRIPT_SOURCE_ACCEPTANCE_REQUIRED');
  const response = Object.hasOwn(manuscriptMetadataRaw,source.acceptancePath) ? new Response(manuscriptMetadataRaw[source.acceptancePath]) : await env.ASSETS.fetch(new Request(`https://assets.local/${source.acceptancePath}`));
  if (!response.ok) throw new Error('MANUSCRIPT_SOURCE_ACCEPTANCE_UNAVAILABLE');
  const bytes = await response.text();
  const digest = [...new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(bytes)))].map(b => b.toString(16).padStart(2, '0')).join('');
  const acceptance = JSON.parse(bytes);
  if (digest !== source.acceptanceSha256 || acceptance.sourceSha256 !== source.sourceSha256 || acceptance.corpusSha256 !== source.corpusSha256 || acceptance.allRecordsHumanAccepted !== true || Number(acceptance.recordCount) !== Number(source.recordCount)) throw new Error('MANUSCRIPT_SOURCE_ACCEPTANCE_IDENTITY_MISMATCH');
}

async function publishedProjection({ request, env, query, locale, mode }) {
  const url = new URL(request.url);
  url.pathname = '/api/public-knowledge';
  url.search = new URLSearchParams({ q: query, locale, mode }).toString();
  const result = await handlePublicKnowledgeRequest(new Request(url, { method: 'GET' }), env);
  return result.json();
}

async function manuscriptProjection({ env, query, locale, bookCode, experimentAccess=null }) {
  // The Pages Preview checkpoint exercises public knowledge and private reports,
  // not production manuscript retrieval. R2 bindings are not inherited.
  if (env?.PHIOS_ENVIRONMENT === 'qa' && env.PHIOS_MANUSCRIPT_RETRIEVAL_ENABLED !== 'true') {
    return { status: 'disabled_in_preview', records: [], errors: [] };
  }
  const [registry, reviewedRegistry, bindings, corrections, semanticProfiles] = await Promise.all([
    Promise.resolve(isolatedExperimentRegistry(experimentAccess,env)).then(candidate=>candidate||readAssetJson(env, manuscriptMetadataRaw.ACTIVE_MANUSCRIPT_SOURCE_REGISTRY || 'content/knowledge/source-access/registries/manuscript-knowledge-source-registry-v5.json')),
    readAssetJson(env, 'content/knowledge/source-access/registries/manuscript-reviewed-corpus-registry-v1.json'),
    readAssetJson(env, 'content/knowledge/source-access/registries/manuscript-section-canonical-binding-v1.json'),
    readAssetJson(env, 'content/knowledge/source-access/registries/manuscript-editorial-correction-v1.json'),
    readAssetJson(env, 'content/knowledge/knowledge-intelligence-r2/semantic-profiles/successors/book4-a6/kir-r2-book-i-iv-semantic-retrieval-profiles-v2.json')
  ]);
  const identityQa=env.PHIOS_ENVIRONMENT==='qa'&&env.PHIOS_MANUSCRIPT_DERIVATIVE_QA==='true';
  const sources = registry.records
    .filter(source => source.locale === locale && (source.runtimeAdmission === 'SCOPED_TEXT_CANDIDATE_NOT_ACTIVATED' ? env.PHIOS_MANUSCRIPT_DERIVATIVE_QA === 'true' || env.PHIOS_MANUSCRIPT_TEXT_SCOPE_ENABLED === 'true' : source.runtimeAdmission !== 'NOT_ADMITTED' || (identityQa&&source.qaOnly===true&&source.sourceIdentityPath) || (env.PHIOS_MANUSCRIPT_DERIVATIVE_QA === 'true' && source.sourceAcceptancePath && source.version?.startsWith('owner-final-20261011-'))) && (!bookCode || source.bookCode === bookCode))
    .map(source => {
      if(isolatedExperimentRegistry(experimentAccess,env)&&experimentFragments(experimentAccess,source).length)return {...source,isolatedSourceCandidate:true};
      if(identityQa&&source.qaOnly===true&&source.sourceIdentityPath)return source;
      if(env.PHIOS_MANUSCRIPT_TEXT_SCOPE_ENABLED==='true'&&source.scopeAdmissionPath&&source.sourceIdentityPath)return source;
      if (source.runtimeAdmission === 'ADMITTED_READABILITY_SOURCE_PENDING_REMOTE_OBJECT') return source;
      if (env.PHIOS_MANUSCRIPT_DERIVATIVE_QA === 'true' && source.sourceAcceptancePath) return source;
      if (env.PHIOS_MANUSCRIPT_TEXT_SCOPE_ENABLED === 'true' && source.scopeAdmissionPath && source.sourceAcceptancePath) return source;
      const reviewed = reviewedRegistry.records.find(record => record.sourceCode === source.sourceCode && record.locale === source.locale);
      if (!reviewed || reviewed.humanReadabilityStatus !== 'HUMAN_REVIEW_COMPLETE') return null;
      return {
        ...source,
        reviewedSourceRecord: reviewed,
        r2ObjectKey: reviewed.r2ObjectKey,
        retrievalCorpusSha256: reviewed.retrievalCorpusSha256,
        activeCorpusAuthority: reviewed.corpusAuthority,
        humanReadabilityStatus: reviewed.humanReadabilityStatus
      };
    })
    .filter(Boolean);
  if (!sources.length) return { status: locale === 'en' ? 'locale_unavailable' : 'source_not_admitted', records: [], errors: [], bookCode: bookCode || null };
  if (!env?.MANUSCRIPTS?.get) return { status: 'storage_unavailable', records: [], errors: ['MANUSCRIPT_SOURCE_STORAGE_UNAVAILABLE'] };

  const settled = await Promise.allSettled(sources.map(async source => {
    if(source.sourceIdentityPath){
      if(source.qaOnly===true&&!identityQa)throw Error('QA_SOURCE_FORBIDDEN_IN_PRODUCTION');
      const provenance=await readAssetJson(env,source.sourceIdentityPath);
      const raw=manuscriptMetadataRaw[source.sourceIdentityPath]||JSON.stringify(provenance);
      const digest=[...new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(raw)))].map(b=>b.toString(16).padStart(2,'0')).join('');
      if(digest!==source.sourceIdentitySha256||(provenance.sourcePdfSha256||provenance.sha256)!==source.sourceSha256)throw Error('MANUSCRIPT_SOURCE_IDENTITY_MISMATCH');
    }
    if (source.sourceAcceptancePath) {
      const result = Object.hasOwn(manuscriptMetadataRaw,source.sourceAcceptancePath) ? new Response(manuscriptMetadataRaw[source.sourceAcceptancePath]) : await env.ASSETS.fetch(new Request(`https://assets.local/${source.sourceAcceptancePath}`));
      if (!result.ok) throw new Error('MANUSCRIPT_SOURCE_ACCEPTANCE_UNAVAILABLE');
      const bytes = await result.text();
      const actual = [...new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(bytes)))].map(b=>b.toString(16).padStart(2,'0')).join('');
      const acceptance = JSON.parse(bytes);
      if (actual !== source.sourceAcceptanceSha256 || acceptance.sourceSha256 !== source.sourceSha256 || acceptance.status !== 'HUMAN_ACCEPTED_SOURCE_IDENTITY' || acceptance.scope !== 'CURRENT_CHINESE_SOURCE_BINARY_ONLY') throw new Error('MANUSCRIPT_SOURCE_ACCEPTANCE_IDENTITY_MISMATCH');
    }
    if (source.runtimeAdmission === 'ADMITTED_READABILITY_SOURCE_PENDING_REMOTE_OBJECT') await validateSourceAcceptance(env, source);
    let currentPermittedScopes = null;
    if (source.scopeAdmissionPath) {
      const raw = manuscriptMetadataRaw[source.scopeAdmissionPath];
      if (!raw) throw Error('MANUSCRIPT_SCOPE_ADMISSION_UNAVAILABLE');
      const digest = [...new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(raw)))].map(b => b.toString(16).padStart(2, '0')).join('');
      if (digest !== source.scopeAdmissionSha256) throw Error('MANUSCRIPT_SCOPE_ADMISSION_IDENTITY_MISMATCH');
      const scope = JSON.parse(raw);
      currentPermittedScopes = admittedManuscriptScopes(scope.records.filter(r => r.bookCode === source.bookCode && r.sourceSha256 === source.sourceSha256 && r.corpusSha256 === source.corpusSha256 && r.locale === locale && r.scopeState === 'LOCAL_QA_VERIFIED_PROSE_CANDIDATE'), source, manuscriptMetadataRaw, {
        textScopeEnabled: env.PHIOS_MANUSCRIPT_TEXT_SCOPE_ENABLED === 'true',
        experimentAccess,
        declaredWholeSections: registry.activationScope?.wholeChapterCandidates || []
      });
      if (!currentPermittedScopes.length) return [];
    }
    let corpus = await loadR2RetrievalCorpus(env.MANUSCRIPTS, source, experimentAccess);
    if (!corpus) throw Error('MANUSCRIPT_CORPUS_PERMISSION_DENIED');
    // Reuse the existing closed KSAR human review for Book II. The original
    // registry and accepted corpus remain unchanged; only the missing consumer
    // provenance is restored. A label alone never grants answer eligibility.
    if (source.bookCode === 'BOOK-2' && source.reviewedSourceRecord) {
      const reviewed = source.reviewedSourceRecord;
      const closurePath = reviewedRegistry.humanReviewResolution;
      const raw = manuscriptMetadataRaw[closurePath];
      if (!raw) throw Error('REVIEWED_MANUSCRIPT_ACCEPTANCE_METADATA_UNAVAILABLE');
      const closure = JSON.parse(raw);
      if (closure.status !== 'HUMAN_REVIEW_GATE_CLOSED' || closure.summary?.pendingHumanReview !== 0 || closure.authorityBoundaries?.reviewedCorpusMayGroundQuestionScopedKnowledgeAccess !== true || reviewed.sourceSha256 !== corpus.sourceSha256 || reviewed.corpusSha256 !== corpus.corpusSha256 || reviewed.reviewedRecordsSha256 !== corpus.reviewedRecordsSha256 || Number(reviewed.recordCount) !== corpus.records.length || corpus.humanReview?.allRecordsReviewed !== true || corpus.humanReview?.pendingCount !== 0 || !corpus.records.every(record => record.reviewStatus === 'HUMAN_APPROVED_FINAL')) throw Error('REVIEWED_MANUSCRIPT_ACCEPTANCE_IDENTITY_MISMATCH');
      source.acceptanceSha256 = [...new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(raw)))].map(b=>b.toString(16).padStart(2,'0')).join('');
    }
    // Reviewed corpora without a scope adapter still need verified fragment argument
    // identities for isolated LLM packs. A private capability never activates production.
    if(!source.scopeAdmissionPath&&experimentAccess){
      const fragments=experimentFragments(experimentAccess,source);
      if(fragments.length){const records=[];for(const record of corpus.records){const allowed=fragments.filter(f=>f.sectionCode===record.sectionCode&&f.sectionSha256===record.textSha256);if(!allowed.length)continue;
        const units=[];for(const f of allowed){const text=record.text.slice(f.startOffset,f.endOffset);if(f.startOffset<0||f.endOffset>record.text.length||f.endOffset<=f.startOffset)throw Error('EXPERIMENT_FRAGMENT_RANGE_INVALID');const sha=[...new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(text)))].map(b=>b.toString(16).padStart(2,'0')).join('');if(sha!==f.textSha256)throw Error('EXPERIMENT_FRAGMENT_BYTES_MISMATCH');units.push({argumentId:f.argumentId,type:'DEFINITION',startOffset:f.startOffset,endOffset:f.endOffset,textSha256:f.textSha256});}
        records.push({...record,argumentUnits:units,experimentFragmentsOnly:true});}
        corpus={...corpus,records};
      }
    }
    if (source.scopeAdmissionPath && env.PHIOS_MANUSCRIPT_TEXT_SCOPE_QA !== 'true' && env.PHIOS_MANUSCRIPT_TEXT_SCOPE_ENABLED !== 'true') throw Error('MANUSCRIPT_SCOPE_NOT_ACTIVATED');
    if ((env.PHIOS_MANUSCRIPT_TEXT_SCOPE_QA === 'true' || env.PHIOS_MANUSCRIPT_TEXT_SCOPE_ENABLED === 'true') && source.scopeAdmissionPath) {
      // Server-only candidate validation. This flag cannot be set by request input.
      const raw=manuscriptMetadataRaw[source.scopeAdmissionPath];
      if(!raw)throw Error('MANUSCRIPT_SCOPE_ADMISSION_UNAVAILABLE');
      const digest=[...new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(raw)))].map(b=>b.toString(16).padStart(2,'0')).join('');
      if(digest!==source.scopeAdmissionSha256)throw Error('MANUSCRIPT_SCOPE_ADMISSION_IDENTITY_MISMATCH');
      const scope=JSON.parse(raw);
      const permitted=currentPermittedScopes;
      for(const admitted of permitted){
        const record=corpus.records.find(r=>r.sectionCode===admitted.sectionCode&&r.textSha256===admitted.sectionSha256);
        if(!record)throw Error('MANUSCRIPT_SCOPE_SECTION_IDENTITY_MISMATCH');
        for(const unit of admitted.argumentUnits||[]){
          const bytes=new TextEncoder().encode(record.text.slice(unit.startOffset,unit.endOffset));
          const actual=[...new Uint8Array(await crypto.subtle.digest('SHA-256',bytes))].map(b=>b.toString(16).padStart(2,'0')).join('');
          if(actual!==unit.textSha256)throw Error('MANUSCRIPT_ARGUMENT_SUPPORT_BYTES_MISMATCH');
        }
      }
      // An explicitly named chapter subject must not fall back to an unrelated
      // admitted chapter merely because both mention structure or control.
      const normalizedQuery=String(query).normalize('NFKC').replace(/\s+/g,'');
      const namedSubjects=corpus.records.filter(record=>{
        const label=String(record.heading||'').normalize('NFKC').split(/[|｜]/u)[0].replace(/^[✦◈◆◇❖]+/u,'').replace(/^什么是/,'').replace(/\s+/g,'');
        const chinesePrimaryLabel=label.match(/^[\u3400-\u9fff]{2,}/u)?.[0];
        const definitions=[...String(record.text||'').normalize('NFKC').replace(/\s+/gu,'').matchAll(/(?:所谓|这就是|这便是|被称为)([\u3400-\u9fff]{3,12}?)(?:[，,。.:：]|并不是|不是|是)/gu)].map(m=>m[1]);
        return (label.length>=2&&normalizedQuery.includes(label))||(chinesePrimaryLabel&&normalizedQuery.includes(chinesePrimaryLabel))||definitions.some(name=>normalizedQuery.includes(name));
      });
      const conceptQuery=normalizedQuery.replace(/垮台|倒台/gu,'终结');
      const declaredConceptCovered=permitted.some(s=>s.wholeChapterCandidate===true&&(s.retrievalConcepts||[]).some(concept=>concept.aliases?.some(alias=>conceptQuery.includes(alias))||concept.termSets?.some(set=>set.every(term=>conceptQuery.includes(term)))));
      const supportedExplanation=corpus.records.some(record=>{
        const scope=permitted.find(s=>s.sectionCode===record.sectionCode&&s.startOffset===0);
        return scope&&selectSourceBoundExplanation({...record,argumentUnits:scope.argumentUnits||[],retrievalConcepts:scope.retrievalConcepts||[]},query,manuscriptQueryTerms(query),1200);
      });
      // A normal question can mention a chapter label without requesting that
      // chapter. Explicit title selection is retained; supported native units
      // may resolve ordinary questions without an unrelated title veto.
      const explicitlyNamed=/(?:第[^，。？?]{1,12}章|《[^》]+》)/u.test(normalizedQuery);
      if(namedSubjects.length&&!declaredConceptCovered&&!namedSubjects.some(record=>permitted.some(s=>s.sectionCode===record.sectionCode))&&(explicitlyNamed||!supportedExplanation))return [];
      corpus={...corpus,records:corpus.records.flatMap(record=>{const s=permitted.find(r=>r.sectionCode===record.sectionCode&&r.sectionSha256===record.textSha256);if(!s)return[];for(const concept of s.retrievalConcepts||[])if(!record.text.normalize('NFKC').replace(/\s+/gu,'').includes(concept.supportAnchor.normalize('NFKC').replace(/\s+/gu,'')))throw Error('MANUSCRIPT_CONCEPT_SOURCE_SUPPORT_MISMATCH');for(const unit of s.argumentUnits||[])if(unit.startOffset<0||unit.endOffset>record.text.length||unit.endOffset<=unit.startOffset)throw Error('MANUSCRIPT_ARGUMENT_RANGE_INVALID');return[{...record,text:record.text.slice(s.startOffset,s.endOffset),startPage:s.pdfPageRange?.start||record.startPage,endPage:s.pdfPageRange?.end||record.endPage,retrievalConcepts:s.retrievalConcepts||[],argumentUnits:s.argumentUnits||[],experimentFragmentsOnly:s.experimentFragmentsOnly===true,answerProjectionPolicy:s.answerProjectionPolicy||null,causalExplanationAvailable:s.causalExplanationAvailable,supportRange:{startOffset:s.startOffset,endOffset:s.endOffset,sectionSha256:s.sectionSha256},admissionScope:'SERVER_VERIFIED_TEXT_SCOPE_CANDIDATE'}];})};
    }
    return searchManuscriptCorpus({ corpus, source, bindings, corrections, query, profiles: semanticProfiles.profiles,experimentAccess });
  }));
  const records = settled.flatMap(result => result.status === 'fulfilled' ? result.value : []);
  const errors = settled.filter(result => result.status === 'rejected').map(result => result.reason?.code || result.reason?.message || 'MANUSCRIPT_SOURCE_QUERY_FAILED');
  records.sort((a, b) => b.score - a.score || a.sectionCode.localeCompare(b.sectionCode));
  return {
    status: records.length ? 'covered' : (errors.length === sources.length ? 'unavailable' : 'no_match'),
    records: records.slice(0, MANUSCRIPT_SOURCE_LIMITS.maximumResults),
    errors
  };
}

function groundingFrom(published, manuscript) {
  const sources = [];
  for (const fragment of published?.projection?.fragments || []) {
    sources.push({
      sourceType: 'PUBLISHED_CANONICAL_ARTICLE',
      nodeCode: published.projection.nodeCode,
      fragmentCode: fragment.fragmentCode,
      digest: fragment.digest,
      text: fragment.text,
      // BOOK_VII_ADMISSION_METADATA: preserve governed projection metadata only.
      ...(fragment.bookId==='BOOK-7'?{nodeCode:fragment.nodeCode||published.projection.nodeCode,bookId:fragment.bookId,bookCode:fragment.bookCode,partCode:fragment.partCode,scopeMatch:fragment.scopeMatch,publicationStatus:fragment.publicationStatus,authorityOwner:fragment.authorityOwner,sourceType:fragment.sourceType,epistemicEvidence:fragment.epistemicEvidence,canonicalProseAuthority:fragment.canonicalProseAuthority,ocrAuthority:fragment.ocrAuthority}:{})
    });
  }
  for (const record of manuscript?.records || []) {
    const topScore = manuscript.records[0]?.score || 0;
    if (record.sourceVersion?.startsWith('owner-final-20261011-') && record !== manuscript.records[0]) continue;
    if (topScore >= 800 && record.score < topScore * 0.8) continue;
    sources.push({
      sourceType: record.sourceType,
      bookCode: record.bookCode,
      partCode: record.partCode,
      sectionCode: record.sectionCode,
      pageRange: record.pageRange,
      sourceDigest: record.sourceDigest,
      canonicalBinding: record.canonicalBinding,
      sourceCode: record.sourceCode,
      sourceVersion: record.sourceVersion,
      sourceBinaryDigest: record.sourceBinaryDigest,
      sourceAcceptanceDigest: record.sourceAcceptanceDigest,
      sourceScopeAdmissionDigest: record.sourceScopeAdmissionDigest || null,
      wholeChapterQualified:record.wholeChapterQualified===true,
      sourceConceptAliases:record.sourceConceptAliases||[],
      selectedArgumentUnit:record.selectedArgumentUnit||null,
      explanationUnit:record.explanationUnit||null,
      scopeMatch:record.scopeMatch===true&&Boolean(record.sourceScopeAdmissionDigest),
      supportRange: record.supportRange || null,
      answerProjectionPolicy:record.answerProjectionPolicy||null,
      causalExplanationAvailable:record.causalExplanationAvailable,
      projectionKind:record.projectionKind||null,
      ...(record.approvedPublicProjection||{}),
      excerptBoundaryState: record.excerptBoundaryState,
      heading: record.heading,
      text: record.excerpt
    });
  }
  return {
    allowed: sources.length > 0,
    generatedAnswerPresent: false,
    policy: 'DOWNSTREAM_SUMMARY_OR_ANSWER_MUST_USE_ONLY_RETURNED_GROUNDING_AND_PRESERVE_SOURCE_BOUNDARIES',
    sources
  };
}

function splitSentences(text) {
  return String(text || '')
    .replace(/([\u3400-\u9fff])\s+(?=[\u3400-\u9fff])/g, '$1')
    .replace(/\s+/g, ' ')
    .match(/[^。！？!?]+[。！？!?]?/g)
    ?.map(value => value.trim())
    // Short source sentences may carry the decisive qualification (for
    // example a negation). Length is not a basis for deleting them.
    .filter(value => /[\p{L}\p{N}]/u.test(value) && /[。！？!?]$/u.test(value)) || [];
}

export function manuscriptAnswerProse(text, heading) {
  const raw = String(text || '');
  const marker = /^\s*[^\p{Script=Han}A-Za-z0-9\s]+/u;
  if (!marker.test(raw)) return raw;
  const compact = value => String(value).normalize('NFKC').replace(/\s+/gu, '');
  const lines = raw.split('\n');
  const title = compact(heading);
  const reviewedHeader = raw.match(/^\s*[^\p{Script=Han}A-Za-z0-9\s]+[^\f]{0,200}?\n[ \t]*\n/u);
  if (reviewedHeader && /[|｜]/u.test(lines[0])) return raw.slice(reviewedHeader[0].length);
  let prefix = '';
  for (let i = 0; i < Math.min(lines.length, 12); i++) {
    // A page boundary is never a heading delimiter.
    if (lines[i].includes('\f')) break;
    const line = lines[i].replace(i === 0 ? marker : /^$/u, '');
    if (i === 0 && /^第[一二三四五六七八九十]+部/u.test(line) && lines[1] && title.startsWith(compact(lines[1]))) continue;
    prefix += line;
    if (title && compact(prefix) === title) return lines.slice(i + 1).join('\n');
    if (title && !title.startsWith(compact(prefix))) break;
  }
  // Legacy reviewed derivatives explicitly separate the heading with an
  // empty line. Accept that separator only before a page break.
  const separator = raw.match(/^\s*[✦◈◆◇❖][^\f]*?\n[ \t]*\n/u);
  return separator ? raw.slice(separator[0].length) : raw;
}

export function deterministicGroundedAnswer(query, grounding, locale) {
  if (!grounding?.allowed) return null;
  const terms = manuscriptQueryTerms(query);
  if (!terms.length) return null;
  const candidates = [];
  for (const source of grounding.sources || []) {
    const sourceId = source.sourceId || (
      source.sourceType === 'PUBLISHED_CANONICAL_ARTICLE'
        ? `PUBLISHED:${source.nodeCode}:${source.fragmentCode}`
        : `MANUSCRIPT:${source.sectionCode}`
    );
    let position = 0;
    let prose=source.text;
    if(source.selectedArgumentUnit&&source.sourceScopeAdmissionDigest){return{present:true,projectionType:'DETERMINISTIC_EXTRACTIVE_GROUNDED_ANSWER',generativeModelUsed:false,locale,text:splitSentences(prose).join(locale==='zh-Hans'?'\n\n':' '),sourceReferences:[sourceId],argumentUnit:source.selectedArgumentUnit,authorityNotice:'Exact chapter argument span from server-verified scope; source qualifiers retained. No generated answer or full-chapter publication.'};}
    if (!source.supportRange || source.bookCode === 'BOOK-3') prose = manuscriptAnswerProse(prose, source.heading);
    if (!source.supportRange && source.excerptBoundaryState === 'COMPLETE_SENTENCES_WITH_OMISSION_MARKERS') prose = String(prose).replace(/^…/u,'').replace(/…$/u,'');
    if(source.supportRange){const normalized=String(prose).replace(/([\u3400-\u9fff])\s+(?=[\u3400-\u9fff])/g,'$1').normalize('NFKC');const title=String(source.heading||'').normalize('NFKC');prose=normalized.startsWith('✦'+title)?normalized.slice(title.length+1):normalized;}
    // Native manuscript prose must retain the definition and its adjacent
    // conditions. Isolated high-scoring sentences can lose their antecedent.
    if (source.sourceType === 'COMPLETED_MANUSCRIPT' && (!source.supportRange || source.bookCode === 'BOOK-3' || source.answerProjectionPolicy==='QUESTION_ANCHORED_CONTIGUOUS')) {
      const sentences = splitSentences(prose);
      const contiguous = []; let size = 0;
      let answerStart=0;
      if(!source.supportRange||source.answerProjectionPolicy==='QUESTION_ANCHORED_CONTIGUOUS'){
        let bestScore=0;
        sentences.forEach((sentence,index)=>{
          const normalized=sentence.normalize('NFKC').toLocaleLowerCase().replace(/\s+/gu,'');
          const informativeTerms=terms.filter(term=>!/^(?:存在|不是|表示|已经|没有|代表|还在|还能|保持)$/u.test(term));
          const namedSubject=String(query).match(/第[一二三四五六七八九十\d]+册/u)?.[0];
          const literalSubject=String(query).match(/^(?:既然|虽然|即使)?([\u3400-\u9fff]{1,8}?)(?:还在|仍然|正在|依然)/u)?.[1];
          const condition=String(query).match(/^(.{2,20}?)(?:是不是|是否|就代表|就意味着)/u)?.[1]?.slice(-2);
          let score=informativeTerms.reduce((sum,term)=>sum+(normalized.includes(term)?term.length:0),0)+(namedSubject&&normalized.includes(namedSubject)?20:0)+(literalSubject&&normalized.includes(literalSubject)?20:0)+(condition&&normalized.includes(condition)?12:0)+(terms.includes('出售')&&normalized.includes('出售')?15:0);
          if(score>0&&/哪些|包括|层次|几种/u.test(query)&&/至少|可以是|包括|分别|分为/u.test(normalized))score+=12;
          if(!/如果|假如|假设/u.test(query)&&/^如果.*如果/u.test(normalized))score-=18;
          if(score>bestScore){bestScore=score;answerStart=index;}
        });
      }
      for (const sentence of sentences.slice(answerStart)) {
        if (/^…|…$/.test(sentence)) break;
        // Do not propagate an overprinted/repeated extraction run. Preserve the
        // stored source, but stop this projection before the suspect sentence.
        const compact = sentence.replace(/\s+/g,'');
        if (contiguous.some(previous=>{
          const earlier=previous.replace(/\s+/g,'');
          return earlier.length>=24 && compact.includes(earlier);
        })) break;
        if (size + sentence.length > MAX_ANSWER_CHARS) break;
        contiguous.push(sentence); size += sentence.length;
      }
      if (contiguous.length) return {
        present:true, projectionType:'DETERMINISTIC_EXTRACTIVE_GROUNDED_ANSWER',
        generativeModelUsed:false, locale, text:(source.causalExplanationAvailable===false&&/为什么|为何|原因/u.test(query)?(locale==='zh-Hans'?'以下来源说明了状态和用途，没有明确说明这一决定的原因。\n\n':'The source states the status and purpose, but does not explicitly explain the reason for this decision. '):'')+contiguous.join(locale==='zh-Hans'?'\n\n':' '),
        sourceReferences:[sourceId], authorityNotice:'Contiguous source prose; retrieval alone does not prove question fit.'
      };
    }
    for (const sentence of splitSentences(prose)) {
      if (/^…|…$/.test(sentence)) continue;
      const normalized = sentence.toLocaleLowerCase();
      let score = source.sourceType === 'PUBLISHED_CANONICAL_ARTICLE' ? 2 : 0;
      if(source.supportRange&&position<4)score+=100-position;
      for (const term of terms) if (normalized.includes(term)) score += term.length > 2 ? 3 : 1;
      if (/为什么|为何|怎样|如何|机制/.test(query) && /因为|因此|如果|只要|取决于|并不是|不只是/.test(sentence)) score += 3;
      candidates.push({ sentence, score, sourceId, position: position++ });
    }
  }
  candidates.sort((left, right) => right.score - left.score || left.sentence.length - right.sentence.length);
  const selected = []; const seen = new Set(); let characters = 0;
  for (const candidate of candidates) {
    const key = candidate.sentence.normalize('NFKC');
    if (seen.has(key) || candidate.score <= 0) continue;
    if (characters + candidate.sentence.length > MAX_ANSWER_CHARS) continue;
    seen.add(key); selected.push(candidate); characters += candidate.sentence.length;
    if (selected.length >= 4 || characters >= MAX_ANSWER_CHARS) break;
  }
  if (!selected.length) return null;
  return {
    present: true,
    projectionType: 'DETERMINISTIC_EXTRACTIVE_GROUNDED_ANSWER',
    generativeModelUsed: false,
    locale,
    text: selected.sort((a,b)=>a.sourceId.localeCompare(b.sourceId)||a.position-b.position).map(item => item.sentence).join(locale === 'zh-Hans' ? '\n\n' : ' '),
    sourceReferences: [...new Set(selected.map(item => item.sourceId))],
    authorityNotice: 'This answer is a question-scoped extractive projection from returned governed sources. It does not create Canonical Node or Published Article authority.'
  };
}

export async function handleKnowledgeAccessRequest(request, env = {}, options = {}) {
  if (request.method !== 'GET') return response({ ok: false, error: { code: 'METHOD_NOT_ALLOWED' } }, 405);
  const url = new URL(request.url);
  const query = (url.searchParams.get('q') || '').trim();
  const locale = url.searchParams.get('locale') || 'zh-Hans';
  const mode = url.searchParams.get('mode') || 'auto';
  const sourceMode = url.searchParams.get('source') || 'hybrid';
  const bookCode = url.searchParams.get('bookCode') || null;
  if (bookCode && !/^BOOK-[1-7]$/.test(bookCode)) return response({ ok: false, error: { code: 'BOOK_SCOPE_INVALID' } }, 400);
  if(bookCode==='BOOK-7'&&isBookViiManuscriptRequest('第七册 '+query))return response({ok:true,providerCalls:0,providerCostUSD:0,manuscript:{status:'protected_full_manuscript',records:[],errors:[]},groundedAnswer:null,answerGrounding:{allowed:false,sources:[]},answerBoundary:{state:'PROTECTED_SOURCE_REQUEST',rawFullBookAvailable:false}});
  if (!query || query.length > MAX_QUERY_LENGTH) return response({ ok: false, error: { code: 'QUERY_INVALID' } }, 400);
  if (!LOCALES.has(locale)) return response({ ok: false, error: { code: 'LOCALE_UNSUPPORTED' } }, 400);
  if (!MODES.has(mode)) return response({ ok: false, error: { code: 'MODE_UNSUPPORTED' } }, 400);
  if (!SOURCES.has(sourceMode)) return response({ ok: false, error: { code: 'SOURCE_MODE_UNSUPPORTED' } }, 400);

  let published = null;
  let manuscript = { status: 'not_requested', records: [], errors: [] };
  if (sourceMode !== 'manuscript') published = await publishedProjection({ request, env, query, locale, mode });
  if (sourceMode !== 'published') manuscript = await manuscriptProjection({ env, query, locale, bookCode,experimentAccess:env.PHIOS_ENVIRONMENT==='local'&&env.PHIOS_ISOLATED_OPERATOR===true?options.experimentAccess:null });

  const publishedCovered = published?.coverage?.level && published.coverage.level !== 'none';
  const manuscriptCovered = manuscript.records.length > 0;
  const coverage = publishedCovered && manuscriptCovered
    ? 'hybrid'
    : publishedCovered
      ? 'published'
      : manuscriptCovered
        ? 'manuscript'
        : 'none';

  if (sourceMode === 'manuscript' && manuscript.status === 'storage_unavailable') {
    return response({ ok: false, error: { code: 'MANUSCRIPT_SOURCE_STORAGE_UNAVAILABLE' } }, 503);
  }

  const atlas = await retrieveAtlasScope({env, scope:options.retrievalScope, locale, question:query});
  const answerGrounding = groundingFrom(published, manuscript);
  answerGrounding.sources = atlas.scope ? atlas.sources : [...atlas.sources, ...answerGrounding.sources];
  // Explicit Atlas selection cannot obtain its answer from unrelated canonical
  // nodes or relationship expansion when the selected object has no evidence.
  if(atlas.scope){published={...published,results:[]};manuscript={...manuscript,records:[]};}
  answerGrounding.allowed = answerGrounding.sources.length > 0;
  const requiresComparativeUnit = sourceMode === 'manuscript' && /区别|比较|关联|之间.*关系|compare|difference|relationship between/i.test(query);
  const predictionCertainty = /肯定|保证|一定|确定|必然|必定|guarantee|certainly|definitely|with certainty/i.test(query) && !/不能保证|无法保证|不保证|不能确定|无法确定|不确定|不一定|未必|cannot guarantee|can.t guarantee|not guaranteed|not certain/i.test(query);
  const personalGuaranteedOutcome=/(?:我|我的|我们|my|i\b).*(?:成功|失败|获利|康复|success|fail|profit|recover)/i.test(query);
  const unsupportedPrediction = predictionCertainty && (personalGuaranteedOutcome || /明[天年]|将来|未来|下(?:周|星期|个?月|年)|tomorrow|future|next\s+(?:week|month|year)/i.test(query));
  const ambiguous = manuscriptQueryTerms(query).length === 0;
  // A comparison is not ambiguous merely because it asks for a distinction.
  // Only admit one when the retrieved prose itself states a contrast.
  const compared = query.match(/^(.+?)与(.+?)(?:有什么区别|有何区别|的区别|区别|之间)/) || query.match(/^(.+?)和(.+?)(?:有什么区别|有何区别|的区别|区别|之间)/);
  const comparisonTerms = compared ? [compared[1],compared[2]].map(x=>x.replace(/^(?:请问|普通|一般|第[一二三四五六七八九十\d]+册(?:中|里|的)?)/,'').replace(/的(?:时间|关注点|条件)(?:和|与|、)(?:时间|关注点|条件)$/u,'').replace(/的$/u,'').trim()) : [];
  // A contrast may be explicitly stated in the chapter body. Require both
  // subjects and the distinguishing predicate in the same bounded passage;
  // a title match or two scattered mentions are not a comparison authority.
  const comparisonSupported = requiresComparativeUnit && comparisonTerms.length===2 && answerGrounding.sources.some(s=>{const prose=String(s.text||'').replace(/([\u3400-\u9fff])\s+(?=[\u3400-\u9fff])/g,'$1');const subjects=s.selectedArgumentUnit?.comparisonSubjects;if(s.sourceScopeAdmissionDigest&&subjects?.length===2&&subjects.every(subject=>prose.includes(subject.sourceLabel))&&comparisonTerms.every(term=>subjects.some(subject=>[subject.sourceLabel,...(subject.aliases||[])].includes(term))))return true;for(let i=0;i<prose.length;i+=100){const passage=prose.slice(i,i+500);if(comparisonTerms.every(term=>passage.includes(term))&&/区别|差异|不同|并不是|不是.*而是|前者|后者|更宽|更深/.test(passage))return true;}return false;});
  const answerSources=bookCode&&sourceMode==='manuscript'?{...answerGrounding,sources:answerGrounding.sources.slice(0,1)}:answerGrounding;
  const definitionSubject=locale==='zh-Hans'?query.replace(/^第[一二三四五六七八九十\d]+册(?:中|里|的)?/u,'').match(/^(?:请问|什么是)?([^，。？！?]{2,20}?)(?:是什么|是什么意思|指什么)[？?]?$/u)?.[1]:null;
  const definitionSupported=!definitionSubject||answerSources.sources.some(s=>s.selectedArgumentUnit||new RegExp(definitionSubject.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')+'(?:是|指|并不是|并不只是|不只是)','u').test(manuscriptAnswerProse(s.text,s.heading).replace(/\s+/gu,'')));
  const groundedAnswer = (requiresComparativeUnit && !comparisonSupported) || unsupportedPrediction || ambiguous || !definitionSupported ? null : deterministicGroundedAnswer(query, answerSources, locale);
  answerGrounding.generatedAnswerPresent = Boolean(groundedAnswer);

  return response({
    ok: true,
    providerCalls: 0,
    providerCostUSD: 0,
    retrievalAssessment: { retrievedContent: manuscriptCovered || Boolean(publishedCovered), correctBookScope: !bookCode || manuscript.records.every(record => record.bookCode === bookCode) },
    answerAssessment: { state: unsupportedPrediction ? 'UNSUPPORTED_PREDICTION' : ambiguous ? 'NEEDS_CLARIFICATION' : requiresComparativeUnit && !comparisonSupported ? 'COMPARATIVE_EXPLANATION_UNIT_REQUIRED' : groundedAnswer ? 'EXTRACTIVE_CANDIDATE_REQUIRES_QUESTION_FIT_VALIDATION' : 'NO_SUPPORTED_ANSWER', retrievalDoesNotProveAnswer: true },
    query: { text: query, locale, mode, source: sourceMode },
    coverage: {
      level: coverage,
      published: published?.coverage?.level || 'not_requested',
      manuscript: manuscript.status,
      answerGroundingAllowed: publishedCovered || manuscriptCovered
    },
    groundedAnswer,
    published,
    manuscript: {
      status: manuscript.status,
      records: manuscript.records,
      errors: manuscript.errors,
      exposure: {
        rawFullBookAvailable: false,
        rawSectionBodyAvailable: false,
        maximumExcerptCharsPerResult: MANUSCRIPT_SOURCE_LIMITS.maximumExcerptCharsPerResult,
        maximumTotalExcerptChars: MANUSCRIPT_SOURCE_LIMITS.maximumTotalExcerptChars
      }
    },
    retrievalScope: atlas.scope,
    retrievalChain: atlas.chain,
    answerGrounding,
    authorityBoundary: {
      publishedArticleAuthorityUnchanged: true,
      completedManuscriptIsValidKnowledgeSource: true,
      activeManuscriptCorpusIsHumanReviewed: true,
      sourceNativeSectionMayAnswerWithoutCanonicalNodeClaim: true,
      pendingCanonicalBindingIsNotCanonicalAuthority: true,
      bookPurchaseAndKnowledgeQueryAreSeparateCapabilities: true
    }
  });
}
