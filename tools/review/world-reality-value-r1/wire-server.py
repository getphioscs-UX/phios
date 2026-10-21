from pathlib import Path
p=Path('tools/review/reality-information-contract-r1/L1/server.mjs');s=p.read_text(encoding='utf-8')
s=s.replace('fetch(origin+url,options)','fetch(origin+url,{...options,headers:{...options?.headers,origin}})')
s=s.replace('if(!file.startsWith(root+path.sep))',"if(!file.startsWith(review+path.sep)&&!['assets','world','content/civilization-atlas','content/world','content/knowledge/public'].some(dir=>file.startsWith(path.resolve(root,dir)+path.sep)))")
p.write_bytes(s.encode('utf-8'))
