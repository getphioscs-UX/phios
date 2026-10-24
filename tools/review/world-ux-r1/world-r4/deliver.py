import json, hashlib, html, re
from pathlib import Path
root=Path(__file__).resolve().parents[4]
out=Path(__file__).resolve().parent
def read(name): return json.loads((out/name).read_text(encoding='utf-8-sig'))
def esc(x): return html.escape(str(x))
build=read('BUILD-RECEIPT.json')
tests=read('TEST-RESULTS.json')
answers=read('REAL-ANSWERS-AND-HANDOFF.json')['answers']
attachment=Path('C:/Users/Guest Account/.codex/attachments/bd871ecb-5914-4558-9d22-efdbbe9c1ebd/Pasted text.txt').read_text(encoding='utf-8-sig')
labels=re.findall(r'\*\*(W4-\d+)\*\*\s*([^\r\n]+)',attachment)
evidence=['REUSE-AND-GAPS.md','EXTRACTION-ROW-AUDIT.json','READING-PROOF.json','TEST-RESULTS.json','TEST-RESULTS.json','TEST-RESULTS.json','TEST-RESULTS.json','ENDPOINT-PROBES.json','REAL-ANSWERS-AND-HANDOFF.json','BNM-PUBLIC-READS.json','BROWSER-RESULTS.json','COVERAGE-SNAPSHOT.json','NATIVE-UX-REGRESSION.json','TASK-STATUS.json']
matrix=[dict(id=i,requirement=t.strip(),state='PASS_LOCAL_LIMITED_SCOPE',evidence=evidence[n],scope='Isolated local candidate only; no production admission or activation') for n,(i,t) in enumerate(labels)]
assert len(matrix)==14
(out/'W4-ACCEPTANCE-MATRIX.json').write_text(json.dumps(matrix,ensure_ascii=False,indent=2),encoding='utf-8')
status=dict(status='LOCAL_CANDIDATE_READY_FOR_REVIEW',humanAcceptance='NOT_ASSUMED',head=build['headForLocation'],relevantBuildInputDigest=build['relevantBuildInputDigest'],source='LOCAL_VALIDATED_CPI_SCOPE',build=build['status'],deployment='NOT_PERFORMED',live='NOT_VERIFIED',providerCalls=0,productionWrites=0,r2Writes=0,commit=0,push=0,realMeasurements=4158,scope='Malaysia/Johor/Selangor; 2024-01 through 2026-09; CPI only',remaining=['Production adapter/admission not implemented or activated','Measured rainfall/water/crop output and geography join unavailable','Matched mortgage approval denominator and unit not established','Remaining modern-world domains have explicit coverage gaps','Membership Ask and real customer outcomes not verified'])
(out/'TASK-STATUS.json').write_text(json.dumps(status,ensure_ascii=False,indent=2),encoding='utf-8')
def link(p,label=None): return '<a href="'+esc(p)+'">'+esc(label or p)+'</a>'
body='''<h1>World R4 · Evidence → Observation</h1><p>本地限定候选 / Local scoped candidate · 2026-10-23 · 等待审阅，未自行接受。</p>
<p>复用现有 World、CWA、比较、知识交接和 Reality owner。真实公开数据形成可追溯观察；本地合成账户验证明确选源、相关性确认、保存引用、撤回及失效。没有把外部观察写成个人事实。</p>
<p><a href="http://127.0.0.1:63961/world/?locale=zh-Hans#world-r4">打开本地实际页面 · 中文</a> · <a href="http://127.0.0.1:63961/world/?locale=en#world-r4">English</a></p>
<h2>实际接通范围</h2><p>四份 DOSM CSV，4,158 条准确行／字段观察；Malaysia、Johor、Selangor，2024-01—2026-09。2026-09 全国同比1.8%，Johor 2.2%，Selangor 1.9%，两州同比差0.3个百分点。不是地区物价水平或家庭生活成本排名。</p>
<p>12个月连续序列、精确同比／环比配对可读；缺期、单位／方法／基期不同拒绝直接比较，缺值不作零。各类别涨幅不是总通胀贡献或成因分解。</p>
<p>B：真实 MET 预报可读，但不是实际降雨、水库或农业产出。C：真实 BNM 利率及申请／批准字段可读，但没有同口径申请人数、结果人数及 cohort 分母，不能计算批准率或断言更难获批。</p>
<h2>验证与边界</h2><p>19项本地检查；4条中英390/1440浏览器流程；12张实际阅读证明；2条原有地图→比较→返回回归。外链图片在浏览器中被阻断，记作未核验，不冒充图片显示通过。真实数据与合成账号／负面副本测试分开记录。</p>
<p>Ask 仅验证既有 handoff owner 的确定性、来源限定解释；不是会员模型交付或自由语义能力证明。原 RIC save=false 未改变，本次使用独立的明确本地 Impact Reference 用途；生产账户写入仍关闭。</p>'''
body+='<h2>W4-01—W4-14</h2><table><tr><th>项</th><th>验收范围</th><th>实际证据</th></tr>'
for x in matrix: body+='<tr><td>'+x['id']+'</td><td>'+esc(x['requirement'])+'<br>PASS_LOCAL_LIMITED_SCOPE</td><td>'+link(x['evidence'])+'</td></tr>'
body+='</table><h2>实际完整中英文回答</h2>'
for key,a in answers.items():
 body+='<article><h3>'+esc(key)+'</h3><p>'+esc(a.get('answer',''))+'</p><p>实际状态：'+esc(a.get('answerState',''))+'</p><details><summary>实际问题、来源身份和交接包</summary><pre>'+esc(json.dumps(a,ensure_ascii=False,indent=2))+'</pre></details></article>'
body+='<h2>实际页面截图</h2><p>点击查看原尺寸；不是独立重画的示范页面。</p><div class="shots">'
for case in 'ABC':
 for loc in ['zh-Hans','en']:
  for width in [390,1440]:
   p=f'{case}-reading-{loc}-{width}.png'
   body+='<figure>'+link(p,'<not-used>') .replace('&lt;not-used&gt;',esc(p))+'<a href="'+p+'"><img loading="lazy" src="'+p+'" alt="'+p+'"></a></figure>'
body+='</div><h2>构建身份</h2><p>源码定位 HEAD：'+esc(build['headForLocation'])+'</p><p>'+str(len(build['records']))+'项相关输入摘要：<code>'+build['relevantBuildInputDigest']+'</code></p><p>Worker：<code>'+build['worker']['sha256']+'</code></p><p>UI与隔离 Functions 编译完成，未执行整站 Pages 发布构建。Node实际24.18.0，项目指定22.16.0；不声称完成Node22运行测试。Worker可能包含共享工作区其他Functions，不能直接作为已授权发布包。</p><p>READ_ONLY；四项生产开关false；未触碰共享.pages-output。R1历史结果保留，共享适配器新增部分以本R4相关依赖证据为准。</p>'
body+='<h2>14领域、来源、失败与具体缺口</h2><ul>'
for p in ['REUSE-AND-GAPS.md','BUILD-RECEIPT.json','TEST-RESULTS.json','BROWSER-RESULTS.json','READING-PROOF.json','NATIVE-UX-REGRESSION.json','RAW-FETCH.json','METADATA-READS.json','BNM-PUBLIC-READS.json','EXTRACTION-ROW-AUDIT.json','TASK-STATUS.json','DELIVERY-VERIFICATION.json','CHANGED-FILES.json']:
 body+='<li>'+link(p)+'</li>'
body+='</ul><p>14领域明细：'+link('COVERAGE-SNAPSHOT.json')+'。这是既有 coverage 的本地 successor，不是第二套全局 registry。</p><p>首次 DNS、测试选错指标、模板及本地服务 entrypoint 失败保留。生产无变动，无需生产回滚；停止本地 R4 预览即可退出候选，不改数据库历史。原有 World／Atlas／OIDC／生产配置摘要保留核对记录。</p><p>下一步需要真实水文／产出与地理连接、匹配贷款分母和许可，以及生产只读来源适配与准入决定；不应将孤立 Node／SQLite QA 服务部署成生产接口。十四域完整覆盖、会员 Ask、真实个人影响均未完成。</p><p>Provider calls=0；R2/生产写入=0；迁移=0；commit/push/deploy=0。</p>'
(out/'COVERAGE-SNAPSHOT.json').write_bytes((root/'content/world/successors/world-r4-local-validation/coverage.json').read_bytes())
document='<!doctype html><html lang="zh-Hans"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>World R4 · Existing World Review Addendum</title><style>body{margin:0 auto;padding:32px 20px;max-width:1120px;background:#0b2832;color:#e7ece7;font:16px/1.8 system-ui}h1,h2,h3,a{color:#d8b970}a{overflow-wrap:anywhere}code,pre{overflow-wrap:anywhere;white-space:pre-wrap}table{border-collapse:collapse;width:100%}td,th{border:1px solid #41606a;padding:10px;text-align:left}article{border-top:1px solid #41606a;padding:16px 0}.shots{display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:16px}figure{margin:0}img{max-width:100%;max-height:620px;object-fit:contain;object-position:top}details{margin:12px 0}p{max-width:80ch}</style>'+body+'</html>'
(out/'HUMAN-REVIEW.html').write_text(document,encoding='utf-8')
append=[]
for target,href in [(root/'tools/review/world-ux-r1/HUMAN-REVIEW.html','world-r4/HUMAN-REVIEW.html'),(root/'content/production-closure/live-customer-commercial-convergence/MASTER-HUMAN-REVIEW.html','../../../tools/review/world-ux-r1/HUMAN-REVIEW.html#world-r4')]:
 start=b'<!-- WORLD-R4-LOCAL-20261023:START -->'; end=b'<!-- WORLD-R4-LOCAL-20261023:END -->'
 before=target.read_bytes(); clean=re.sub(re.escape(start)+b'.*?'+re.escape(end),b'',before,flags=re.S)
 section=(start.decode()+'<section id="world-r4"><h2>World R4 · Evidence to Observation</h2><p>本地CPI候选：真实4158条观察，19项检查、4条中英浏览器流程、12张实际阅读证明和2条原UX回归；隔离UI/Functions编译通过。水文与贷款分母缺口保留，生产接入及线上未验证。无部署、生产写入或收费调用。</p><p><a href="'+href+'">本轮实现、完整回答、截图、构建及14领域缺口</a></p></section>'+end.decode()).encode()
 pos=clean.lower().rfind(b'</body>'); pos=pos if pos>=0 else len(clean)
 after=clean[:pos]+section+clean[pos:]
 assert re.sub(re.escape(start)+b'.*?'+re.escape(end),b'',after,flags=re.S)==clean
 assert target.read_bytes()==before,'Concurrent review mutation; stop append'
 target.write_bytes(after)
 append.append(dict(path=str(target.relative_to(root)),beforeSha256=hashlib.sha256(before).hexdigest(),afterSha256=hashlib.sha256(after).hexdigest(),priorBytesPreserved=True))
(out/'REVIEW-APPEND-RECEIPT.json').write_text(json.dumps(append,indent=2),encoding='utf-8')
print('Review written; existing review/Master prior content preserved')
