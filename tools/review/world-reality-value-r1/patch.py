from pathlib import Path
p=Path('assets/js/pages/civilization-atlas/world-experience-r2.js');s=p.read_text(encoding='utf-8')
s="import {queryWorldExplanation,worldCustomerAnswerHTML} from './world-customer-answer.js';\n"+s
s=s.replace('.then(evidence=>{','.then(async evidence=>{',1)
start=s.index('  const value=n=>',s.index('function renderEvidenceAnswer'))
end=s.index("  if(answer.answerState===",start)
s=s[:start]+'''  if(answer.answerState!=='ANSWERED_BOUNDED'&&customQuestion){const explanation=await queryWorldExplanation(customQuestion,getLocale());if(seq!==answerSequence)return;if(explanation?.sources?.length)answer.explanation=explanation;}
  answerHost.innerHTML=worldCustomerAnswerHTML(answer,getLocale());
'''+s[end:]
p.write_bytes(s.encode('utf-8'))
