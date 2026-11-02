from pathlib import Path
p=Path('C:/phios/tools/review/ziwei-r1-3-final-delivery/finish-print.py');s=p.read_text();s=s.replace("report=inspect_pdf(raw,'ZWR-R13-PRINT','ZWR','Local corrected accepted reference');result=optimize(report,87", "report=inspect_pdf(raw,'ZWR-R13-PRINT','ZWR','Local corrected accepted reference')\noriginal_images=inspect_pdf(old,'ZWR-R12-ORIGINAL','ZWR','Protected Q87 reference')['images'];protected_hashes={x['sha256']for x in original_images}\nfor image in report['images']:\n if image['sha256']in protected_hashes:image['backgroundCandidate']=False\nresult=optimize(report,87")
s=s.replace("'originalReference':str(old)","'originalQ87ImagesProtectedFromSecondJPEGPass':True,'originalReference':str(old)")
p.write_text(s)
