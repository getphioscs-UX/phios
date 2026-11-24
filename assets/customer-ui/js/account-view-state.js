// Ephemeral display projections only. No identity, entitlement or delivery authority.
const views=new Map(),listeners=new Set();
export function publishAccountView(source,view){views.set(source,view);for(const fn of listeners)fn(views);}
export function observeAccountViews(fn){listeners.add(fn);fn(views);return()=>listeners.delete(fn);}
function clear(){views.clear();for(const fn of listeners)fn(views);}
window.addEventListener('phios:account-logout',clear);window.addEventListener('pagehide',clear);
