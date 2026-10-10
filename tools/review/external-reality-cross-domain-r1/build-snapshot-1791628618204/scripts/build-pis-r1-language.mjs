import fs from 'node:fs';
const terms=[
 ['Canonical Knowledge','Reviewed PHI OS knowledge','经过整理与审阅的 PHI OS 知识'],
 ['Registry','Collection','内容集'],['Runtime','Ongoing situation','持续变化的处境'],
 ['Runtime owner','Who is responsible','由谁负责'],['Authority','Scope and responsibility','适用范围与责任'],
 ['Projection','A perspective offered by a method','方法提供的观察视角'],['Unknown','What we cannot yet confirm','现有资料无法确认的部分'],
 ['RRE','Reality Reading','现实读取'],['RNE','Navigation','现实导航'],['LRM','Continuity over time','随时间保留现实变化'],
 ['Evidence','Evidence you can check','可核对依据'],['Method Projection','Method perspective','方法提供的观察视角'],
 ['Navigation Threshold','When it is appropriate to act','什么时候适合行动'],['Outcome Event','What happened after the action','行动后发生了什么'],
 ['Reality Diff','What has changed','发生了哪些变化'],['Binding state','Availability','是否可用']
];
const out={schemaVersion:'1.0.0',work:'PHI-OS-PIS-R1',scope:['headings','navigation','CTA','helper text','empty states','aria labels'],changesUnderlyingIdentifiers:false,theoryQuotationException:'Preserve accurate book terminology in attributed theoretical content; do not automatically replace it.',prohibitedImplementationTerms:['canonical','registry','runtime owner','authority registry','projection registry','cutover','successor','freeze','admission','resolver','contract','execution class','fixture','checker','consumer state','pipeline','binding state'],terms:terms.map(([internalTerm,publicEnglish,publicZhHans])=>({internalTerm,publicEnglish,publicZhHans})),editorialStandard:{firstScreenQuestions:['Where am I?','How does this help me?','What can I do next?'],bodyQuestions:['Why does it exist?','What problem does it address?','How is it related to other pages?','Who is it suitable for?','When is it unsuitable?','Where can I go next?'],functionalPages:'Keep transaction, account and workspace pages concise; do not turn them into marketing pages.'},commercialBoundary:'No new product, price, subscription entitlement or checkout may be created by presentation copy.'};
fs.writeFileSync('content/web/public-language/public-language-canon-v1.json',JSON.stringify(out,null,2)+'\n');
