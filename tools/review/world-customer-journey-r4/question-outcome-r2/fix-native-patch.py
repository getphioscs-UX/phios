from pathlib import Path
p=Path('C:/phios/tools/review/world-customer-journey-r4/question-outcome-r2/implement-native.py');s=p.read_text(encoding='utf-8');lines=s.splitlines()
for i,line in enumerate(lines):
 if line.startswith('s=s.replace("state.pane==='):
  prefix='s=s.replace("state.pane===\'places\'?dataView(true):", ';value=line[line.index(', ')+2:-1];lines[i]=prefix+"'''"+value[1:-1]+"''')"
p.write_text('\n'.join(lines)+'\n',encoding='utf-8')
