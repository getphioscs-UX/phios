from pathlib import Path
q=Path('C:/phios/tools/review/world-customer-journey-r4/question-outcome-r2');base='https://72bf9875.phios-github.pages.dev'
for name in ['original-42','original-14']:
 s=(q/(name+'.mjs')).read_text(encoding='utf-8-sig');old="JSON.parse(fs.readFileSync('C:/phios/tools/review/world-customer-journey-r4/SERVER.json'))";assert old in s;s=s.replace(old,"{candidate:'"+base+"'}");s=s.replace("question-outcome-r2/"+name+"'","question-outcome-r2/preview/"+name+"'");(q/('preview-'+name+'.mjs')).write_text(s,encoding='utf-8');(q/'preview'/name).mkdir(parents=True,exist_ok=True)
