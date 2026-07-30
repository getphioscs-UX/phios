import {
  prepareArticleBlockForRendering
} from './article-blocks.js';
import {
  publicConnectionList,
  safeInternalHref
} from './article-links.js';
import {
  publicSourceProjection
} from './article-sources.js';
import {
  ARTICLE_RENDER_ERROR_CODES,
  ArticleRenderError
} from './article-errors.js';

const FORBIDDEN_CAPABILITY_KEYS = new Set([
  'rawHtml',
  'script',
  'style',
  'arbitraryEmbed',
  'externalIframe',
  'runtimeForm',
  'caseInput',
  'providerInvocation',
  'personalRecommendation'
]);

function text(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function assertNoForbiddenCapabilityKeys(value, path = 'article') {
  if (Array.isArray(value)) {
    value.forEach((item, index) => {
      assertNoForbiddenCapabilityKeys(item, `${path}[${index}]`);
    });
    return;
  }

  if (!value || typeof value !== 'object') {
    return;
  }

  for (const [key, nested] of Object.entries(value)) {
    if (FORBIDDEN_CAPABILITY_KEYS.has(key)) {
      throw new ArticleRenderError(
        ARTICLE_RENDER_ERROR_CODES.UNSAFE_CONTENT,
        `${path}.${key}`
      );
    }
    assertNoForbiddenCapabilityKeys(nested, `${path}.${key}`);
  }
}

function publicKeyConcepts(values) {
  if (!Array.isArray(values)) {
    return [];
  }

  return values.flatMap(concept => {
    if (typeof concept === 'string' && concept.trim()) {
      return [concept.trim()];
    }

    if (!concept || typeof concept !== 'object') {
      return [];
    }

    const label = text(concept.label);
    const definition = text(concept.definition);
    if (!label || !definition) {
      return [];
    }

    return [{
      conceptCode: text(concept.conceptCode),
      label,
      definition,
      termReference: text(concept.termReference) || null
    }];
  });
}

function publicBoundaries(values) {
  if (!Array.isArray(values)) {
    return [];
  }

  return values.flatMap(boundary => {
    if (typeof boundary === 'string' && boundary.trim()) {
      return [boundary.trim()];
    }

    const boundaryText = text(boundary?.text);
    if (!boundaryText) {
      return [];
    }

    return [{
      type: text(boundary.type) || 'scope_limit',
      text: boundaryText
    }];
  });
}

function publicSections(sections) {
  if (!Array.isArray(sections)) {
    return [];
  }

  return sections.map(section => {
    const base = {
      sectionCode: text(section?.sectionCode),
      heading: text(section?.heading),
      purpose: text(section?.purpose),
      ariaLabel: text(section?.ariaLabel),
      anchor: text(section?.anchor)
    };

    if (Array.isArray(section?.paragraphs)) {
      return {
        ...base,
        paragraphs: section.paragraphs
          .map(text)
          .filter(Boolean)
      };
    }

    return {
      ...base,
      blocks: Array.isArray(section?.blocks)
        ? section.blocks
          .map(prepareArticleBlockForRendering)
          .filter(Boolean)
        : []
    };
  });
}

function publicConnections(connections = {}) {
  return {
    previousNode: text(connections.previousNode) || null,
    nextNode: text(connections.nextNode) || null,
    relatedNodes: Array.isArray(connections.relatedNodes)
      ? connections.relatedNodes.filter(value => typeof value === 'string')
      : [],
    relatedArticles: Array.isArray(connections.relatedArticles)
      ? connections.relatedArticles.filter(value => typeof value === 'string')
      : [],
    relatedBooks: publicConnectionList(connections.relatedBooks),
    relatedAtlasEntries: publicConnectionList(
      connections.relatedAtlasEntries
    ),
    relatedFigures: publicConnectionList(connections.relatedFigures),
    journeyEntryTopics: publicConnectionList(
      connections.journeyEntryTopics
    )
  };
}

function publicHero(hero) {
  if (!hero || typeof hero !== 'object') {
    return null;
  }

  return {
    eyebrow: text(hero.eyebrow),
    lead: text(hero.lead),
    assetCode: text(hero.assetCode) || null
  };
}

function publicTaxonomy(taxonomy) {
  if (!taxonomy || typeof taxonomy !== 'object') {
    return null;
  }

  return {
    themeCode: text(taxonomy.themeCode),
    nodeType: text(taxonomy.nodeType),
    knowledgeLevel: text(taxonomy.knowledgeLevel),
    tags: Array.isArray(taxonomy.tags)
      ? taxonomy.tags.map(text).filter(Boolean)
      : []
  };
}

export function createPublicArticleProjection(
  content,
  {
    node,
    localized,
    articleAsset,
    visualAssets,
    registeredSources
  }
) {
  assertNoForbiddenCapabilityKeys(content);

  const publicHref = safeInternalHref(articleAsset?.publicHref) ||
    safeInternalHref(`/articles/${localized.slug}`);
  if (!publicHref) {
    throw new ArticleRenderError(
      ARTICLE_RENDER_ERROR_CODES.UNSAFE_CONTENT,
      'article_public_href'
    );
  }

  return Object.freeze({
    nodeCode: content.nodeCode,
    locale: content.locale,
    contentRole: content.contentRole,
    version: content.version,
    slug: content.slug,
    publicationOrder: content.publicationOrder,
    publishedAt: text(content.publishedAt) || null,
    title: text(content.title),
    displayQuestion: text(content.displayQuestion),
    shortAnswer: text(content.shortAnswer),
    summary: text(content.summary),
    readingTimeMinutes: Number.isInteger(content.readingTimeMinutes)
      ? content.readingTimeMinutes
      : null,
    seo: Object.freeze({
      title: text(content.seo?.title),
      description: text(content.seo?.description),
      canonicalPath: safeInternalHref(content.seo?.canonicalPath) || publicHref
    }),
    taxonomy: publicTaxonomy(content.taxonomy),
    hero: publicHero(content.hero),
    keyConcepts: Object.freeze(publicKeyConcepts(content.keyConcepts)),
    sections: Object.freeze(publicSections(content.sections)),
    knowledgeBoundary: Object.freeze(
      publicBoundaries(content.knowledgeBoundary)
    ),
    publicSources: Object.freeze(publicSourceProjection(
      content.sourceReferences,
      registeredSources
    )),
    connections: Object.freeze(publicConnections(content.connections)),
    node: Object.freeze({
      nodeCode: node.nodeCode,
      canonicalLanguage: node.canonicalLanguage,
      themeCode: node.themeCode
    }),
    localizedRecord: Object.freeze({
      contentRole: localized.contentRole,
      locale: localized.locale,
      slug: localized.slug
    }),
    visualAssets: Object.freeze(visualAssets),
    publicHref
  });
}
