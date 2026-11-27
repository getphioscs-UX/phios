import test from 'node:test';
import assert from 'node:assert/strict';
import {investigateScam,classifyScamQuestion,safeIndicatorURL,inspectScamURL,scamAskResponse,scamSourceDirectory} from '../../functions/external-reality-impact/consumer-scam-navigation.js';
const check=(question,rest={})=>investigateScam({question,explicitCheck:true,now:'2026-11-27T12:00:00Z',...rest});
test('official sources follow explicit countries and unknown never returns MY',()=>{
 for(const jurisdiction of ['MY','SG','US','GB','AU']){const r=check('Someone asks me for my OTP',{jurisdiction});assert(r.sourceReferences.length);assert(r.sourceReferences.every(s=>s.jurisdiction===jurisdiction));assert.equal(r.jurisdiction,jurisdiction);}
 for(const jurisdiction of [undefined,null,{},'DE','unknown','']){const r=check('Someone asks me for my OTP',{jurisdiction});assert.equal(r.jurisdiction,'UNKNOWN');assert.deepEqual(r.sourceReferences,[]);assert(!JSON.stringify(r).includes('997'));assert(r.actions.some(a=>a.id==='LOCAL_COVERAGE_UNKNOWN'));}
 assert.equal(check('suspicious',{jurisdiction:'uk'}).jurisdiction,'GB');assert.deepEqual(scamSourceDirectory(),[]);
 const cross=check('suspicious',{jurisdiction:'MY',bankJurisdiction:'SG',eventJurisdiction:'DE'});assert.deepEqual(cross.jurisdictions,['MY','SG']);assert(cross.unknowns.length>=4);
});
test('requested action is separate from reported exposure in English and Chinese',()=>{
 for(const question of ['They ask me to pay before I withdraw investment profits. I have not paid or shared my OTP.','有人要求我先转账才能提取投资盈利，我还没转账。','They ask me to install AnyDesk. I have not installed it.','如果我已经转账，应该怎么办？','If I have paid a scammer, what should I do?']){assert.deepEqual(check(question).exposures,[],question);}
 const cases=[['I have shared my OTP.','CREDENTIALS_SHARED'],['I have installed the remote access app.','APP_INSTALLED'],['I already shared my screen.','SCREEN_SHARED'],['我已经转账。','PAID_OR_LOST'],['对方要求付款，我已经付款。','PAID_OR_LOST'],['我已经提供了密码。','CREDENTIALS_SHARED'],['我已经安装了可疑应用。','APP_INSTALLED'],['我已经共享屏幕。','SCREEN_SHARED'],['I sent my passport.','IDENTITY_SHARED']];
 for(const [q,code]of cases)assert(check(q).exposures.includes(code),q);
});
test('simultaneous exposures produce all protective actions in safe order',()=>{
 const r=check('I already paid. I shared my OTP. I installed a remote access app. I shared my screen.',{jurisdiction:'SG'});
 assert.deepEqual(new Set(r.exposures),new Set(['PAID_OR_LOST','CREDENTIALS_SHARED','APP_INSTALLED','SCREEN_SHARED']));
 assert.deepEqual(r.actions.slice(0,3).map(a=>a.id),['ISOLATE_DEVICE','CONTACT_PAYMENT_PROVIDER','SECURE_ACCOUNTS']);assert(!r.answer.includes('997'));
 const selected=check('Please help me check this',{exposure:['IDENTITY_SHARED','CREDENTIALS_SHARED']});assert(selected.actions.some(a=>a.id==='IDENTITY_PROTECTION'));
});
test('existing and additional observable patterns remain usable across locales',()=>{
 const cases=[['有人要求我先转账才能提取投资盈利。','ADVANCE_FEE_WITHDRAWAL_RISK'],['The platform says I must pay first before I withdraw investment profits.','ADVANCE_FEE_WITHDRAWAL_RISK'],['Someone asks me to share my OTP code.','CREDENTIAL_AND_ACCOUNT_TAKEOVER'],['Someone asks me to install an unknown.apk and open my banking app.','SCREEN_SHARING_AND_REMOTE_ACCESS'],['I paid a recovery agent an upfront fee to recover lost money.','RECOVERY_AND_REFUND_SCAM'],['They guarantee investment returns if I transfer money.','GUARANTEED_RETURN_RISK'],['Someone threatens to harm my family unless I pay to remove a curse.','SPIRITUAL_COERCION_RISK'],['My partner threatens to leave unless I transfer money.','ROMANCE_FINANCIAL_COERCION_RISK'],['Someone guarantees payment will cure my illness.','GUARANTEED_OUTCOME_PAYMENT_RISK'],['The police caller told me to transfer money to a safe account.','SAFE_ACCOUNT_IMPERSONATION'],['The platform says investment profits are frozen until a tax payment is made.','ADVANCE_FEE_WITHDRAWAL_RISK'],['平台说要补税才能提取投资盈利。','ADVANCE_FEE_WITHDRAWAL_RISK'],['招聘平台要求我先充值才能拿佣金。','JOB_AND_TASK_DEPOSIT'],['A supplier emailed a changed bank account for their invoice.','BUSINESS_PAYMENT_REDIRECTION']];
 for(const [q,domain]of cases)for(const locale of ['en','zh-Hans'])assert(check(q,{locale}).indicators.reportedIndicators.some(i=>i.kind===domain),q);
});
test('ordinary transactions and explicit denials never become a safety certificate',()=>{
 for(const q of ['My company has profit but no cash to withdraw.','The platform says I do not need to pay fees before I withdraw investment profits.','平台说我无需先付款即可提取投资盈利。','I paid an ordinary invoice.','My bank says never share your OTP.','A voluntary course fee costs 100.','They do not guarantee investment returns if I transfer money.','Someone did not ask me to share my OTP.','银行没有要求我提供验证码。'])assert.equal(classifyScamQuestion(q),null,q);
 const r=check('Is this genuine?');assert.equal(r.domain,'INFORMATION_INSUFFICIENT');assert.equal(r.sourceLookup.emptyResultMeansSafe,false);assert.match(r.assessment,/not a safety clearance/);
});
test('submitted URLs are structural observations only; secrets and local addresses rejected',()=>{
 for(const url of ['https://127.0.0.1/','https://[::1]/','https://user:password@example.com/','https://a.local/','https://a.localhost/','http://example.com/','javascript:alert(1)','https://example.com:8080/'])assert.equal(safeIndicatorURL(url),null,url);
 assert.equal(safeIndicatorURL('https://merchant.example/private?password=123#otp'),'https://merchant.example');
 assert(inspectScamURL('https://xn--pple-43d.com/').flags.length);
 const r=check('Check https://merchant.example/private?password=123#otp');assert.equal(r.indicators.urls[0].reputation,'NOT_CHECKED');assert.equal(r.indicators.urls[0].fetched,false);assert(!JSON.stringify(r).includes('password=123'));
});
test('freshness never presents stale or invalid dates as current and output avoids raw secrets',()=>{
 for(const now of ['2027-02-01','invalid','2026-11-01']){const stale=check('suspicious',{jurisdiction:'SG',now});assert.equal(stale.sourceCoverage.freshness,'REVALIDATION_REQUIRED');assert(!stale.actions.some(a=>a.text.includes('1799')));assert(stale.actions.some(a=>a.id==='RECHECK_LOCAL_CONTACTS'));}
 const r=check('I shared my password TOP_SECRET. Check https://example.com/path?token=SECRET');const response=scamAskResponse(r,{question:'TOP_SECRET',locale:'en'});assert(!JSON.stringify(response).includes('TOP_SECRET'));assert(!JSON.stringify(response).includes('token=SECRET'));
 for(const q of ['hello','someone asks for my OTP','I already paid a recovery agent']){const r=check(q);assert.equal(r.governance.providerCalls,0);assert.equal(r.governance.externalFetches,0);assert.equal(r.governance.persisted,false);assert.equal(r.pattern.identityOrGuiltEstablished,false);}
});
