import {
  ARTICLE_RENDER_ERROR_CODES,
  ArticleRenderError
} from './article-errors.js';
import {resolveUnifiedPublicVisual} from '../public-v2/unified-public-visual-resolver.js';

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
    (isSafePublicAssetPath(asset.publicSrc) || (asset.resolver === 'UNIFIED_PUBLIC_VISUAL' && /^VIS-CIV-[A-Z0-9_-]+$/.test(asset.assetCode))) &&
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
  if (asset.publicSrc) image.setAttribute('src', asset.publicSrc);
  image.setAttribute('alt', altText || asset.altText);
  image.setAttribute('width', String(asset.width));
  image.setAttribute('height', String(asset.height));
  image.setAttribute('loading', eager ? 'eager' : 'lazy');
  image.setAttribute('decoding', 'async');
  picture.append(image);
  if (asset.resolver === 'UNIFIED_PUBLIC_VISUAL') {
    const holder = documentRef.createElement('div');
    holder.className = 'knowledge-resolved-visual';
    const status = documentRef.createElement('p');
    status.textContent = asset.caption || asset.altText;
    holder.append(picture, status);
    const failed = () => {picture.hidden=true;holder.dataset.assetStatus='unavailable';};
    image.addEventListener('error', failed, {once:true});
    void resolveUnifiedPublicVisual(asset.assetCode, {surface:'ARTICLE',locale:asset.locale}).then(result => {
      if (!result.renderable) return failed();
      image.addEventListener('load', () => {
        holder.dataset.assetStatus='ready';status.hidden=true;
        const button = documentRef.createElement('button');
        button.type='button';button.className='public-button public-button--secondary';button.textContent=asset.locale==='zh-Hans'?'展开图片':'Expand image';
        button.setAttribute('aria-label',button.textContent+' · '+asset.altText);
        button.addEventListener('click', () => {
          const dialog=documentRef.createElement('dialog');dialog.className='knowledge-visual-dialog';
          const close=documentRef.createElement('button');close.type='button';close.className='public-button public-button--secondary';close.textContent=asset.locale==='zh-Hans'?'关闭图片':'Close image';
          const expanded=image.cloneNode();expanded.loading='eager';
          const caption=documentRef.createElement('p');caption.textContent=asset.caption||asset.altText;
          dialog.setAttribute('aria-label',asset.altText);dialog.append(close,expanded,caption);documentRef.body.append(dialog);
          close.addEventListener('click',()=>dialog.close());
          dialog.addEventListener('close',()=>{dialog.remove();button.focus();},{once:true});
          dialog.showModal();close.focus();
        });
        holder.append(button);
      }, {once:true});
      image.src = result.src;
    }).catch(failed);
    return holder;
  }
  return picture;
}
