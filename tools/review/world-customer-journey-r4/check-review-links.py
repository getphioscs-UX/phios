from pathlib import Path
import re,json,urllib.request
root=Path('C:/phios');q=root/'tools/review/world-customer-journey-r4';s=(root/'content/production-closure/live-customer-commercial-convergence/MASTER-HUMAN-REVIEW.html').read_text(encoding='utf-8');assert s.count('id="world-customer-journey-r4"')==1;a=s.index('<section id="world-customer-journey-r4"');b=s.index('</section>',a);section=s[a:b];base=json.loads((q/'SERVER.json').read_text())['candidate'];rows=[]
for f in sorted(set(re.findall(r'(?:href|src)="\.\./\.\./\.\./tools/review/world-customer-journey-r4/([^"#]+)',section))):
 p=q/f;assert p.is_file(),f
 with urllib.request.urlopen(base+'/tools/review/world-customer-journey-r4/'+f,timeout=15)as response:assert response.status==200
 rows.append({'path':f,'status':'PASS','bytes':p.stat().st_size})
(q/'MASTER-LINK-CHECKS.json').write_text(json.dumps({'uniqueSection':True,'rows':rows,'providerCalls':0,'productionWrites':0},indent=2),encoding='utf-8');print('PASS current original Master references:',len(rows))
