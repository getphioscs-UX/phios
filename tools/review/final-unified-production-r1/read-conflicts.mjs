import fs from 'node:fs';
const root='C:/phios/.worktrees/final-unified-production-r1';
for(const p of process.argv.slice(2)){const s=fs.readFileSync(root+'/'+p,'utf8'),parts=[...s.matchAll(/<<<<<<< ours\r?\n([\s\S]*?)=======\r?\n([\s\S]*?)>>>>>>> theirs/g)];console.log('\n'+p);for(const [i,m]of parts.entries())console.log(JSON.stringify({conflict:i,ours:m[1].length,theirs:m[2].length,oursStart:m[1].slice(0,550),theirsStart:m[2].slice(0,550),oursEnd:m[1].slice(-450),theirsEnd:m[2].slice(-650)}));}
