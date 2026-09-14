export const PHIOS_FAVICON_ASSET_CODE = 'LOGO-011';
export const PHIOS_FAVICON_FILENAME = 'PHIOS-FAVICON-v1.svg';
export const PHIOS_FAVICON_OBJECT_KEY = 'images/branding/logo/PHIOS-FAVICON-v1.svg';
export const PHIOS_FAVICON_VERSION = 'ptrc-w1-20260914';
export const PHIOS_FAVICON_VERIFIED_FALLBACK_URL = `https://pub-1967bc5812ee4164b19a806fb1427021.r2.dev/images/branding/logo/PHIOS-FAVICON-v1.svg?v=${PHIOS_FAVICON_VERSION}`;
export const PHIOS_WEB_MANIFEST_URL = `/site.webmanifest?v=${PHIOS_FAVICON_VERSION}`;

export function ensureCanonicalPhiosFavicon(href = PHIOS_FAVICON_VERIFIED_FALLBACK_URL, { marker = 'data-phios-branding' } = {}) {
  const head = document.head;
  if (!head) return null;
  const icons = [...head.querySelectorAll('link[rel~="icon"]')];
  let link = icons.find(item => item.hasAttribute(marker)) || icons.find(item => item.dataset.phiosBranding === 'true' || item.dataset.phiosJourneyBranding === 'true');
  if (!link) {
    link = document.createElement('link');
    link.rel = 'icon';
    head.append(link);
  }
  link.setAttribute(marker, 'true');
  link.type = 'image/svg+xml';
  link.href = href;
  icons.forEach(item => { if (item !== link) item.remove(); });
  return link;
}

export function ensurePhiosWebManifest(href = PHIOS_WEB_MANIFEST_URL) {
  const head = document.head;
  if (!head) return null;
  let link = head.querySelector('link[rel="manifest"][data-phios-branding="true"]') || head.querySelector('link[rel="manifest"]');
  if (!link) {
    link = document.createElement('link');
    link.rel = 'manifest';
    head.append(link);
  }
  link.dataset.phiosBranding = 'true';
  link.href = href;
  return link;
}
