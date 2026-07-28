export function json(payload, status = 200, extraHeaders = {}) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'private, no-store',
      'x-content-type-options': 'nosniff',
      ...extraHeaders
    }
  });
}

export function methodNotAllowed(allowed) {
  return json({
    success: false,
    error: 'method_not_allowed'
  }, 405, {
    allow: allowed.join(', ')
  });
}

export function cleanText(value, maximum = 500) {
  return typeof value === 'string'
    ? value.replace(/[\u0000-\u001f\u007f]/g, '').trim().slice(0, maximum)
    : '';
}

export function localeFrom(value) {
  const locale = cleanText(value, 32).toLowerCase().replaceAll('_', '-');
  return locale === 'zh' || locale.startsWith('zh-') ? 'zh-Hans' : 'en';
}

export function requestOrigin(request) {
  const url = new URL(request.url);
  return `${url.protocol}//${url.host}`;
}

export async function readJsonBody(request, maximumBytes = 16384) {
  const contentType = cleanText(request.headers.get('content-type'), 128)
    .toLowerCase();
  if (!contentType.includes('application/json')) {
    throw Object.assign(new Error('Content-Type must be application/json.'), {
      status: 415,
      code: 'content_type_invalid'
    });
  }

  const declaredLength = Number(request.headers.get('content-length') || 0);
  if (declaredLength > maximumBytes) {
    throw Object.assign(new Error('Request body is too large.'), {
      status: 413,
      code: 'request_body_too_large'
    });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    throw Object.assign(new Error('Request body must be valid JSON.'), {
      status: 400,
      code: 'json_invalid'
    });
  }

  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    throw Object.assign(new Error('Request body must be a JSON object.'), {
      status: 400,
      code: 'request_body_invalid'
    });
  }
  return body;
}

export function cookieValue(request, name) {
  const cookie = request.headers.get('cookie') || '';
  for (const segment of cookie.split(';')) {
    const separator = segment.indexOf('=');
    if (separator === -1) continue;
    const key = segment.slice(0, separator).trim();
    if (key === name) return segment.slice(separator + 1).trim();
  }
  return '';
}

export function commerceError(error, fallbackCode = 'commerce_failed') {
  const status = Number(error?.status);
  return json({
    success: false,
    error: cleanText(error?.code, 96) || fallbackCode,
    message: status >= 400 && status < 500
      ? cleanText(error?.message, 500)
      : 'The commerce service could not complete this request.'
  }, status >= 400 && status <= 599 ? status : 500);
}
