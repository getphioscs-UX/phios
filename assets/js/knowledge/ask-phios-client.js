export async function askPhios({ query, locale, depth = 'STANDARD', source = 'hybrid', signal } = {}) {
  const params = new URLSearchParams({
    q: String(query ?? ''),
    locale: String(locale || 'zh-Hans'),
    depth: String(depth || 'STANDARD'),
    source: String(source || 'hybrid')
  });
  const response = await fetch(`/api/ask-phios?${params}`, {
    method: 'GET',
    headers: { Accept: 'application/json' },
    signal
  });
  const payload = await response.json().catch(() => null);
  if (!response.ok || !payload?.ok) {
    const code = payload?.error?.code || 'ASK_PHIOS_REQUEST_FAILED';
    const error = new Error(code);
    error.code = code;
    throw error;
  }
  return payload;
}
