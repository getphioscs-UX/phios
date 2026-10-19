"""Read OOXML directly. Never runs macros, Excel, external links or calculations."""
from pathlib import Path
import sys
sys.stdout.reconfigure(encoding='utf-8')
import zipfile, hashlib, json, xml.etree.ElementTree as ET
NS={'s':'http://schemas.openxmlformats.org/spreadsheetml/2006/main'}
paths=[Path('C:/Users/Guest Account/Desktop/Monthly Amortization for all.xlsx'),Path('C:/Users/Guest Account/Desktop/Malaysia_Net_Rental_Income_Calculator_Bilingual.xlsm')]
result=[]
for path in paths:
    raw=path.read_bytes()
    record={'path':str(path),'sha256':hashlib.sha256(raw).hexdigest(),'bytes':len(raw),'macroExecuted':False,'recalculated':False,'sheets':[]}
    with zipfile.ZipFile(path) as z:
        strings=[]
        if 'xl/sharedStrings.xml' in z.namelist():
            strings=[''.join(si.itertext()) for si in ET.fromstring(z.read('xl/sharedStrings.xml'))]
        book=ET.fromstring(z.read('xl/workbook.xml'))
        record['definedNames']=[{'name':n.get('name'),'formula':n.text,'invalidReference':bool(n.text and '#REF!' in n.text)} for n in book.findall('s:definedNames/s:definedName',NS)]
        names=[x.attrib['name'] for x in book.findall('s:sheets/s:sheet',NS)]
        sheets=sorted(x for x in z.namelist() if x.startswith('xl/worksheets/sheet') and x.endswith('.xml'))
        for i,name in enumerate(sheets):
            tree=ET.fromstring(z.read(name));cells=[];errors=[];formulas=0
            for c in tree.findall('.//s:c',NS):
                v=c.find('s:v',NS);f=c.find('s:f',NS);value=v.text if v is not None else None
                if c.get('t')=='s' and value is not None:value=strings[int(value)]
                if c.get('t')=='inlineStr':value=''.join(c.find('s:is',NS).itertext())
                if f is not None:formulas+=1
                # Evidence keeps structural/formula provenance, not raw customer inputs.
                entry={'cell':c.get('r'),'type':c.get('t'),'valuePresent':value is not None,'formula':f.text if f is not None else None}
                if c.get('t')=='e':entry['cachedError']=value
                if c.get('t')=='e':errors.append(entry)
                row=int(''.join(x for x in c.get('r') if x.isdigit()))
                if row<=40:cells.append(entry)
            record['sheets'].append({'name':names[i] if i<len(names) else name,'formulaCount':formulas,'cachedErrorCount':len(errors),'cachedErrors':errors,'inputAndOutputCells':cells})
    result.append(record)
out=Path('docs/financial-preparation/INPUT-WORKBOOK-AUDIT.json');out.write_text(json.dumps({'method':'READ_ONLY_OOXML_NO_MACROS','workbooks':result},ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
for r in result:
    print(Path(r['path']).name,r['bytes'],r['sha256'])
    for s in r['sheets']:print(s['name'],'formulas',s['formulaCount'],'cached_errors',s['cachedErrorCount'])
