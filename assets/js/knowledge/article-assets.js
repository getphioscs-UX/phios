import {
  ARTICLE_RENDER_ERROR_CODES,
  ArticleRenderError
} from './article-errors.js';

const PUBLIC_VISUAL_TYPES = new Set([
  'hero_illustration',
  'mechanism_diagram',
  'timeline_diagram',
  'decorative_image'
]);
const SAFE_ASSET_PATH = /^\/assets\/[a-zA-Z0-9/_-]+\.(?:avif|svg|webp)$/;

function positiveInteger(value) {
  return Number.isInteger(value) && value > 0 && value <= 10000;
}

export function isSafePublicAssetPath(value) {
  return (
    typeof value === 'string' &&
    SAFE_ASSET_PATH.test(value) &&
    !value.includes('..') &&
    !value.startsWith('//')
  );
}

export function resolvePublishedVisualAsset(
  visualAssets,
  assetCode,
  { required = true } = {}
) {
  const asset = Array.isArray(visualAssets)
    ? visualAssets.find(candidate => (
      candidate?.assetCode === assetCode &&
      candidate?.publicProjection === true
    ))
    : null;

  const valid = (
    asset &&
    PUBLIC_VISUAL_TYPES.has(asset.assetType) &&
    isSafePublicAssetPath(asset.publicSrc) &&
    typeof asset.altText === 'string' &&
    asset.altText.trim() &&
    positiveInteger(asset.width) &&
    positiveInteger(asset.height)
  );

  if (!valid && required) {
    throw new ArticleRenderError(
      ARTICLE_RENDER_ERROR_CODES.ASSET_UNAVAILABLE,
      assetCode || 'missing_asset_code'
    );
  }

  return valid ? asset : null;
}

export function createPublishedPicture(
  documentRef,
  asset,
  {
    altText = '',
    className = '',
    eager = false
  } = {}
) {
  const picture = documentRef.createElement('picture');
  if (className) {
    picture.className = className;
  }

  const image = documentRef.createElement('img');
  image.setAttribute('src', asset.publicSrc);
  image.setAttribute('alt', altText || asset.altText);
  image.setAttribute('width', String(asset.width));
  image.setAttribute('height', String(asset.height));
  image.setAttribute('loading', eager ? 'eager' : 'lazy');
  image.setAttribute('decoding', 'async');
  picture.append(image);
  return picture;
}
