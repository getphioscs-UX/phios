import {
  assertCkaRealityContextAuthorization,
  projectCkaRealityContextDisclosure
} from '../_lib/client-knowledge-ask-c.js';

const headers = Object.freeze({
  'content-type': 'application/json; charset=utf-8',
  'cache-control': 'no-store',
  'referrer-policy': 'no-referrer'
});
const json = (body, status = 200) => new Response(JSON.stringify(body), { status, headers });

export async function onRequestGet(context) {
  try {
    const authorization = assertCkaRealityContextAuthorization({
      access: context?.data?.ckaAccess || {},
      realityContext: context?.data?.ckaRealityContext || {},
      useCurrentRealityContext: true
    });
    return json({
      ok: true,
      available: true,
      disclosure: projectCkaRealityContextDisclosure(authorization),
      askHref: '/knowledge-search?entrySurface=REALITY_DASHBOARD&mode=REALITY_AWARE&useCurrentRealityContext=1',
      governance: {
        explicitUseRequired: true,
        rawPrivateContextExposedToClient: false,
        privateContextInAnalyticsPayload: false,
        hiddenCaseCreated: false
      }
    });
  } catch (error) {
    if (String(error?.message) === 'CKA_REALITY_CONTEXT_NOT_AUTHORIZED') {
      return json({
        ok: true,
        available: false,
        disclosure: {
          usingCurrentRealityContext: false,
          label: 'Current Reality context is not being used',
          contextItems: []
        },
        publicAskHref: '/knowledge-search?entrySurface=REALITY_DASHBOARD&mode=GLOBAL&contextType=REALITY_DASHBOARD_NO_PRIVATE_CONTEXT',
        governance: {
          explicitUseRequired: true,
          authorizationRequired: true,
          rawPrivateContextExposedToClient: false,
          privateContextInAnalyticsPayload: false,
          hiddenCaseCreated: false
        }
      });
    }
    return json({ ok: false, error: { code: 'CKA_REALITY_CONTEXT_DISCLOSURE_FAILED' } }, 500);
  }
}
