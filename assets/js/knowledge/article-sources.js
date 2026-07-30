import {
  createInternalLink,
  safeInternalHref
} from './article-links.js';

const PUBLIC_SOURCE_USES = new Set([
  'public_citation_allowed',
  'public_metadata_only'
]);

export function publicSourceProjection(
  sourceReferences = [],
  registeredSources = []
) {
  const sourceByCode = new Map(
    registeredSources.map(source => [source.sourceCode, source])
  );

  return sourceReferences.flatMap(reference => {
    const registered = sourceByCode.get(reference?.sourceCode);
    const href = safeInternalHref(reference?.href);
    const label = typeof reference?.label === 'string'
      ? reference.label.trim()
      : '';

    if (!registered || !href || !label) {
      return [];
    }

    return [{
      sourceCode: registered.sourceCode,
      label,
      href,
      publicUse: 'public_metadata_only'
    }];
  });
}

export function renderPublicSources(
  documentRef,
  sources,
  heading
) {
  const publicSources = Array.isArray(sources)
    ? sources.filter(source => (
      PUBLIC_SOURCE_USES.has(source?.publicUse) &&
      safeInternalHref(source?.href) &&
      typeof source?.label === 'string' &&
      source.label.trim()
    ))
    : [];

  if (!publicSources.length) {
    return null;
  }

  const section = documentRef.createElement('section');
  const title = documentRef.createElement('p');
  title.className = 'knowledge-eyebrow';
  title.textContent = heading;
  section.append(title);

  const list = documentRef.createElement('ol');
  list.className = 'knowledge-source-list';

  for (const source of publicSources) {
    const item = documentRef.createElement('li');
    const link = createInternalLink(documentRef, {
      href: source.href,
      label: source.label
    });
    if (link) {
      item.append(link);
      list.append(item);
    }
  }

  if (!list.childElementCount) {
    return null;
  }

  section.append(list);
  return section;
}
