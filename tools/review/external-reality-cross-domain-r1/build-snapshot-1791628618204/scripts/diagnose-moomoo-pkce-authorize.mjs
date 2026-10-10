import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {buildAuthorizeUrl,diagnoseAuthorizeUrl,pkceChallenge,randomToken} from './lib/civilization-atlas/moomoo-pkce-auth-helper-v1.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const clientFile=path.join(root,'.moomoo-auth','client.json');
const redirectUri='http://localhost:60355/callback';
let clientId=String(process.env.MOOMOO_CLIENT_ID||'').trim();
let clientSource='MOOMOO_CLIENT_ID_ENV';
if(!clientId&&fs.existsSync(clientFile)){
  const meta=JSON.parse(fs.readFileSync(clientFile,'utf8'));
  clientId=String(meta?.clientId||'').trim();
  clientSource='LOCAL_IGNORED_CLIENT_METADATA';
}
if(!clientId){
  console.log(JSON.stringify({state:'NO_CLIENT_ID',next:'Run npm run moomoo:pkce-live-import once to dynamically register a client, then rerun this diagnostic.'},null,2));
  process.exit(2);
}
const verifier=randomToken(64);
const challenge=pkceChallenge(verifier);
const state=randomToken(32);
const url=buildAuthorizeUrl({clientId,redirectUri,state,codeChallenge:challenge});
const report=diagnoseAuthorizeUrl(url);
console.log(JSON.stringify({
  state:'AUTHORIZE_URL_DIAGNOSTIC',
  clientSource,
  ...report,
  secretsPrinted:false,
  note:'Values are redacted; only parameter presence, lengths and fixed-format checks are shown.'
},null,2));
if(Object.values(report.requiredPresent).some(v=>!v)||Object.values(report.formatChecks).some(v=>!v)||report.unexpectedParameters.length)process.exit(1);
