from pathlib import Path
import urllib.request, urllib.error, json, hashlib, datetime, concurrent.futures
base=Path('tools/review/world-r3/gate2c/WORLD-R3-GMCH-PILOT-SNAPSHOTS');base.mkdir(exist_ok=True)
urls={
'my-cpi':'https://api.data.gov.my/data-catalogue?id=cpi_headline&limit=12&filter=overall@division&date_start=2024-01-01&date_end=2024-12-01',
'my-datasets':'https://api.data.gov.my/data-catalogue?id=datasets&limit=1000',
'bnm-opr':'https://financialmarkets.bnm.gov.my/data-download-opr',
'bnm-mhs':'https://www.bnm.gov.my/-/sorotan-statistik-bulanan-untuk-jun-2026',
'bnm-license':'https://www.bnm.gov.my/terms-of-use-bnm-datasets',
'fed-sloos':'https://www.federalreserve.gov/data/sloos/sloos-202410.htm',
'fed-table':'https://www.federalreserve.gov/data/sloos/202410/table1.htm',
'fed-license':'https://www.federalreserve.gov/disclaimer.htm',
'hmda-doc':'https://ffiec.cfpb.gov/documentation/publications/loan-level-datasets/lar-data-fields',
'hmda-api':'https://ffiec.cfpb.gov/documentation/api/data-browser/',
'dosm-license':'https://open.dosm.gov.my/data-catalogue/cpi_headline',
'uk-credit':'https://www.bankofengland.co.uk/statistics/money-and-credit/2026/august-2026',
'ecb-license':'https://www.ecb.europa.eu/services/using-our-site/disclaimer/html/index.en.html',
'bis-dsr':'https://data.bis.org/topics/DSR',
'boj-call':'https://www.boj.or.jp/en/statistics/market/short/mutan/index.htm',
'cn-nbs':'https://www.stats.gov.cn/english/',
'fhfa':'https://www.fhfa.gov/house-price-index',
'jhf':'https://www.jhf.go.jp/about/research/loan/index.html',
'napic':'https://napic.jpph.gov.my/en'}
def get(kv):
 k,u=kv; result={'id':k,'url':u,'fetched_at':datetime.datetime.now(datetime.timezone.utc).isoformat(),'method':'HTTPS_GET','automaticRetries':0}
 try:
  r=urllib.request.urlopen(urllib.request.Request(u,headers={'User-Agent':'PHIOS-ReadOnly-Research/1.0'}),timeout=22);data=r.read(6_000_001)
  if len(data)>6_000_000: raise ValueError('BOUNDED_SIZE_EXCEEDED')
  ext='json' if 'json' in r.headers.get('Content-Type','') else 'html';p=base/(k+'.'+ext);p.write_bytes(data)
  result.update(http_status=r.status,final_url=r.url,path=p.as_posix(),bytes=len(data),sha256=hashlib.sha256(data).hexdigest(),content_type=r.headers.get('Content-Type'),status='FETCHED_NOT_AUTOMATICALLY_ADMITTED')
 except Exception as e:result.update(status='SOURCE_ERROR',http_status=getattr(e,'code',None),error=str(e)[:200])
 return result
with concurrent.futures.ThreadPoolExecutor(max_workers=6) as pool: results=list(pool.map(get,urls.items()))
(base.parent/'READ-ATTEMPTS.json').write_text(json.dumps(results,indent=2),encoding='utf8')
for r in results:print(r['id'],r.get('http_status'),r['status'],r.get('bytes',''))
