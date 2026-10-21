from pathlib import Path
p=Path('functions/customer-projection/ric-world-session.js');s=p.read_text(encoding='utf-8').replace("sourceType:'PUBLIC_STATISTIC',href:s.originalUrlOrCanonicalRef","sourceType:s.sourceClass,href:s.originalUrlOrCanonicalRef")
s=s.replace("if(evidence.some(e=>!['OBSERVED','NO_RELEASE','INCOMPARABLE'].includes(e.state)))", "if(result.answer.observations.length&&evidence.some(e=>!['OBSERVED','NO_RELEASE','INCOMPARABLE'].includes(e.state)))")
p.write_text(s,encoding='utf-8')
p=Path('assets/js/pages/civilization-atlas/world-experience-r2.js');s=p.read_text(encoding='utf-8').replace("if(explanation?.sources?.length)answer.explanation=explanation;","if(explanation?.sources?.length||answer.answerState==='NOT_COVERED')answer.explanation=explanation;")
s=s.replace('answerHost.innerHTML=worldCustomerAnswerHTML(answer,getLocale());', '''answerHost.innerHTML=worldCustomerAnswerHTML(answer,getLocale());
  if(['127.0.0.1','localhost'].includes(location.hostname)){const link=document.createElement('a');link.href='/L1/PRODUCT-LOCAL.html?locale='+getLocale();link.textContent=pair('整理我自己的处境与选择','Clarify my own situation and choices');answerHost.append(link);}''')
p.write_text(s,encoding='utf-8')
