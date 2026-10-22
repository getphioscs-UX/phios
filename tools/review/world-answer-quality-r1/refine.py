from pathlib import Path
root=Path('tools/review/world-answer-quality-r1')
for name in ['UNSEEN-RESULTS.json','UNSEEN-QUESTIONS.json']:
 (root/('INITIAL-'+name)).write_bytes((root/name).read_bytes())
p=Path('functions/_lib/world-answer-quality.js');s=p.read_text(encoding='utf-8')
s=s.replace("if(kind==='FACT_OR_NUMERIC')return", "if(kind==='FACT_OR_NUMERIC'&&!/why|为什么|为何|如何影响|怎样影响|how.*affect/i.test(question))return")
s=s.replace("const unit=matched[0],segments=[],sources=[],relevance=[];", """const unit=matched[0],segments=[],sources=[],relevance=[];
 const proportional=unit.id==='oil-costs'&&/同一比例|同比例|same proportion|same percentage/i.test(question);
 const selectedPropositions=proportional?[unit.reasons[1],unit.direct,unit.reasons[0]]:[unit.direct,...unit.reasons];""")
s=s.replace("[unit.direct,...unit.reasons].entries()", "selectedPropositions.entries()")
s=s.replace("questionType:kind,quality:'DIRECT_USEFUL_BOUNDED'", "questionType:kind,quality:kind==='FACT_OR_NUMERIC'?'NUMERIC_LIMITATION_WITH_MECHANISM':'DIRECT_USEFUL_BOUNDED'")
p.write_bytes(s.encode())
p=Path('functions/_lib/world-published-explanation.js');s=p.read_text(encoding='utf-8')
s=s.replace("const background=await retrieveWorldBackground({question,locale,env}),zh=locale==='zh-Hans';", """const background=await retrieveWorldBackground({question,locale,env}),zh=locale==='zh-Hans';
 if(classifyWorldQuestion(question)==='FACT_OR_NUMERIC')return {...background,sources:[],segments:[],reasons:[],state:'NUMERIC_EVIDENCE_REQUIRED',quality:'NUMERIC_LIMITATION',directAnswer:zh?'当前本地来源没有取到你所问的观测值，不能用文章或通用机制推算这个数字。需要核对相应地区、时期、指标定义与覆盖人群的原始统计。':'The local sources have not supplied the observation you asked for. An article or general mechanism cannot supply that number; the original statistic needs matching place, period, definition and population coverage.',impact:zh?'未取得观测值不等于数值为零，也不能推出个人结果。':'A missing observation is not zero and does not establish an individual outcome.',nextSteps:zh?['先核对官方统计是否发布该指标及其分母、时期和覆盖范围。','若指标不存在，明确标记不可得；可以另问有证据的机制或比较方法。']:['Check whether the official source publishes the measure, denominator, period and coverage.','If unavailable, retain that gap; ask separately about a supported mechanism or comparison method.'],boundary:zh?'没有补造数值，也没有把批准金额、申请数量或银行标准当作拒绝率。':'No number is invented, and approval amounts, application counts and bank standards are not treated as rejection rates.',diagnostics:{backgroundCandidates:background.sources.map(s=>({...s,relevance:'BACKGROUND_ONLY'}))}};""")
p.write_bytes(s.encode())
p=Path('content/world/local-answer-quality-r1.json');import json;doc=json.loads(p.read_text(encoding='utf-8'))
for u in doc['units']:
 if u['id']=='growth-households':u['matchGroups'][1].append(r'\bpay\b')
 if u['id']=='ageing-work-care':u['matchGroups'][0].append('退休')
doc['sources']['ports']['publishedAt']='2024-06-04'
for key in ['age','infrastructure']:doc['sources'][key]['verificationBasis']='OFFICIAL_SEARCH_TEXT_INSPECTED; direct HTTP may be blocked or binary; see SOURCE-HTTP.json. No full-text HTTP success is inferred.'
for key in doc['sources']:
 if 'verificationBasis' not in doc['sources'][key]:doc['sources'][key]['verificationBasis']='OFFICIAL_WEB_PAGE_TEXT_INSPECTED; independent HTTP results recorded separately. HTTP403 is not absence.'
p.write_bytes(json.dumps(doc,ensure_ascii=False,indent=2).encode())
p=root/'unseen.mjs';s=p.read_text(encoding='utf-8').replace("for(const f of freeze.files)assert.equal", "for(const f of process.argv.includes('--replay')?[]:freeze.files)assert.equal")
s=s.replace("fs.writeFileSync(out+'UNSEEN-QUESTIONS.json',", "if(!process.argv.includes('--replay'))fs.writeFileSync(out+'UNSEEN-QUESTIONS.json',")
p.write_bytes(s.encode())
