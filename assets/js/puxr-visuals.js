import { resolvePublicAssetForWeb } from './runtime/web-production/asset-resolver.js';
async function resolveImage(img) {
  const code = img.dataset.puxrAsset;
  if (!code) return;
  try {
    const asset = await resolvePublicAssetForWeb(code, { surface: img.dataset.puxrSurface || 'PUBLIC_PAGE' });
    if (!asset?.renderable) throw new Error('ASSET_NOT_RENDERABLE');
    img.src = asset.src;
    if (asset.srcset) img.srcset = asset.srcset;
    if (asset.sizes) img.sizes = asset.sizes;
    if (asset.width) img.width = asset.width;
    if (asset.height) img.height = asset.height;
    img.closest('[data-puxr-visual]')?.removeAttribute('data-asset-status');
  } catch {
    img.closest('[data-puxr-visual]')?.setAttribute('data-asset-status','unavailable');
  }
}
Promise.all([...document.querySelectorAll('img[data-puxr-asset]')].map(resolveImage));
