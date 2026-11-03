import concurrent.futures, urllib.request, json, hashlib, pathlib, datetime
out=pathlib.Path('content/production-closure/live-customer-commercial-convergence/business-financial-tax-intelligence-r1');tmp=pathlib.Path('.tmp/bft-tax-r1/sources');tmp.mkdir(parents=True,exist_ok=True)
urls={'MY-IND-2025':'https://www.hasil.gov.my/en/individu/kadar-cukai/','MY-COMPANY-RATES':'https://www.hasil.gov.my/en/syarikat/kadar-cukai-syarikat/','MY-PR8-2025':'https://www.hasil.gov.my/media/fo1ptejq/pr-8-2025-tax-treatment-for-micro-small-and-medium-companies.pdf','MY-EB2025':'https://www.hasil.gov.my/media/fqphzxud/tax-savvy-business-owner-e-b-2025.pdf','MY-CA2015':'https://phl.hasil.gov.my/pdf/pdfam/PR_6_2015.pdf','MY-BIK2019':'https://phl.hasil.gov.my/pdf/pdfam/PR_11_2019.pdf','MY-ITA':'https://www.hasil.gov.my/en/perundangan/akta/','MY-AGENT':'https://www.hasil.gov.my/ejen-cukai/profesion-sebagai-ejen-cukai/','MY-DIV2025':'https://www.hasil.gov.my/media/pshpbomm/explanatorynotes_be2025_2.pdf','SG-VEHICLE':'https://www.iras.gov.sg/taxes/corporate-income-tax/income-deductions-for-companies/business-expenses/tax-treatment-of-business-expenses-%28m-r%29','GB-VEHICLE':'https://www.gov.uk/capital-allowances/business-cars'}
def get(item):
 k,u=item
 try:
  with urllib.request.urlopen(urllib.request.Request(u,headers={'User-Agent':'Mozilla/5.0 PHI-OS-local-source-review'}),timeout=25) as r:b=r.read(10000000);code=r.status;ct=r.headers.get('Content-Type','')
  name=k+('.pdf' if 'pdf' in ct else '.html');(tmp/name).write_bytes(b)
  return {'id':k,'url':u,'httpStatus':code,'sha256':hashlib.sha256(b).hexdigest(),'bytes':len(b),'localSource':str(tmp/name),'status':'SOURCE_IDENTIFIED_NOT_PROFESSIONALLY_ADMITTED','verifiedAt':'2026-11-03'}
 except Exception as e:return {'id':k,'url':u,'status':'SOURCE_FETCH_BLOCKED','error':str(e)[:180],'verifiedAt':'2026-11-03'}
with concurrent.futures.ThreadPoolExecutor(max_workers=6) as pool:rows=list(pool.map(get,urls.items()))
(out/'OFFICIAL-SOURCE-FETCH.json').write_text(json.dumps(rows,indent=2),encoding='utf8');print(json.dumps([{k:x.get(k) for k in ['id','httpStatus','status','bytes']} for x in rows]))
