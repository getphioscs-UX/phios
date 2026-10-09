import fs from 'node:fs';import crypto from 'node:crypto';import {execFileSync} from 'node:child_process';
export const sha256=p=>crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
export const currentHead=()=>execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim();
export function buildInputIdentity(){
 const paths=execFileSync('git',['-c','core.quotepath=false','ls-files','--cached','--others','--exclude-standard','-z'],{encoding:'utf8',maxBuffer:32*1024*1024}).split('\0').filter(Boolean);
 const files=[...new Set(paths)].filter(p=>fs.existsSync(p)&&fs.statSync(p).isFile()&&!p.startsWith('content/production-closure/')&&!p.endsWith('ZERO-COST-GUARD-EVIDENCE.json')&&(/^(functions|assets|workers|config|scripts|content)\//.test(p)||/^(package(?:-lock)?\.json|wrangler\.jsonc|[^/]+\.html)$/.test(p)||(!/^(docs|tests|\.tmp|\.codex|\.agents)\//.test(p)&&/\.html$/.test(p)))).sort().map(path=>({path,sha256:sha256(path)}));
 return {scope:'BUILD_INPUT_SOURCE_AND_PUBLIC_FILES_EXCLUDING_INTERNAL_REVIEW_AND_GENERATED_GUARD_RECEIPTS',files,digest:crypto.createHash('sha256').update(JSON.stringify(files)).digest('hex')};
}
