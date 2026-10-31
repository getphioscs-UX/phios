// Payload-free cross-tab logout invalidation. This conveys no authentication or permission.
const channel=typeof BroadcastChannel==='function'?new BroadcastChannel('phios-account-session-events'):null;
channel?.addEventListener('message',event=>{if(event.data?.type==='ACCOUNT_LOGOUT')window.dispatchEvent(new Event('phios:account-logout'));});
export function notifyAccountLogout(){window.dispatchEvent(new Event('phios:account-logout'));channel?.postMessage({type:'ACCOUNT_LOGOUT'});}
