import urllib.request,pathlib,hashlib,json,re
base=pathlib.Path('content/production-closure/live-customer-commercial-convergence/business-financial-tax-intelligence-r1'); rows=json.loads((base/'OFFICIAL-SOURCE-FETCH.json').read_text()); urls=[('MY-ACT2026','https://www.hasil.gov.my/wp-content/uploads/Income-Tax-Act-1967-online-version-as-at-1-January-2026.pdf'),('MY-PUBLIC-INDEX','https://www.hasil.gov.my/en/perundangan/ketetapan-umum/')]
for k,u in urls:
 try:
  with urllib.request.urlopen(u,timeout=25) as r:b=r.read(8000000);ct=r.headers.get('Content-Type','');status=r.status
  f=pathlib.Path('.tmp/bft-tax-r1/sources')/(k+('.pdf' if 'pdf' in ct else '.html'));f.write_bytes(b);rows.append({'id':k,'url':u,'httpStatus':status,'sha256':hashlib.sha256(b).hexdigest(),'bytes':len(b),'localSource':str(f),'status':'SOURCE_IDENTIFIED_NOT_PROFESSIONALLY_ADMITTED','verifiedAt':'2026-11-03'})
  if k=='MY-PUBLIC-INDEX':
   s=b.decode('utf8',errors='replace'); print('\n'.join(dict.fromkeys(re.findall(r'href="([^"]*(?:PR_6_2015|PR_11_2019|pr-8-2025|ku-8-2025)[^"]*)"',s,re.I))))
 except Exception as e:rows.append({'id':k,'url':u,'status':'SOURCE_FETCH_BLOCKED','error':str(e)[:150]})
(base/'OFFICIAL-SOURCE-FETCH.json').write_text(json.dumps(rows,indent=2))
