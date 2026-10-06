// Book VII adds evidence boundaries to the existing composer; no I/O or authority mutation.
export const KNOWLEDGE_STATES = Object.freeze(['KNOWN','RECONSTRUCTED','PROJECTED','CONTESTED','UNKNOWN']);
export const OBSERVATION_TIME_CLASSES = Object.freeze(['CURRENT','LONGITUDINAL','STRUCTURAL']);
export const UNKNOWN_REASONS = Object.freeze(['INSUFFICIENT_EVIDENCE','LOW_RESOLUTION','TIME_WINDOW_TOO_SHORT','SOURCE_CONFLICT','CONTESTED','MODEL_BLIND_SPOT','IRREDUCIBLE_UNCERTAINTY']);
export const CLAIM_AUTHORITIES = Object.freeze({POLICY_FACT:['POLICY_ISSUER'],OFFICIAL_STATISTIC:['STATISTICAL_AGENCY'],COMPANY_FINANCIAL_FACT:['AUDITED_FILING','REGULATORY_FILING'],MARKET_REACTION:['MARKET_DATA'],LONGITUDINAL_PATTERN:['REPEATED_EVIDENCE'],STRUCTURAL_RECONFIGURATION:['RELATION_CARRIER_ROUTING_CONSTRAINT_EVIDENCE'],HISTORICAL_RECONSTRUCTION:['HISTORICAL_ARCHIVE'],FUTURE_PROJECTION:['CONDITIONAL_MODEL'],LIVED_EXPERIENCE:['FIRST_PERSON_ACCOUNT']});
export function evaluateClaimAuthorityMatch({claimType,authorityType}={}) { return {claimType,authorityType,matched:(CLAIM_AUTHORITIES[claimType]||[]).includes(authorityType),globalSourceRanking:false}; }
export function isBookViiManuscriptRequest(question='') {
  const q=String(question).normalize('NFKC');
  return /世界如何被观察|book\s*(?:vii|7)|第七册/i.test(q) && /页|pages?|全文|完整|pdf|下载|手稿|manuscript|full\s*(?:text|source)/i.test(q);
}
const validSource=s=>s?.bookId==='BOOK-7' && s.sourceType==='PUBLISHED_CANONICAL_ARTICLE' && s.publicationStatus==='PUBLISHED' && /^KN-B7-14-\d{3}$/.test(s.nodeCode||'') && Number(s.nodeCode.slice(-3))>=1 && Number(s.nodeCode.slice(-3))<=100 && s.authorityOwner==='BOOK_VII_OBSERVATION_SCIENCE' && typeof s.text==='string' && s.text.trim() && s.epistemicEvidence;
export function excludeProtectedBookViiSources(bundle={}) {
  const original=bundle.sources||[];
  const sources=original.filter(s=>{
    const bookVii=s.bookId==='BOOK-7'||s.bookCode==='BOOK-7'||/^KN-B7-/.test(s.nodeCode||'');
    if(!bookVii) return true;
    return s.publicationStatus==='PUBLISHED' && (s.sourceType==='PUBLISHED_CANONICAL_ARTICLE'||(s.sourceType==='REGISTERED_FIGURE_SEMANTICS'&&s.canonicalProseAuthority===false&&s.ocrAuthority===false));
  });
  return {...bundle,sources,bookViiProtectedSourceRejected:bundle.bookViiProtectedSourceRejected===true||sources.length!==original.length};
}
const cleanText=t=>typeof t==='string' && !/https?:\/\/|r2ObjectKey|objectKey|private\/|signedUrl/i.test(t) ? t.trim() : '';
function supportedReadings(e={}) { return (e.readings||[]).filter(r=>cleanText(r.text)&&r.material===true&&r.highQuality===true&&Array.isArray(r.evidenceRefs)&&r.evidenceRefs.length>0&&r.evidenceRefs.every(ref=>(e.evidenceRefs||[]).includes(ref))); }
export function deriveKnowledgeState(e={}) {
  if(e.future===true) return 'PROJECTED';
  const readings=supportedReadings(e);
  if(readings.length>1 && (e.discriminated!==true||!readings.some(r=>r.id===e.primaryReadingId))) return 'CONTESTED';
  if(e.claimType && !evaluateClaimAuthorityMatch(e).matched) return 'UNKNOWN';
  if(e.sufficient!==true || !Array.isArray(e.evidenceRefs) || !e.evidenceRefs.length) return 'UNKNOWN';
  if(e.pastInferred===true) return 'RECONSTRUCTED';
  return e.observedRealized===true ? 'KNOWN' : 'UNKNOWN';
}
export function deriveObservationTimeClass(e={}) {
  if(e.repeatedEvidence===true && e.distinctTimeWindows>=2 && e.structuralChangeEvidence===true && ['relation','carrier','routing','constraint'].some(k=>(e.changedDimensions||[]).includes(k))) return 'STRUCTURAL';
  return e.repeatedEvidence===true && e.distinctTimeWindows>=2 ? 'LONGITUDINAL' : 'CURRENT';
}
export function derivePrimaryReading(e={}) {
  const readings=supportedReadings(e);
  if(readings.length>1 && (e.discriminated!==true||!readings.some(r=>r.id===e.primaryReadingId))) return '';
  return cleanText(readings.find(r=>r.id===e.primaryReadingId)?.text || (readings.length===1?readings[0].text:''));
}
export function deriveAlternativeReadings(e={}) { const primary=derivePrimaryReading(e); return supportedReadings(e).map(r=>cleanText(r.text)).filter(t=>t!==primary); }
export function deriveUnknownBoundary(e={}) { return [...new Set([...(e.unknownReasons||[]).filter(r=>UNKNOWN_REASONS.includes(r)),...(deriveKnowledgeState(e)==='UNKNOWN'?['INSUFFICIENT_EVIDENCE']:[]),...(deriveKnowledgeState(e)==='CONTESTED'?['CONTESTED']:[])])]; }
export function deriveConfidenceBoundary(e={},locale='zh-Hans') {
  const state=deriveKnowledgeState(e);
  return locale==='zh-Hans' ? `${state}：证据只支持其适用范围；投影不是事实，模型不是现实，现实保留最终纠正权。` : `${state}: Evidence supports only its scope; projection is not fact, model is not reality, and reality retains final correction authority.`;
}
export function deriveEpistemicReading(bundle={},coverage={}) {
  if(coverage.answerCompositionEligible!==true||isBookViiManuscriptRequest(bundle.question?.text)) return null;
  const sources=(bundle.sources||[]).filter(validSource);
  if(!sources.length) return null;
  // Evidence describes the scoped claim, not the general epistemology article itself.
  const records=sources.map(s=>s.epistemicEvidence);
  const first=records[0];
  const readings=[...new Map(records.flatMap(e=>e.readings||[]).map(r=>[r.text,r])).values()];
  const e={...first,readings,evidenceRefs:[...new Set(records.flatMap(e=>e.evidenceRefs||[]))],unknownReasons:[...new Set(records.flatMap(e=>e.unknownReasons||[]))],counterEvidence:records.flatMap(e=>e.counterEvidence||[]),future:records.some(e=>e.future===true),sufficient:records.every(e=>e.sufficient===true),discriminated:records.every(e=>e.discriminated===true)};
  const refs=new Set(sources.flatMap(s=>s.epistemicEvidence.evidenceRefs||[]));
  if((e.evidenceRefs||[]).some(ref=>!refs.has(ref))) return null;
  return {knowledgeState:deriveKnowledgeState(e),observationTimeClass:deriveObservationTimeClass(e),primaryReading:derivePrimaryReading(e),alternativeReadings:deriveAlternativeReadings(e),counterEvidence:(e.counterEvidence||[]).filter(c=>c.evidenceRef&&refs.has(c.evidenceRef)).map(c=>cleanText(c.text)).filter(Boolean),confidenceBoundary:deriveConfidenceBoundary(e,bundle.question?.locale),unknownBoundary:deriveUnknownBoundary(e)};
}
export function reconcileEpistemicGuidedStop(existing,reading) {
  if(!reading||existing?.status==='REALITY_MODEL_REQUIRED') return existing;
  const status=reading.unknownBoundary.includes('TIME_WINDOW_TOO_SHORT')?'TIME_WINDOW_INSUFFICIENT':reading.knowledgeState==='CONTESTED'?'CONTESTED_READING':reading.knowledgeState==='UNKNOWN'?'STOP_AT_UNKNOWN':reading.alternativeReadings.length?'ALTERNATIVE_READING_ACTIVE':null;
  return status ? {...existing,status,automaticEscalation:false,requiresExplicitEscalationConsent:false} : existing;
}
