export const PHIOS_FAVICON_ASSET_CODE = 'LOGO-011';
export const PHIOS_FAVICON_FILENAME = 'PHIOS-FAVICON-v1.svg';
export const PHIOS_FAVICON_OBJECT_KEY = 'images/branding/logo/PHIOS-FAVICON-v1.svg';
export const PHIOS_FAVICON_VERIFIED_FALLBACK_URL = 'https://pub-1967bc5812ee4164b19a806fb1427021.r2.dev/images/branding/logo/PHIOS-FAVICON-v1.svg';

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
  // Prevent an older generic phi favicon from competing with the canonical PHI OS favicon.
  icons.forEach(item => { if (item !== link) item.remove(); });
  return link;
}
