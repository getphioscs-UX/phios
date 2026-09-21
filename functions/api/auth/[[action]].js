import {authApi} from '../../account/oidc-auth.js';
export function onRequest(context){return authApi(context,String(context.params.action));}
