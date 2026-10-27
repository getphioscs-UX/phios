import assert from 'node:assert/strict';
import {existsSync,readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';
import {parseHTML} from 'linkedom';

const root=process.cwd();
const file=path=>readFileSync(path,'utf8');
const profile=file('perspectives/profile/index.html');
const account=file('account/index.html');
const css=file('assets/customer-ui/surfaces/profile-context-network-r2.css');
const brand='/assets/images/branding/PHIOS-LOGO-MARK-v1.png';
assert.ok(existsSync('.'+brand),'approved PHI OS brand mark missing');
assert.ok(!css.includes("content:'Φ'"),'mathematical Phi must not be used as branding');
assert.ok(css.includes("url('"+brand+"')"),'wheel should use the approved brand mark');
const {document:profileDoc}=parseHTML(profile);
const {document:accountDoc}=parseHTML(account);
assert.ok(profileDoc.querySelector('[data-prf-auth-status]'),'profile needs live account status');
assert.ok(profileDoc.querySelector('[data-prf-signin-link]'),'profile needs sign-in action');
assert.ok(profileDoc.querySelector('#profile-saved-evidence [data-prf-account-load]'),'preserve existing authenticated evidence reading');
assert.ok(profileDoc.querySelector('[data-prf-account-save]'),'preserve explicit consent checkbox');
assert.ok(profileDoc.querySelector('a[href="/account/#account-profile-evidence"]'),'profile must link to the account evidence section');
assert.ok(accountDoc.querySelector('#account-profile-evidence [data-account-profile-refresh]'),'account requires on-demand saved evidence refresh');
assert.ok(accountDoc.querySelector('a[href="/perspectives/profile/#profile-saved-evidence"]'),'account links back to assessment history');
assert.match(profile,/surfaces\/profile-account-bridge\.js/);
assert.match(account,/surfaces\/account-profile-evidence-bridge\.js/);
assert.match(file('assets/customer-ui/js/surfaces/account-persons.js'),/BIRTH DETAILS/);
assert.ok(!file('assets/customer-ui/js/surfaces/account-profile-evidence-bridge.js').includes("method:'POST'"),'account reader must not write');
console.log('PASS static: approved brand path, cross-links, consent, birth/evidence distinction');

async function tick(){await new Promise(resolve=>setImmediate(resolve));}
async function accountCase(authenticated){
  const {document,window}=parseHTML(account);
  let calls=[];
  const fetch=async url=>{
    calls.push(String(url));
    if(String(url)==='/api/auth/session')return {ok:true,json:async()=>({authenticated,providerConfigured:true})};
    if(String(url)==='/api/account-profile-evidence')return {ok:true,json:async()=>({objects:[{objectId:'opaque-1',mode:'BIG_FIVE',createdAt:'2026-10-27T11:00:00Z',rawAnswers:'NEVER_SHOW_PRIVATE_ANSWERS'}]})};
    throw Error('UNEXPECTED_API');
  };
  const source=file('assets/customer-ui/js/surfaces/account-profile-evidence-bridge.js');
  runInNewContext(source,{document,window,fetch,console});
  const button=document.querySelector('[data-account-profile-refresh]');
  button.click();await tick();await tick();
  assert.equal(calls.filter(url=>url==='/api/auth/session').length,1);
  const list=document.querySelector('[data-account-profile-items]').textContent;
  if(authenticated){
    assert.ok(calls.includes('/api/account-profile-evidence'),'signed in may explicitly view saved list');
    assert.match(document.querySelector('[data-account-profile-summary]').textContent,/1 saved/);
    assert.ok(list.includes('Big Five'));
    assert.ok(!list.includes('NEVER_SHOW_PRIVATE_ANSWERS'),'summary must not leak raw answers');
  }else{
    assert.ok(!calls.includes('/api/account-profile-evidence'),'guest must not fetch private evidence');
    assert.equal(list.trim(),'');
  }
  assert.ok(calls.every(x=>x==='/api/auth/session'||x==='/api/account-profile-evidence'));
  console.log('PASS account: '+(authenticated?'verified session + explicit list':'guest no private fetch'));
}
await accountCase(false);
await accountCase(true);

{
  const {document,window}=parseHTML(profile);
  let calls=[];
  const fetch=async url=>{calls.push(String(url));return {ok:true,json:async()=>({authenticated:false,providerConfigured:true})}};
  runInNewContext(file('assets/customer-ui/js/surfaces/profile-account-bridge.js'),{document,window,fetch,console});
  await tick();await tick();
  assert.deepEqual(calls,['/api/auth/session'],'profile status must not read private evidence or auto-save');
  const save=document.querySelector('[data-prf-account-save]');
  assert.equal(save.checked,false,'guest must not have save consent checked');
  assert.equal(save.disabled,true,'guest cannot opt into account persistence');
  assert.equal(document.querySelector('[data-prf-signin-link]').hidden,false);
  console.log('PASS profile guest: no auto-save, explicit authenticated retention required');
}
console.log('PROFILE_BRAND_ACCOUNT_BRIDGE_R1 PASS — isolated DOM checks; not live deployment or production write QA');
