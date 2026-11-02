import urllib.request,json
base='https://fa2a3a4f.phios-github.pages.dev';rows=[]
for path in ['/api/customer-subject-workspace?publicCountry=MYS','/content/world/world-country-public-evidence-current.json','/assets/icons/profile-r1/PHIOS-PROFILE-ICON-IDENTITY-v1.svg']:
 try:
  with urllib.request.urlopen(base+path,timeout=30)as r:body=r.read();status=r.status
  v=json.loads(body)if path.startswith(('/api/','/content/'))else None;rows.append({'path':path,'status':status,'sourceVersion':v.get('sourceVersion')if v else None,'error':v.get('error')if v else None,'bytes':len(body)})
 except Exception as e:rows.append({'path':path,'error':str(e)})
print(json.dumps({'scope':'PREDECESSOR_DIAGNOSTIC_ONLY_NOT_FINAL_SHA_ACCEPTANCE','rows':rows}))
