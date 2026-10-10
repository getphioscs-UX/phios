import {spawn} from 'node:child_process';
const child=spawn(process.execPath,['node_modules/wrangler/bin/wrangler.js','pages','deployment','tail',process.argv[2]||'08ded173-d075-4243-8ac3-a2fa97a426a0','--project-name','phios-github','--format','json'],{stdio:['ignore','pipe','pipe']});
let buffer='',depth=0,quoted=false,escaped=false,start=-1;
child.stdout.on('data',chunk=>{for(const ch of chunk.toString()){buffer+=ch;if(start<0){if(ch==='{'){start=buffer.length-1;depth=1;}continue;}if(quoted){if(escaped)escaped=false;else if(ch==='\\')escaped=true;else if(ch==='"')quoted=false;continue;}if(ch==='"')quoted=true;else if(ch==='{')depth++;else if(ch==='}'&&--depth===0){try{const e=JSON.parse(buffer.slice(start));const request=e.event?.request;if(request&&new URL(request.url).pathname==='/api/account-method-reports'){const clean={timestamp:e.eventTimestamp,outcome:e.outcome,cpuTime:e.cpuTime,wallTime:e.wallTime,method:request.method,status:e.event?.response?.status,diagnostics:(e.logs||[]).filter(x=>JSON.stringify(x.message).includes('METHOD_REPORT_QA_FAILURE')).map(x=>x.message),exceptions:(e.exceptions||[]).map(x=>({name:x.name,message:x.message}))};console.log(JSON.stringify(clean));}}catch{}buffer='';start=-1;}}});
child.stderr.on('data',()=>{});
process.on('SIGINT',()=>{child.kill();process.exit(0);});
setTimeout(()=>{child.kill();process.exit(0);},900000);
