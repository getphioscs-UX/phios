"""Finalize this isolated review; never writes an accepted source or shared registry."""
from pathlib import Path
import ast, hashlib, html, json, os, subprocess
from datetime import datetime, timezone

D = Path(__file__).resolve().parent
REPO = D.parents[3]
assert REPO == Path.cwd().resolve()
def load(name): return json.loads((D / name).read_text(encoding='utf-8-sig'))
def save(name, value): (D / name).write_text(json.dumps(value, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
def digest(path): return hashlib.sha256(Path(path).read_bytes()).hexdigest()
def git(*args): return subprocess.check_output(['git', *args], cwd=REPO).decode('utf-8').strip()
def relative(path): return os.path.relpath(Path(path).resolve(), D).replace('\\', '/')
def esc(value): return html.escape(str(value), quote=True)
def link(path, label): return f'<a href="{esc(relative(path))}">{esc(label)}</a>'
def mib(n): return f'{n / 1048576:.3f} MiB'

now = datetime.now(timezone.utc).isoformat()
root = load('FULL-BLEED-ROOT-CAUSE.json')
regression = load('FULL-BLEED-REGRESSION.json')
manifest = load('REPAIRED-PDF-MANIFEST.json')
binding = load('ECR-SOURCE-BINDING.json')
ecr = load('ECR-Q87-REGRESSION.json')
baseline = load('BASELINE.json')
baseline_reports = load('BASELINE-REPORTS.json')['reports']
asset_registry = json.loads((REPO / 'content/reports/shared/report-visual-assets-r2.json').read_text(encoding='utf-8-sig'))
assets = {a['objectKey']: a for a in asset_registry['assets']}
hd_manifest = REPO / 'tools/review/hd-r6/import-20261027/r611/FRONT-MATTER-BINDINGS.json'
hd_rows = json.loads(hd_manifest.read_text(encoding='utf-8-sig'))['rows']
asset_map = []
for row in root['records']:
    key = row['r2_object_key_or_registered_path']
    assert digest(REPO / row['sourceFile']) == row['sourceSHA256']
    if row['method'] == 'HD':
        registered = next(a for a in hd_rows if a['registryAssetId'] == row['actual_asset_id'])
        registry_path = hd_manifest
        assert registered['objectKey'] == key
    else:
        registered = assets[key]
        registry_path = REPO / 'content/reports/shared/report-visual-assets-r2.json'
    assert registered['sha256'] == row['sourceSHA256']
    item = dict(row)
    item['registeredLogicalPageId'] = row['actual_asset_id']
    item['actualAssetFilename'] = Path(key).name
    item['registryEvidence'] = str(registry_path.relative_to(REPO)).replace('\\', '/')
    item['sourceSHARecheckedAt'] = now
    item['localSourceAndRegisteredSHAStillMatch'] = True
    item['remoteRefetchPerformed'] = False
    item['mode'] = 'FULL_BLEED_SAFE_EXTEND'
    item['newCropping'] = False
    item['newStretching'] = False
    item['visualReview'] = 'REVIEWED_NO_PAPER_GAP_NO_NEW_SOURCE_LOSS'
    item['edgeStyleHumanAcceptance'] = 'PENDING'
    # Preserve original measured geometry, including native sub-point rounding.
    item['originalBoundsOverflowPt'] = {
        'right': max(0, row['image_rectangle'][2] - row['page_dimensions'][0]),
        'top': max(0, row['image_rectangle'][3] - row['page_dimensions'][1])}
    asset_map.append(item)
root['records'] = asset_map
root['visualReview'] = {'all17Inspected': True, 'method': '34 actual page rasters and three contact sheets',
    'noUnintendedPaperGapsObserved': True, 'mainArtworkPayloadsPreserved': True,
    'remainingVisualDecision': 'Approve source-colour gradient extensions, especially AST51 and HD1; no crop proposal.',
    'edgeStyleHumanAcceptance': 'PENDING'}
save('FULL-BLEED-ROOT-CAUSE.json', root)
save('ASSET-IDENTITY-MAP.json', {'count': 17, 'records': asset_map,
    'authority': 'Exact current Q87 page image -> pre-Q87 RGB -> registered cached WebP SHA',
    'R2MutationCount': 0, 'remoteRefetchPerformed': False})
regression['visualStatus'] = 'LOCAL_GEOMETRY_CONTENT_PASS__EDGE_STYLE_HUMAN_REVIEW_PENDING'
regression['visualReview'] = root['visualReview']
save('FULL-BLEED-REGRESSION.json', regression)
save('ECR-VISUAL-REVIEW.json', {'at': now, 'actualInspectedPairs': [1, 7, 72, 132],
    'contact': '.tmp/r2-background-ecr-publication-repair/private/ecr-representatives/ECR-Q87-SOURCE-COMPARE.jpg',
    'observations': ['Cover artwork unchanged', 'Bilingual accepted body layout unchanged',
        'SEC07 professional figure unchanged', 'Final appendix geometry and table unchanged'],
    'freshRenderedPageImages': 8, 'full132FreshVisualReviewClaimed': False,
    'inheritedFullPageVisualEvidence': 'R33 binding-closure-20261027: prior 281 ZH/EN/bilingual page reviews',
    'all132TextContentFontsIdentityAnd20SourceBodiesCheckedNow': True,
    'Q87RepresentativeVisualResult': 'PASS_LOCAL', 'commercialPublicationApproval': False})

head = git('rev-parse', 'HEAD')
assert head == baseline['HEAD'], 'HEAD_DRIFT'
assert not git('diff', '--cached', '--name-only'), 'INDEX_NOT_EMPTY'
for report in baseline_reports: assert digest(report['path']) == report['sha256']
assert digest(ecr['source']) == ecr['sourceSHA256']
assert digest(ecr['output']) == ecr['outputSHA256']
assert digest(binding['sourceIndex']) == binding['sourceIndexSHA256']
assert digest(binding['bindingManifest']) == binding['bindingSHA256']
assert digest(binding['frozenIRPath']) == binding['frozenIRSHA256']
for report in manifest['results']: assert digest(report['file']) == report['sha256']
sources = ['scripts/lib/report_background_layout.py', 'scripts/lib/ecr-author-case-store.mjs',
    'tools/review/report-storage-optimization-r1/optimize.py']
source_rows = [{'path': p, 'sha256': digest(REPO / p), 'bytes': (REPO / p).stat().st_size} for p in sources]
source_digest = hashlib.sha256(json.dumps(source_rows, sort_keys=True, separators=(',', ':')).encode()).hexdigest()
for p in [REPO / sources[0], REPO / sources[2], *D.glob('*.py')]: ast.parse(p.read_text(encoding='utf-8-sig'))
dirty_now = git('status', '--short')
concurrent = [{'path': a['path'], 'baselineSHA256': a['sha256'],
    'currentSHA256': digest(REPO / a['path']), 'writtenByThisTask': False,
    'concurrentBytesChangedSinceStart': digest(REPO / a['path']) != a['sha256']} for a in baseline['dirtyFiles']]
save('SOURCE-CANDIDATE-MANIFEST.json', {'at': now, 'HEAD': head, 'branch': git('branch', '--show-current'),
    'notRepresentedByHEADAlone': True, 'sourceFiles': source_rows, 'sourceFilesDigest': source_digest,
    'actualGitStatus': dirty_now.splitlines(), 'originalConcurrentPaths': concurrent,
    'otherConcurrentOwnerChanges': 'Numerology registry/resolver/narrative and Subject/Profile work retained; not written here.',
    'reviewScripts': [{'path': relative(p), 'sha256': digest(p)} for p in sorted(D.glob('*.py')) + sorted(D.glob('*.mjs'))],
    'indexEmpty': True, 'committed': False, 'pushed': False})
safety = {'at': now, 'HEADUnchanged': True, 'indexEmpty': True,
    'originalQ87PDFHashesUnchanged': True, 'originalECRPDFHashUnchanged': True,
    'all17CachedSourceAssetHashesUnchanged': True, 'currentScopedRegistrationsMatch': True,
    'ECRSourceIndexBindingAndFrozenCalculationUnchanged': True,
    'all20SourceBodiesReReadByRealSelector': True,
    'parentHumanReviewWritten': False, 'globalMasterWritten': False,
    'otherWindowFilesWritten': False, 'fullOptimizationSweepRerun': False,
    'fullNpmCheckRun': False, 'BaZiOrNumerologyRegeneratedByThisTask': False,
    'providerCalls': 0, 'providerUSD': 0, 'payments': 0, 'refunds': 0,
    'productionWrites': 0, 'D1Operations': 0, 'R2Writes': 0, 'StripeChanges': 0,
    'commits': 0, 'pushes': 0, 'merges': 0, 'deployments': 0,
    'privateECRArtifactsGitIgnored': all(subprocess.run(['git', 'check-ignore', '-q', str(p)], cwd=REPO).returncode == 0
        for p in [Path(ecr['output']), Path(load('ECR-PRIVATE-HTML.json')['path'])])}
assert safety['privateECRArtifactsGitIgnored']
save('SAFETY-RECEIPT.json', safety)

style = '''body{margin:0;background:#f6f4ec;color:#173a43;font:16px/1.65 system-ui,"Microsoft YaHei",sans-serif}main{max-width:1180px;margin:auto;padding:32px 24px}h1,h2{line-height:1.3;color:#102d43}h2{margin-top:40px}a{color:#086762}code{overflow-wrap:anywhere;font-size:.86em}table{border-collapse:collapse;width:100%;font-size:14px}td,th{padding:10px;border:1px solid #c8cec4;text-align:left;vertical-align:top;overflow-wrap:anywhere}.scroll{overflow:auto}.note{border-left:4px solid #aa854a;padding:16px;background:#fff9e7}.ok{border-left:4px solid #1b7871;padding:16px;background:#eaf4ef}.cards{display:grid;grid-template-columns:repeat(auto-fit,minmax(235px,1fr));gap:16px}.card,details{background:white;border:1px solid #d4d5c8;border-radius:8px;padding:18px;margin:12px 0}.pair{display:grid;grid-template-columns:1fr 1fr;gap:12px}.pair img{width:100%;height:auto;border:1px solid #bdc6bd}.contact{width:100%;height:auto}summary{cursor:pointer;font-weight:600}small{color:#536568}nav{display:flex;gap:16px;flex-wrap:wrap}iframe{width:100%;height:76vh;border:1px solid #b6c4b9}@media(max-width:600px){main{padding:24px 12px}h1{font-size:26px}td,th{padding:7px;font-size:12px}.pair{gap:6px}}'''
def page(title, body): return f'<!doctype html><html lang="zh-Hans"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>{esc(title)}</title><style>{style}</style><main>{body}</main></html>'

pairs = []
rows = []
for a in asset_map:
    method, number = a['method'], a['pdf_page']
    prefix = D / 'current-page-rasters' / f'{method}-{number:03d}'
    before, after = Path(str(prefix) + '-before.png'), Path(str(prefix) + '-after.png')
    assert before.exists() and after.exists()
    pairs.append(f'<section id="{method}-{number}"><h2>{method} · PDF 第 {number} 页 · {esc(a["section_id"])}</h2>'
        f'<p>{esc(a["actualAssetFilename"])} · EXTEND · 原主体矩形保持不变。</p>'
        f'<div class="pair"><div>修复前<img loading="lazy" src="{esc(relative(before))}" alt="{method} page {number} before"></div>'
        f'<div>修复后<img loading="lazy" src="{esc(relative(after))}" alt="{method} page {number} after"></div></div></section>')
    rows.append(f'<tr><td>{method} / {number}<br>{esc(a["section_id"])}</td>'
        f'<td>{esc(a["actualAssetFilename"])}<details><summary>真实 key / SHA / owner</summary>'
        f'<code>{esc(a["r2_object_key_or_registered_path"])}<br>{a["sourceSHA256"]}<br>{esc(a["owning_renderer"])}</code></details></td>'
        f'<td>{a["source_dimensions"][0]}×{a["source_dimensions"][1]}<br>上 {a["top_gap_pt"]:.2f} / 下 {a["bottom_gap_pt"]:.2f} pt</td>'
        f'<td>EXTEND；未新增裁切、拉伸或底部遮盖<br>{link(D / "FULL-BLEED-BEFORE-AFTER.html", "前后完整页")}</td></tr>')
(D / 'FULL-BLEED-BEFORE-AFTER.html').write_text(page('17 页 · 实际前后对照',
    '<h1>17 页实际渲染对照</h1><p>原图内容保持；仅补充原有纸张空白区域。每对均为同尺寸、同渲染器 110dpi 的真实页面，不是示意图。</p>'
    '<p class="note">请重点审核 AST51 与 HD1 的宽边渐变风格。全部原图不裁切；没有待批准的裁切方案。</p>' + ''.join(pairs)), encoding='utf-8')

cards = []
for r in manifest['results']:
    old = r['source']['bytes']; delta = r['bytes'] - old
    cards.append(f'<article class="card"><h2>{r["method"]}</h2><p>{link(r["file"], "打开完整修复 PDF")}</p>'
        f'<p>{r["pages"]} 页 · {r["bytes"]:,} bytes · {mib(r["bytes"])}</p>'
        f'<p>原 Q87 {old:,} bytes；补边增加 {delta:,} bytes。原主体图片载荷保留。</p>'
        f'<details><summary>文件摘要</summary><code>{r["sha256"]}</code></details></article>')
cards.append(f'<article class="card"><h2>ECR · 实际作者报告</h2><p>{link(ecr["output"], "打开完整 132 页 Q87 PDF")}</p>'
    f'<p>{ecr["optimizedBytes"]:,} bytes · {mib(ecr["optimizedBytes"])}；原文件 {ecr["originalBytes"]:,} bytes。</p>'
    f'<p>{link(load("ECR-PRIVATE-HTML.json")["path"], "打开完整图文 HTML + 十章双语正文")}</p>'
    '<p>仅已接受作者案例的私人本地审阅，不是通用或商业客户交付。</p>'
    f'<details><summary>文件摘要</summary><code>{ecr["outputSHA256"]}</code></details></article>')

coverage = load('ECR-SECTION-COVERAGE.json')['sections']
coverage_rows = ''.join(f'<tr><td>SEC{r["sectionId"]}</td><td>{esc(r["acceptedVersion"])}</td>'
    f'<td>中英文正文均有明确作者 ACCEPT；PDF 实际正文命中</td><td>{esc(Path(r["approvedVisual"]).name)}</td><td>PENDING / DRAFT</td></tr>' for r in coverage)
evidence = ['FULL-BLEED-ROOT-CAUSE.json', 'ASSET-IDENTITY-MAP.json', 'FULL-BLEED-REGRESSION.json',
    'BACKGROUND-LAYOUT-UNIT-CHECKS.json', 'ECR-SOURCE-AUTHORITY.md', 'ECR-SOURCE-BINDING.json',
    'ECR-SECTION-COVERAGE.json', 'ECR-CONTENT-STATUS.md', 'ECR-SOURCE-NEGATIVE-TESTS.json',
    'ECR-Q87-REGRESSION.json', 'ECR-FINAL-CONTENT-CHECKS.json', 'ECR-VISUAL-REVIEW.json',
    'Q87-ENCODING-VERIFY.json', 'Q87-REGRESSION.md', 'SOURCE-CANDIDATE-MANIFEST.json', 'SAFETY-RECEIPT.json', 'EXECUTION-STATE.md', 'REVIEW-HTML-VALIDATION.json']
evidence = [n for n in evidence if (D / n).exists()]
evidence_links = '<ul>' + ''.join(f'<li>{link(D / n, n)}</li>' for n in evidence) + '</ul>'
source_links = '<ul>' + ''.join(f'<li>{link(REPO / p, p)}</li>' for p in sources) + '</ul>'
contact_html = ''.join(f'<p>{link(D / f"FULL-BLEED-COMPARISON-{i}.jpg", f"前后联系表 {i}")}</p>'
    f'<img class="contact" loading="lazy" src="FULL-BLEED-COMPARISON-{i}.jpg" alt="17 pages before after contact sheet {i}">' for i in range(1, 4))
body = f'''<h1>R2 满版背景与 ECR 作者报告修复</h1>
<p>独立的局部人审候选 · 2026-10-30 · 不取代全局 Master，不改写历史回执。</p>
<nav><a href="#pdfs">四份实际 PDF</a><a href="#backgrounds">17 页修复</a><a href="#ecr">ECR 正文权威</a><a href="#checks">实际检查</a><a href="#next">人审与接线边界</a></nav>
<div class="ok">背景几何与内容保留：PASS_LOCAL。17 页均已实际查看，无新增纸白边、主体裁切或拉伸。ECR_SOURCE_BINDING：PASS_LOCAL_ACCEPTED_AUTHOR_CASE。</div>
<p class="note">仍需人审：补边的柔和渐变风格，尤其 AST 第51页、HD 第1页。ECR 完整出版批准未记录，20份正文的商业权利状态仍为 PENDING / DRAFT；ECR_PUBLICATION 不能标记 PASS。未获准生产或商业交付。</p>
<h2 id="pdfs">可实际阅读的四份报告</h2><div class="cards">{''.join(cards)}</div>
<h2 id="backgrounds">17 页问题、真实资产与修复</h2>
<p>原先将非 A4 比例的固定图以 contain 放入 A4：留下的是图外 PDF 画布，不是图片未加载，也没有白色遮盖层。直接 cover 会裁掉已批准的边缘内容。本次保持原图、原矩形及 MediaBox/CropBox，只在空白处加入由边缘颜色生成的背景延展；未镜像复制文字、标志或图案。</p>
<p>原生 CSS 存在不足一点的边界舍入量，完整矩形与越界量保留在 JSON；没有为消除舍入而缩放或移动原稿。图内本来存在的浅色区域仍属于原画，不冒充纸边处理。</p>
<p>{link(D / 'FULL-BLEED-BEFORE-AFTER.html', '打开全部 17 对完整页面（34 张真实渲染）')}</p>
<div class="scroll"><table><thead><tr><th>方法 / 物理页</th><th>实际资产</th><th>源尺寸 / 原纸边</th><th>修复与对照</th></tr></thead><tbody>{''.join(rows)}</tbody></table></div>
<details><summary>三张实际前后联系表</summary>{contact_html}</details>
<h2 id="ecr">ECR：已定位真实的十章作者来源</h2>
<p>旧存储审计在 PRIMARY 基准中显式选择六页 SYNTHETIC-BILINGUAL-RENDERER-QA.pdf，不能代表最新作者稿，也不能由此推断付费路径使用工程正文。历史审计不改写；新候选明确选择 LOCAL_AUTHOR_REPORT，拒绝工程样稿和未接受来源。</p>
<p>真实来源是 R32 私人作者集合 CURRENT-EFFECTIVE-CHAPTERS.json → 二十份 exact-text.txt / accepted-version.json / 作者 ACCEPT 回执 → R33 明确十章图文绑定 → binding-closure-20261027 最新作者 PDF。使用原冻结计算快照，未新写正文、重新计算命盘或借用通用旧章节填充。</p>
<p>{link(D / 'ECR-SOURCE-AUTHORITY.md', '查看完整来源目录、版本、SHA、权利及 composer')}。第一章 V3，第二、三章 V2，第四至十章 V1；全部中英各有正文。源文件继续存放在 Git 外私人目录。</p>
<div class="scroll"><table><thead><tr><th>章节</th><th>作者版本</th><th>实际完整性</th><th>明确图示绑定</th><th>商业权利 / 出版</th></tr></thead><tbody>{coverage_rows}</tbody></table></div>
<p>完整 PDF/HTML 仅在 ignored 私人目录保存，没有向公开仓库复制原文。实际 Q87 共132页，20/20正文投影命中；新鲜抽查第1、7、72、132页的原版/Q87共8张渲染。继承现有 R33 全页视觉证据，不声称本轮重新肉眼检查全部132页。</p>
<p>{link(REPO / '.tmp/r2-background-ecr-publication-repair/private/ecr-representatives/ECR-Q87-SOURCE-COMPARE.jpg', 'ECR 原版 / Q87：四组实际画面对照（私人本地）')}</p>
<h2 id="checks">针对性验证与真实失败保留</h2>
<ul><li>四模式几何及准入测试27项；真实 ECR 来源正负测22项；Node语法与本轮Python语法检查。</li>
<li>AST64 + ZWR68 + HD145 = 277页：文字、字体、原图片载荷、页数、页框和身份不变；260个非目标页面内容流保持；17个目标原图主体像素一致，34张前后渲染实际完成。</li>
<li>ECR132页文字、内容流、字体、身份、源SHA保持；20份已接受正文逐份验证；没有工程样稿标签。</li>
<li>新增或重编码JPEG：AST20、ZWR12、HD2、ECR16，实际量化表匹配Q87，4:4:4；ECR原图尺寸集合不变，未下采样。</li>
<li>首次CTM定位失败、首次边缘色带及ECR回执格式失败均保留。最终修正没有覆盖历史PDF或失败记录。</li>
<li>未运行全局npm检查、24候选压缩矩阵或15样张全套检查；未重生成BaZi或Numerology，未占用或移除其他窗口的渲染锁。</li></ul>
<h2>实际源码候选，不仅是 HEAD</h2><p>HEAD <code>{head}</code>，main；本轮源码尚未提交。三项源码摘要 <code>{source_digest}</code>，完整当前dirty清单及并行变化见manifest。</p>{source_links}
<p>新增共享背景适配器；ECR store只追加只读的已接受作者案例选择；原 Q87 优化器只新增隔离输出参数，原编码和默认路径不变。没有改动并行修改中的共享 Registry/resolver，也未改变旧版原生分页器。</p>
<h2 id="next">安全接线方案与需要你确认的内容</h2>
<ol><li>审阅17页延展风格，尤其AST51与HD1。没有任何待批准的裁切；不批准时保留原主图，修订延展层即可。</li>
<li>审阅完整ECR作者报告、20份正文和十章图示。现有作者文本接受不自动补足商业权利或最终出版批准。</li>
<li>后续获准接线时，在既有原生composer之后、Q87之前调用同一背景适配器；用已核实资产角色/哈希/实际矩形选页，不能把本候选的固定物理页号套给其他报告。显式选择四种模式，COVER要求安全裁切区域，CONTAIN要求留边批准；未知源fail closed。</li>
<li>ECR继续使用现有author store、R33 composer及既有保存下载owner；默认不启用通用或付费来源。先补商业权利及最终出版接受，再另行授权产品/生产接线。</li></ol>
<p class="note">本轮生产写入0、R2写入0、D1操作0、Stripe改动0、Provider 0 / USD0、付款/退款0/0；未commit/push/merge/deploy。原Master与父人审入口未写入；其他窗口的Subject/Profile/Numerology变化保留。</p>
<h2>原始证据与接续记录</h2>{evidence_links}<p>STOP AT HUMAN REVIEW · 此状态不代表上线或商业交付。</p>'''
(D / 'HUMAN-REVIEW.html').write_text(page('R2 满版 & ECR 作者报告 · Human Review', body), encoding='utf-8')

(D / 'Q87-REGRESSION.md').write_text(f'''# Q87 targeted regression

Original JPEG Q87 / 4:4:4 / no-downsampling policy retained. No old 24-candidate or 15-sample sweep repeated.

AST/ZWR/HD: existing Q87 main image payloads, fonts, content, identity and page boxes retained; added only Q87 boundary-colour extensions. Actual outputs: AST {manifest['results'][0]['bytes']:,} bytes /64 pages; ZWR {manifest['results'][1]['bytes']:,}/68; HD {manifest['results'][2]['bytes']:,}/145. All17 actual before/after pairs inspected. Broad edge gradients remain subject to Human style acceptance, especially AST51 and HD1; no cropping requested.

ECR: current accepted author-case original58,215,037 bytes → Q87 20,754,792 bytes /132 pages. All132 page text/content/font/identity checks, all20 exact source-body projections, unchanged raster dimensions, actual Q87 quantization tables and4:4:4 checks pass. Fresh source/Q87 visual pairs1,7,72,132 viewed: cover, body, professional SEC07, final appendix unchanged. Prior R33 complete visual evidence is inherited; no claim of132 new manual page inspections.

Initial CTM failure, first visible-edge-profile version and receipt-format failure preserved. Final Q87 PDF recovered by independent reopen after initial receipt error, not re-encoded again. Evidence: FULL-BLEED-REGRESSION.json, Q87-ENCODING-VERIFY.json, ECR-Q87-REGRESSION.json, ECR-FINAL-CONTENT-CHECKS.json, ECR-VISUAL-REVIEW.json.
''', encoding='utf-8')
(D / 'EXECUTION-STATE.md').write_text(f'''# R2 Full-Bleed & ECR Author Report Repair — checkpoint

Updated {now}. HEAD `{head}`, main, unchanged. Candidate is identified by actual source rows in SOURCE-CANDIDATE-MANIFEST.json, digest `{source_digest}`, not HEAD alone. Index empty. No own test/render job remains running.

## Completed
- Full attachment, governance, actual branch/worktrees/dirty baseline read. Concurrent Subject/Profile/Numerology and initial four dirty paths not written. Parent Human Review/global Master retained.
- Seventeen exact source WebP identities/registered SHA values rechecked. Paper gaps are outside original contain image rectangles; source white areas not treated as canvas. No R2 writes or remote-token work.
- Shared four-mode geometry/permission contract + safe extension adapter;27 tests. Existing Q87 original streams isolated with q/Q so Skia root CTM cannot distort new layers.
- Actual three PDFs64/68/145 pages generated. All277 page text/font/image/page-box/identity checks;260 unaffected content streams;34 target page rasters;all17 pairs inspected. Only original blank canvas extended. Soft colour extension style, especially AST51/HD1, remains Human Review, not invisible-seam approval.
- Existing ECR R32→R33 current private author collection located;20 accepted bodies/10 chapters exact. Real source selector and22 source boundary tests;current frozen IR and bindings retained. No new prose.
- Real132-page ECR Q87 PDF+full bilingual HTML generated in ignored private directory. All132 pages verified,20/20 source bodies located,4 representative pairs actually inspected. Existing R33 full-page visual proof reused. Rights20 PENDING, publication DRAFT;commercial/publication PASS not declared.
- Q87 DQT87 /444 verified for all newly encoded image payloads:AST20,ZWR12,HD2,ECR16. No resizing.
- Required asset map/root cause/regressions/source documents/before-after HTML and isolated HUMAN-REVIEW.html completed. Historic failures and own generated-cache backup retained.

## Status / next exact action
BACKGROUND_GEOMETRY_CONTENT = PASS_LOCAL.
BACKGROUND_EDGE_STYLE = HUMAN_REVIEW_PENDING (AST51 / HD1 priority; inspect all17).
ECR_SOURCE_BINDING = PASS_LOCAL_ACCEPTED_AUTHOR_CASE.
ECR_FULL_AUTHOR_CASE = GENERATED_132_PAGES;local review only.
ECR_PUBLICATION = NOT_APPROVED (rights PENDING + final Human publication approval absent).
PRODUCTION_DELIVERY = NOT_AUTHORIZED / NOT_EXECUTED.

STOP AT HUMAN REVIEW. Next:owner reviews actual PDFs and extension style, then separately decides rights/publication/product integration. No fixed current-page list may be reused across changed layouts without new source/geometry checks. Do not rerun historical optimization matrices or overwrite accepted source/receipts.

Provider0/USD0;payments/refunds0/0;production/R2/D1/Stripe writes0;commit/push/merge/deploy0. No global npm check. No BaZi/NUM regeneration. Private ECR source stays outside Git;private PDF/HTML remain ignored. Safety and actual dirty composition in SAFETY-RECEIPT.json / SOURCE-CANDIDATE-MANIFEST.json.
''', encoding='utf-8')
print(json.dumps({'status': 'HUMAN_REVIEW', 'HEAD': head, 'sourceDigest': source_digest,
    'backgroundPages': 17, 'ECRPages': 132, 'humanReview': str(D / 'HUMAN-REVIEW.html')}, ensure_ascii=False))
