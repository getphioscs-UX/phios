import fs from 'node:fs';
import path from 'node:path';
const root=path.resolve(import.meta.dirname,'..');
const files=[];
function walk(dir){for(const e of fs.readdirSync(path.join(root,dir),{withFileTypes:true})){const p=dir+'/'+e.name;if(e.isDirectory())walk(p);else if(p.endsWith('.js'))files.push(p);}}
walk('assets/js/locales');
files.push('assets/js/public-shell-v2.js','assets/js/pages/knowledge-spine-visuals.js');
const changed=[];
for(const p of files){const before=fs.readFileSync(path.join(root,p),'utf8');let after=before
  .replace(/\bfive([ -])(books?|volumes?)\b/gi,(all,sep,noun)=>`${all[0]==='F'?'Seven':'seven'}${sep}${noun}`)
  .replace(/(?<!第)五册/g,'七册');
  if(after!==before){fs.writeFileSync(path.join(root,p),after);changed.push(p);}}
console.log(`Updated seven-volume public copy in ${changed.length} files.`);
const books=JSON.parse(fs.readFileSync(path.join(root,'content/registry/successors/seven-volume-v1/books.json'),'utf8')).books;
const roman=['I','II','III','IV','V','VI','VII'], words=['One','Two','Three','Four','Five','Six','Seven'];
for(const lang of ['en','zh-Hans']){
  for(const file of ['thesis','atlas','public']){
    const p=path.join(root,`assets/js/locales/${lang}/${file}.js`);
    let text=fs.readFileSync(p,'utf8').replace('Five reading volumes','Seven reading volumes');
    const quote=value=>JSON.stringify(value);
    for(const b of books){
      const n=b.volume, title=b.title[lang], desc=b.subtitle[lang]||b.subtitle.en;
      const parts=b.parts.length===1?`${b.parts[0]}`:`${b.parts[0]}–${b.parts.at(-1)}`;
      const label=lang==='en'?`Book ${roman[n-1]} · ${title}`:`第${['一','二','三','四','五','六','七'][n-1]}册 · ${title}`;
      if(file==='public'){
        text=text.replace(new RegExp(`b${n}Title: '[^']*'`,'g'),`b${n}Title: ${quote(label)}`);
        text=text.replace(new RegExp(`b${n}Copy: '[^']*'`,'g'),`b${n}Copy: ${quote(desc)}`);
      }
      if(file==='thesis'){
        const record={no:lang==='en'?`BOOK ${roman[n-1]} · PART${b.parts.length===1?'':'S'} ${parts}`:`第${['一','二','三','四','五','六','七'][n-1]}册 · 第 ${parts} 部`,title,copy:desc,status:lang==='en'?'Seven-volume architecture':'七册架构'};
        text=text.replace(new RegExp(`"b${n}": \\{[^\\n]+\\}`),`"b${n}": ${JSON.stringify(record)}`);
      }
      if(file==='atlas'){
        for(const [key,value] of Object.entries({[`book${words[n-1]}Title`]:title,[`book${words[n-1]}English`]:b.title.en,[`book${words[n-1]}Description`]:desc,[`exploreParts${words[n-1]}`]:lang==='en'?`Explore Part${b.parts.length===1?'':'s'} ${parts}`:`探索第 ${parts} 部`,[`showingBook${words[n-1]}`]:lang==='en'?`Showing Book ${roman[n-1]} · Part${b.parts.length===1?'':'s'} ${parts}`:`正在显示第${['一','二','三','四','五','六','七'][n-1]}册 · 第 ${parts} 部`})) text=text.replace(new RegExp(`${key}: '[^']*'`,'g'),`${key}: ${quote(value)}`);
      }
    }
    fs.writeFileSync(p,text);
  }
}
