import crypto from 'node:crypto';
import { computeFinalPackageDigest, verifyFinalPackageDigest, stableSerialize } from './bfa-package-v1.mjs';

export const FIGURE_STATES = Object.freeze(['FIGURE_NOT_REQUIRED','FIGURE_REQUIRED_PENDING','FIGURE_CANDIDATE_READY','FIGURE_APPROVED','FIGURE_PUBLICATION_READY']);
export const FINAL_DECISIONS = Object.freeze(['approve_for_publication','revise','defer','do_not_publish']);
export const STATUS_ORDER = Object.freeze({ PASS: 0, WARNING: 1, BLOCKED: 2 });
export const sha256 = value => crypto.createHash('sha256').update(typeof value === 'string' ? value : stableSerialize(value), 'utf8').digest('hex');
const normalize = value => String(value ?? '').normalize('NFKC').toLowerCase().replace(/\s+/g,' ').trim();
const han = /[\u3400-\u9fff]/u;
const statusMax = values => values.reduce((a,b)=>STATUS_ORDER[b]>STATUS_ORDER[a]?b:a,'PASS');

export function projectPjaBrief(brief, { locale = brief?.locale ?? 'zh-Hans', figureRequirement = null } = {}) {
  const boundary = brief?.articleBoundary ?? {};
  const meaning = brief?.canonicalMeaning ?? {};
  const terms = brief?.terminologyProjection?.terms ?? [];
  return {
    projectionType: 'BFA_PJA_BRIEF_HUMAN_REVIEW_PROJECTION',
    nodeCode: brief?.nodeCode ?? null,
    locale,
    sourceBriefCode: brief?.briefCode ?? null,
    sourceDigest: brief?.briefDigest ?? sha256(brief ?? {}),
    canonicalQuestion: meaning.canonicalQuestion ?? null,
    canonicalTitle: meaning.canonicalTitle ?? null,
    canonicalMeaning: meaning.centralThesis ?? null,
    requiredCoverage: (boundary.mustEstablish ?? []).map(x => typeof x === 'string' ? x : x.requirement).filter(Boolean),
    requiredDistinctions: boundary.requiredDistinctions ?? [],
    mustPreserve: boundary.includedScope ?? [],
    mustNotClaim: boundary.mustNotClaim ?? [],
    terminology: terms.map(t => ({ termCode:t.termCode, zhHans:t['zh-Hans'], en:t.en, translationLock:!!t.translationLock })),
    evidenceScope: brief?.sourceSnapshot?.inputFiles ?? [],
    figureRequirement,
    localeRequirement: { locale, independentAuthoring:true, sameCanonicalMeaning:true, translationInheritanceAllowed:false },
    authority: { mode:'projection_only', mayCreateMeaning:false, mayApprove:false }
  };
}

export function buildFigureAuthoringBrief(projection, { localePolicy = 'SAME_VISUAL_CANONICAL_MEANING_LOCALE_SAFE_TEXT', surface = 'WEBSITE', aspectRatio = '16:9', placement = 'After the first section where the represented relationship is introduced.' } = {}) {
  const concepts = [...new Set([
    ...(projection?.terminology ?? []).flatMap(t => [t.zhHans, t.en]).filter(Boolean),
    ...(projection?.requiredCoverage ?? []).flatMap(x => String(x).split(/[,:;，；]/)).map(x => x.trim()).filter(Boolean)
  ])].slice(0, 24);
  const brief = {
    briefType: 'BFA_FIGURE_PRODUCTION_BRIEF_PROJECTION',
    authority: 'PJA_CAR_INTERFACE_PROJECTION_ONLY',
    nodeCode: projection?.nodeCode ?? null,
    figurePurpose: projection?.canonicalMeaning ? `Visually clarify the bounded canonical relationship: ${projection.canonicalMeaning}` : 'Visually clarify the required canonical relationships without creating new meaning.',
    canonicalConceptsRepresented: concepts,
    requiredRelationships: projection?.requiredDistinctions ?? [],
    mustShow: (projection?.requiredCoverage ?? []).slice(0, 16),
    mustNotImply: projection?.mustNotClaim ?? [],
    visualHierarchy: 'Primary canonical relationship first; supporting distinctions second; no decorative element may imply additional authority.',
    textPolicy: 'Prefer locale-neutral visual structure. Any embedded text must be governed by the locale policy and must not alter Canonical Meaning.',
    localePolicy,
    altIntent: projection?.canonicalMeaning ?? projection?.canonicalQuestion ?? 'Describe the canonical relationship shown by the figure.',
    recommendedPlacement: placement,
    aspectRatio,
    surface
  };
  return { ...brief, sourceDigest: sha256(brief) };
}

export function buildAuthoringPrompt(projection, locale) {
  const text = [
    `Produce a ${locale} article Candidate for ${projection.nodeCode}.`,
    `Canonical question: ${projection.canonicalQuestion ?? ''}`,
    `Canonical meaning: ${projection.canonicalMeaning ?? ''}`,
    `Required coverage:\n- ${(projection.requiredCoverage ?? []).join('\n- ')}`,
    `Required distinctions:\n- ${(projection.requiredDistinctions ?? []).join('\n- ')}`,
    `Must not claim:\n- ${(projection.mustNotClaim ?? []).join('\n- ')}`,
    `Required terminology: ${(projection.terminology ?? []).map(t => locale==='en'?t.en:t.zhHans).filter(Boolean).join(', ')}`,
    'Return title, summary and bodyMarkdown. Candidate production is not Human approval.'
  ].join('\n\n');
  return { prompt: text, promptDigest: sha256(text) };
}

function phraseCovered(body, phrase) {
  const b = normalize(body); const p = normalize(phrase);
  if (!p) return true;
  const tokens = p.replace(/[≠=]/g,' ').split(/[^\p{L}\p{N}]+/u).filter(x=>x.length>=3);
  if (!tokens.length) return b.includes(p);
  return tokens.filter(t=>b.includes(t)).length >= Math.max(1, Math.ceil(tokens.length * 0.45));
}

export function runAutomaticPreflight({ projection, candidate, locale, sameRouteIdentity, figure, presentationPreview }) {
  const checks = [];
  const add = (code, status, detail='') => checks.push({ code, status, detail });
  const article = candidate?.article ?? candidate ?? {};
  const body = String(article.bodyMarkdown ?? '');
  const title = String(article.title ?? '');
  const summary = String(article.summary ?? '');
  add('CANDIDATE_INTEGRITY', candidate && title && body ? 'PASS':'BLOCKED', candidate ? 'candidate present':'candidate missing');
  add('CANONICAL_BINDING', candidate?.nodeCode === projection?.nodeCode ? 'PASS':'BLOCKED');
  add('BRIEF_DIGEST_BINDING', candidate?.sourceBrief?.briefDigest === projection?.sourceDigest || candidate?.briefDigest === projection?.sourceDigest ? 'PASS':'BLOCKED');
  add('PROMPT_BINDING', candidate?.promptDigest || candidate?.provenance?.promptDigest ? 'PASS':'WARNING','legacy/imported Candidates may not expose promptDigest');
  const coverageMiss = (projection?.requiredCoverage ?? []).filter(r=>!phraseCovered(body,r));
  add('REQUIRED_CONCEPT_COVERAGE', coverageMiss.length ? 'BLOCKED':'PASS', coverageMiss.join(' | '));
  const distinctionMiss = (projection?.requiredDistinctions ?? []).filter(r=>!phraseCovered(body,r));
  add('REQUIRED_DISTINCTION_COVERAGE', distinctionMiss.length ? 'BLOCKED':'PASS', distinctionMiss.join(' | '));
  const mustNotHits = (projection?.mustNotClaim ?? []).filter(r=>normalize(r).length>8 && normalize(body).includes(normalize(r)));
  add('MUST_NOT_CLAIM_SCAN', mustNotHits.length ? 'BLOCKED':'PASS', mustNotHits.join(' | '));
  const requiredTerms = (projection?.terminology ?? []).map(t=>locale==='en'?t.en:t.zhHans).filter(Boolean);
  const termMiss = requiredTerms.filter(t=>!normalize(body).includes(normalize(t)));
  add('TERMINOLOGY_COMPLIANCE', termMiss.length ? 'WARNING':'PASS', termMiss.join(', '));
  add('CJK_LEAKAGE', locale==='en' && han.test(`${title}\n${summary}\n${body}`) ? 'BLOCKED':'PASS');
  add('LOCALE_VALIDITY', ['zh-Hans','en'].includes(locale) ? 'PASS':'BLOCKED');
  add('TITLE_EDITORIAL_QUALITY', title.length < 8 || title.length > 150 ? 'WARNING':'PASS');
  add('TITLE_IDENTITY_BINDING', title ? 'PASS':'BLOCKED');
  add('SAME_ROUTE_INTEGRITY', sameRouteIdentity?.canonicalRoute && sameRouteIdentity?.locales?.includes('zh-Hans') && sameRouteIdentity?.locales?.includes('en') ? 'PASS':'BLOCKED');
  add('DUPLICATE_CONTENT', normalize(body) && normalize(body)===normalize(summary) ? 'WARNING':'PASS');
  add('BROKEN_STRUCTURE', body.length < 120 ? 'BLOCKED':'PASS');
  add('MISSING_SUMMARY', summary ? 'PASS':'BLOCKED');
  const hasHeadings = /^#{1,3}\s+/m.test(body) || (candidate?.article?.sectionHeadings?.length ?? candidate?.sectionHeadings?.length ?? 0) > 0;
  add('MISSING_HEADINGS', hasHeadings ? 'PASS':'WARNING');
  const figureReady = figure?.state === 'FIGURE_NOT_REQUIRED' ? !!figure.reason : figure?.state === 'FIGURE_PUBLICATION_READY';
  add('FIGURE_READINESS', figureReady ? 'PASS':'BLOCKED', figure?.state ?? 'missing');
  const presentationReady=!!presentationPreview?.sourceDigest;
  add('PRESENTATION_READINESS', presentationReady ? 'PASS':'BLOCKED');
  add('PUBLICATION_READINESS', title && summary && body && figureReady && presentationReady ? 'PASS':'BLOCKED', 'Candidate-level preflight only; Final Package readiness remains BFA-W24 aggregation.');
  const status = statusMax(checks.map(x=>x.status));
  const evidence = { schemaVersion:'PHI-OS-BFA-AUTOMATIC-REVIEW-EVIDENCE-v1.0.0', nodeCode:projection?.nodeCode, locale, status, checks, authority:{ evidenceOnly:true, humanAcceptance:false } };
  evidence.sourceDigest = sha256(evidence);
  return evidence;
}

export function compareCanonicalMeaningCoverage(projection, zhEvidence, enEvidence) {
  const req = [...(projection.requiredCoverage??[]), ...(projection.requiredDistinctions??[])];
  const byCode = e => new Map((e?.checks??[]).map(x=>[x.code,x]));
  const z=byCode(zhEvidence), e=byCode(enEvidence);
  return { comparisonType:'CANONICAL_MEANING_COVERAGE_NOT_LITERAL_TRANSLATION_DIFF', requirements:req.map(requirement=>({ requirement, zhHans:z.get('REQUIRED_CONCEPT_COVERAGE')?.status!=='BLOCKED' && z.get('REQUIRED_DISTINCTION_COVERAGE')?.status!=='BLOCKED', en:e.get('REQUIRED_CONCEPT_COVERAGE')?.status!=='BLOCKED' && e.get('REQUIRED_DISTINCTION_COVERAGE')?.status!=='BLOCKED' })) };
}

export function validateFigureRequirement(figure) {
  const errors=[];
  if (!figure || !FIGURE_STATES.includes(figure.state)) errors.push('FIGURE_STATE_REQUIRED');
  if (figure?.state==='FIGURE_NOT_REQUIRED' && !String(figure.reason??'').trim()) errors.push('FIGURE_NOT_REQUIRED_REASON_REQUIRED');
  if (figure?.state==='FIGURE_PUBLICATION_READY' && !figure?.car?.publishedAssetDigest && !figure?.fixtureOnly) errors.push('CAR_PUBLISHED_ASSET_DIGEST_REQUIRED');
  return { valid:!errors.length, errors };
}

export function computePublicationReadiness({ canonicalAuthority, locales, meaningCoverage, localeIdentity, figure, presentationPreview, accessibility, blockers=[] }) {
  const localReady = ['zh-Hans','en'].every(l=>!!locales?.[l]?.candidateDigest);
  const figureCheck=validateFigureRequirement(figure);
  const figureReady=figureCheck.valid && (figure.state==='FIGURE_NOT_REQUIRED'||figure.state==='FIGURE_PUBLICATION_READY');
  const meaningPass = meaningCoverage?.requirements?.every(x=>x.zhHans&&x.en) ?? false;
  const ready=!!canonicalAuthority?.sourceDigest && localReady && meaningPass && !!localeIdentity?.sourceDigest && figureReady && !!presentationPreview?.sourceDigest && accessibility?.status==='PASS' && blockers.length===0;
  const record={ state:ready?'READY_FOR_FINAL_APPROVAL':'BLOCKED_FROM_FINAL_APPROVAL', canonicalAuthorityReady:!!canonicalAuthority?.sourceDigest, bilingualCandidatesReady:localReady, bilingualMeaningCoveragePass:meaningPass, localeIdentitiesReady:!!localeIdentity?.sourceDigest, figureReady, cprPreviewReady:!!presentationPreview?.sourceDigest, accessibilityPass:accessibility?.status==='PASS', blockers:[...blockers,...figureCheck.errors] };
  record.sourceDigest=sha256(record); return record;
}

export function createFinalApproval(packageRecord, decision, { reviewerCode='TL', decidedAt=new Date().toISOString(), summary, warningAcknowledgements=[] }={}) {
  if (!FINAL_DECISIONS.includes(decision)) throw new Error(`BFA_INVALID_DECISION:${decision}`);
  if (reviewerCode!=='TL') throw new Error('BFA_REVIEWER_MUST_BE_TL');
  if (!verifyFinalPackageDigest(packageRecord)) throw new Error('BFA_PACKAGE_DIGEST_INVALID_OR_STALE');
  if (decision==='approve_for_publication' && packageRecord?.publicationReadiness?.state!=='READY_FOR_FINAL_APPROVAL') throw new Error('BFA_PACKAGE_NOT_READY_FOR_FINAL_APPROVAL');
  if (decision==='approve_for_publication' && packageRecord?.automaticEvidence?.status==='WARNING' && !(warningAcknowledgements?.length)) throw new Error('BFA_WARNING_ACKNOWLEDGEMENT_REQUIRED');
  const payload={ authorityType:'BILINGUAL_FINAL_PUBLICATION_APPROVAL', batchCode:packageRecord.batchCode, nodeCode:packageRecord.nodeCode, finalPackageDigest:packageRecord.finalPackageDigest, decision, reviewerCode, decidedAt, summary:summary||`TL final decision for ${packageRecord.packageCode}: ${decision}.`, warningAcknowledgements };
  return {...payload,authorityDigest:sha256(payload)};
}

export function buildAuthorityBridge(approval) {
  if (approval?.authorityType!=='BILINGUAL_FINAL_PUBLICATION_APPROVAL'||approval?.reviewerCode!=='TL') throw new Error('BFA_SOURCE_APPROVAL_REQUIRED');
  const common={sourceAuthorityType:approval.authorityType,sourceAuthorityDigest:approval.authorityDigest,finalPackageDigest:approval.finalPackageDigest,nodeCode:approval.nodeCode,batchCode:approval.batchCode,transitionIsHumanEvidence:false};
  return {
    schemaVersion:'PHI-OS-BFA-AUTHORITY-BRIDGE-v1.0.0',
    sourceAuthorityDigest:approval.authorityDigest,
    transitions: approval.decision==='approve_for_publication' ? [
      {...common, transitionType:'SATISFIES_PJA_FINAL_EDITORIAL_GATE'},
      {...common, transitionType:'SATISFIES_PUBLICATION_APPROVAL_GATE'},
      {...common, transitionType:'AUTHORIZES_PUBLICATION_EXECUTION'}
    ] : []
  };
}

export function approvalIsCurrent(approval, packageRecord) {
  return approval?.authorityType==='BILINGUAL_FINAL_PUBLICATION_APPROVAL' && approval?.reviewerCode==='TL' && approval?.batchCode===packageRecord?.batchCode && approval?.nodeCode===packageRecord?.nodeCode && approval?.finalPackageDigest===computeFinalPackageDigest(packageRecord) && verifyFinalPackageDigest(packageRecord);
}

export function decisionDisplayState({ packageRecord, approval }) {
  if (approval && !approvalIsCurrent(approval, packageRecord)) return 'STALE_REVIEW_REQUIRED';
  if (approval?.decision==='approve_for_publication') return 'APPROVED';
  if (approval?.decision==='defer') return 'DEFERRED';
  if (approval?.decision==='revise') return 'REVISION';
  if (approval?.decision==='do_not_publish') return 'DO_NOT_PUBLISH';
  if (packageRecord?.publicationReadiness?.state!=='READY_FOR_FINAL_APPROVAL') return 'BLOCKED';
  return 'PENDING';
}

export function dashboardSummary(entries) {
  const count = key => entries.filter(key).length;
  return { nodes:entries.length, localeCandidates:entries.length*2, articleReady:count(x=>x.package?.locales?.['zh-Hans']?.candidateDigest&&x.package?.locales?.en?.candidateDigest), figureReady:count(x=>['FIGURE_NOT_REQUIRED','FIGURE_PUBLICATION_READY'].includes(x.package?.figure?.state)), warnings:count(x=>x.package?.automaticEvidence?.status==='WARNING'), blocked:count(x=>x.package?.publicationReadiness?.state!=='READY_FOR_FINAL_APPROVAL'), finalApproved:count(x=>x.decisionState==='APPROVED'), pending:count(x=>x.decisionState==='PENDING'), deferred:count(x=>x.decisionState==='DEFERRED'), published:count(x=>x.published===true) };
}
