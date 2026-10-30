from pathlib import Path
q=Path('C:/phios/tools/review/world-customer-journey-r4');o=q/'revision-r1';
for src,name,old,new in [('browser-checks.mjs','regression.mjs',str(q/'regression'),str(o/'regression')),('home-journeys.mjs','home.mjs',str(q),str(o))]:
 s=(q/src).read_text(encoding='utf-8').replace(old.replace(chr(92),'/'),new.replace(chr(92),'/'))
 if name=='home.mjs':s=s.replace("fs.readFileSync(dir+'/SERVER.json')","fs.readFileSync('C:/phios/tools/review/world-customer-journey-r4/SERVER.json')");s=s.replace("from '../../../scripts/lib/world-browser-runtime.mjs'","from '../../../../scripts/lib/world-browser-runtime.mjs'")
 (o/name).write_text(s,encoding='utf-8')
(o/'regression/screens').mkdir(parents=True,exist_ok=True)
