import { runAskPhiosPipeline, normalizeAnswerDepth } from '../_lib/knowledge-answer-composition.js';
import {
  classifyCkaFollowUpBoundary,
  composeCkaRetrievalQuestion,
  createCkaFollowUpContext,
  normalizeCkaEntryContext,
  projectCkaClientAnswer
} from '../_lib/client-knowledge-ask.js';
import {
  composeCkaContextualRetrievalQuestion,
  composeCkaGuidedRetrievalQuestion,
  normalizeCkaGuidedContext,
  normalizeCkaKnowledgeContext,
  projectCkaW5W17Envelope
} from '../_lib/client-knowledge-ask-b.js';
import {
  assertCkaRealityContextAuthorization,
  composeCkaRealityAwareRetrievalQuestion,
  normalizeTrustedCkaAccess,
  projectCkaW18W33Consumption
} from '../_lib/client-knowledge-ask-c.js';

const JSON_HEADERS = Object.freeze({
  'content-type': 'application/json; charset=utf-8',
  'cache-control': 'no-store',
  'referrer-policy': 'no-referrer'
});

function json(body, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: JSON_HEADERS });
}

const object = value => value && typeof value === 'object' && !Array.isArray(value) ? value : {};
const text = value => String(value ?? '').trim();
// Frozen CKA-W4 compatibility assertion: accountState: 'GUEST' is still the fail-closed default when no trusted account provider is present.

function buildInput(payload, context) {
  const body = object(payload);
  const rawEntry = object(body.entryContext);
  const rawFollowUp = object(body.followUpContext);
  const rawGuided = object(body.guidedContext);
  const q = text(body.q);
  const locale = text(body.locale || 'zh-Hans');
  const depth = normalizeAnswerDepth(body.depth || 'STANDARD');
  const source = text(body.source || 'hybrid');
  if (!q) throw new Error('KAP_QUESTION_INVALID');

  const trustedAccess = normalizeTrustedCkaAccess(context?.data?.ckaAccess || {});
  const useCurrentRealityContext = body.useCurrentRealityContext === true;
  const rawMode = text(rawEntry.mode).toUpperCase();
  const realityRequested = useCurrentRealityContext || rawMode === 'REALITY_AWARE';
  const realityAuthorization = assertCkaRealityContextAuthorization({
    access: trustedAccess,
    realityContext: context?.data?.ckaRealityContext || {},
    useCurrentRealityContext: realityRequested
  });

  const realityCaseId = realityAuthorization.authorized
    ? realityAuthorization.trustedReality.realityCaseId
    : null;
  const entryContext = normalizeCkaEntryContext({
    entrySurface: rawEntry.entrySurface,
    entryRoute: rawEntry.entryRoute,
    contextType: rawEntry.contextType,
    contextId: rawEntry.contextId,
    bookCode: rawEntry.bookCode,
    partCode: rawEntry.partCode,
    articleCode: rawEntry.articleCode,
    figureCode: rawEntry.figureCode,
    realityCaseId,
    accountState: trustedAccess.accountState,
    locale,
    mode: realityRequested ? 'REALITY_AWARE' : rawEntry.mode,
    permission: realityAuthorization.authorized ? trustedAccess.permission : false,
    privacy: realityAuthorization.authorized ? trustedAccess.privacy : false,
    entitlement: realityAuthorization.authorized ? trustedAccess.entitlement : false
  });
  const followUpContext = createCkaFollowUpContext({
    currentQuestion: q,
    contextQuestion: rawFollowUp.contextQuestion,
    parentAnswerId: rawFollowUp.parentAnswerId,
    groundingBundleId: rawFollowUp.groundingBundleId,
    followUpDepth: rawFollowUp.followUpDepth,
    accountState: trustedAccess.accountState
  });
  const followUpBoundary = classifyCkaFollowUpBoundary(q);
  if (!followUpBoundary.simpleAskAllowed) throw new Error('CKA_NOT_SIMPLE_ASK');
  const guidedContext = normalizeCkaGuidedContext({ question: q, ...rawGuided });
  const knowledgeContext = normalizeCkaKnowledgeContext({
    contextLabel: rawEntry.contextLabel,
    contextSummary: rawEntry.contextSummary,
    readingPath: rawEntry.readingPath,
    relatedKnowledgeRef: rawEntry.relatedKnowledgeRef
  });
  return {
    q,
    locale,
    depth,
    source,
    entryContext,
    followUpContext,
    followUpBoundary,
    guidedContext,
    knowledgeContext,
    trustedAccess,
    realityAuthorization
  };
}

async function execute(context, payload) {
  const input = buildInput(payload, context);
  const retrievalQuestion = composeCkaRealityAwareRetrievalQuestion(
    composeCkaContextualRetrievalQuestion(
      composeCkaGuidedRetrievalQuestion(
        composeCkaRetrievalQuestion(input.followUpContext),
        input.guidedContext
      ),
      input.knowledgeContext
    ),
    input.realityAuthorization
  );
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
  const w5w17 = projectCkaW5W17Envelope(result, {
    displayQuestion: input.q,
    locale: input.locale,
    guidedContext: input.guidedContext,
    knowledgeContext: input.knowledgeContext
  });
  const w18w33 = projectCkaW18W33Consumption(result, w5w17, {
    locale: input.locale,
    access: input.trustedAccess,
    realityAuthorization: input.realityAuthorization
  });
  return json({
    ok: true,
    ...result,
    cka: {
      schemaVersion: 'PHI-OS-CKA-RESPONSE-v1.1.0',
      entryContext: input.entryContext,
      followUp: {
        ...input.followUpContext,
        boundary: input.followUpBoundary,
        guestLimitReached: input.trustedAccess.accountState === 'GUEST' && input.followUpContext.followUpDepth >= 1
      },
      clientAnswer,
      w5w17,
      w18w33,
      governance: {
        clientSurfaceOnly: true,
        upstreamAnswerRuntimeReused: true,
        secondAnswerRuntimeCreated: false,
        persistentHistoryCreated: false,
        shadowAccountCreated: false,
        requestTransport: 'POST_JSON_NO_STORE',
        privateContextInQueryString: false,
        privateContextInAnalyticsPayload: false
      }
    }
  });
}

function legacyGetPayload(url) {
  const mode = text(url.searchParams.get('mode')).toUpperCase();
  if (mode === 'REALITY_AWARE' || url.searchParams.get('realityCaseId') || url.searchParams.get('whatIsHappening')) {
    throw new Error('CKA_PRIVATE_CONTEXT_REQUIRES_POST');
  }
  return {
    q: url.searchParams.get('q'),
    locale: url.searchParams.get('locale'),
    depth: url.searchParams.get('depth'),
    source: url.searchParams.get('source'),
    entryContext: {
      entrySurface: url.searchParams.get('entrySurface'),
      entryRoute: url.searchParams.get('entryRoute'),
      contextType: url.searchParams.get('contextType'),
      contextId: url.searchParams.get('contextId'),
      bookCode: url.searchParams.get('bookCode'),
      partCode: url.searchParams.get('partCode'),
      articleCode: url.searchParams.get('articleCode'),
      figureCode: url.searchParams.get('figureCode'),
      mode: mode || undefined
    },
    followUpContext: { followUpDepth: 0 },
    guidedContext: {},
    useCurrentRealityContext: false
  };
}

function errorResponse(error) {
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
      realityJourneyStarted: false,
      privateContextPersisted: false
    }
  }, status);
}

export async function onRequestPost(context) {
  try {
    const body = await context.request.json().catch(() => ({}));
    return await execute(context, body);
  } catch (error) {
    return errorResponse(error);
  }
}

export async function onRequestGet(context) {
  try {
    return await execute(context, legacyGetPayload(new URL(context.request.url)));
  } catch (error) {
    return errorResponse(error);
  }
}
