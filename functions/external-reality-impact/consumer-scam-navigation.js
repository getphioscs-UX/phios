// Explicit contract upgrade: existing External Reality projection; no second engine or case store.
export const SCAM_CONTRACT='EXTERNAL_REALITY_CONSUMER_SCAM_R5';
const reviewedAt='2026-11-27';
const source=(sourceId,jurisdiction,publisher,url,purpose,scope=jurisdiction)=>Object.freeze({sourceId,jurisdiction,publisher,url,purpose,scope,sourceClass:'OFFICIAL_PRIMARY',permission:'DIRECT_LINK_ONLY',connection:'CURATED_REFERENCE_NOT_LIVE_LOOKUP',verifiedAt:reviewedAt,apiAuthorized:false});
export const scamSources=Object.freeze([
 source('BNM-SCAM-RESPONSE','MY','Bank Negara Malaysia','https://www.bnm.gov.my/faqs/scams','Contact bank immediately; NSRC 997 and police reporting'),
 source('PDRM-SEMAK-MULE','MY','Royal Malaysia Police','https://semakmule.rmp.gov.my/','User-initiated official portal; no API authorization; empty result is not safety proof'),
 source('SC-ADVANCE-FEE-WITHDRAWAL','MY','Securities Commission Malaysia','https://www.sc.com.my/investor-empowerment/scam-meter','Advance payment demands and clone investment firms'),
 source('SC-INVESTMENT-CHECKER','MY','Securities Commission Malaysia','https://www.sc.com.my/investment-checker','User-initiated capital market authorization check'),
 source('SG-SCAMSHIELD','SG','ScamShield','https://www.scamshield.gov.sg/','Scam assistance; helpline 1799'),
 source('SG-MAS-FID','SG','Monetary Authority of Singapore','https://eservices.mas.gov.sg/fid','Check institution, permitted activity and official contacts'),
 source('SG-MAS-REP','SG','Monetary Authority of Singapore','https://eservices.mas.gov.sg/rr','Check appointed representative; separately confirm identity'),
 source('US-FTC-RESPONSE','US','Federal Trade Commission','https://consumer.ftc.gov/articles/what-do-if-you-were-scammed','Payment, credential and device exposure response'),
 source('GB-REPORT-FRAUD','GB','Report Fraud','https://www.reportfraud.police.uk/','Reporting in England, Wales and Northern Ireland; Scotland uses police 101','England, Wales and Northern Ireland; Scotland: police 101'),
 source('GB-FCA-CHECK','GB','Financial Conduct Authority','https://www.fca.org.uk/consumers/how-check-firm-individual-authorised','Authorization and permitted services'),
 source('GB-FCA-CLONE','GB','Financial Conduct Authority','https://www.fca.org.uk/consumers/clone-firms-individuals','Independently check genuine contacts; real registration can be copied'),
 source('AU-ASIC-RESPONSE','AU','ASIC Moneysmart','https://moneysmart.gov.au/check-and-report-scams/what-to-do-if-youve-been-scammed','Payment, identity and device exposure; reporting through Scamwatch')
]);
export const scamJurisdictions=Object.freeze(['MY','SG','US','GB','AU']);
export function normalizeScamJurisdiction(value){
 if(typeof value!=='string')return 'UNKNOWN';
 const code=value.trim().toUpperCase();return code==='UK'?'GB':scamJurisdictions.includes(code)?code:'UNKNOWN';
}
export function scamSourceDirectory(jurisdiction){const code=normalizeScamJurisdiction(jurisdiction);return scamSources.filter(s=>s.jurisdiction===code);}
const normalized=q=>String(q??'').normalize('NFKC').replace(/[轉帳匯款驗證碼密遠與開關詐騙資損無繳]/g,c=>({'轉':'转','帳':'账','匯':'汇','驗':'验','證':'证','碼':'码','遠':'远','與':'与','開':'开','關':'关','詐':'诈','騙':'骗','資':'资','損':'损','無':'无','繳':'缴'}[c]||c)).replace(/\s+/g,' ').slice(0,4000);
// Remove negated action clauses only when determining what the user has done.
// A request from somebody else may still be risky even when the user has not acted.
const affirmative=q=>q.replace(/\bbut\b|但是|但/gi,';').replace(/\b(?:I |we )?(?:have not|haven't|did not|didn't|never|not yet)[^,.;!?，。；]*(?=[,.;!?，。；]|$)|(?:没有|尚未|未曾|不曾|还没|未(?:付款|转账|汇款|交出|提供|分享|发送|泄露|安装|共享))[^,，。；!?]*(?=[,，。；!?]|$)/gi,'');
const secret=/\botp\b|password|credential|验证码|密码|登录凭证/i;
const money=/\bpay(?:ing|ment|ments)?\b|money|fee|charg|transfer|付钱|付款|费用|收费|转账|汇款|打款|支付|捐款|借钱/i;
function sharedCredentials(q){
 const acted=affirmative(q).replace(/password[- ]reset (?:request|email|link)/gi,'');
 return /(?:\bI\b|\bwe\b|I've).{0,45}(?:gave|shared|sent|provided|disclosed|entered).{0,30}(?:\botp\b|password|credential)/i.test(acted)||/(?:我|我们).{0,12}已(?:经)?.{0,12}(?:交出|分享|提供|发送|泄露|透露|发给|告诉).{0,20}(?:密码|验证码|OTP)|(?:我|我们).{0,12}(?:交出|分享|提供|发送|泄露|透露|发给|告诉)了.{0,20}(?:密码|验证码|OTP)/i.test(acted);
}
function credentialRisk(q){
 return secret.test(q)&&(/(?:someone|somebody|they|he|she|caller|stranger|agent|official|bank|merchant).{0,100}(?:ask|request|demand|want|tell|need).{0,60}(?:share|send|give|provid|disclos|enter|password|\botp\b|credential)/i.test(q)||/(?:someone|they|有人|对方|他|她|来电|客服|商家|银行|政府人员).{0,60}(?:要求|索取|索要|让我|叫我).{0,40}(?:提供|交出|发送|告诉|输入|密码|验证码|OTP)/i.test(q)||sharedCredentials(q));
}
function remoteRisk(q){
 const access=/screen.?shar|shar(?:e|ed|ing).{0,12}screen|remote.?access|remote.?control|anydesk|teamviewer|共享屏幕|屏幕共享|远程控制|远控|\.apk\b/i.test(q);
 return access&&(/(?:someone|they|caller|merchant|stranger|food.{0,15}(?:order|ad)).{0,80}(?:ask|request|tell|sent)|(?:有人|对方|商家|客服|餐饮广告|订餐).{0,40}(?:要求|让我|叫我|发来)|suspicious|unknown\.apk|陌生|可疑|bank(?:ing)? app|银行应用/i.test(q)||/(?:I|we).{0,30}(?:installed|shared)|(?:我|已).{0,12}(?:安装|共享)/i.test(affirmative(q)));
}
// A reported third-party pay-first request is separate from ordinary withdrawal planning.
function advanceFeeWithdrawalRisk(q){
 const investment=/invest|profit|returns?|earnings?|投资|投資|盈利|收益|回报|回報/i.test(q);
 const request=/(?:someone|somebody|they|platform|broker|agent|caller).{0,70}(?:ask|say|said|tell|told|demand|require|insist|want)|(?:有人|对方|對方|平台|客服|经纪|經紀).{0,40}(?:要求|说|說|让我|讓我|叫我|告知|表示)/i.test(q);
 const sequence=/(?:pay|transfer|deposit|send).{0,70}(?:before|first|to unlock|to withdraw).{0,70}(?:withdraw|release|unlock|profits?|returns?|earnings?)|(?:first|upfront).{0,30}(?:pay|transfer|deposit).{0,70}(?:withdraw|release|unlock)|(?:先|预先|預先|额外|額外).{0,25}(?:转账|轉帳|汇款|匯款|付|缴|繳|支付).{0,45}(?:才能|才可|才会|才會|方可|以便).{0,25}(?:提取|提款|提现|提現|解锁|解鎖|取出|发放|發放)/i.test(q);
 const indirect=/(?:profits?|earnings?|returns?).{0,50}(?:frozen|locked|withheld).{0,50}(?:until|unless).{0,35}(?:tax|fee|deposit|payment)|(?:tax|clearance|verification|release).{0,15}(?:fee|payment).{0,35}(?:required|demanded).{0,45}(?:withdraw|release|unlock)|(?:补税|解冻费|认证费|保证金).{0,25}(?:才能|才可).{0,20}(?:提取|提现|提款|解冻)/i.test(q);
 const negatedRequest=/(?:someone|they|platform|broker|agent).{0,40}(?:say|said|tell|told|confirm).{0,35}(?:do not need|don.t need|not required|no need|not to|don.t have to|do not have to).{0,25}(?:pay|transfer|deposit)|(?:有人|对方|對方|平台|客服).{0,20}(?:说|說|表示|告知).{0,15}(?:不需要|无需|無需|不必|不要|不要求).{0,20}(?:先|付|转账|轉帳|缴|繳)/i.test(q);
 return investment&&request&&(sequence||indirect)&&!negatedRequest;
}
const rules=[
 ['RECOVERY_AND_REFUND_SCAM',{test:q=>(/recover|recovery|追回|追讨/i.test(q)&&money.test(q)&&/upfront|advance|before|first|agent|demands?|要求|代理|先|才能|预付/i.test(q))||/退款.{0,15}(?:先|预付).{0,15}(?:费|付款)|refund.{0,30}(?:upfront|advance).{0,15}(?:fee|payment)/i.test(q)}],
 ['CREDENTIAL_AND_ACCOUNT_TAKEOVER',{test:credentialRisk}],
 ['SCREEN_SHARING_AND_REMOTE_ACCESS',{test:remoteRisk}],
 ['UNAUTHORIZED_FINANCIAL_TRANSACTION',{test:q=>/\b(?:I|we).{0,30}(?:lost money|was scammed|were scammed)|unauthori[sz]ed.{0,25}(?:transaction|transfer|charge|payment)|不明扣款|未经授权.{0,15}(?:扣款|转账|付款)|(?:我|已经|已).{0,12}(?:损失|被骗|汇款给骗子)|钱.{0,5}(?:被骗|没了)/i.test(affirmative(q))}],
 ['SPIRITUAL_COERCION_RISK',{test:q=>money.test(q)&&(/(?:remov|clear|lift|cleanse).{0,30}(?:curse|karma)|(?:解除|消除|清除|化解).{0,12}(?:业障|诅咒)/i.test(q)||(/curse|karma|luck|spiritual|teacher|业障|诅咒|好运|导师|仪式/i.test(q)&&/family.{0,30}(?:suffer|harm|die)|unless|lose.{0,15}luck|家人.{0,12}(?:出事|灾|死)|不付.{0,20}(?:失去|灾|好运)/i.test(q)))}],
 ['GUARANTEED_RETURN_RISK',{test:q=>/guarantee|保证|保本|稳赚/i.test(q)&&/invest|return|profit|投资|回报|收益/i.test(q)&&money.test(q)}],
 ['ROMANCE_FINANCIAL_COERCION_RISK',{test:q=>/partner|romance|dating|boyfriend|girlfriend|网恋|恋人|对象|伴侣/i.test(q)&&money.test(q)&&/threat|unless|pressure|威胁|分手|施压/i.test(q)}],
 ['GUARANTEED_OUTCOME_PAYMENT_RISK',{test:q=>money.test(q)&&/guarantee|保证|包治|必定/i.test(q)&&/cure|illness|health|wealth|marriage|relationship|疾病|治好|健康|财富|婚姻|挽回/i.test(q)}],
 ['PHISHING_AND_IMPERSONATION',/(?:someone|caller|they).{0,60}(?:phish|impersonat|posing as)|有人.{0,20}(?:冒充|假冒)|(?:可疑|陌生).{0,15}(?:钓鱼|链接)/i],
 ['CONSUMER_SCAM',/(?:I|we).{0,25}(?:suspect|think).{0,30}(?:scam|fraud)|(?:我怀疑|疑似|可疑).{0,30}(?:诈骗|骗钱|短信|链接|付款)/i]
];

const additionalRules=[
 ['ADVANCE_FEE_WITHDRAWAL_RISK',{test:advanceFeeWithdrawalRisk}],
 ['SAFE_ACCOUNT_IMPERSONATION',{test:q=>/(?:they|caller|police|official|bank).{0,90}(?:ask|tell|told|instruct|demand).{0,50}(?:transfer|move|send).{0,70}(?:safe|secure|protect|investigat)|(?:警察|警方|银行|客服|对方).{0,40}(?:要求|叫我|让我).{0,30}(?:转账|汇款|转移).{0,35}(?:安全账户|保护资金|调查)/i.test(q)}],
 ['JOB_AND_TASK_DEPOSIT',{test:q=>/(?:job|recruit|task|commission|工作|招聘|刷单|任务|佣金)/i.test(q)&&/(?:they|recruiter|platform|employer|对方|招聘|平台).{0,65}(?:ask|require|demand|tell|要求|让我|叫我)/i.test(q)&&/(?:pay|deposit|top.?up|recharge|付|转账|充值|垫付|缴费)/i.test(q)}],
 ['BUSINESS_PAYMENT_REDIRECTION',{test:q=>/(?:supplier|vendor|invoice|供应商|发票|货款)/i.test(q)&&/(?:changed?|new|different|更改|变更|新的|换了).{0,30}(?:bank|account|payment|银行|账户|账号)|(?:bank|account|payment|银行|账户|账号).{0,30}(?:changed?|new|different|更改|变更|换了)/i.test(q)}]
];
function riskAssertions(text){
 return text.replace(/(?:someone|somebody|they|he|she|caller|stranger|agent|official|bank|merchant).{0,25}\b(?:did not|didn't|does not|doesn't|do not|don't|never|has not|hasn't)\s+(?:ask|request|demand|require|want|tell)[^,.;!?，。；]*/gi,'').replace(/(?:有人|对方|银行|客服|商家).{0,12}(?:没有|并未|不曾|从未)(?:要求|索取|索要|让我|叫我)[^,，。；!?]*/g,'').replace(/\b(?:not guaranteed|no guaranteed|no guarantee|do not guarantee|don't guarantee)\b/gi,'unassured').replace(/(?:不保证|不保本|不承诺保本)/g,'不确定');
}
function matchedRules(text){
 const asserted=riskAssertions(text);
 return [...new Set([...rules,...additionalRules].filter(([,r])=>r.test(asserted)).map(([id])=>id))];
}
export function classifyScamQuestion(q=''){return matchedRules(normalized(q))[0]||null;}
// Extraction only. Submitted URLs are never fetched, embedded, or rendered as links.
export function safeIndicatorURL(value){try{const u=new URL(value);if(u.protocol!=='https:'||u.username||u.password||u.port&&u.port!=='443')return null;const h=u.hostname.toLowerCase();if(!h.includes('.')||h==='localhost'||h.endsWith('.local')||h.endsWith('.internal')||h.endsWith('.localhost')||h.endsWith('.arpa')||h.includes(':')||/^\d+(\.\d+){3}$/.test(h)||/\.(test|invalid)$/.test(h))return null;return u.origin;}catch{return null;}}
export function inspectScamURL(value){
 const origin=safeIndicatorURL(value);let parsed;try{parsed=new URL(value);}catch{}
 const flags=[];
 if(!origin)flags.push('UNSAFE_OR_UNSUPPORTED_URL');
 if(parsed?.username||parsed?.password)flags.push('EMBEDDED_CREDENTIALS');
 if(parsed?.hostname.includes('xn--'))flags.push('INTERNATIONALIZED_DOMAIN_REQUIRES_MANUAL_CHECK');
 if(parsed&&parsed.protocol!=='https:')flags.push('NON_HTTPS');
 return {value:origin,state:origin?'UNVERIFIED_DOMAIN_PATH':'REJECTED_UNSAFE_URL',flags,evidenceClass:'USER_SUBMISSION',reputation:'NOT_CHECKED',fetched:false};
}
const exposureCodes=['PAID_OR_LOST','CREDENTIALS_SHARED','APP_INSTALLED','SCREEN_SHARED','IDENTITY_SHARED'];
export function validScamExposure(value){return value===undefined||(Array.isArray(value)&&value.length<=5&&value.every(x=>exposureCodes.includes(x)));}
function detectedExposure(q){
 const text=affirmative(q).replace(/\b(?:if|suppose|imagine)\b[^.;!?。；]*/gi,'').replace(/(?:如果|假如|假设)[^。；!?]*/g,'');
 const out=[];
 const clauses=text.split(/[,.;!?，。；！？]|\bbut\b|但是/gi);
 const firstPerson=clauses.filter(c=>/^\s*(?:I(?:'ve|'d)?|we(?:'ve|'d)?|我|我们|已经|已)/i.test(c));
 if(firstPerson.some(c=>/^\s*(?:I|we)(?:'ve|'d)?(?:\s+(?:have|had|already|just|previously|actually))*\s+(?:paid|transferred|sent money|lost money|was scammed|were scammed)\b/i.test(c)||/^\s*(?:(?:我|我们)?(?:今天|昨天|刚才)?(?:已经|早已|已|刚刚|刚)(?:付款|支付|转账|汇款|损失)|(?:我|我们)(?:今天|昨天|刚才)?(?:(?:付款|支付|转账|汇款)了|付了款|转了(?:账|钱)|汇了款))/i.test(c))||/unauthori[sz]ed.{0,20}(?:transaction|transfer|charge)|不明扣款|未经授权.{0,15}(?:扣款|转账)/i.test(text))out.push('PAID_OR_LOST');
 if(sharedCredentials(text))out.push('CREDENTIALS_SHARED');
 if(firstPerson.some(c=>/^\s*(?:I|we)(?:'ve)?(?:\s+(?:have|already|just))*\s+installed\b.{0,60}(?:app|apk|anydesk|teamviewer|remote)|^\s*(?:我|我们|已经|已).{0,10}(?:安装了|已安装|已经安装)|^\s*(?:已经|已)安装/i.test(c)))out.push('APP_INSTALLED');
 if(firstPerson.some(c=>/^\s*(?:I|we)(?:'ve)?(?:\s+(?:have|already|just))*\s+shared.{0,20}screen|^\s*(?:我|我们|已经|已).{0,10}(?:已经|已|正在|了).{0,10}(?:共享|分享|屏幕)|^\s*(?:我|我们)共享了屏幕/i.test(c)))out.push('SCREEN_SHARED');
 if(firstPerson.some(c=>/^\s*(?:I|we)(?:'ve)?(?:\s+(?:have|already|just))*\s+(?:sent|shared|provided|uploaded).{0,30}(?:passport|identity document|ID card)|^\s*(?:我|我们).{0,10}(?:已|了).{0,10}(?:身份证|护照)/i.test(c)))out.push('IDENTITY_SHARED');
 return [...new Set(out)];
}
export function investigateScam({question='',locale='en',jurisdiction,bankJurisdiction,eventJurisdiction,exposure,explicitCheck=false,now=new Date().toISOString()}={}){
 const text=normalized(question),matches=matchedRules(text),inferred=detectedExposure(text);
 if(!matches.length&&!explicitCheck)return null;
 const domain=matches[0]||'INFORMATION_INSUFFICIENT',zh=locale==='zh-Hans',pair=(en,cn)=>zh?cn:en;
 const selected=validScamExposure(exposure)?exposure||[]:[];
 const exposures=[...new Set([...inferred,...selected])];
 const stage=exposureCodes.find(x=>exposures.includes(x))||'NOT_CONFIRMED_ACTED';
 const jurisdictions=[...new Set([jurisdiction,bankJurisdiction,eventJurisdiction].map(normalizeScamJurisdiction).filter(x=>x!=='UNKNOWN'))];
 const country=normalizeScamJurisdiction(jurisdiction);
 const sourceReferences=scamSources.filter(s=>jurisdictions.includes(s.jurisdiction));
 const urls=[...text.matchAll(/https?:\/\/[^\s<>"']+/g)].slice(0,8).map(m=>inspectScamURL(m[0]));
 const phoneCount=[...text.matchAll(/(?:\+\d[\d ()-]{6,18}\d|\b0\d[\d -]{6,12}\d)/g)].length;
 const domainGuidance={
  ADVANCE_FEE_WITHDRAWAL_RISK:pair('A request to pay or transfer more money before releasing alleged investment profits is a risk signal. Pause the payment and independently verify the request through the regulator or an independently obtained official contact. Neither the profit nor the requester’s legitimacy has been established.','要求先付款或转账，才能提取对方声称的投资盈利，是需要警惕的风险信号。先暂停付款，通过监管机构或独立取得的官方联系方式核实；盈利是否真实、对方是否可信，都尚未得到确认。'),
  RECOVERY_AND_REFUND_SCAM:pair('An upfront recovery fee before returning lost funds is a further financial risk. Pause any further payment, verify the claim independently and keep the messages privately. Recovery is not guaranteed.','要求先付费用才能追回损失，是进一步的资金风险。暂停继续付款，独立核实追回款项的说法，并私下保留消息；追回没有保证。'),
  SPIRITUAL_COERCION_RISK:pair('Threats about curses, karma or harm to family can create payment pressure; they do not establish that a curse is real. Pause payment and discuss the demand with someone you trust. Belief or a voluntary course fee alone does not establish fraud.','用业障、诅咒或家人受害施压付款，是需要警惕的行为，不能证明诅咒真实存在。暂停付款，和可信的人一起核对要求；信仰或自愿课程收费本身不能证明诈骗。'),
  GUARANTEED_RETURN_RISK:pair('A guaranteed investment return combined with pressure to transfer money is a risk signal. Pause the transfer and independently verify the investment and the claimed authority. No return or recovery is guaranteed.','保证投资回报并催促转账，是风险信号。暂停转账，独立核实投资及对方声称的资质；收益和追回资金都没有保证。'),
  ROMANCE_FINANCIAL_COERCION_RISK:pair('Threatening a relationship to pressure you to borrow or transfer money is financial pressure. Pause payment, avoid borrowing under pressure and seek trusted support. This does not establish criminal guilt.','以关系或分手施压，要求借钱或转账，是需要警惕的经济施压。暂停付款，避免在压力下借款，寻求可信支持；这不等于确认对方犯罪。'),
  GUARANTEED_OUTCOME_PAYMENT_RISK:pair('A guarantee that paying will cure illness or restore a relationship is not evidence of that outcome. Pause payment and verify the claim independently; do not let a promised ritual replace appropriate health care or real relationship decisions.','付钱就能保证治病或挽回婚姻的说法，不是结果的证据。暂停付款并独立核实，不让仪式承诺取代适当医疗或现实关系决策。'),
  CREDENTIAL_AND_ACCOUNT_TAKEOVER:pair('Do not give passwords, OTP codes or banking credentials to the requester. Verify the request through an independently obtained official channel.','不要向索取者提供密码、OTP 验证码或银行凭证。通过独立取得的官方渠道核实要求。'),
  SCREEN_SHARING_AND_REMOTE_ACCESS:pair('Do not install an unfamiliar APK or start the requested screen sharing or remote access while opening a bank app. Stop suspicious access and use a trusted device to contact your bank if information was exposed.','不要安装陌生 APK，或按要求共享屏幕、远程控制后打开银行应用。停止可疑连接；如资料暴露，使用可信设备联系银行。'),
  PHISHING_AND_IMPERSONATION:pair('Verify the claimed identity through an independently obtained official contact. Do not transfer money or disclose credentials based on that claim.','通过独立取得的官方联系方式核实身份，不要仅凭对方声称的身份转账或提供凭证。')
 };

 const extraGuidance={
 SAFE_ACCOUNT_IMPERSONATION:pair('A request to move funds to a “safe account” for an alleged investigation is a serious warning sign. End the call and contact your bank independently.','以调查或保护资金为由，要求转入“安全账户”，是严重风险信号。结束通话，独立联系银行。'),
 JOB_AND_TASK_DEPOSIT:pair('A job or task platform asking you to top up money or pay before releasing earnings is a risk signal. Pause payment and verify the employer independently.','工作或任务平台要求先充值、垫付或付款才能领取收入，是风险信号。暂停付款，独立核实雇主。'),
 BUSINESS_PAYMENT_REDIRECTION:pair('A changed supplier payment account may be legitimate or may indicate invoice interception. Verify with a known contact using previously trusted details before paying.','供应商收款账户变更可能真实，也可能涉及发票截取。付款前，使用原先可信的联系方式向熟悉的联系人核实。'),
 INFORMATION_INSUFFICIENT:pair('This description does not establish a specific fraud pattern. That is not a safety clearance. Check the requested action, identity, payment destination and independent evidence before deciding.','现有描述不足以确认具体诈骗模式，这不代表安全。作决定前，核对对方要求、身份、收款方及独立证据。')
 };
 const assessment=domainGuidance[domain]||extraGuidance[domain]||pair('The reported request may expose money, accounts or devices. Verify independently.','描述的要求可能使资金、账户或设备暴露，请独立核实。');
 const time=Date.parse(now);const stale=sourceReferences.some(s=>!Number.isFinite(time)||time<Date.parse(s.verifiedAt)||time-Date.parse(s.verifiedAt)>30*86400000);
 const actions=[];const add=(id,en,cn)=>actions.push({id,text:pair(en,cn)});
 if(exposures.includes('APP_INSTALLED')||exposures.includes('SCREEN_SHARED'))add('ISOLATE_DEVICE','Stop screen sharing or remote access; disconnect the affected device from the internet. Use a separate trusted device for banking and account recovery.','停止共享屏幕或远程访问，断开受影响设备的网络。使用另一台可信设备联系银行及恢复账户。');
 if(exposures.includes('PAID_OR_LOST'))add('CONTACT_PAYMENT_PROVIDER','Contact the bank, card issuer, payment service or exchange you used immediately through independently verified contact details. Ask whether the payment can be stopped or recalled; recovery is not guaranteed.','立即使用独立核实的联系方式联系原付款银行、发卡行、支付服务或交易平台，询问能否停止或撤回交易；追回没有保证。');
 if(exposures.includes('CREDENTIALS_SHARED'))add('SECURE_ACCOUNTS','From a trusted device, contact the affected service, reset exposed and reused passwords, revoke unfamiliar sessions and enable multi-factor authentication. Do not share more codes.','使用可信设备联系受影响服务，更改泄露及重复使用的密码，撤销陌生会话并启用多重验证；不要再提供验证码。');
 if(exposures.includes('IDENTITY_SHARED'))add('IDENTITY_PROTECTION','Tell affected financial institutions that identity documents were disclosed and ask about account and identity protection. Monitor unfamiliar accounts and transactions.','告知受影响金融机构证件资料已经泄露，询问账户与身份保护措施，留意陌生账户和交易。');
 add('PAUSE_AND_VERIFY','Pause further payments and sensitive disclosures. Verify identity and the request using an independently obtained official contact, not a number or link supplied by the requester.','暂停进一步付款及敏感资料披露。使用独立取得的官方联系方式核实身份与要求，不使用对方提供的号码或链接。');
 if(jurisdictions.includes('MY')&&!stale)add('MY_OFFICIAL_HELP','Malaysia: for suspected financial loss contact your bank immediately or NSRC 997, and make a police report. Do not wait for a website result.','马来西亚：怀疑资金受骗时立即联系银行或 NSRC 997，并向警方报案；不要等待网站查询结果。');
 if(jurisdictions.includes('SG')&&!stale)add('SG_OFFICIAL_HELP','Singapore: contact your bank immediately if money or accounts are exposed. ScamShield 1799 provides scam assistance; use official police reporting channels.','新加坡：资金或账户暴露时立即联系银行。ScamShield 1799 提供反诈骗协助，报案请使用警方官方渠道。');
 if(jurisdictions.includes('GB')&&!stale)add('GB_OFFICIAL_HELP','United Kingdom: Report Fraud covers England, Wales and Northern Ireland. In Scotland report to police via 101. Contact your payment provider first when money is exposed.','英国：Report Fraud 适用于英格兰、威尔士及北爱尔兰；苏格兰通过 101 向警方报案。资金暴露时优先联系付款机构。');
 if(stale)add('RECHECK_LOCAL_CONTACTS','Country contact references require revalidation. Use your bank’s verified channel immediately and check the linked official websites for current local reporting details.','国家联系方式需要重新核实。立即使用银行的可信渠道，并在链接的官方网站确认当前本地举报方式。');
 if(!jurisdictions.length)add('LOCAL_COVERAGE_UNKNOWN','Country-specific sources have not been verified for your location. Use your bank’s official app, card or independently obtained contact and local police or consumer protection authority.','尚未核实你所在地的专属来源。使用银行官方应用、卡背或独立取得的联系方式，联系银行及当地警方或消费者保护机构。');
 add('KEEP_EVIDENCE','Privately keep original messages, transaction references and a timeline. Do not send more money to someone promising recovery for an upfront fee.','私下保存原始消息、交易编号和时间线。不要向声称先收费才能追回款项的人继续付款。');
 const unknowns=[pair('Requester identity, authorization for the specific service, payment destination and claims remain unverified. A genuine company registration does not establish a genuine representative.','对方身份、特定服务授权、收款方及主张仍未核实；公司真实登记不证明联系你的人真实。'),pair('A missing warning or an empty search result does not prove safety.','没有警告或查询无记录不代表安全。')];
 const unknownCountry=[jurisdiction,bankJurisdiction,eventJurisdiction].some(v=>v&&v!=='UNKNOWN'&&normalizeScamJurisdiction(v)==='UNKNOWN');
 if(unknownCountry)unknowns.push(pair('At least one relevant country is outside the verified directory; consult its local official channels.','至少一个相关国家尚未覆盖，请咨询当地官方渠道。'));
 if(jurisdictions.length>1)unknowns.push(pair('Cross-border event: these are country references, not a determination of legal jurisdiction or reimbursement rights.','跨国事件：这些是相关国家的参考渠道，不代表已经确定法律管辖权或赔偿权利。'));

 const limitations=[pair('Rule-based text and URL structure review only. No live phone, website reputation, company, case, image or document authenticity check was performed.','仅进行规则文本与网址结构核对；未执行实时电话、网站信誉、公司、案件、图片或文件真伪查询。'),pair('Risk signals are not a criminal finding or a guarantee of safety. Complex wording can be missed; verify independently.','风险信号不是犯罪认定或安全保证；复杂表达可能漏判，请独立核实。')];
 if(stale)limitations.push(pair('Official reference review is overdue or its date cannot be established. Recheck the official website before relying on contact details.','官方来源复核已过期或日期无法确认，使用联系方式前请重新核对官方网站。'));
 const guidanceText=actions.map((a,i)=>`${i+1}. ${a.text}`).join('\n');
 return {schemaVersion:SCAM_CONTRACT,domain,jurisdiction:country,jurisdictions,stage,exposures,exposureBasis:{inferred,selected,verification:'USER_REPORT_NOT_INDEPENDENTLY_VERIFIED'},state:'PATTERN_HYPOTHESIS_NOT_INCIDENT_VERIFICATION',indicators:{reportedIndicators:matches.map(kind=>({kind,evidenceClass:'USER_SUBMISSION',verification:'UNVERIFIED',personalFact:false})),urls,phoneCount,phoneLookup:'NOT_CONNECTED',secrets:'NOT_RETAINED',rawTextPersisted:false},sourceLookup:{state:'LIVE_SOURCE_UNAVAILABLE',performed:false,reason:'NO_AUTHORIZED_CASE_LOOKUP_ADAPTER',emptyResultMeansSafe:false},pattern:{id:domain+'_R5',version:5,jurisdictions:['GLOBAL_BEHAVIORAL_GUIDANCE'],claimClass:'ANALYTIC_INFERENCE',confidence:'UNASSESSED_PATTERN_HYPOTHESIS',identityOrGuiltEstablished:false},sourceReferences,sourceCoverage:{state:jurisdictions.length?'CURATED_COUNTRY_REFERENCES':'LOCAL_REFERENCES_UNVERIFIED',freshness:stale?'REVALIDATION_REQUIRED':sourceReferences.length?'REVIEWED_REFERENCE_NOT_LIVE':'UNKNOWN',reviewedAt},answer:exposures.length?guidanceText:assessment,guidance:exposures.length?assessment:guidanceText,assessment,actions,unknowns,limitations,governance:{providerCalls:0,externalFetches:0,persisted:false,createsPersonalFacts:false,reportFiled:false,bankContacted:false,transactionBlocked:false},handoff:{requiresExplicitContext:true,retentionConsentRequired:true,publicWorldRecordAllowed:false}};
}
export function scamAskResponse(result,{locale='en'}={}){
 const zh=locale==='zh-Hans',sources=result.sourceReferences.map(s=>({label:s.publisher,href:s.url,sourceClass:'OFFICIAL_REFERENCE',scope:s.scope,reviewedAt:s.verifiedAt,freshness:result.sourceCoverage.freshness}));
 return {ok:true,scam:result,view:{surface:'ASK',locale,state:'SCAM_PATTERN_GUIDANCE',question:zh?'核对可疑请求':'Suspicious request review',answer:{text:result.answer+'\n\n'+result.guidance,supporting:[]},basedOn:{sources,statement:zh?'官方参考；未实时核实个案。':'Official references; no live incident verification.'},answerStructure:{basedOnGroups:sources.length?[{sourceClass:'OFFICIAL_REFERENCE',sources}]:[]},limits:{items:[...result.unknowns,...result.limitations]},relatedKnowledge:[],handoff:{available:false}},execution:{generationMode:'DETERMINISTIC',providerCalls:0,providerInvoked:false}};
}
