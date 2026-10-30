from pathlib import Path
p=Path('C:/phios/tools/review/world-customer-journey-r4/question-outcome-r2/implement-native.py');s=p.read_text(encoding='utf-8');a=s.index('old=');b=s.index('assert old in s;',a);s=s[:a]+'''old="T('topic')+select('topicSelect',state.topic,Object.entries(TOPICS).map(([k,t])=>[k,vtext(t.name)]))"
new="(state.mode==='history'&&currentWorldQuestion()&&!currentWorldQuestion().requestedTopic?pair('历史主题未指定；请使用案例或历史时期筛选。','Historical topic unspecified; use case or period filters.'):T('topic')+select('topicSelect',state.topic,Object.entries(TOPICS).map(([k,t])=>[k,vtext(t.name)])))"
'''+s[b:];p.write_text(s,encoding='utf-8')
