// R4.2 versioned projection owned by External Reality, not a second evidence graph.
export const SCAM_CONTRACT='EXTERNAL_REALITY_CONSUMER_SCAM_R42';
export const scamSources=Object.freeze([
 {sourceId:'BNM-MOBILE-SCAM',url:'https://www.bnm.gov.my/smsscam',publisher:'Bank Negara Malaysia',sourceClass:'REGULATOR',jurisdiction:'MY',permission:'DIRECT_LINK_ONLY',connection:'CURATED_REFERENCE_NOT_LIVE_LOOKUP',verifiedAt:'2026-10-15',purpose:'Suspicious third-party applications and credential exposure'},
 {sourceId:'BNM-SCAM-RESPONSE',url:'https://www.bnm.gov.my/faqs/scams',publisher:'Bank Negara Malaysia',sourceClass:'REGULATOR',jurisdiction:'MY',permission:'DIRECT_LINK_ONLY',connection:'CURATED_REFERENCE_NOT_LIVE_LOOKUP',verifiedAt:'2026-10-15',purpose:'Contact bank scam hotline / NSRC 997 promptly'},
 {sourceId:'PAYNET-NSRC',url:'https://paynet.my/digital-initiatives/national-fraud-portal.html',publisher:'PayNet',sourceClass:'OFFICIAL_PRIMARY',jurisdiction:'MY',permission:'DIRECT_LINK_ONLY',connection:'CURATED_REFERENCE_NOT_LIVE_LOOKUP',verifiedAt:'2026-10-15',purpose:'NSRC 997 reporting and coordinated response'},
 {sourceId:'PDRM-SEMAK-MULE',url:'https://semakmule.rmp.gov.my/',publisher:'Royal Malaysia Police',sourceClass:'OFFICIAL_PRIMARY',jurisdiction:'MY',permission:'PERMISSION_NOT_VERIFIED_AUTOMATION_DISABLED',connection:'DIRECT_OFFICIAL_PORTAL_ONLY',verifiedAt:'2026-10-15',purpose:'User-initiated official lookup; a complaint or empty result is not guilt or safety proof'}
]);
const normalized=q=>String(q).normalize('NFKC').replace(/\s+/g,' ').slice(0,4000);
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
export function classifyScamQuestion(q=''){const text=normalized(q);return rules.find(([,r])=>r.test(text))?.[0]||null;}
export function safeIndicatorURL(value){try{const u=new URL(value);if(u.protocol!=='https:'||u.username||u.password||u.port&&u.port!=='443')return null;const h=u.hostname.toLowerCase();if(!h.includes('.')||h==='localhost'||h.endsWith('.local')||h.endsWith('.internal')||h.includes(':')||/^\d+(\.\d+){3}$/.test(h)||/\.(localhost|test|invalid)$/.test(h))return null;return u.origin;}catch{return null;}}
function completedPaymentOrLoss(q){
 // A request such as 催我今天转账 is not a completed transfer. Require a
 // clause-level first-person completion report, rather than 我 near 转账.
 const english=/(?:^|[,.;!?])\s*(?:I|we)(?:'ve|'d)?(?:\s+(?:have|had|already|just|previously|actually))*\s+(?:paid|transferred|lost money)\b/i;
 const chinese=/(?:^|[，。；,;!?！？])\s*(?:(?:我|我们)?(?:今天|昨天|刚才)?(?:已经|早已|已|刚刚|刚)(?:付款|支付|转账|汇款|损失)|(?:我|我们)(?:今天|昨天|刚才)?(?:(?:付款|支付|转账|汇款)了|付了款|转了(?:账|钱)|汇了款|损失了钱)|钱(?:已经|已)?(?:转了|没了))/;
 return english.test(q)||chinese.test(q);
}
function exposureStage(q){q=affirmative(q);if(completedPaymentOrLoss(q))return 'PAID_OR_LOST';if(sharedCredentials(q))return 'CREDENTIALS_SHARED';if(/(?:\bI\b|\bwe\b|I've).{0,30}installed|(?:我已|已经).{0,12}安装/i.test(q))return 'APP_INSTALLED';if(/(?:\bI\b|\bwe\b|I've).{0,30}shared.{0,15}screen|(?:我已|已经).{0,12}共享/i.test(q))return 'SCREEN_SHARED';if(/replied|回复了|已回复/i.test(q))return 'REPLIED';return 'NOT_CONFIRMED_ACTED';}
export function investigateScam({question='',locale='en',jurisdiction='MY',now=new Date().toISOString()}={}){
 const text=normalized(question),domain=classifyScamQuestion(text);if(!domain)return null;const zh=locale==='zh-Hans',stage=exposureStage(text),pair=(en,cn)=>zh?cn:en;
 const urls=[...text.matchAll(/https?:\/\/[^\s<>"']+/g)].slice(0,8).map(m=>({value:safeIndicatorURL(m[0]),state:safeIndicatorURL(m[0])?'UNVERIFIED_DOMAIN_PATH':'REJECTED_UNSAFE_URL',evidenceClass:'USER_SUBMISSION'}));
 const reportedIndicators=rules.filter(([,rx])=>rx.test(text)).map(([kind])=>({kind,evidenceClass:'USER_SUBMISSION',verification:'UNVERIFIED',personalFact:false}));
 const phoneCount=[...text.matchAll(/(?:\+?60|0)[ -]?\d(?:[ -]?\d){7,11}/g)].length;
 const labels={SCREEN_SHARED:pair('Stop the suspicious screen-sharing session. Use a trusted device to contact your bank through its official channel if account information may have been exposed.','停止可疑屏幕共享。如果账户资料可能暴露，使用可信设备通过官方渠道联系银行。'),APP_INSTALLED:pair('Stop using the suspicious application and disconnect the suspicious session. Use a trusted device to contact your bank and secure affected accounts.','停止使用可疑应用并断开可疑连接。使用可信设备联系银行并保护受影响账户。'),CREDENTIALS_SHARED:pair('Do not share further codes. Contact the affected bank or service through a verified official channel from a trusted device and secure exposed credentials.','不要再提供验证码。使用可信设备，通过核实的官方渠道联系受影响银行或服务并保护暴露的凭证。'),PAID_OR_LOST:pair('Contact your bank immediately using its official scam channel. In Malaysia, contact NSRC 997 promptly. Keep transaction evidence privately; recovery is not guaranteed.','立即通过银行官方反诈渠道联系银行。在马来西亚，尽快联系 NSRC 997。私下保留交易证据；追回资金没有保证。')};
 const domainGuidance={
  RECOVERY_AND_REFUND_SCAM:pair('An upfront recovery fee before returning lost funds is a further financial risk. Pause any further payment, verify the claim independently and keep the messages privately. Recovery is not guaranteed.','要求先付费用才能追回损失，是进一步的资金风险。暂停继续付款，独立核实追回款项的说法，并私下保留消息；追回没有保证。'),
  SPIRITUAL_COERCION_RISK:pair('Threats about curses, karma or harm to family can create payment pressure; they do not establish that a curse is real. Pause payment and discuss the demand with someone you trust. Belief or a voluntary course fee alone does not establish fraud.','用业障、诅咒或家人受害施压付款，是需要警惕的行为，不能证明诅咒真实存在。暂停付款，和可信的人一起核对要求；信仰或自愿课程收费本身不能证明诈骗。'),
  GUARANTEED_RETURN_RISK:pair('A guaranteed investment return combined with pressure to transfer money is a risk signal. Pause the transfer and independently verify the investment and the claimed authority. No return or recovery is guaranteed.','保证投资回报并催促转账，是风险信号。暂停转账，独立核实投资及对方声称的资质；收益和追回资金都没有保证。'),
  ROMANCE_FINANCIAL_COERCION_RISK:pair('Threatening a relationship to pressure you to borrow or transfer money is financial pressure. Pause payment, avoid borrowing under pressure and seek trusted support. This does not establish criminal guilt.','以关系或分手施压，要求借钱或转账，是需要警惕的经济施压。暂停付款，避免在压力下借款，寻求可信支持；这不等于确认对方犯罪。'),
  GUARANTEED_OUTCOME_PAYMENT_RISK:pair('A guarantee that paying will cure illness or restore a relationship is not evidence of that outcome. Pause payment and verify the claim independently; do not let a promised ritual replace appropriate health care or real relationship decisions.','付钱就能保证治病或挽回婚姻的说法，不是结果的证据。暂停付款并独立核实，不让仪式承诺取代适当医疗或现实关系决策。'),
  CREDENTIAL_AND_ACCOUNT_TAKEOVER:pair('Do not give passwords, OTP codes or banking credentials to the requester. Verify the request through an independently obtained official channel.','不要向索取者提供密码、OTP 验证码或银行凭证。通过独立取得的官方渠道核实要求。'),
  SCREEN_SHARING_AND_REMOTE_ACCESS:pair('Do not install an unfamiliar APK or start the requested screen sharing or remote access while opening a bank app. Stop suspicious access and use a trusted device to contact your bank if information was exposed.','不要安装陌生 APK，或按要求共享屏幕、远程控制后打开银行应用。停止可疑连接；如资料暴露，使用可信设备联系银行。'),
  PHISHING_AND_IMPERSONATION:pair('Verify the claimed identity through an independently obtained official contact. Do not transfer money or disclose credentials based on that claim.','通过独立取得的官方联系方式核实身份，不要仅凭对方声称的身份转账或提供凭证。')
 };
 const urgent=['PAID_OR_LOST','CREDENTIALS_SHARED','APP_INSTALLED','SCREEN_SHARED'].includes(stage);
 const immediate=urgent?labels[stage]:domainGuidance[domain]||pair('Pause the suspicious request. Verify it independently before paying or disclosing information.','暂停可疑要求，付款或提供资料前先独立核实。');
 const location=jurisdiction==='MY'?'':pair(' These reporting references are Malaysia-specific; use your local bank and official anti-scam reporting channel.',' 以下举报来源适用于马来西亚；请联系所在地银行及官方反诈骗机构。');
 const guidance=(jurisdiction!=='MY'&&stage==='PAID_OR_LOST'?pair('Contact your bank immediately through its official channel and your local official anti-scam reporting service. Keep transaction evidence privately; recovery is not guaranteed.','立即通过官方渠道联系银行及所在地官方反诈骗机构。私下保留交易证据；追回没有保证。'):immediate)+location;
 const domainAnswer=domainGuidance[domain]||pair('These reported actions may put money, account or device information at risk.','这些报告的行为可能给资金、账户或设备资料带来风险。');
 const answer=pair('A pattern resemblance does not establish that a particular person committed a crime.','与风险模式相似，不代表已经确认某个人实施了犯罪。');
 const stale=scamSources.some(s=>Date.parse(now)-Date.parse(s.verifiedAt)>30*86400000);
 return {schemaVersion:SCAM_CONTRACT,domain,jurisdiction,stage,state:'PATTERN_HYPOTHESIS_NOT_INCIDENT_VERIFICATION',indicators:{reportedIndicators,urls,phoneCount,phoneLookup:'NOT_CONNECTED',secrets:'NOT_RETAINED',rawTextPersisted:false},sourceLookup:{state:'LIVE_SOURCE_UNAVAILABLE',performed:false,reason:'NO_AUTHORIZED_CASE_LOOKUP_ADAPTER',emptyResultMeansSafe:false},pattern:{id:domain==='FAKE_MERCHANT_AND_DELIVERY'||/food|订餐|外卖/i.test(text)?'FOOD_ORDER_SCREEN_ACCESS_R1':domain+'_R1',version:1,jurisdictions:['MY'],name:{en:'Suspicious requested-action sequence', 'zh-Hans':'可疑操作请求序列'},sourceRefs:scamSources.map(s=>s.sourceId),claimClass:'ANALYTIC_INFERENCE',confidence:'UNASSESSED_PATTERN_HYPOTHESIS',firstObserved:null,lastVerified:null,knownVariations:[],expiryState:'PATTERN_NOT_INCIDENT_ADMITTED',uncertainties:['No external case lookup','No guilt or common ownership established'],matchType:'OBSERVABLE_ACTION_HYPOTHESIS',stages:['ADVERTISEMENT','PRIVATE_ORDER','SCREEN_OR_REMOTE_ACCESS_REQUEST','POSSIBLE_EXPOSURE','POSSIBLE_TRANSACTION'],allStagesEstablished:false,identityOrGuiltEstablished:false},sourceReferences:scamSources,answer:urgent?guidance:domainAnswer,guidance:urgent?domainAnswer+' '+answer:answer+location,limitations:[pair('No live phone, merchant or incident search was performed; source access failure is not a clean record.','未执行实时电话、商家或案件查询；来源不可用不等于没有记录。'),...(stale?[pair('Reporting references require freshness revalidation.','举报来源需要重新核实时效。')]:[])],governance:{providerCalls:0,externalFetches:0,persisted:false,createsPersonalFacts:false,reportFiled:false,bankContacted:false,transactionBlocked:false},handoff:{requiresExplicitContext:true,retentionConsentRequired:true,publicWorldRecordAllowed:false}};
}
export function scamAskResponse(result,{question,locale}){return {ok:true,scam:result,view:{surface:'ASK',locale,state:'SCAM_PATTERN_GUIDANCE',question,answer:{text:result.answer+'\n\n'+result.guidance,supporting:[]},basedOn:{sources:result.sourceReferences.map(s=>({label:s.publisher,href:s.url})),statement:locale==='zh-Hans'?'官方安全资源；未实时查证个案。':'Official safety references; no live incident verification.'},limits:{items:result.limitations},relatedKnowledge:[{title:locale==='zh-Hans'?'世界与来源':'World and evidence',href:'/world/?intent=sources'},{title:locale==='zh-Hans'?'证据学习目录':'Evidence learning directory',href:'/academy/'}],handoff:{available:false}},execution:{generationMode:'DETERMINISTIC',providerCalls:0,providerInvoked:false}};}
