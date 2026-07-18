/*
 * Deprecated compatibility endpoint.
 *
 * The former implementation called OpenAI directly and bypassed the PHI OS
 * provider order. Reading now enters through POST /api/read-runtime:
 * Rule Engine -> Workers AI -> OpenAI -> Professional Review.
 */

function response(method, status = 410) {
  return new Response(JSON.stringify({
    success: false,
    deprecated: true,
    endpoint: '/api/generate-reading',
    replacement: '/api/read-runtime',
    method,
    error: 'This endpoint is retired. Use the Reality Reading provider router at /api/read-runtime.'
  }), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store',
      'access-control-allow-origin': '*'
    }
  });
}

export function onRequestGet() {
  return response('POST', 410);
}

export function onRequestPost() {
  return response('POST', 410);
}

export function onRequestOptions() {
  return new Response(null, {
    status: 204,
    headers: {
      'access-control-allow-origin': '*',
      'access-control-allow-methods': 'GET, POST, OPTIONS',
      'access-control-allow-headers': 'content-type'
    }
  });
}

export function onRequest(context) {
  const method = context?.request?.method || 'GET';
  if (method === 'OPTIONS') return onRequestOptions(context);
  return response('POST', 410);
}
