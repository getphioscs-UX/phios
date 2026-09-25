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
const BOOK4_PUBLICATION_SUCCESSOR_MANIFEST =
  '/content/knowledge/public/successors/book4-publication-v1/visual-article-release.json';
const BOOK5_PUBLICATION_SUCCESSOR_MANIFEST =
  '/content/knowledge/public/successors/book5-publication-v1/visual-article-release.json';
const BOOK6_PUBLICATION_SUCCESSOR_MANIFEST =
  '/content/knowledge/public/successors/book6-publication-v1/visual-article-release.json';
let book5Manifest;
let book6Manifest;
export function loadBook5PublicationMetadata() {
  book5Manifest ||= fetchJson(BOOK5_PUBLICATION_SUCCESSOR_MANIFEST).catch(error => {
    book5Manifest = null;
    throw error;
  });
  return book5Manifest;
}
export function loadBook6PublicationMetadata() {
  book6Manifest ||= fetchJson(BOOK6_PUBLICATION_SUCCESSOR_MANIFEST).catch(error => {
    book6Manifest = null;
    throw error;
  });
  return book6Manifest;
}

function canonicalizeSuccessorArticleContext(article) {
  if(!article || typeof article!=='object') return article;
  if(article.publicationContext?.bookCode!=='BOOK-6') return article;
  const canonical='/books/reality-reconfiguration/';
  const legacy='/books/reality-configuration/';
  const fix=value=>typeof value==='string'?value.replaceAll(legacy,canonical):value;
  const publicationContext=article.publicationContext?{
    ...article.publicationContext,
    bookRoute:fix(article.publicationContext.bookRoute),
    atlasRoute:fix(article.publicationContext.atlasRoute)
  }:article.publicationContext;
  const relatedBooks=(article.connections?.relatedBooks||[]).map(link=>({...link,href:fix(link.href)}));
  return {
    ...article,
    publicationContext,
    connections:article.connections?{...article.connections,relatedBooks}:article.connections
  };
}

async function fetchJson(path) {
  const response = await fetch(path, {
    credentials: 'same-origin', signal: AbortSignal.timeout(12000),
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
    fetchJson(BOOK4_PUBLICATION_SUCCESSOR_MANIFEST).catch(() => ({ records: [] })),
    loadFiveVolumePublicationContextRegistry(),
    loadBook5PublicationMetadata().catch(() => ({records:[]})),
    loadBook6PublicationMetadata().catch(() => ({records:[]}))
  ]).then(async ([
    nodeRegistry,
    localizedRegistry,
    assetRegistry,
    sourceRegistry,
    visualReleaseManifest,
    ablBilingualReleaseManifest,
    booksRegistry,
    partsRegistry,
    book4PublicationSuccessorManifest,
    publicationContextRegistry,
    book5PublicationManifest,
    book6PublicationManifest
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
        ...(ablBilingualReleaseManifest.records || []),
        ...(book4PublicationSuccessorManifest.records || [])
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
      [...publishedByNode.values(), ...book5PublicationManifest.records.filter(record => record.locale === normalizedLocale && record.status === 'published'), ...book6PublicationManifest.records.filter(record => record.locale === normalizedLocale && record.status === 'published')]
        .sort((left, right) => (
          left.publicationOrder - right.publicationOrder
        ))
    );
  });

  cache.set(normalizedLocale, promise);
  promise.catch(()=>cache.delete(normalizedLocale));

  return promise;
}

export function loadPublishedArticles(locale) {
  return loadLocale(locale);
}

export async function loadPublishedArticleBySlug(slug, locale) {
  // Successor manifests carry route metadata. Fetch only the selected body.
  const manifests = await Promise.all([loadBook5PublicationMetadata().catch(() => ({records:[]})), loadBook6PublicationMetadata().catch(() => ({records:[]}))]);
  const row = manifests.flatMap(manifest => manifest.records || []).find(record => record.slug === slug && record.locale === normalizeLocale(locale) && record.status === 'published');
  if (row) {
    const article = canonicalizeSuccessorArticleContext(await fetchJson(row.path));
    return isApprovedPublication(article) && article.slug === row.slug && article.locale === row.locale ? article : null;
  }
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
