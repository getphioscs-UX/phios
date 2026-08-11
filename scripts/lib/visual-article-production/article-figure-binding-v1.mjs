import {
  resolvePublishedVisualAsset
} from '../../../assets/js/knowledge/article-assets.js';

export class VapArticleFigureBindingError extends Error {
  constructor(code, details = {}) {
    super(code);
    this.name = 'VapArticleFigureBindingError';
    this.code = code;
    this.details = details;
  }
}

const text = value => typeof value === 'string' ? value.trim() : '';
const PUBLISHED_ASSET_TYPES = new Set(['FIGURE', 'DIAGRAM']);
const DISPLAY_MODES = new Set(['inline', 'wide', 'full']);

export function parseArticleFigurePlacement(value) {
  const normalized = text(value);
  const match = /^after_section:(S[0-9]{2})$/.exec(normalized);
  if (!match) {
    throw new VapArticleFigureBindingError('VAP_W20_PLACEMENT_INVALID', { value });
  }
  return Object.freeze({ mode: 'after_section', sectionCode: match[1] });
}

function articleIsPublished(article) {
  return article?.publicationStatus === 'published' || article?.publicationState === 'published';
}

export function resolveCanonicalArticleVisualBinding({
  binding,
  article,
  publishedAssetRegistry
}) {
  if (!binding || binding.bindingState !== 'active') {
    throw new VapArticleFigureBindingError('VAP_W20_BINDING_NOT_ACTIVE');
  }
  if (!articleIsPublished(article)) {
    throw new VapArticleFigureBindingError('VAP_W20_ARTICLE_NOT_PUBLISHED');
  }
  if (text(article.assetCode) !== text(binding.articleAssetCode)) {
    throw new VapArticleFigureBindingError('VAP_W20_ARTICLE_IDENTITY_MISMATCH');
  }
  if (text(article.nodeCode) !== text(binding.nodeCode) || text(article.locale) !== text(binding.locale)) {
    throw new VapArticleFigureBindingError('VAP_W20_ARTICLE_SCOPE_MISMATCH');
  }

  const placement = parseArticleFigurePlacement(binding.placement);
  const section = Array.isArray(article.sections)
    ? article.sections.find(item => text(item?.sectionCode) === placement.sectionCode)
    : null;
  if (!section) {
    throw new VapArticleFigureBindingError('VAP_W20_TARGET_SECTION_NOT_STABLE', {
      sectionCode: placement.sectionCode
    });
  }

  if (!publishedAssetRegistry || !Array.isArray(publishedAssetRegistry.publications)) {
    throw new VapArticleFigureBindingError('VAP_W20_CAR_PUBLISHED_ASSET_REGISTRY_INVALID');
  }
  if (publishedAssetRegistry.productionStatus === 'validation_only') {
    throw new VapArticleFigureBindingError('VAP_W20_CAR_REGISTRY_VALIDATION_ONLY');
  }

  const publication = publishedAssetRegistry.publications.find(record => (
    record?.assetCode === binding.assetCode &&
    record?.publicationCode === binding.publicationCode
  ));
  if (!publication || publication.publicationState !== 'published') {
    throw new VapArticleFigureBindingError('VAP_W20_PUBLISHED_ASSET_NOT_FOUND');
  }
  if (!PUBLISHED_ASSET_TYPES.has(publication.assetType)) {
    throw new VapArticleFigureBindingError('VAP_W20_ASSET_TYPE_NOT_FIGURE');
  }
  if (publication.surface !== 'WEBSITE') {
    throw new VapArticleFigureBindingError('VAP_W20_ASSET_SURFACE_NOT_WEBSITE');
  }
  if (publication.locale !== binding.locale) {
    throw new VapArticleFigureBindingError('VAP_W20_ASSET_LOCALE_MISMATCH');
  }
  if (publication.publicationDigest !== binding.publicationDigest) {
    throw new VapArticleFigureBindingError('VAP_W20_PUBLICATION_DIGEST_MISMATCH');
  }

  return Object.freeze({
    binding: Object.freeze({ ...binding }),
    placement,
    publication: Object.freeze({ ...publication })
  });
}

function paragraphBlocks(section) {
  if (Array.isArray(section.blocks)) {
    return section.blocks.map(block => ({ ...block }));
  }
  return (Array.isArray(section.paragraphs) ? section.paragraphs : [])
    .map((paragraph, index) => ({
      blockCode: `${text(section.sectionCode) || 'SECTION'}-P${String(index + 1).padStart(2, '0')}`,
      type: 'paragraph',
      text: paragraph
    }));
}

export function projectStructuredFigureBinding({
  publicArticle,
  resolvedBinding,
  publishedVisualAssets
}) {
  const binding = resolvedBinding?.binding;
  const placement = resolvedBinding?.placement || parseArticleFigurePlacement(binding?.placement);
  if (!binding) {
    throw new VapArticleFigureBindingError('VAP_W21_RESOLVED_BINDING_REQUIRED');
  }

  const asset = resolvePublishedVisualAsset(publishedVisualAssets, binding.assetCode);
  if (!text(asset.caption)) {
    throw new VapArticleFigureBindingError('VAP_W21_PUBLISHED_FIGURE_CAPTION_REQUIRED');
  }

  let projected = false;
  const sections = (publicArticle?.sections || []).map(section => {
    if (text(section.sectionCode) !== placement.sectionCode) {
      return { ...section };
    }
    projected = true;
    const blocks = paragraphBlocks(section);
    blocks.push({
      blockCode: `${placement.sectionCode}-FIG-${String(blocks.length + 1).padStart(2, '0')}`,
      type: 'figure',
      assetCode: binding.assetCode,
      altText: asset.altText,
      caption: asset.caption,
      displayMode: DISPLAY_MODES.has(binding.displayMode) ? binding.displayMode : 'wide',
      creditLabel: text(binding.creditLabel)
    });
    const copy = { ...section, blocks };
    delete copy.paragraphs;
    return copy;
  });

  if (!projected) {
    throw new VapArticleFigureBindingError('VAP_W21_TARGET_SECTION_NOT_FOUND');
  }

  const currentReferences = Array.isArray(publicArticle.figureReferences)
    ? publicArticle.figureReferences
    : [];
  const figureReference = Object.freeze({
    assetCode: binding.assetCode,
    publicationCode: binding.publicationCode,
    publicationDigest: binding.publicationDigest,
    placement: binding.placement
  });

  return Object.freeze({
    ...publicArticle,
    sections: Object.freeze(sections.map(section => Object.freeze(section))),
    visualAssets: Object.freeze(Array.isArray(publishedVisualAssets) ? [...publishedVisualAssets] : []),
    figureReferences: Object.freeze([...currentReferences, figureReference])
  });
}
