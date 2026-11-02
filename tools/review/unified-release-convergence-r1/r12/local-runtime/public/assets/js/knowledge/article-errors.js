export const ARTICLE_RENDER_ERROR_CODES = Object.freeze({
  INVALID_ARTICLE: 'invalid_article',
  INVALID_SECTION: 'invalid_section',
  UNKNOWN_BLOCK: 'unknown_block',
  UNSAFE_CONTENT: 'unsafe_content',
  ASSET_UNAVAILABLE: 'asset_unavailable',
  NODE_MISMATCH: 'node_mismatch'
});

const FORBIDDEN_OBJECT_KEYS = new Set([
  '__proto__',
  'constructor',
  'prototype'
]);

export class ArticleRenderError extends Error {
  constructor(code, detail = '') {
    super(`Article rendering stopped: ${code}`);
    this.name = 'ArticleRenderError';
    this.code = code;
    this.detail = detail;
  }
}

export function assertSafePublicValue(value, path = 'article') {
  if (Array.isArray(value)) {
    value.forEach((item, index) => {
      assertSafePublicValue(item, `${path}[${index}]`);
    });
    return;
  }

  if (!value || typeof value !== 'object') {
    return;
  }

  const prototype = Object.getPrototypeOf(value);
  if (prototype !== Object.prototype && prototype !== null) {
    throw new ArticleRenderError(
      ARTICLE_RENDER_ERROR_CODES.UNSAFE_CONTENT,
      `${path}:unexpected_prototype`
    );
  }

  for (const key of Object.keys(value)) {
    if (FORBIDDEN_OBJECT_KEYS.has(key)) {
      throw new ArticleRenderError(
        ARTICLE_RENDER_ERROR_CODES.UNSAFE_CONTENT,
        `${path}:${key}`
      );
    }
    assertSafePublicValue(value[key], `${path}.${key}`);
  }
}

export function appendArticleState(
  documentRef,
  root,
  {
    heading,
    message = '',
    returnLabel,
    returnHref = '/articles',
    secondaryLabel = '',
    secondaryHref = '/library',
    state: stateName = 'invalid'
  }
) {
  const stateElement = documentRef.createElement('section');
  stateElement.className =
    'knowledge-article-state knowledge-empty-state';
  stateElement.setAttribute('data-state', stateName);

  const title = documentRef.createElement('h1');
  title.textContent = heading;
  stateElement.append(title);

  if (message) {
    const copy = documentRef.createElement('p');
    copy.textContent = message;
    stateElement.append(copy);
  }

  const actions = documentRef.createElement('div');
  actions.className = 'knowledge-empty-state__actions';

  const link = documentRef.createElement('a');
  link.href = returnHref;
  link.textContent = returnLabel;
  actions.append(link);

  if (secondaryLabel) {
    const secondary = documentRef.createElement('a');
    secondary.href = secondaryHref;
    secondary.textContent = secondaryLabel;
    actions.append(secondary);
  }

  stateElement.append(actions);

  root.replaceChildren(stateElement);
}
