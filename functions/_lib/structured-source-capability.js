import {resolveFormationEntry, retrieveFormationScope} from './formation-retrieval-scope.js';
export const isStructuredAskRef = ref => /^CONCEPT:sk-b[1-4]-[a-z0-9-]+$/.test(String(ref || ''));
// No model or third-party calls: availability is based on actual bound content.
export async function structuredSourceCapability(env, ref, locale = 'en') {
  if (!isStructuredAskRef(ref)) return null;
  const entry = await resolveFormationEntry(ref, env);
  if (!entry?.retrievalScope) return {available: false, reason: 'SELECTED_SOURCE_UNAVAILABLE'};
  const bundle = await retrieveFormationScope({env, scope: entry.retrievalScope, locale});
  const source = bundle.sources?.find(s => s.selected && s.structuredObjectId === entry.retrievalScope.objectId && String(s.text || '').trim());
  return {available: Boolean(source), reason: source ? 'BOUND_SEMANTIC_SOURCE' : 'SEMANTIC_CONTENT_UNAVAILABLE'};
}
