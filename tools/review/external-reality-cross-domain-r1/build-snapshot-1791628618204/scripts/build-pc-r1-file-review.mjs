import fs from 'node:fs';import path from 'node:path';import {build} from 'esbuild';
const source=path.resolve('content/product-convergence-r1/audits/w12-w95'),destination=path.resolve('tools/review/pc-r1-w12-w95'),hub=path.resolve('tools/review/PC-R1-CONSOLIDATED-HUMAN-REVIEW.html');
const walk=dir=>fs.readdirSync(dir,{withFileTypes:true}).flatMap(entry=>entry.isDirectory()?walk(path.join(dir,entry.name)):[path.join(dir,entry.name)]);
const closure=path.resolve('content/product-convergence-r1/audits/consolidated-closure');
const inputs=[...walk(source),...(fs.existsSync(closure)?walk(closure):[])].filter(file=>file.endsWith('.html'));
const target=file=>file===path.join(source,'PC-R1-CONSOLIDATED-HUMAN-REVIEW.html')?hub:file.startsWith(closure+path.sep)?path.join(destination,'closure',path.relative(closure,file)):path.join(destination,path.relative(source,file));
const records=[];
for(const input of inputs){const output=target(input);let html=fs.readFileSync(input,'utf8');
 html=html.replace(/\b(href|src)="([^"]+)"/g,(whole,attribute,value)=>{
  if(value.startsWith('#')||/^(?:[a-z]+:|\/\/)/i.test(value))return whole;
  const match=value.match(/^([^?#]+)(.*)$/);if(!match)return whole;
  const resolved=path.resolve(path.dirname(input),match[1]);
  const linked=inputs.includes(resolved)?target(resolved):resolved;
  return `${attribute}="${path.relative(path.dirname(output),linked).replaceAll('\\','/')}${match[2]}"`;
 });
 const modules=[...html.matchAll(/<script type="module">([\s\S]*?)<\/script>/g)];
 for(const module of modules){const bundled=await build({stdin:{contents:module[1],resolveDir:path.dirname(input),sourcefile:path.basename(input)+'.js'},bundle:true,format:'iife',platform:'browser',write:false,logLevel:'silent'});html=html.replace(module[0],'<script>\n'+bundled.outputFiles[0].text.replace(/<\/script/gi,'<\\/script')+'\n</script>');}
 fs.mkdirSync(path.dirname(output),{recursive:true});fs.writeFileSync(output,html);records.push({source:path.relative(process.cwd(),input).replaceAll('\\','/'),file:path.relative(process.cwd(),output).replaceAll('\\','/'),inlineModuleBundles:modules.length});
}
fs.writeFileSync(path.join(destination,'FILE-REVIEW-MANIFEST.json'),JSON.stringify({scope:'Portable file:// review copies; source audit and decisions unchanged',hub,requiresLocalServer:false,files:records},null,2)+'\n');
console.log(`Created ${records.length} portable review pages. Main: ${hub}`);
