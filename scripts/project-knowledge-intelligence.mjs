import {buildDynamicReadingPath,buildAdaptiveKnowledgeProjection} from './lib/knowledge-intelligence/package-k-d-v1.mjs';
const args=process.argv.slice(2); const query=args.find(a=>!a.startsWith('--'))??'';
const locale=(args.find(a=>a.startsWith('--locale='))??'--locale=zh-Hans').split('=')[1];
const purpose=(args.find(a=>a.startsWith('--purpose='))??'--purpose=auto').split('=')[1];
const mode=(args.find(a=>a.startsWith('--output='))??'--output=projection').split('=')[1];
const result=mode==='path'?await buildDynamicReadingPath({query,locale,purpose}):await buildAdaptiveKnowledgeProjection({query,locale,purpose});
console.log(JSON.stringify(result,null,2));
