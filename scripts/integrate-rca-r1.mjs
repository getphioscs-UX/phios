import fs from 'node:fs';
const path='functions/api/customer-current-reality.js';let s=fs.readFileSync(path,'utf8');
const old="if(body?.consent!==true)return json";
if(!s.includes("body?.action?.startsWith('REPORT_CONTEXT_')"))s=s.replace(old,"if(body?.action?.startsWith('REPORT_CONTEXT_')){try{if(JSON.stringify(body).length>8192)return json({ok:false,error:'REQUEST_TOO_LARGE'},413);return json({ok:true,...await processAccountReportContext(context,body)});}catch(e){return json({ok:false,error:e.code||'REPORT_CONTEXT_UNAVAILABLE'},e.status||422)}}"+old);
fs.writeFileSync(path,s);
// Account request helper consumes `code`; retain the existing API's `error`
// field as well for other Current Reality callers.
s=s.replace("error:e.code||'REPORT_CONTEXT_UNAVAILABLE'","error:e.code||'REPORT_CONTEXT_UNAVAILABLE',code:e.code||'REPORT_CONTEXT_UNAVAILABLE'");fs.writeFileSync(path,s);
const ui='assets/customer-ui/js/surfaces/account-persons.js';let u=fs.readFileSync(ui,'utf8');
if(!u.includes("import {installReportModeChoice"))u="import {installReportModeChoice,prepareReportContext} from '../report-context-ui.js';\n"+u;
u=u.replace('installReportModeChoice,prepareReportContext}', 'installReportModeChoice,prepareReportContext,reportContextErrorLabel}');
if(!u.includes('installReportModeChoice(host'))u=u.replace("host.querySelector('[data-generate-form]')?.addEventListener", "if(host.querySelector('[data-generate-form]'))installReportModeChoice(host.querySelector('[data-generate-form]'),{request:accountRequest,locale});\n host.querySelector('[data-generate-form]')?.addEventListener");
u=u.replace("try{await accountRequest('/api/account-method-reports',{personId:f.get('personId')", "try{const contextSelection=await prepareReportContext(e.target,{request:accountRequest,locale});await accountRequest('/api/account-method-reports',{...contextSelection,personId:f.get('personId')");
u=u.replace("catch{message=tr('The report could not be released.","catch(error){if(error.code==='CONTEXT_EDIT_REQUESTED'){e.target.querySelector('button[type=submit]').disabled=false;return;}message=tr('The report could not be released.");
if(!u.includes('reportContextErrorLabel(error.code'))u=u.replace("return;}message=tr('The report could not be released.","return;}if(/REALITY_|CONTEXTUAL_|REPORT_CONTEXT_|REPORT_MODE_/.test(error.code||'')){message=reportContextErrorLabel(error.code,locale());let status=e.target.querySelector('[data-context-error]');if(!status){status=document.createElement('p');status.dataset.contextError='';status.setAttribute('role','status');e.target.append(status);}status.textContent=message;e.target.querySelector('button[type=submit]').disabled=false;return;}message=tr('The report could not be released.");
fs.writeFileSync(ui,u);
const ask='assets/customer-ui/js/surfaces/contextual-ask.js';let a=fs.readFileSync(ask,'utf8');
if(!a.includes('installAskReportHandoff')){a="import {installAskReportHandoff} from '../report-context-ui.js';\nimport {accountRequest} from './secure-drafts.js';\n"+a;a=a.replace('function boot(){',"function boot(){\n installAskReportHandoff(document.querySelector('[data-cx-contextual-ask-form]'),{request:accountRequest,locale});");}
fs.writeFileSync(ask,a);
const packagePath='package.json',pkg=JSON.parse(fs.readFileSync(packagePath,'utf8'));pkg.scripts['check:rca-r1']='node scripts/check-rca-r1.mjs && node scripts/check-rca-r1-security.mjs';fs.writeFileSync(packagePath,JSON.stringify(pkg,null,2)+'\n');
