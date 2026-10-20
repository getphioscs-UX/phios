import json,pathlib,hashlib,html,copy
D=pathlib.Path('tools/review/world-r3/gate2c-verification'); B=pathlib.Path('tools/review/world-r3/gate2c');rd=lambda p:json.loads(pathlib.Path(p).read_text(encoding='utf-8-sig'))
def wr(n,v):(D/n).write_text(json.dumps(v,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
# Resolve each raw observation to the exact saved HTTP request instead of a generic catalogue.
requests=[]
for name in ['READ-ATTEMPTS.json','PILOT-READ-ATTEMPTS.json','CLOSURE-READ-ATTEMPTS.json']:
 requests+=rd(B/name)
obs=rd(B/'WORLD-R3-GMCH-PILOT-SNAPSHOTS/NORMALIZED-OBSERVATIONS.json'); checks=rd(D/'NUMERIC-REPRODUCTION-ALL.json')['checks']
for p in (D/'EVIDENCED-ANSWERS').glob('*.json'):
 a=rd(p)
 if 'sources' not in a:continue
 for s in a['sources']:
  if s['kind']=='observed_fact':
   req=next((r for r in requests if r.get('sha256')==s['sha256']),None)
   assert req,s
   s['official_url']=req['url'];s['retrieval_http_status']=req.get('http_status');s['raw_relative_url']='../../../../../'+s['path'];s['fetched_at']=req['fetched_at']
 if p.name.startswith('COMPARE'):
  a['comparison']['evidence_objects']={'MY':rd(D/'MY-SOURCE-REPRODUCTION.json')['approvalProbability'],'US':rd(D/'US-HMDA-METHOD-REPRODUCTION.json')['years']}
 a['limits']=a['unknowns'];wr('EVIDENCED-ANSWERS/'+p.name,a)
# Correct audit stages without conflating separate MHS and dashboard sources.
g=rd(D/'GLOBAL-SOURCE-READINESS.json')
for s in g['sources']:
 if s['source_id']=='MY_HOUSING':s['commercial_redistribution']='NOT_ESTABLISHED';s['source_status']['LICENSE_REVIEWED']=False;s['source_status']['BLOCKED']=True
 if s['source_id'].startswith('MY_LOANS_'):s['alternative_verified_source']='MY_CCRIS official dashboard; not recovered MHS XLS';s['source_status']['FETCHED']=False;s['source_status']['VALIDATED']=False;s['source_status']['BLOCKED']=True
 s['population']=s.get('reporting_population') or s['population']
 raw=next((r for r in requests if r.get('sha256')==s.get('content_hash') and s.get('content_hash')),None)
 s['content_hash_basis']='ORIGINAL_SAVED_BYTES' if raw else s.get('source_hash_basis','UNKNOWN')
 if raw:s['exact_endpoint_or_file']=raw['url'];s['retrieval_date']=raw['fetched_at'];s['http_status']=raw.get('http_status')
 if not s['source_status']['FETCHED']:s['missing_reason'].append('No validated numeric series in this exact source identity; any saved webpage is metadata only')
wr('GLOBAL-SOURCE-READINESS.json',g)
# Facts, null and rejected values are visible review specimens, never a replacement product prototype.
parts=[]
for lang in ['zh-Hans','en']:
 parts.append('<section lang="'+lang+'"><h2>'+('四个证据样板' if lang=='zh-Hans' else 'Four evidence-bound samples')+'</h2>')
 for typ in ['MY','US','COMPARE','HOUSEHOLD']:
  a=rd(D/'EVIDENCED-ANSWERS'/f'{typ}-{lang}.json');q=a['question']['original'];answer=a['direct_answer']['text']
  parts.append('<article><h3>'+html.escape(q)+'</h3><p class="direct">'+html.escape(answer)+'</p><small>CURATED_ANSWER_ONLY · OFFLINE_PREVIEW</small><ul>')
  for c in a['claims']:parts.append('<li>'+html.escape(c['text'])+'</li>')
  parts.append('</ul><p><a href="EVIDENCED-ANSWERS/'+typ+'-'+lang+'.json">'+('完整证据对象、来源、期间与摘要' if lang=='zh-Hans' else 'Full evidence object, sources, periods and hashes')+'</a></p></article>')
 parts.append('</section>')
content='''<!doctype html><html lang="zh-Hans"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><meta name="robots" content="noindex,nofollow"><title>Gate 2C Evidence Verification</title><style>*{box-sizing:border-box}body{margin:0;background:#f6f3eb;color:#143c47;font:16px/1.65 system-ui}main{max-width:1100px;margin:auto;padding:24px max(20px,env(safe-area-inset-left))}h1{font-size:30px}h2{border-bottom:2px solid #b38a47}article{padding:20px 0;border-bottom:1px solid #ccd5cf}a{color:#17615f;overflow-wrap:anywhere}p,li{overflow-wrap:anywhere}.direct{font-size:19px;font-weight:600}a:focus-visible{outline:3px solid #b38a47}.status{background:#102d42;color:#fff;padding:18px}.null,.error{border-left:4px solid #b38a47;padding:16px;background:#fff}pre{white-space:pre-wrap;overflow-wrap:anywhere}</style><main><h1>Gate 2C Verification · Evidence Closure &amp; Gate 3 Readiness</h1><p class="status">REVIEW_ONLY · READY_FOR_SCOPED_HUMAN_REVIEW · GATE3_NOT_AUTHORIZED</p><p>仅核验现有证据，不是新的 World 产品页。Evidence verification board, not a deployed answer service.</p><p><a href="../WORLD-R3-HUMAN-REVIEW.html">唯一人审入口 / Main Human Review</a> · <a href="../gate2c/WORLD-R3-GMCH-PROTOTYPE.html">保留的双语原型 / Retained prototype</a></p>'''+''.join(parts)+'''<section id="null"><h2>空值 / Null evidence specimen</h2><p class="null">马来西亚个人房贷获批概率：无法从现有数据测量。缺同一申请群组、同一产品和期间的申请与批准件数；金额不是概率。<br>MY individual approval probability: NOT_MEASURABLE_FROM_AVAILABLE_DATA. Missing matched application/cohort counts and outcomes; monetary amounts cannot supply that denominator.</p></section><section id="error"><h2>错误拒绝 / Rejected evidence specimen</h2><p class="error">拒绝将 USA 的 HMDA 拒绝占比当作 MYS 获批概率；拒绝将金额当作件数。此为离线契约负面用例，不表示产品已经执行此 gate。<br>Country, metric and population mismatch: reject, do not display a national claim. Offline contract negative test only; product enforcement remains unimplemented.</p></section><section><h2>真实上限 / Actual limits</h2><p>八个陌生问题 × 中英：World/Search 无直接答案；本地 Ask 15 次来源不足，1 次不相关理论段落，0 次证据完整回答。Source/normalisation checks are separate from answer capability.</p><p><a href="UNSEEN-QUESTION-EVALUATION.json">完整失败及结果</a> · <a href="HUMAN-REVIEW-DECISION.md">人审决定与阻断</a></p></section></main></html>'''
(D/'VERIFICATION-REVIEW.html').write_text(content,encoding='utf-8')
# Actual local handler + browser results, not an offline specimen success label.
b=rd(D/'QUESTION-TO-ANSWER-BROWSER-EVIDENCE.json');api=rd(D/'UNSEEN-LOCAL-ASK-RESPONSES.json');questions=rd(D/'UNSEEN-QUESTIONS.json');evaluations=[]
for i,q in enumerate(questions):
 for lang in ['zh-Hans','en']:
  response=next(x for x in api['results'] if x['question']==q['question'][lang]);ui=next(x for x in b['rows'] if x['id']==q['id'] and x['locale']==lang)
  state=response.get('payload',{}).get('view',{}).get('state');evaluations.append({'id':q['id'],'locale':lang,'question':q['question'][lang],'UI':ui,'actualLocalHandler':response,'RETRIEVAL_PASS':False,'ANSWER_PASS':False,'failure':'UNRELATED_THEORETICAL_PASSAGE' if state=='PARTIALLY_ANSWERED' else 'SOURCE_INSUFFICIENT','WorldAnswerRoute':'NOT_IMPLEMENTED','production':'UNVERIFIED','unknownFixedAnswerFallback':'No successful evidence answer inferred from navigation/readings'})
wr('UNSEEN-QUESTION-EVALUATION.json',{'mode':'LOCAL_FIXTURE_EXISTING_PRODUCT_NO_EXTERNAL_API','evaluations':evaluations,'totals':{'questions':8,'languages':2,'handlerHTTP200':16,'sourceInsufficient':15,'irrelevantPassage':1,'evidenceCompleteAnswers':0},'independentGates':{'SOURCE_READ_PASS':'VERIFIED_BOUNDED_SAVED_RAW','NORMALIZATION_PASS':'70_VALUES_PLUS_ONE_EXPLICIT_UNKNOWN','RETRIEVAL_PASS':'FAIL_UNSEEN_QUESTION_SPECIFIC_EVIDENCE','ANSWER_PASS':'FAIL_0_OF_16','ASK_HANDOFF_PASS':'PARTIAL_INPUT_ONLY_PRIOR_VALID_EVIDENCE_FULL_SCOPE_MISSING','PRODUCTION_PASS':'UNVERIFIED'},'providerCalls':0,'externalNetworkAttempts':api['externalNetworkAttempts'],'productionInvocations':0})
(D/'ANSWER-CAPABILITY-MATRIX.md').write_text('''# Actual capability, separate from design
| Layer | Result | Evidence |
|---|---|---|
| Source read | VERIFIED bounded raw files | 97 artifacts/hash, official method reads |
| Normalization | VERIFIED 70 numbers, one explicit unknown | Independent reproduction |
| Gate1 ten / Gate2C twenty | Historical design cases | Not unseen automatic answering |
| Four bilingual samples | CURATED_ANSWER_ONLY | Real bounded facts + conditional published interpretation; eight JSON objects |
| Actual World R2 | Navigation/readings present; direct answer NOT_IMPLEMENTED | 16 current browser observations |
| Actual mounted Search | Query/result interface; question-specific sufficient retrieval FAIL | Actual Knowledge surface, not old search-v2 |
| Actual local contextual Ask | HTTP200 is not semantic PASS | 15 insufficient, one irrelevant theoretical passage, zero complete answers |
| Ask handoff | PARTIAL INPUT_ONLY | Prior valid sender/popup evidence retained; full country/year/topic/source not proven |
| Production | UNVERIFIED | No serving identity, deployed source or runtime execution proof |

English U2 PARTIALLY_ANSWERED is a false-positive relevance state, not a correct mortgage explanation. No test changed to manufacture answer PASS. Separate local harness corrections are disclosed in LOCAL-HARNESS-DIAGNOSTICS.json. No paid provider used.
''',encoding='utf-8')
print('Evidence samples and actual evaluation finalized')
