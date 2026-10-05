// Data adapter: all quantitative entries come from the supplied authority inventory.
// Interpretive flows are accepted-copy models; they are never scored chart facts.
export function buildBaziVfrDiagrams(authority,timing,copy){
 const chart=authority.chart;if(JSON.stringify(chart.pillars)!==JSON.stringify(timing.natal)||chart.dayMaster!=='庚'||timing.daYun!=='己巳'||timing.annual!=='丙寅')throw Error('TIMING_IDENTITY_MISMATCH');
 const elements={甲:'WOOD',乙:'WOOD',丙:'FIRE',丁:'FIRE',戊:'EARTH',己:'EARTH',庚:'METAL',辛:'METAL',壬:'WATER',癸:'WATER',申:'METAL',子:'WATER',辰:'EARTH',寅:'WOOD'};
 const names={WOOD:'木',FIRE:'火',EARTH:'土',METAL:'金',WATER:'水'};
 const positions=[['year','年柱','YEAR_BRANCH_HIDDEN'],['month','月柱','MONTH_BRANCH_HIDDEN'],['day','日柱','DAY_BRANCH_HIDDEN'],['hour','时柱','HOUR_BRANCH_HIDDEN']];
 const pillars=positions.map(([key,label,position])=>({label,value:chart.pillars[key],element:elements[chart.pillars[key][0]],detail:chart.tenGodFacts.filter(f=>f.position===position).map(f=>f.token).join(' · ')}));
 const inventory=[...Object.values(chart.pillars).join(''),...chart.tenGodFacts.filter(f=>f.position.includes('HIDDEN')).map(f=>f.token)];
 const elementCounts=Object.keys(names).map(e=>({label:names[e],value:inventory.filter(g=>elements[g]===e).length,element:e}));
 const gods=['比肩','劫财','食神','伤官','偏财','正财','七杀','正官','偏印','正印'];
 const tenGodCounts=gods.map(g=>({label:g,value:chart.tenGodFacts.filter(f=>f.tenGod===g).length,element:['比肩','劫财'].includes(g)?'METAL':['食神','伤官'].includes(g)?'WATER':['偏财','正财'].includes(g)?'WOOD':['七杀','正官'].includes(g)?'FIRE':'EARTH'}));
 const specs=[];const add=(id,title,type,nodes,caption,extras={})=>{specs.push({id,title,type,nodes,caption,...extras});return id;};
 const n=(label,detail='',element='METAL')=>({label,detail,element});
 add('BZD-01','四柱命盘','pillars',pillars,'以日干庚金为参照。年、月、日、时各自保留干支与藏干，柱位之间既有联系，也有不同的读取作用；这里不把四柱替换成固定年龄区间。日柱强调自我参照，四柱一起构成后续图表的原局基础。',{source:'chart.pillars + chart.tenGodFacts'});
 add('BZD-02','五行结构','bars',elementCounts,'数字来自四个天干、四个地支及十个藏干的未加权清单，共十八项。同一个字在不同位置出现会分别计入；这些数量让结构可见，却不是能量百分比、强弱评分或五行喜忌。强弱仍读取已接受的完整结构结论。',{unit:'未加权清单计数',source:'chart.pillars + chart.tenGodFacts'});
 add('BZD-03','十神结构','bars',tenGodCounts,'以庚日主为参照，统计已提供的其余三个天干与十个藏干，共十三项。日主自身不计入十神数量。零表示该清单没有相应记录，不代表一生没有此类作用；这里不增加运年十神，也不据数量单独决定职业、财富或关系。',{unit:'天干与藏干记录数',source:'chart.tenGodFacts'});
 add('BZD-04','季节与日主','orbit',[n('庚金日主','三庚并见','METAL'),n('子月冬令','寒湿背景','WATER'),n('中和偏弱','保留承载条件','METAL'),n('土主 · 金辅','基础与边界','EARTH'),n('火的作用','调候与责任','FIRE')],'子月的水势与三庚的判断一起读取，最终结构判断仍为中和偏弱。土的承载与金的边界保留为主辅条件；火有冬令调候与责任的作用。图示不以季节或三合单独改写强弱，也不把调候候选与用神层混为一谈。');
 add('BZD-05','原局支系关系','relations',[n('申','年支','METAL'),n('子','月支','WATER'),n('辰','日支','EARTH'),n('寅','时支','WOOD')],'申、子、辰的三合关系与寅申冲同时保留。三合的存在不表示已经完成化水，冲也不取消合。不同线型标示联系与张力，而不是关系强度；两种作用共同参与原局的理解、变化与方向选择。',{edges:[{from:0,to:1,label:'三合',kind:'合'},{from:1,to:2,label:'三合',kind:'合'},{from:3,to:0,label:'寅申冲',kind:'冲'}],group:'申子辰三合关系成立 · 未确认化水'});
 const sectionTypes=['flow','flow','flow','flow','orbit','network','flow','loop','stack'];
 const ids=['BZD-06','BZD-07','BZD-08','BZD-09','BZD-10','BZD-11','BZD-12','BZD-13','BZD-14'];
 copy.forEach((s,i)=>add(ids[i],s.title,sectionTypes[i],s.flow.map((label,j)=>n(label,s.insights[j%s.insights.length],['METAL','WATER','WOOD','EARTH','FIRE'][j%5])),s.interpretation[0],{sourceSection:s.id,interpretiveModel:true}));
 specs.find(d=>d.id==='BZD-14').nodes=[n('原局','庚申／甲子／庚辰／庚寅','METAL'),n('大运','己巳','EARTH'),n('年度层','丙寅','FIRE')];
 add('BZD-15','当前激活关系','relations',[n('甲','原局月干','WOOD'),n('己','大运天干','EARTH'),n('巳','大运地支','FIRE'),n('申','原局年支','METAL'),n('寅','原局时支','WOOD'),n('寅','年度地支','WOOD')],'原局、大运与年度层分别标示，甲己仅论合，不推出化土。巳申六合兼破、巳寅害与寅巳申刑同时进入图示；年度寅重复原局寅，冲申并害巳。关系提示结构被怎样牵动，不提供确定事件、公历年份、年龄或起运日期。',{edges:[{from:0,to:1,label:'甲己合',kind:'合'},{from:2,to:3,label:'六合兼破',kind:'破'},{from:2,to:4,label:'巳寅害',kind:'害'},{from:4,to:5,label:'重复',kind:'重复'},{from:5,to:3,label:'寅申冲',kind:'冲'},{from:5,to:2,label:'寅巳害',kind:'害'}],group:'寅巳申刑：原局寅 × 大运巳 × 原局申',source:'TIMING-AUTHORITY.relations'});
 const more=[
 ['BZD-06-B','让敏锐进入稳定结构','flow',[n('信息','观察与反应','WATER'),n('筛选','辨认真伪与重点','METAL'),n('组织','形成可用的方法','EARTH'),n('落实','结果经现实检验','WOOD')],0],
 ['BZD-07-B','四柱的领域与位置','pillars',pillars.map((p,i)=>({...p,detail:['早期秩序与起点','社会资源与现实','自我承载与位置','发展与后续方向'][i]})),1],
 ['BZD-08-B','责任、权限与资源','orbit',[n('成果','被采用的价值','WOOD'),n('职责','需要承担的部分','FIRE'),n('权限','能够决定的范围','METAL'),n('资源','落实所需条件','EARTH'),n('方法','经验成为系统','WATER')],2],
 ['BZD-08-C','从个人能力到可重复结构','flow',[n('一次解决','经验与判断','WATER'),n('形成方法','步骤与边界','METAL'),n('团队采用','资源与分工','EARTH'),n('持续价值','可重复交付','WOOD')],2],
 ['BZD-09-B','资源的三个层次','stack',[n('流动收入','客户、项目与机会','WOOD'),n('可留资源','成本与责任后的部分','EARTH'),n('选择空间','可持续安排的基础','METAL')],3],
 ['BZD-09-C','机会与留存条件','network',[n('机会','外部流动','WOOD'),n('投入','时间与承担','FIRE'),n('承载','制度与基础','EARTH'),n('留存','稳定属于自己的部分','METAL')],3],
 ['BZD-10-B','吸引与长期结构','flow',[n('彼此靠近','好感与交流','WATER'),n('现实磨合','承诺与行动','EARTH'),n('责任清楚','边界与共同安排','METAL'),n('一起成长','可延续的结构','WOOD')],4],
 ['BZD-11-B','责任怎样成为共同承担','flow',[n('看见问题','照顾与现实需要','WATER'),n('角色清楚','谁承担哪些部分','METAL'),n('可见支持','资源与事务分担','EARTH'),n('保留空间','各自的发展方向','WOOD')],5],
 ['BZD-12-B','负荷与恢复的循环','loop',[n('能处理','外部仍然运作','METAL'),n('继续增加','事务与思考叠加','WATER'),n('支持进入','分担与基础','EARTH'),n('重新定界','负荷回到可承载范围','METAL'),n('恢复空间','持续性重新形成','WOOD')],6],
 ['BZD-13-B','五行角色，不是固定运程序列','orbit',[n('木','资源与成果','WOOD'),n('火','温暖与责任','FIRE'),n('土','基础与承载','EARTH'),n('金','判断与边界','METAL'),n('水','理解与表达','WATER')],7],
 ['BZD-14-B','当前的三个强调','orbit',[n('支撑','知识、制度与资源','EARTH'),n('责任','现实要求与压力','FIRE'),n('方向','已有结构与重新选择','WOOD'),n('边界','保留判断与承载','METAL')],8]
 ];
 more.forEach(([id,title,type,nodes,i])=>add(id,title,type,nodes,copy[i].interpretation[1].slice(0,200),{sourceSection:copy[i].id,interpretiveModel:true}));
 add('BZD-SUMMARY','贯穿全文的运行结构','flow',[n('理解与判断','三庚 × 水势','METAL'),n('输出与价值','职业与资源','WATER'),n('支持与承载','关系、家庭与压力','EARTH'),n('重组与方向','周期与时序','WOOD')],'判断与理解形成能力，输出要经过现实采用才成为价值；关系、家庭和恢复空间又决定这些成果能否长期承载。周期与时序补充方向上的变化。它们是可以与你生活对照的结构，而不是分数、人物分类或预定事件。',{interpretiveModel:true});
 add('BZD-OVERVIEW','你的命盘，一眼看见','orbit',[n('日主庚金','判断与边界','METAL'),n('子月水势','理解与表达','WATER'),n('印比承载','土主、金辅','EARTH'),n('财的连接','资源与现实价值','WOOD'),n('己巳 × 丙寅','当前时序层','FIRE')],'三庚、子月、水势与甲木，共同参与判断、理解、输出和现实价值的读取。中和偏弱结论要求保留承载条件；己巳与丙寅只是目前提供的时序层。各图分别展开事实与解释，不把任何单一特征当成完整的人生结论。');
 return specs;
}
