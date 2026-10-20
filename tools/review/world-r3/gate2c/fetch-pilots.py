from pathlib import Path
import urllib.request, urllib.error, json, hashlib, datetime, concurrent.futures
base=Path('tools/review/world-r3/gate2c/WORLD-R3-GMCH-PILOT-SNAPSHOTS');base.mkdir(exist_ok=True)
urls={
'my-cpi-full':'https://storage.dosm.gov.my/cpi/cpi_2d.csv',
'my-income':'https://api.data.gov.my/data-catalogue?id=hh_income&limit=100',
'fed-table-corrected':'https://www.federalreserve.gov/data/sloos/sloos-202410-table-1.htm',
'hmda-aggregate-2024':'https://ffiec.cfpb.gov/v2/data-browser-api/view/nationwide/aggregations?years=2024&loan_purposes=1&actions_taken=1,2,3',
'ffiec-2025-release':'https://www.ffiec.gov/news/press-releases/2026/an-06-23',
'fhfa-hpi':'https://www.fhfa.gov/hpi/download/monthly/hpi_po_monthly_nsa.xlsx',
'fhfa-license':'https://www.fhfa.gov/about/fhfa-policies/website-privacy-policy',
'cfpb-license':'https://www.consumerfinance.gov/copyright/',
'bnm-reference-notice':'https://www.bnm.gov.my/-/pd-rrf-mar26'}

def get(kv):
 k,u=kv; result={'id':k,'url':u,'fetched_at':datetime.datetime.now(datetime.timezone.utc).isoformat(),'method':'HTTPS_GET','automaticRetries':0}
 try:
  r=urllib.request.urlopen(urllib.request.Request(u,headers={'User-Agent':'PHIOS-ReadOnly-Research/1.0'}),timeout=22);data=r.read(6_000_001)
  if len(data)>6_000_000: raise ValueError('BOUNDED_SIZE_EXCEEDED')
  ext='xlsx' if u.endswith('.xlsx') else 'csv' if u.endswith('.csv') else 'json' if 'json' in r.headers.get('Content-Type','') else 'html';p=base/(k+'.'+ext);p.write_bytes(data)
  result.update(http_status=r.status,final_url=r.url,path=p.as_posix(),bytes=len(data),sha256=hashlib.sha256(data).hexdigest(),content_type=r.headers.get('Content-Type'),status='FETCHED_NOT_AUTOMATICALLY_ADMITTED')
 except Exception as e:result.update(status='SOURCE_ERROR',http_status=getattr(e,'code',None),error=str(e)[:200])
 return result
with concurrent.futures.ThreadPoolExecutor(max_workers=6) as pool: results=list(pool.map(get,urls.items()))
(base.parent/'PILOT-READ-ATTEMPTS.json').write_text(json.dumps(results,indent=2),encoding='utf8')
for r in results:print(r['id'],r.get('http_status'),r['status'],r.get('bytes',''))
