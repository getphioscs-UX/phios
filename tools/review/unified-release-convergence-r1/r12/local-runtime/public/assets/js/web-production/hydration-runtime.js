const MODES = new Set(['PUBLIC_CANONICAL_READ','PUBLIC_STATIC_METADATA','BROWSER_LOCAL_READ_ONLY_COMPATIBILITY','BROWSER_EPHEMERAL_INPUT_READINESS','PROFESSIONAL_AUTHORIZED_EXTERNAL_PAYLOAD']);
export class WprHydrationError extends Error { constructor(code){ super(code); this.name='WprHydrationError'; this.code=code; } }
export function resolveHydrationMode({surfaceCode, accessMode}={}) {
  if (['PROFESSIONAL_WORKSPACE','PROFESSIONAL_REPORT_VIEWER'].includes(surfaceCode)) return 'PROFESSIONAL_AUTHORIZED_EXTERNAL_PAYLOAD';
  if (surfaceCode === 'REALITY_JOURNEY_LOCAL') return 'BROWSER_LOCAL_READ_ONLY_COMPATIBILITY';
  if (surfaceCode === 'PERSONAL_RUNTIME_SETUP') return 'BROWSER_EPHEMERAL_INPUT_READINESS';
  if (surfaceCode === 'PROFESSIONAL' && accessMode === 'PUBLIC') return 'PUBLIC_STATIC_METADATA';
  return 'PUBLIC_CANONICAL_READ';
}
export function assertHydrationRequest({mode,url,method='GET'}={}) {
  if (!MODES.has(mode)) throw new WprHydrationError('WPR_HYDRATION_MODE_INVALID');
  if (mode !== 'PUBLIC_CANONICAL_READ' && mode !== 'BROWSER_EPHEMERAL_INPUT_READINESS') throw new WprHydrationError('WPR_NETWORK_HYDRATION_FORBIDDEN');
  if (String(method).toUpperCase() !== 'GET') throw new WprHydrationError('WPR_HYDRATION_MUTATION_FORBIDDEN');
  const target = new URL(url, window.location.origin);
  if (target.origin !== window.location.origin) throw new WprHydrationError('WPR_HYDRATION_CROSS_ORIGIN_FORBIDDEN');
  return target;
}
export async function fetchPublicHydrationJson(url,{mode='PUBLIC_CANONICAL_READ',fetchImpl=fetch}={}) {
  const target=assertHydrationRequest({mode,url,method:'GET'});
  const response=await fetchImpl(target,{method:'GET',credentials:'same-origin',headers:{Accept:'application/json'}});
  if(!response.ok) throw new WprHydrationError('WPR_HYDRATION_READ_FAILED');
  return response.json();
}
