import hashlib,json,re
from pathlib import Path
from pypdf import PdfReader
source=Path('.wrangler/book-vii-source-v2.pdf')
data=source.read_bytes()
assert data.startswith(b'%PDF-')
pages=[p.extract_text() or '' for p in PdfReader(source).pages]
records=[];seen=set()
for page,body in enumerate(pages,1):
    lines=body.splitlines()
    for i,line in enumerate(lines):
        if not line.lstrip().startswith('✦'):continue
        heading=line.split('✦')[1]
        for following in lines[i+1:i+4]:
            if not following.strip() or following.lstrip().startswith('✦') or len(following)-len(following.lstrip())>=5:break
            heading+=following
        heading=re.sub(r'\s+','',heading)
        parts=re.split(r'[|｜]',heading,maxsplit=1);title=parts[0]
        if title=='观察科学' or title in seen:continue
        seen.add(title);records.append(dict(sectionCode=f'14.{len(records)+1}',titleZhHans=title,readerQuestionZhHans=parts[1] if len(parts)>1 else None,sourcePage=page))
assert len(records)==100,len(records)
sections=[]
for n in [65,66,71,72]:
    current=records[n-1];following=records[n]
    raw='\n'.join(pages[current['sourcePage']-1:following['sourcePage']])
    lines=raw.splitlines();compact=lambda s:re.sub(r'\s+','',s)
    a=next(i for i,l in enumerate(lines) if compact(l).startswith('✦'+current['titleZhHans']))
    b=next(i for i,l in enumerate(lines[a+1:],a+1) if compact(l).startswith('✦'+following['titleZhHans']))
    text='\n'.join(lines[a:b]);normalized=re.sub(r'[ \t]+','',text)
    sections.append({**current,'nodeCode':f'KN-B7-14-{n:03d}','status':'VERIFIED_FROM_V2','text':normalized,'rawExtractedText':text,'sectionDigest':hashlib.sha256(normalized.encode()).hexdigest(),'rawExtractedDigest':hashlib.sha256(text.encode()).hexdigest(),'digestScheme':'SHA256_UTF8_EXTRACTED_SECTION_TYPESET_SPACES_REMOVED'})
directory=Path('content/knowledge/book-vii/v2-cutover');directory.mkdir(parents=True,exist_ok=True)
record={'status':'BOUND','sourceVersion':'v2','bucket':'phios-private-manuscripts','objectKey':'books/book-7/source/PHI-OS-Book-7-v2.pdf','actualRemoteRead':True,'pdfHeader':'%PDF-','byteLength':len(data),'sha256':hashlib.sha256(data).hexdigest(),'pageCount':len(pages),'sectionCount':len(records),'records':records,'sections':sections,'privateEditorialEvidence':True,'rawManuscriptRetrievalAllowed':False}
(directory/'verified-source-v2.json').write_text(json.dumps(record,ensure_ascii=False,indent=2)+'\n',encoding='utf8')
print(json.dumps({k:record[k] for k in ['status','sha256','byteLength','pageCount','sectionCount']}))
