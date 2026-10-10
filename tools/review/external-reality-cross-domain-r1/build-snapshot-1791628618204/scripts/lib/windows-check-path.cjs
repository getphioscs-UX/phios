// npm run recursively prepends the same node_modules/.bin paths on Windows.
// Preserve lookup order while removing repeats before the next child shell.
// This changes only process environment, never checker logic or exit status.
if(process.platform==='win32'){
 const key=Object.keys(process.env).find(k=>k.toLowerCase()==='path');
 if(key){const seen=new Set();process.env[key]=process.env[key].split(';').filter(p=>{const n=p.replace(/[\\/]+$/,'').toLowerCase();if(seen.has(n))return false;seen.add(n);return true;}).join(';');}
}
