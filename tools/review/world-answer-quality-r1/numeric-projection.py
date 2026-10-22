from pathlib import Path
p=Path('functions/customer-projection/ric-world-session.js');s=p.read_text(encoding='utf-8').replace("else if(explanation&&answer.answerState==='NOT_COVERED')", "else if(explanation&&(answer.answerState==='NOT_COVERED'||explanation.quality==='NUMERIC_LIMITATION'))")
p.write_bytes(s.encode())
p=Path('assets/js/pages/civilization-atlas/world-experience-r2.js');s=p.read_text(encoding='utf-8').replace("if(explanation?.sources?.length||answer.answerState==='NOT_COVERED')", "if(explanation?.sources?.length||answer.answerState==='NOT_COVERED'||explanation?.quality==='NUMERIC_LIMITATION')")
p.write_bytes(s.encode())
