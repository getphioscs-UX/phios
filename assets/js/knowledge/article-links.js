const SAFE_NODE_CODE = /^KN-[A-Z0-9-]+$/;
const CONTROL_CHARACTER = /[\u0000-\u001f\u007f]/u;

export function safeInternalHref(value) {
  if (
    typeof value !== 'string' ||
    !value.startsWith('/') ||
    value.startsWith('//') ||
    value.includes('\\') ||
    CONTROL_CHARACTER.test(value)
  ) {
    return null;
  }

  try {
    const resolved = new URL(value, 'https://public.phios.invalid');

    if (
      resolved.origin !== 'https://public.phios.invalid' ||
      resolved.username ||
      resolved.password
    ) {
      return null;
    }

    return `${resolved.pathname}${resolved.search}${resolved.hash}`;
  } catch {
    return null;
  }
}

export function resolvePublishedNode(nodeCode, publishedArticles = []) {
  if (!SAFE_NODE_CODE.test(nodeCode || '')) {
    return null;
  }

  return publishedArticles.find(candidate => (
    candidate?.nodeCode === nodeCode &&
    safeInternalHref(candidate.publicHref)
  )) || null;
}

export function createInternalLink(
  documentRef,
  {
    href,
    label,
    className = 'knowledge-connection-link'
  }
) {
  const safeHref = safeInternalHref(href);
  if (!safeHref || typeof label !== 'string' || !label.trim()) {
    return null;
  }

  const link = documentRef.createElement('a');
  link.className = className;
  link.href = safeHref;
  link.textContent = label;
  return link;
}

export function publicConnectionList(items = []) {
  if (!Array.isArray(items)) {
    return [];
  }

  return items.flatMap(item => {
    const href = safeInternalHref(item?.href);
    const label = typeof item?.label === 'string' ? item.label.trim() : '';

    if (!href || !label) {
      return [];
    }

    return [{
      id: typeof item.id === 'string' ? item.id : '',
      label,
      href
    }];
  });
}
