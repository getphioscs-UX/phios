import { runAskPhiosPipeline, normalizeAnswerDepth } from '../_lib/knowledge-answer-composition.js';
import {
  classifyCkaFollowUpBoundary,
  composeCkaRetrievalQuestion,
  createCkaFollowUpContext,
  normalizeCkaEntryContext,
  projectCkaClientAnswer
} from '../_lib/client-knowledge-ask.js';

const JSON_HEADERS = Object.freeze({
  'content-type': 'application/json; charset=utf-8',
  'cache-control': 'no-store'
});

function json(body, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: JSON_HEADERS });
}

function requestInput(url) {
  const q = String(url.searchParams.get('q') || '').trim();
  const locale = String(url.searchParams.get('locale') || 'zh-Hans').trim();
  const depth = normalizeAnswerDepth(url.searchParams.get('depth') || 'STANDARD');
  const source = String(url.searchParams.get('source') || 'hybrid').trim();
  if (!q) throw new Error('KAP_QUESTION_INVALID');
  const entryContext = normalizeCkaEntryContext({
    entrySurface: url.searchParams.get('entrySurface'),
    entryRoute: url.searchParams.get('entryRoute'),
    contextType: url.searchParams.get('contextType'),
    contextId: url.searchParams.get('contextId'),
    bookCode: url.searchParams.get('bookCode'),
    partCode: url.searchParams.get('partCode'),
    articleCode: url.searchParams.get('articleCode'),
    figureCode: url.searchParams.get('figureCode'),
    realityCaseId: url.searchParams.get('realityCaseId'),
    accountState: 'GUEST',
    locale,
    mode: url.searchParams.get('mode'),
    permission: false,
    privacy: false,
    entitlement: false
  });
  const followUpContext = createCkaFollowUpContext({
    currentQuestion: q,
    contextQuestion: url.searchParams.get('contextQuestion'),
    parentAnswerId: url.searchParams.get('parentAnswerId'),
    groundingBundleId: url.searchParams.get('groundingBundleId'),
    followUpDepth: url.searchParams.get('followUpDepth'),
    accountState: 'GUEST'
  });
  const followUpBoundary = classifyCkaFollowUpBoundary(q);
  if (!followUpBoundary.simpleAskAllowed) throw new Error('CKA_NOT_SIMPLE_ASK');
  return { q, locale, depth, source, entryContext, followUpContext, followUpBoundary };
}

export async function onRequestGet(context) {
  try {
    const url = new URL(context.request.url);
    const input = requestInput(url);
    const retrievalQuestion = composeCkaRetrievalQuestion(input.followUpContext);
    const result = await runAskPhiosPipeline({
      input: {
        question: retrievalQuestion,
        locale: input.locale,
        surfaceContext: {
          surfaceType: 'ASK_PHIOS',
          articleSlug: input.entryContext.articleCode || undefined,
          bookCode: input.entryContext.bookCode || undefined
        }
      },
      request: context.request,
      env: context.env || {},
      depth: input.depth,
      retrievalOptions: { source: input.source, mode: 'auto' }
    });
    const clientAnswer = projectCkaClientAnswer(result, {
      entryContext: input.entryContext,
      followUpContext: input.followUpContext,
      displayQuestion: input.q
    });
    return json({
      ok: true,
      ...result,
      cka: {
        schemaVersion: 'PHI-OS-CKA-RESPONSE-v1.0.0',
        entryContext: input.entryContext,
        followUp: {
          ...input.followUpContext,
          boundary: input.followUpBoundary,
          guestLimitReached: input.followUpContext.followUpDepth >= 1
        },
        clientAnswer,
        governance: {
          clientSurfaceOnly: true,
          upstreamAnswerRuntimeReused: true,
          secondAnswerRuntimeCreated: false,
          persistentHistoryCreated: false,
          shadowAccountCreated: false
        }
      }
    });
  } catch (error) {
    const code = String(error?.message || 'KAP_ASK_PHIOS_FAILED');
    const status = code === 'CKA_REALITY_CONTEXT_NOT_AUTHORIZED' ? 403
      : code === 'CKA_GUEST_FOLLOW_UP_LIMIT_REACHED' ? 429
        : code.startsWith('CKA_') || code === 'KAP_QUESTION_INVALID' || code === 'KAP_LOCALE_UNSUPPORTED' || code === 'KAP_ANSWER_DEPTH_UNSUPPORTED' ? 400
          : 500;
    return json({
      ok: false,
      error: { code },
      governance: {
        canonicalAuthorityCreated: false,
        publicationCreated: false,
        realityReadingCreated: false,
        persistentCaseCreated: false,
        shadowAccountCreated: false,
        methodExecuted: false,
        realityJourneyStarted: false
      }
    }, status);
  }
}
