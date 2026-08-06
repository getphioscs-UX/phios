export async function queryPublishedKnowledge({ query, locale, mode = 'auto', signal } = {}) {
  const params = new URLSearchParams({ q: String(query ?? ''), locale, mode });
  const response = await fetch(`/api/public-knowledge?${params}`, {
    method: 'GET',
    headers: { Accept: 'application/json' },
    signal
  });
  const payload = await response.json().catch(() => null);
  if (!response.ok || !payload) {
    const error = new Error(payload?.error?.code || 'PUBLIC_KNOWLEDGE_REQUEST_FAILED');
    error.code = payload?.error?.code || 'PUBLIC_KNOWLEDGE_REQUEST_FAILED';
    throw error;
  }
  return payload;
}
