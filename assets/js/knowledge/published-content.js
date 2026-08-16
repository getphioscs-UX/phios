import { normalizeLocale } from '../i18n.js';
import {
  createPublicArticleProjection
} from './article-projection.js';
import {
  safeInternalHref
} from './article-links.js';
import {
  loadCanonicalBooks,
  loadCanonicalParts,
  loadFiveVolumePublicationContextRegistry,
  resolvePublicationContextForNode
} from '../web-production/public-surface-data.js';

const REGISTRY_PATHS = Object.freeze({
  nodes: '/content/knowledge/registry/nodes.json',
  localizedContent: '/content/knowledge/registry/localized-content.json',
  assets: '/content/knowledge/registry/assets.json',
  sources: '/content/knowledge/registry/sources.json'
});

const ARTICLE_ROUTE_PREFIX = '/articles/';
const SAVE_STORAGE_KEY = 'phiOSPublicKnowledgeSaves.v1';
const VISUAL_ASSET_TYPES = Object.freeze([
  'hero_illustration',
  'mechanism_diagram',
  'timeline_diagram',
  'decorative_image'
]);
const cache = new Map();
const VISUAL_RELEASE_MANIFEST =
  '/content/knowledge/public/visual-article-release.json';
const ABL_BILINGUAL_RELEASE_MANIFEST =
  '/content/knowledge/public/abl-bilingual-release.json';

async function fetchJson(path) {
  const response = await fetch(path, {
    credentials: 'same-origin',
    headers: {
      Accept: 'application/json'
    }
  });

  if (!response.ok) {
    throw new Error(`Unable to load published Knowledge content: ${path}`);
  }

  return response.json();
}

function isApprovedPublication(record) {
  return (
    record?.contentStatus === 'content_reviewed' &&
    record?.reviewStatus === 'approved' &&
    record?.publicationStatus === 'published'
  );
}

function publishedLocaleRecord(localizedRecord, locale) {
  const localized = localizedRecord?.locales?.[locale];

  if (!isApprovedPublication(localized)) {
    return null;
  }

  if (
    locale === 'en' &&
    (
      localized.terminologyReviewStatus !== 'approved' ||
      localized.semanticParityStatus !== 'approved'
    )
  ) {
    return null;
  }

  return localized;
}

function articleAssetFor(assets, localized) {
  return assets.find(asset => (
    asset.assetCode === localized.articleAssetCode &&
    asset.assetType === 'article' &&
    asset.locale === localized.locale &&
    isApprovedPublication(asset)
  ));
}

function localizedVisualText(value, locale) {
  if (typeof value === 'string') {
    return value;
  }

  return value?.[locale] || value?.['zh-Hans'] || '';
}

function visualAssetsFor(assets, nodeCode, locale) {
  return assets
    .filter(asset => (
      asset.nodeCode === nodeCode &&
      VISUAL_ASSET_TYPES.includes(asset.assetType) &&
      (
        asset.localeDependency === 'none' ||
        asset.localeDependency === locale ||
        asset.locale === locale
      ) &&
      typeof asset.contentPath === 'string' &&
      isApprovedPublication(asset)
    ))
    .map(asset => Object.freeze({
      assetCode: asset.assetCode,
      assetType: asset.assetType,
      publicSrc: `/${asset.contentPath.replace(/^\/+/, '')}`,
      altText: localizedVisualText(asset.altText, locale),
      caption: localizedVisualText(asset.caption, locale),
      width: asset.width || asset.dimensions?.width,
      height: asset.height || asset.dimensions?.height,
      publicProjection: true
    }));
}

function publicArticle(
  content,
  node,
  localized,
  asset,
  assets,
  sources,
  booksRegistry,
  partsRegistry,
  publicationContextRegistry
) {
  return createPublicArticleProjection(content, {
    node,
    localized,
    articleAsset: asset,
    visualAssets: visualAssetsFor(
      assets,
      node.nodeCode,
      localized.locale
    ),
    registeredSources: sources,
    publicationContext: resolvePublicationContextForNode(
      node, booksRegistry, partsRegistry, publicationContextRegistry
    )
  });
}

async function loadLocale(locale) {
  const normalizedLocale = normalizeLocale(locale);

  if (cache.has(normalizedLocale)) {
    return cache.get(normalizedLocale);
  }

  const promise = Promise.all([
    fetchJson(REGISTRY_PATHS.nodes),
    fetchJson(REGISTRY_PATHS.localizedContent),
    fetchJson(REGISTRY_PATHS.assets),
    fetchJson(REGISTRY_PATHS.sources),
    fetchJson(VISUAL_RELEASE_MANIFEST).catch(() => ({ records: [] })),
    fetchJson(ABL_BILINGUAL_RELEASE_MANIFEST).catch(() => ({ records: [] })),
    loadCanonicalBooks(),
    loadCanonicalParts(),
    loadFiveVolumePublicationContextRegistry()
  ]).then(async ([
    nodeRegistry,
    localizedRegistry,
    assetRegistry,
    sourceRegistry,
    visualReleaseManifest,
    ablBilingualReleaseManifest,
    booksRegistry,
    partsRegistry,
    publicationContextRegistry
  ]) => {
    const localizedByNode = new Map(
      localizedRegistry.localizedContent.map(record => [record.nodeCode, record])
    );

    const candidates = nodeRegistry.nodes.flatMap(node => {
      if (
        node.registryStatus !== 'frozen' ||
        !node.requiredPublicLanguages.includes(normalizedLocale)
      ) {
        return [];
      }

      const localized = publishedLocaleRecord(
        localizedByNode.get(node.nodeCode),
        normalizedLocale
      );

      if (!localized) {
        return [];
      }

      const asset = articleAssetFor(assetRegistry.assets, localized);

      if (!asset?.contentPath) {
        return [];
      }

      return [{ node, localized, asset }];
    });

    const loaded = await Promise.all(candidates.map(async candidate => {
      const content = await fetchJson(`/${candidate.asset.contentPath}`);

      if (
        content.nodeCode !== candidate.node.nodeCode ||
        content.locale !== normalizedLocale ||
        content.assetCode !== candidate.asset.assetCode ||
        !isApprovedPublication(content)
      ) {
        return null;
      }

      return publicArticle(
        content,
        candidate.node,
        candidate.localized,
        candidate.asset,
        assetRegistry.assets,
        sourceRegistry.sources,
        booksRegistry,
        partsRegistry,
        publicationContextRegistry
      );
    }));

    const visualArticles = await Promise.all(
      [
        ...(visualReleaseManifest.records || []),
        ...(ablBilingualReleaseManifest.records || [])
      ]
        .filter(record => (
          record.locale === normalizedLocale &&
          record.status === 'published'
        ))
        .map(record => fetchJson(record.path))
    );
    const publishedByNode = new Map(
      [...loaded.filter(Boolean), ...visualArticles]
        .map(article => [article.nodeCode, article])
    );

    return Object.freeze(
      [...publishedByNode.values()]
        .sort((left, right) => (
          left.publicationOrder - right.publicationOrder
        ))
    );
  });

  cache.set(normalizedLocale, promise);

  return promise;
}

export function loadPublishedArticles(locale) {
  return loadLocale(locale);
}

export async function loadPublishedArticleBySlug(slug, locale) {
  const articles = await loadLocale(locale);
  return articles.find(article => article.slug === slug) || null;
}

export function articleHref(article) {
  return safeInternalHref(article?.publicHref) ||
    safeInternalHref(`${ARTICLE_ROUTE_PREFIX}${article?.slug || ''}`) ||
    '/articles';
}

function readSavedNodeCodes() {
  try {
    const stored = JSON.parse(window.localStorage.getItem(SAVE_STORAGE_KEY) || '[]');
    return Array.isArray(stored)
      ? stored.filter(value => typeof value === 'string')
      : [];
  } catch {
    return [];
  }
}

export function isArticleSaved(nodeCode) {
  return readSavedNodeCodes().includes(nodeCode);
}

export function toggleArticleSaved(nodeCode) {
  const saved = new Set(readSavedNodeCodes());

  if (saved.has(nodeCode)) {
    saved.delete(nodeCode);
  } else {
    saved.add(nodeCode);
  }

  try {
    window.localStorage.setItem(
      SAVE_STORAGE_KEY,
      JSON.stringify([...saved])
    );
  } catch {
    // Saving is a browser convenience and never a Runtime dependency.
  }

  return saved.has(nodeCode);
}
