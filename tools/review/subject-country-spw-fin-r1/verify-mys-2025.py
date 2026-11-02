import urllib.request,json,hashlib,datetime
from pathlib import Path
u='https://api.worldbank.org/v2/country/MY/indicator/SP.POP.TOTL?format=json&date=2025&per_page=1'
with urllib.request.urlopen(u,timeout=40)as r:raw=r.read();status=r.status
j=json.loads(raw);row=j[1][0];assert row['countryiso3code']=='MYS' and row['date']=='2025' and row['value']==35977838
out={'url':u,'httpStatus':status,'retrievedAt':datetime.datetime.now(datetime.timezone.utc).isoformat(),'sha256':hashlib.sha256(raw).hexdigest(),'officialRow':row,'status':'PASS','providerCalls':0,'productionWrites':0}
Path('C:/phios/tools/review/subject-country-spw-fin-r1/MYS-2025-OFFICIAL-VERIFICATION.json').write_text(json.dumps(out,indent=2),encoding='utf-8');print(json.dumps(out))
