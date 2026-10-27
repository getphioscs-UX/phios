import fs from 'node:fs';
const dir='tools/review/integrated-closure-r25',source='functions/ecr-full-report/ecr-sec07-presentation-r33.js';
let text=fs.readFileSync(source,'utf8').replace("../../content/", "../../../content/").replace('ECR-SEC07-A4-VECTOR-LABELS-R33-v1','ECR-SEC07-A4-VECTOR-LABELS-R25-v2');
text=text.replace("import fontkit from '@pdf-lib/fontkit';", "import fontkit from '@pdf-lib/fontkit';\nimport trigramRegistry from '../../../content/professional/core-method-runtime/iching-trigram-registry-v1.json';\nimport environments from '../../../content/embodied-configuration/ecr-environment-first-configuration-v1.json';");
text=text.replace(' return {page,evidence:', `
 // Correct only the finite symbolic/lettering regions; the accepted source stays immutable.
 const lines=(ref,x,y,w=42,h=4,gap=6)=>{const t=trigramRegistry.entries.find(t=>t.trigramId===ref);if(!t||t.binary.length!==3||t.lineOrder!=='BOTTOM_TO_TOP')throw Error('CANONICAL_TRIGRAM_REQUIRED');[...t.binary].reverse().forEach((bit,i)=>{const yy=height-(y+i*(h+gap)+h)*scale,xx=gutter+x*scale;if(bit==='1')page.drawRectangle({x:xx,y:yy,width:w*scale,height:h*scale,color:ink});else for(const start of [0,w*.6])page.drawRectangle({x:xx+start*scale,y:yy,width:w*.4*scale,height:h*scale,color:ink});});};
 for(let i=0;i<8;i++){const x=27+i*123;box(x+30,586,60,36,'M'+(i+1)+'-canonical-lines');lines(motionRegistry.entries[i].trigramRef,x+39,590);}
 const example=environments.entries.find(e=>e.configurationId==='ECR-H42');if(example.environmentPriorityMotionId!=='M6'||example.embodiedResponseMotionId!=='M2'||example.hexagramRef!=='HEXAGRAM-27')throw Error('EXAMPLE_BINDING_DRIFT');
 box(681,1181,287,67,'explicit-non-personal-example');text('EXAMPLE CONFIGURATION',686,1199,14);text('— NOT A PERSONAL RESULT',686,1218,14);text('固定示例，不是个人计算结果',686,1239,16,cn);
 box(139,1285,185,78,'example-environment-label');text('M6 · GEN · 艮',143,1307,21,cn);text('界定运动 / Boundary',143,1330,17,cn);text('Environmental priority',143,1352,12);
 box(792,1308,170,80,'example-carrier-label');text('M2 · ZHEN · 震',795,1331,19,cn);text('启动运动 / Activation',795,1355,15,cn);text('Carrier response',795,1377,12);
 box(407,1450,220,41,'traditional-27-caption');text('第 27 卦 · 颐',410,1468,16,cn);text('HEXAGRAM 27 · NOURISHMENT',410,1487,11.5);
 regions.push({id:'ECR-H42-fixed-example',configurationId:example.configurationId,environment:example.environmentPriorityMotionId,carrier:example.embodiedResponseMotionId,hexagram:example.hexagramRef});
 return {page,evidence:`);
fs.writeFileSync(dir+'/sec07-presentation-candidate.mjs',text);
const rebuild=fs.readFileSync(dir+'/rebuild-ecr.mjs','utf8').replace("../../../functions/ecr-full-report/ecr-sec07-presentation-r33.js","./sec07-presentation-candidate.mjs");fs.writeFileSync(dir+'/rebuild-ecr.mjs',rebuild);
for(const name of ['ECR-PDF-RESULTS.json','PDF-INTEGRITY.json','SEC07-A4-R25.png']){const d=dir+'/before-sec07-v2';fs.mkdirSync(d,{recursive:true});fs.copyFileSync(dir+'/'+name,d+'/'+name);}
