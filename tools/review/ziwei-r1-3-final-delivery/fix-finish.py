from pathlib import Path
p=Path('C:/phios/tools/review/ziwei-r1-3-final-delivery/finish-print.py');s=p.read_text();start=s.index('for j,n in enumerate');end=s.index('w.add_metadata',start);s=s[:start]+'''marks=[]
for j,n in enumerate([47,52,58]):
 p=new.pages[j];cloned=p.clone(w,force_duplicate=True);target=w.pages[n-1];target.replace_contents(cloned.get_contents());target[NameObject('/Resources')]=cloned['/Resources']
 b=io.BytesIO();c=canvas.Canvas(b,pagesize=(float(p.mediabox.width),float(p.mediabox.height)));c.setFont('Helvetica',7);c.setFillColorRGB(.46,.30,.22);c.drawCentredString(float(p.mediabox.width)/2,float(p.mediabox.height)-8,'SYNTHETIC REVIEW ONLY - ACCEPTED REFERENCE - NOT CUSTOMER ISSUED');c.save();mark=PdfReader(b);marks.append(mark);target.merge_page(mark.pages[0]);target.compress_content_streams()
'''+s[end:];s=s.replace("assert all(norm(line)in norm(newtext)for line in oldtext.splitlines()if line.strip()),('TEXT_LOST',i+1)","from collections import Counter\n assert Counter(norm(oldtext))==Counter(norm(newtext)),('TEXT_LOST',i+1)");p.write_text(s)
