import json,pathlib,hashlib,copy,datetime
D=pathlib.Path('tools/review/world-r3/gate2c-verification'); B=pathlib.Path('tools/review/world-r3/gate2c'); now=datetime.datetime.now(datetime.timezone.utc).isoformat()
def read(p):return json.loads(pathlib.Path(p).read_text(encoding='utf-8-sig'))
def js(n,v): (D/n).write_text(json.dumps(v,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
def md(n,v): (D/n).write_text(v.strip()+'\n',encoding='utf-8')
my=read(D/'MY-SOURCE-REPRODUCTION.json'); us=read(D/'US-HMDA-METHOD-REPRODUCTION.json'); nums=read(D/'NUMERIC-REPRODUCTION-ALL.json'); obs=read(B/'WORLD-R3-GMCH-PILOT-SNAPSHOTS/NORMALIZED-OBSERVATIONS.json'); binding=read('tools/review/world-r3/gate2/SOURCE-BINDINGS.json')['sources']
md('CLAIM-BY-CLAIM-VERDICT.md','''# Evidence verdict · REVIEW ONLY
97/97 old manifest artifacts were opened and SHA-256 matched. No listed artifact was missing. See EVIDENCE-CHAIN-RECONCILIATION.json. This verifies bytes, not all semantic claims.

| Claim | Verdict | Evidence / correction |
|---|---|---|
| 70 numeric observations and one unknown | VERIFIED values / PARTIAL metadata | Independent raw CSV, HTML JSON, API aggregation, OOXML reproduction; publication dates not invented |
| MY CCRIS 36 observations | VERIFIED bounded amounts | 3 stages × 12 months, national dashboard, no duplicate stage/month; exact institution and refinancing coverage incomplete |
| MY individual approval probability | NOT_MEASURABLE | Monetary values are not comparable application/cohort counts |
| BNM XLS 403 | CORRECTED / PARTIAL | Saved Python 403 belongs to MHS document/directory page. Exact XLS request HTTP status unproven; XLS bytes unavailable. Dashboard remains a different source |
| HMDA 2024/2025 | VERIFIED bounded record shares | Purpose=1, actions=1,2,3; dynamic API cache, not frozen annual snapshot; publication/vintage incomplete |
| SLOOS | VERIFIED bounded bank survey | Government category Q13B/Q14B, not loan refusal rate |
| FHFA 2024 | VERIFIED later historical workbook | Prior 2026 change workbook is not 2024 evidence; later history workbook independently reproduces 12 months |
| 80 checks | VERIFIED old layout evidence only | Not 80 semantic answers; old failed runs retained |
| Four answers | CURATED_ANSWER_ONLY | New evidence-bound bilingual objects, not dynamic R2 deployment |
| 392 visual bindings | Existing illustration reuse | Not 392 statistical charts or current observations |
| Source rights | PARTIAL by source | Rights review not automatic production admission; see GLOBAL-SOURCE-READINESS.json |
| Source main / production | Main verified, production unverified | Main 796802d96e5fe10f8af2f46f3d2d96b0efca51dc; no authenticated serving-deployment evidence |

Old intermediate gaps claiming no 2025 HMDA, no 2024 FHFA, no MY flow amounts were subsequently closed by saved raw evidence; preserved as history. Old FHFA licensing table still refers to the first 2026 workbook and is stale in that respect. No historical file is rewritten.
''')
md('MY-MORTGAGE-CLAIMS.md','''# MY · VERIFIED bounded activity / PARTIAL approval difficulty
CCRIS official household-debt dashboard: `my-debt-dashboard.html`, exact __NEXT_DATA__ paths and all 36 records in MY-SOURCE-REPRODUCTION.json. `property_residental` is the raw key, not a new classification. Unit MYR monetary monthly flows, not outstanding stock or application counts.

2024 January → December: applied RM37.485bn → RM34.452bn (−8.091%); approved RM14.354bn → RM14.183bn (−1.189%); disbursed RM11.836bn → RM10.550bn (−10.864%). These are unadjusted endpoint comparisons, not year-on-year changes or trends identified causally. Annual sums are separate in the JSON. Application, approval and disbursement need not concern the same loan cohort in the same month; do not divide them into an approval probability.

OPR is a policy rate; MYOR is an overnight money-market rate; effective housing borrowing cost depends on loan contract, spread, repricing/effective date, fixed/floating terms and fees. An OPR fall does not immediately change a fixed-rate payment. Islamic financing terms may use a reference/profit rate and contractual cap; coverage is not established by a conventional-rate assumption. No actual retail mortgage rate series was fetched in this pilot; rate-to-payment lag is NOT_ESTIMATED. The BNM reference-rate framework is a mechanism source, not proof of each customer's repricing.

CPI: monthly overall index, 2010=100, not a displayed inflation rate. Household income: survey-reference-year nominal gross monthly income level, citizen households; median RM6,338 (2022) and RM7,017 (2024), not monthly observations, not mean income. CPI population basket differs from citizen-household income survey. Neither measures a particular household's disposable cash flow.

Data.gov.my dashboard is independently accessible; MHS document page 403 remains. Exact XLS status is UNVERIFIED, not a recovered XLS. Publication dates per observation remain null; fetched_at is not publication_date. Dashboard next expected August 2026 date does not establish freshness in October.

NAPIC price/transaction portal: discovered, exact series/vintage/licence not admitted. DOSM employment and housing-cost component catalogues: available discovery paths, no numeric pilot admission. This does not block using the bounded verified CPI/income/CCRIS evidence.
''')
md('MY-UNMEASURABLE-GAPS.md','''# NOT_MEASURABLE_FROM_AVAILABLE_DATA
To determine an individual's or a defined group's mortgage approval trend requires comparable application record/cohort counts and approved/denied outcomes for the SAME objects, product, institution coverage and period, including pending/withdrawn/incomplete/preapproval handling, duplicate applications, cohort follow-up and applicant-risk mix. No such MY denominator has been obtained.

Missing: exact financial institution perimeter and refinancing/Islamic-financing product coverage of the dashboard; publication/revision dates for each observation; actual borrower rates/terms/fees and repricing; matched employment/disposable-income and housing cost series; licensed NAPIC numeric series. These gaps affect specific inference, not already reproduced amounts.

Owner SOURCE: seek official documentation/cohort tables through normal public access, no bypass. Owner ANSWER: retain null and explain alternate activity indicators. Owner RIGHTS: settle exact NAPIC product terms. No arbitrary probability or zero fill.
''')
md('US-SLOOS-SCOPE-CHECK.md','''# US SLOOS · VERIFIED survey, not rejections
Official October 2024 survey describes prior three months, generally Q3 2024. Board page last updated 2024-11-12; not the observation date. Overall response panel 66 domestic banks plus 20 foreign branches/agencies; chosen domestic government home-purchase category has 49 responding institutions.

Raw `fed-table-corrected.html`: Q13B: 1 tightened, 0 eased, 49 total → (1−0)/49×100 = 2.040816% net tightening. Q14B: 5 stronger, 10 weaker, 49 total → (5−10)/49×100 = −10.204082% net stronger demand. Equal respondent counts for selected all-respondent table, not loan-volume weighting. New home purchase excludes refinancing. This is one category, not every mortgage product.

Board classifies net standards in 0–5% as basically unchanged. Weaker demand can coexist with basically unchanged standards. Neither is an applicant-level denial percentage. HMDA annual outcomes and FHFA monthly prices cannot be spliced into a synchronous causal experiment.

Source: https://www.federalreserve.gov/data/sloos/sloos-202410.htm ; table: https://www.federalreserve.gov/data/sloos/sloos-202410-table-1.htm . See NUMERIC-REPRODUCTION-ALL.json raw hash and locator.
''')
md('US-FHFA-COVERAGE-CHECK.md','''# US FHFA · VERIFIED bounded price history
`fhfa-hpi-history.xlsx`, official historical monthly purchase-only file, independently read as OOXML; Sheet1 A=date and T=USA NSA. First numeric base 1991-01=100; 12 observations in 2024, January407.59 and February415.30. Nominal national purchase-only price index, not application counts, rejections, mortgage rates or affordability.

Purchase-only coverage uses conventional conforming transactions involving Fannie Mae/Freddie Mac; not all-cash or every dwelling/financing segment. U=USA seasonally adjusted was not used. Do not compare NSA with SA without explicit transformation. Current downloaded vintage can revise old values; original monthly release dates and per-value revision times are unavailable and remain null. Download/fetch date is a separate field.

The earlier `fhfa-hpi.xlsx` recent-change file covers 2026 changes and cannot prove 2024 history. It is retained unchanged. Reproduction points to the later history workbook. General federal-data use does not grant FHFA logos or third-party materials.
''')
reg=read(B/'WORLD-R3-GMCH-SOURCE-REGISTRY.json')['sources']; rows=[]
for s in reg:
 sid=s['source_id']; rights= ('CONDITIONAL_BNM_PRIMARY_DATA' if sid.startswith('MY_') and sid not in ['MY_CPI','MY_INCOME','MY_HOUSING'] else 'CC_BY_4_0' if sid in ['MY_CPI','MY_INCOME'] else 'FEDERAL_PUBLIC_DATA_THIRD_PARTY_EXCLUDED' if sid in ['US_SLOOS','US_HMDA','US_FHFA'] else 'CONDITIONAL_ECB' if sid.startswith('EA_') else 'OGL_DATABASE_ONLY' if sid.startswith('UK_') else 'CONDITIONAL_BIS_NO_EXTRA_CHARGE' if sid.startswith('BIS_') else 'NOT_ESTABLISHED')
 related=[o for o in obs if ({'MY_CPI':'my-cpi-full','MY_INCOME':'my-income','US_SLOOS':'fed-table-corrected','US_HMDA':'hmda','US_FHFA':'fhfa-hpi-history','MY_CCRIS':'my-debt-dashboard','MY_LOANS_APPLIED':'NO_MHS_BYTES','MY_LOANS_APPROVED':'NO_MHS_BYTES'}.get(sid,'NONE')) in str(o.get('source_id',''))]
 row={**s,'dataset_id':s.get('external_series_id') or sid,'exact_endpoint_or_file':s.get('endpoint_or_file'),'license_terms_url':s.get('license_url'),'commercial_redistribution':rights,'attribution':s.get('attribution_requirement'),'observation_date':sorted(set(o['observation_period'] for o in related)) or None,'publication_date':None,'retrieval_date':s.get('fetched_at'),'population':s.get('coverage') or s.get('country_or_coverage'),'region':s.get('country_or_coverage'),'revision_vintage':'SAVED_FETCH_VINTAGE' if related else None,'missing_reason':[],'content_hash':s.get('source_hash'),'source_status':{'DISCOVERED':True,'DOCUMENTED':bool(s.get('documentation_url')),'ACCESS_VERIFIED':bool(s.get('states',{}).get('ACCESS_VERIFIED',False)),'LICENSE_REVIEWED':rights!='NOT_ESTABLISHED','FETCHED':bool(related),'VALIDATED':bool(related),'ADMITTED':False,'BLOCKED':rights=='NOT_ESTABLISHED'},'admission_scope':'OFFLINE_REVIEW_ONLY; no production registry change'}
 if not related:row['missing_reason'].append('Exact normalized numeric series not admitted in pilot; discovery or webpage is not series validation')
 if rights=='NOT_ESTABLISHED':row['missing_reason'].append('Commercial numeric redistribution terms unresolved')
 row['missing_reason']+=['Per-observation original publication/revision metadata incomplete','Production source admission not authorized']
 rows.append(row)
js('GLOBAL-SOURCE-READINESS.json',{'status':'PARTIAL_SOURCE_SPECIFIC_NOT_PRODUCTION_ADMISSION','sources':rows,'stateSemantics':'Independent stages. Numeric bytes validated does not imply rights-complete or ADMITTED. All production ADMITTED=false. Prior state flags preserved as historical fields, new source_status governs this review.'})
md('LICENSE-BLOCKERS.md','''# Rights · conditional eligibility, not blanket admission
The source-by-source registry preserves original URLs and adds explicit stage flags. A page opening is ACCESS, not ADMISSION. Original saved licence bytes were hash-checked; fresh official reads are separately recorded, without invented HTTP statuses.

Conditional numeric reuse: DOSM CPI/income CC BY4.0 (credit, licence link, disclose changes); BNM primary compiled datasets (source/link/prescribed terms notice/no endorsement or logo; third-party content excluded); Board-produced SLOOS public data; official HMDA/CFPB public content and aggregate counts; FHFA federal numeric data. Exact dataset scope, source-vintage label and citations must accompany production display. No individual financial records are redistributed.

ECB information conditional reuse: accuracy/attribution/change disclosure and notice of free original source in paid context; named-author papers separate. BoE database statistics OGL, not blanket article prose. BIS conditional: attribution, no extra charge for inclusion, unofficial translation notice and no endorsement; paid product model needs RIGHTS review before admission. These three have no newly admitted numeric series.

BOJ/JHF, NAPIC, NBS/PBOC: commercial redistribution for relevant products unresolved; discovery/reference links only. Freddie Mac PMMS: no commercial numeric reuse established, no cache or FRED mirror substitution. US CFPB rate examples may use third-party Curinos data: do not reuse as current rates. BNM MHS access restriction is independent of its dataset licence; no bypass.

Rights owner must resolve exact product before reuse. No new account, purchase or legal approval is invented. Production admission remains separate for every source.
''')
md('COMPARABILITY-COUNTEREXAMPLES.md','''# Comparison counterexamples · all must reject direct ranking
1. MY approved/applied MYR vs HMDA action3/(1+2+3): monetary flows vs reported action records, no shared cohort.
2. UK net approval counts vs denial share: missing application denominator; net counts are not probabilities.
3. China developer funding personal-mortgage receipts vs bank approvals: recipient/developer finance flow is not approval outcome.
4. ECB BLS / Japanese bank surveys vs HMDA: respondent net balances vs action records, coverage and weighting differ.
5. OPR vs MYOR vs retail mortgage rate: policy instrument, overnight transactions, contracted borrower cost with different spread/tenor.
6. FHFA NSA vs a seasonally adjusted price series: adjustment and base differ; not direct level comparison.
7. Monthly CPI index vs survey-year median monthly income: different frequency and population; cannot fabricate monthly income points.
8. BIS debt-service ratio vs household arrears/denial: sector-specific modelled servicing burden, not individual stress incidence.
9. HMDA 2024→2025 share change may reflect borrower/income/reporter mix; no causal tightening conclusion without adjustment.
10. Price fall with rent rise, or policy cut with fixed mortgage payments: distinct tenure, cashflow and contractual exposure.

Use each country's own labelled trend plus definitions. Direct comparison requires identical metric/population, unit/base/adjustment, frequency, period, vintage and rights. No crisis score/ranking/heatmap. US securitisation crisis, Japan balance-sheet/deleveraging and China developer funding are different mechanisms, not proof of another country's present crisis.
''')
# Reuse accepted answer shape; bind each factual value to independently reproduced source.
old=read(B/'ANSWER-EXAMPLES.json')['examples']; audit=[]
for i,a in enumerate(old):
 a=copy.deepcopy(a); typ=['MY','US','COMPARE','HOUSEHOLD'][i//2]; lang='zh-Hans' if i%2==0 else 'en'; zh=lang=='zh-Hans'
 a['mode']='CURATED_ANSWER_ONLY';a['schemaOwner']='../gate2c/WORLD-R3-GMCH-ANSWER-SCHEMA.json';a['indicators']=[];a['claims']=[];a['sources']=[];a['figures']=[]
 selected=([o for o in obs if o['id'] in ['MY_applied_2024-01','MY_applied_2024-12','MY_approved_2024-01','MY_approved_2024-12']] if typ=='MY' else [o for o in obs if o['id'].startswith('US_')] if typ=='US' else [o for o in obs if 'MEDIAN' in o['id'] or o['id']=='MY_CPI_2024-01-01'] if typ=='HOUSEHOLD' else [])
 for o in selected:
  a['indicators'].append(o);a['claims'].append({'id':o['id'],'kind':'observed_fact','text':f"{o['country']} · {o['observation_period']} · {o['metric_id']}: {o['value']} {o['unit']}",'support':[o['id']],'conditions':['Bounded historical snapshot; original publication date not retained'],'observation_period':o['observation_period'],'publication_date':o.get('publication_date')})
  ck=next(c for c in nums['checks'] if c['id']==o['id']);a['sources'].append({'id':o['id'],'kind':'observed_fact','path':ck['rawPath'],'sha256':ck['rawSha256'],'locator':ck['rawLocator'],'official_url':next((s['official_url'] for s in reg if s['source_id']=={'MY':'MY_CCRIS','US':'US_SLOOS','HOUSEHOLD':'MY_INCOME'}.get(typ)),None),'period':o['observation_period'],'unit':o['unit'],'country':o['country'],'fetched_at':o['fetched_at'],'publication_date':None})
 k='daily' if typ in ['MY','HOUSEHOLD'] else 'networks'; src=binding[k]['locales'][lang]; fp=pathlib.Path(src['path'].lstrip('/'));actual=hashlib.sha256(fp.read_bytes()).hexdigest();assert actual==src['sha256'];passage=src['passages'][0]
 a['sources'].append({'id':binding[k]['id'],'kind':'published_interpretation_not_statistics','canonical_url':binding[k]['href'][lang],'path':str(fp),'sha256':actual,'sourceVersion':src['version'],'publishedAt':src['publishedAt'],'locator':passage['pointer'],'text':passage['text'],'permission':'Existing public published reading; own PHI OS interpretation, not national empirical proof'})
 a['claims'].append({'id':typ+'-mechanism','kind':'conditional_mechanism','text':passage['text'],'support':[binding[k]['id']],'conditions':['Interpretation of resources/income/costs; not an empirical causal estimate or current national statistic']})
 if typ=='US':
  a['hmdaEvidence']=us['years'];a['source_links']+= [us['definitionsURL'],us['apiDocumentationURL']];a['unknowns']+=['HMDA year-to-year mix and original publication date unresolved; not synchronous with Q3 SLOOS']
 if typ=='COMPARE':a['comparison']={'allowed':False,'reason':'No harmonised same-cohort denominator; MY amounts, US action shares, UK net counts, China developer receipts and bank surveys differ','evidence':['MY-SOURCE-REPRODUCTION.json','US-HMDA-METHOD-REPRODUCTION.json','COMPARABILITY-COUNTEREXAMPLES.md']}
 a['provenance']={'data_version':'Saved raw SHA-bound fetch vintage; see independent reproduction','content_version':src['version'],'validatedAt':now,'dynamicQueryExecuted':False,'providerCalls':0,'production':False};a['data_quality']['answer_engine']='CURATED_ANSWER_ONLY'
 a['unknowns']+=['No source-bound automatic World answer route or full public scope handoff implemented'];a['visualEvidence']={'status':'NO_STATISTICAL_PROOF_FROM_ATLAS','existingVisuals':'Old mapped Atlas assets retained; optional explanation only, not new causal chart'}
 js('EVIDENCED-ANSWERS/'+typ+'-'+lang+'.json',a);audit.append({'file':typ+'-'+lang+'.json','status':'VERIFIED_BOUNDED_FACTS_AND_CONDITIONAL_INTERPRETATION','sourceHashMatch':True,'semanticAnswer':'CURATED_ONLY_NOT_PRODUCT_DYNAMIC','numericClaims':len(selected)})
js('EVIDENCED-ANSWERS/REVIEW.json',{'answers':audit,'limits':'No new schema, article, production response or provider synthesis. Old schema retained with additive provenance. New source objects retain canonical routes and exact JSON locators.'})
md('GATE3-MINIMAL-SCOPED-PLAN.md','''# GATE3_NOT_AUTHORIZED · minimal existing-owner candidate
First chain: MY question → approved intent (housing financing activity / approval difficulty) → immutable licensed CCRIS snapshot → amount facts or explicit unmeasurable probability → public accepted explanation → direct answer with source. Deterministic routing must label CURATED/DETERMINISTIC; unsupported wording receives useful boundary and reading choices, never one of four unrelated answers.

Minimum first chain: **3 existing owner domains, 4 existing source files, 1 existing GET API, 2 JSON objects** (typed fact snapshot manifest + answer contract instance). Files: functions/api/world-observations.js (extend existing GET without breaking WB population/GDP), functions/_lib/world-bank-observations.js (retain WB mapping; minimal namespaced local snapshot branch or one sibling adapter if separation required), assets/js/pages/civilization-atlas/world-experience-r2.js (single answer-first renderer/search intent), existing world-published-reading.js (authorised paragraph source resolution). Resolve exact path in file-owner map. The two JSON objects are design objects, not competing registry: use existing source governance/answer schema; do not fork master source ownership. Estimated 150–300 lines plus bounded fixture, subject to code review. No DB or new API route required for the first local chain.

G3.1 only source-permitted snapshots; validate country/period/unit/population/version/rights before facts. Preserve fetched_at separately, null publication_date visible, stale status not current claim. Manual read-only refresh initially; no scheduler. BNM directory403 does not block downloaded dashboard amounts but blocks claims about XLS/cohort recovery.
G3.2 existing R2 question, country/time/topic/scales → typed intent → facts plus accepted published paragraph → existing answer schema. No private Profile data. Evidence first; no automatic external current-facts query of raw user text.
G3.3 separately extend world-reading-context.js + entry-context-handoff.js and controlled Ask intake to carry public scope/source/version via approved contract. INPUT_ONLY, no auto-submit, no entitlement bypass. Existing Ask deterministic lexical fallback is insufficient, particularly irrelevant English result observed in U2. Fix only with separately reviewed scope.
G3.4 reuse R2 map/history/compare and existing Atlas, not a second site. Test zh/en at390/1440, no-data/error/wrong-series, back/refresh/locale/region/year and keyboard. Unknown question must not map to a fixed answer.
G3.5 separate acceptance/production authority, runtime identity, rights, provider budget and release chain. No production writes or live provider needed for local deterministic chain. Provider cap **0 calls/USD0**. Optional model synthesis requires exact model/current price, per-call token bound, call count and total approved budget; none currently authorised. Do not procure or call a provider.

Current production identity, D1 write isolation and global provider usage remain UNVERIFIED. Local test process made zero external model calls. No deploy-ready assertion. NEXT: Human review evidence corrections and explicitly authorise Gate3 local candidate scope; otherwise stop.
''')
# locate actual owner paths, no invented second runtime
names=['world-experience-r2.js','world-published-reading.js','world-reading-context.js','entry-context-handoff.js','world-current-claims.js']; owners=[]
for name in names:
 for p in pathlib.Path('assets').rglob(name):owners.append({'path':str(p).replace('\\','/'),'owner':'FRONTEND' if name.startswith('world') else 'PUBLIC_CONTEXT','role':'existing owner reuse; future planned only','sha256':hashlib.sha256(p.read_bytes()).hexdigest()})
for p in ['world/index.html','search/index.html','assets/customer-ui/js/surfaces/knowledge.js','functions/api/world-observations.js','functions/_lib/world-bank-observations.js','functions/api/customer-contextual-ask.js','functions/api/ask-phios-consumption.js','functions/contextual-ask/contextual-ask-runtime.js']:
 owners.append({'path':p,'owner':'FACTS' if 'world-' in p else 'ASK' if 'functions/' in p else 'FRONTEND','role':'Read-only verified actual owner; future diff requires separate Gate3 acceptance','sha256':hashlib.sha256(pathlib.Path(p).read_bytes()).hexdigest()})
js('GATE3-FILE-OWNER-MAP.json',{'status':'PLAN_ONLY_NO_SOURCE_MODIFICATION','firstChain':{'ownerDomains':3,'existingFiles':4,'existingAPI':1,'JSONObjects':2,'newBackend':False},'owners':owners,'conflicts':'BaZi zero-cost evidence and global shell checker are outside World scope. Review HTML and gate2c history were dirty before this task; preserve byte-identical history. Recheck World owner dirty diff before future edits.'})
md('GATE3-GO-NOGO-CRITERIA.md','''# Gate decision
Gate1 HUMAN_ACCEPTED preserved. Gate2/2B/2C no silent acceptance. Current evidence package: READY_FOR_SCOPED_HUMAN_REVIEW with PARTIAL metadata/licensing/actual answer gaps. GATE3_NOT_AUTHORIZED. No GATE3_PRODUCTION_READY.

Local candidate GO only after explicit Human ACCEPT Gate2C Evidence & Gate3 Local Candidate, scope/owner conflict recheck, accepted typed fixtures/rights and failure tests. Unsupported answer paths must remain honest; paid AI is not required for the first deterministic chain. Production GO separately needs serving identity, deployment authority, source rights, actual E2E, operational lifecycle and any fee authorization. D1 mutation not required for read-only fixture; D1 production safety is not proven by this work.

Reject: cross-country probability ranking, fabricated current rates, unknown licence numeric panel, mismatched time/base, unrelated fixed answer fallback, raw private user question sent to external data source. Ask input transfer does not mean Ask answer or source-scope retention.
''')
md('DATA-QUALITY-RELEASE-CONTRACT.md','''# Review-only release contract · no scheduler activated
Use existing Answer Schema and source governance, not a new runtime. Per observation retain source ID, original endpoint, raw SHA, JSON/cell locator, region/product/population, metric/unit/base/seasonal adjustment/frequency, observation_period, publication_date, fetched_at, revised_at, effective_date, licence and immutable vintage. Unknown dates remain null with missing_reason, not copied from fetch time.

Policy decisions update on event/effective date; overnight data on published trading day; mortgage flows monthly with source-specific lag; SLOOS quarterly; HMDA calendar-year release plus revisions; income by survey release cycle (monthly income *level* is not monthly frequency). Expected date is an alert, not proof of new release. No all-series daily polling.

New bytes receive new SHA/vintage, previous answers stay pinned. Compare schema and definitions before activating revised fact; reject changed unit/base/population/series identity, do not overwrite old receipt. SOURCE updates facts; ANSWER separately governs interpretation. Missing publication metadata allows labelled historical fact only, not currentness.

403 access_denied, 429 rate_limited, licence_unknown, source_schema_changed, stale_data, missing_series, uncomparable, error are distinct nonzero states. Country/year mismatch, zero cohort denominator or unknown formula reject national claim. MY probability null is not 0%. No automatic retries to bypass restrictions. No private account/Profile/financial text in public external request, URL or persisted logs; only allowlisted public source identifiers. Failure test fixtures do not prove product enforcement before Gate3.
''')
js('LOCAL-HARNESS-DIAGNOSTICS.json',{'historicalAttemptsThisTask':[{'stage':'Node import','error':'ERR_IMPORT_ATTRIBUTE_MISSING','resolution':'Existing Pages JSON preload used; no product change'},{'stage':'first local request fixture','http':400,'error':'ASK_PUBLIC_KNOWLEDGE_REF_INVALID','reason':'Internal resolved sentinel incorrectly sent as public request ref','resolution':'Omit ref per actual public contract; 16 subsequent requests succeed at HTTP transport, semantic failures preserved'}]})
print('Reports and eight evidence answer objects written')

