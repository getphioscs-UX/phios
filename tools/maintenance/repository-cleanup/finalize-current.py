from pathlib import Path
import json,hashlib,datetime,html,os,re
R=Path('C:/phios');B=R/'tools/maintenance/repository-cleanup';M=R/'content/production-closure/live-customer-commercial-convergence/MASTER-HUMAN-REVIEW.html'
def load(n):return json.loads((B/n).read_text(encoding='utf-8-sig'))
def save(n,x):(B/n).write_text(json.dumps(x,ensure_ascii=False,indent=2),encoding='utf8')
before=load('CURRENT-SYSTEM-BASELINE.json');after=load('CURRENT-AFTER-INVENTORY.json');base=load('CURRENT-BASELINE-CORRECTED.json');samples=load('CURRENT-SPACE-SAMPLES.json');work=load('CURRENT-WORKTREE-RETIREMENT.json');snap=load('CURRENT-SNAPSHOT-DELETION.json');media=load('CURRENT-RETIRED-MEDIA-DELETION.json');temp=load('CURRENT-GIT-TEMP-DELETION.json');git=load('CURRENT-GIT-AFTER.json');state=load('CURRENT-MAIN-STATE.json');hist=load('CURRENT-HISTORY-AUDIT.json');pending=load('CURRENT-PENDING-SUMMARY.json')
assert len(samples)>=3 and all(x['head']==state['currentHead'] for x in samples)
elapsed=(datetime.datetime.fromisoformat(samples[-1]['utc'].replace('Z','+00:00'))-datetime.datetime.fromisoformat(samples[0]['utc'].replace('Z','+00:00'))).total_seconds();assert elapsed>=60
categories=[{'category':'retired linked worktrees','files':sum(base['roots'][x['name']]['filesExcludingJunctionAliases']for x in work),'logicalBytes':sum(base['roots'][x['name']]['logicalBytesExcludingJunctionAliases']for x in work)},{'category':'obsolete P9/build snapshots','files':sum(x['plannedFiles']for x in snap),'logicalBytes':sum(x['plannedLogicalBytes']for x in snap)},{'category':'superseded rendered PDFs/PNG/HTML/TAR','files':len(media),'logicalBytes':sum(x['bytes']for x in media)},{'category':'Git-classified expired temporary garbage (not valid objects)','files':temp['deletedFiles'],'logicalBytes':int(temp['deletedLogicalBytes'])}]
finalFree=samples[-1]['freeBytes'];net=finalFree-before['freeBytes']
summary={'status':'LOCAL_CONCENTRATED_CLEANUP_COMPLETED_WITH_HELD_ITEMS','completedUtc':datetime.datetime.now(datetime.timezone.utc).isoformat(),'volumeSerial':before['serial'],'volumeTotalBytes':before['totalBytes'],'initialDriveFreeBytes':before['freeBytes'],'initialSampleUtc':before['utc'],'finalDriveFreeBytes':finalFree,'finalSampleUtc':samples[-1]['utc'],'observedNetFreeGainBytes':net,'target15GBMet':finalFree>=15_000_000_000,'target25GBMet':finalFree>=25_000_000_000,'categories':categories,'manifestedLogicalBytes':sum(x['logicalBytes']for x in categories),'manifestedFiles':sum(x['files']for x in categories),'logicalVsPhysical':'Per-path logical bytes are separate from actual C: net change. Hardlinks, junctions, allocation and unrelated background writes prevent equality; no forced attribution of the difference.','correctedBeforeUniqueFileLogicalBytes':base['allRootsUniqueFileLogicalBytes'],'afterUniqueFileLogicalBytes':after['allRootsUniqueFileLogicalBytes'],'afterInventory':after,'worktreeResults':work,'remainingRegisteredWorktrees':1,'recoveryDirectory':'C:/phios-recovery/20261028','recoveryArchiveBytes':sum(p.stat().st_size for p in Path('C:/phios-recovery/20261028').glob('*.zip')),'gitAfter':git,'spaceSamples':samples,'observationSeconds':elapsed,'observationNetBytes':samples[-1]['freeBytes']-samples[0]['freeBytes'],'stabilityQualification':'No obvious sustained decline in this finite observation window; not a permanent stability promise.','historical22844989440ByteDrop':'UNKNOWN; not reopened or assigned to pagefile','pagefileCurrentWindow':'22362464256 bytes before and after; system settings unchanged','remainingReviewFiles':pending['files'],'restrictions':{'providerCalls':0,'productionWrites':0,'R2Writes':0,'StripeMutations':0,'commitsByThisAgent':0,'pushes':0,'deployments':0,'gcOrRepack':0,'historyRewrite':0},'notRun':'No full build, report render, batch rasterization or screenshots. Syntax/guards and retained bytes only.'}
old=load('RESULT.json');history=old.get('historicalResultBeforeConcentratedCleanup',old)
save('RESULT.json',{**summary,'historicalResultBeforeConcentratedCleanup':history})
growth=load('GROWTH-INVESTIGATION.json');growth['concentratedCleanup20261028']={k:summary[k]for k in ['status','initialDriveFreeBytes','finalDriveFreeBytes','observedNetFreeGainBytes','gitAfter','spaceSamples','observationSeconds','historical22844989440ByteDrop','pagefileCurrentWindow']};save('GROWTH-INVESTIGATION.json',growth)
gb=lambda n:f'{n/1e9:.3f}'
rows='\n'.join(f'| {x["category"]} | {x["files"]:,} | {x["logicalBytes"]:,} | {gb(x["logicalBytes"])} |' for x in categories)
wt='\n'.join(f'| {x["path"]} | {x.get("branch") or x.get("recoveryBranch")} | {gb(base["roots"][x["name"]]["logicalBytesExcludingJunctionAliases"])} → 0 | {x["archive"]} |'for x in work)
text=f'''## 2026-10-28 concentrated cleanup — final current result

Volume C: serial {before['serial']}; capacity {before['totalBytes']:,} bytes. Available {before['freeBytes']:,} → {finalFree:,} bytes; measured net gain {net:,} bytes ({gb(net)} decimal GB). Last sample {samples[-1]['utc']}. Both 15/25 GB targets exceeded. Logical deletion sizes are not physical allocation/reclaim claims.

| Category | Files | Logical bytes | Decimal GB |
|---|---:|---:|---:|
{rows}

| Retired path | Retained branch/ref | Logical GB before → after | Verified small recovery archive |
|---|---|---:|---|
{wt}

Current main working files: {after['roots']['main']['logicalBytes']:,} bytes. Shared Git directory: {after['roots']['git']['logicalBytes']:,} bytes; objects subtree {next(x['bytes']for x in after['largest20NonoverlappingDirectories']if x['path'].endswith('objects')):,} bytes. Combined unique-file logical size {after['allRootsUniqueFileLogicalBytes']:,} bytes; no additional linked worktree remains. PNGs remaining: {after['png']['files']:,}, {after['png']['logicalBytes']:,} bytes. Largest 20 files/directories are in CURRENT-AFTER-INVENTORY.json. Directory junctions are not followed in the final inventory; CURRENT-BASELINE-CORRECTED.json corrects the earlier raw traversal.

Three finite samples over {elapsed:.1f}s changed free bytes by {summary['observationNetBytes']:+,}; no obvious sustained decline observed. Paging stayed 22,362,464,256 bytes, automatic configuration untouched. The older 22,844,989,440-byte loss remains UNKNOWN. No suitable second physical data volume was found; the recovery partition is not a migration destination.

Git pack count stayed {git['after']['packs']}; packed object count stayed {git['after']['in-pack']}. Loose-object count increased by {git['validLooseCountDelta']}, so an initial count-equality assertion failed and is NOT reported PASS. Only explicitly classified expired temporary garbage was deleted. Recent temporary files remain itemized; their creating-task/recovery disposition is not established. No valid-object deletion, reflog expiry, branch deletion, gc/repack or history rewrite occurred. See HISTORY-SLIMMING-PLAN.md for the separately authorized future plan.

Current runtime/assets/registries are unchanged from preserved main {state['currentHead']}; current review PDFs and required Numerology R20 source JSON passed exact hashes. Guard syntax, threshold rejection, explicit override, render mutual exclusion and junction-target preservation were checked. Initial sandbox TEMP/junction permission failures and their successful scoped successor checks are retained. No new product build or publication acceptance is claimed.

NEXT-REVIEW-CANDIDATES.csv names every held artifact, bytes, missing dependency evidence and next action. Official manuscripts/assets, templates, current Financial R3 and order-delivery materials were not deletion targets. Main's other-window merge is preserved. The normal deletions remain unstaged reviewable differences, including the tracked obsolete snapshot; ignore rules do not substitute for deletion. Provider/production/R2/Stripe writes, agent commit/push/deploy = 0. Development remains paused pending Owner resumption.
'''
p=B/'EXECUTION-RECORD.md';s=p.read_text(encoding='utf8');marker='## 2026-10-28 concentrated cleanup — final current result';s=s.split(marker)[0].rstrip()+'\n\n'+text;p.write_text(s,encoding='utf8')
links=['RESULT.json','EXECUTION-RECORD.md','CURRENT-AFTER-INVENTORY.json','CURRENT-BASELINE-CORRECTED.json','CURRENT-MAINTENANCE-CHECKS.json','NEXT-REVIEW-CANDIDATES.csv','HISTORY-SLIMMING-PLAN.md','RECOVERY-INSTRUCTIONS.md','CURRENT-SNAPSHOT-DELETION.json','CURRENT-GIT-TEMP-DELETION.json','CURRENT-SPACE-SAMPLES.json','CURRENT-MAIN-STATE.json']
href=lambda n:os.path.relpath(B/n,M.parent).replace('\\','/')
body=f'''<div id="repository-cleanup-current"><h3>2026-10-28 集中瘦身 · 本地完成，待审项保留</h3>
<p><strong>C 盘可用：{gb(before['freeBytes'])} → {gb(finalFree)} GB；实际净增 {gb(net)} GB。</strong>卷序列号 {before['serial']}。末轮采样 {samples[-1]['utc']}。单位均为十进制 GB。</p>
<p>四个附加 worktree 均已正常移除；独有提交保留分支，未提交源码与二进制修改已在仓库外小恢复包核验保全。没有强制移除、reset 或 clean。<code>C:\\phios-recovery\\20261028</code>（{gb(summary['recoveryArchiveBytes'])} GB；不要公开上传恢复包）。</p>
<table><thead><tr><th>清理类别</th><th>文件数</th><th>逻辑 GB</th></tr></thead><tbody>'''+''.join(f'<tr><td>{html.escape(x["category"])}</td><td>{x["files"]:,}</td><td>{gb(x["logicalBytes"])}</td></tr>'for x in categories)+f'''</tbody></table>
<p>主工作文件 {gb(after['roots']['main']['logicalBytes'])} GB；共享 Git {gb(after['roots']['git']['logicalBytes'])} GB；合计 {gb(after['allRootsUniqueFileLogicalBytes'])} GB（扫描时的唯一文件逻辑大小）。剩余 PNG：{after['png']['files']:,} 张／{gb(after['png']['logicalBytes'])} GB。逻辑删除量不等于磁盘净释放；硬链接、目录联接及其他后台变化单独处理。</p>
<p>保留正式原稿／视觉、当前报告与 Financial R3、订单交付文件及未解决问题证据。近期 Git 临时文件和归属未充分核定的旧审阅文件已逐路径列入待审 CSV。Git 正式对象、注册 pack、分支和 reflog 未删；没有 gc/repack 或历史改写。</p>
<p>三轮约 {elapsed:.0f} 秒观察无明显持续下降，仅代表本次观察期。分页文件本轮前后均为 22.36 GB，设置未改；历史 22.845 GB 下降继续 UNKNOWN。空间保护、稀疏 worktree 入口、稳定输出及渲染互斥已补；只做语法、必要保护测试和现有 PDF 字节检查，没有构建／渲染／截图，也不代表产品重新验收。</p>
<p>本轮未 commit／push／deploy，未调用收费 provider，未写生产／R2／Stripe；主仓库其他窗口的 merge 与成果保留。开发等待用户恢复。</p><ul>'''+''.join(f'<li><a href="{href(n)}">{html.escape(n)}</a></li>'for n in links)+'</ul></div>'
original=M.read_bytes();page=original.decode('utf8');start='<!-- CONCENTRATED-CLEANUP-20261028:START -->';end='<!-- CONCENTRATED-CLEANUP-20261028:END -->'
if start in page:page=page[:page.index(start)+len(start)]+body+page[page.index(end):]
else:
 tag='<section id="repository-disk-cleanup-20261027">';i=page.index(tag);j=page.index('</section>',i)
 oldbody=page[i+len(tag):j]
 page=page[:i]+tag+'<h2>Repository cleanup · 当前 2026-10-28</h2>'+start+body+end+'<details><summary>2026-10-27 历史记录（非当前空间结果）</summary>'+oldbody+'</details>'+page[j:]
if 'data-r20-render-media-retired' not in page:
 page=re.sub(r'(<section[^>]*id="numerology-r20"[^>]*>)',r'\1<p data-r20-render-media-retired="true">历史 R20 渲染媒体已按清理授权退役；源 JSON 与接受记录保留，当前审阅见 <a href="#numerology-r21">Numerology R21</a>。</p>',page,count=1)
assert M.read_bytes()==original,'Concurrent Master edit; stop without overwrite'
tmp=M.with_suffix('.cleanup-tmp');tmp.write_text(page,encoding='utf8');os.replace(tmp,M)
save('CURRENT-DELIVERY-IDENTITY.json',{'head':state['currentHead'],'master':str(M),'masterSHA256':hashlib.sha256(M.read_bytes()).hexdigest(),'checks':'CURRENT-MAINTENANCE-CHECKS.json','scope':'Local maintenance delivery; no build identity claimed'})
print('FINAL',finalFree,'NET',net,'LOGICAL',summary['manifestedLogicalBytes'],'FILES',summary['manifestedFiles'],'PNG',after['png'])
