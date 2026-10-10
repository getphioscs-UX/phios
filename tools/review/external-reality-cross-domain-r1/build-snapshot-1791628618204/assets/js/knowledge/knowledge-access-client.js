export async function queryKnowledgeAccess({ query, locale, mode = 'auto', source = 'hybrid', signal } = {}) {
  const params = new URLSearchParams({ q: String(query ?? ''), locale, mode, source });
  const response = await fetch(`/api/knowledge-access?${params}`, {
    method: 'GET',
    headers: { Accept: 'application/json' },
    signal
  });
  const payload = await response.json().catch(() => null);
  if (!response.ok || !payload) {
    const error = new Error(payload?.error?.code || 'KNOWLEDGE_ACCESS_REQUEST_FAILED');
    error.code = payload?.error?.code || 'KNOWLEDGE_ACCESS_REQUEST_FAILED';
    throw error;
  }
  return payload;
}
