"""Configure the existing R65 export adapter with R68 selected real paragraphs.
No second drawing engine; the actual R65 classes and story builder execute here.
"""
import pathlib,hashlib,json,sys
base=pathlib.Path('tools/review/hd-r6/import-20261027/r65/render.py');original=base.read_text(encoding='utf-8');s=original
s=s[:s.index("file=O/'HD-R65-BODYGRAPH-PROOF.pdf'")]+"save('LAYOUT-MAP.json',{'formats':layout})\n"
s=s.replace('hd-r65','hd-r68').replace('/r65','/r68').replace('R65','R68').replace('R6.5','R6.8')
s=s.replace("T=pathlib.Path('.tmp/hd-r68-private');", "T=pathlib.Path('.tmp/hd-r68-private');T.mkdir(parents=True,exist_ok=True);")
s=s.replace("if isinstance(f,Poster):self.chapters[f.number]=self.page;self.roles[self.page]='SECTION_OPENER_'+str(f.number)","if isinstance(f,Poster):self.chapters[f.number]=self.page;self.roles[self.page]='SECTION_OPENER_'+str(f.number);self.canv.bookmarkPage('SEC%02d'%f.number);self.canv.addOutlineEntry('SEC%02d'%f.number,'SEC%02d'%f.number,level=0,closed=False)")
old='for n,sec in enumerate(selection[\'sections\'],1):s +=[P(f"{n:02}  {sec[\'title\'][\'zh-Hans\' if z else \'en\']}   {known.get(\'chapters\',{}).get(n,\'\')}")]'
new='for n,sec in enumerate(selection[\'sections\'],1):s +=[Paragraph(f\'<link href="#SEC{n:02}">{n:02}  {escape(sec["title"]["zh-Hans" if z else "en"])}   {known.get("chapters",{}).get(n,"")}</link>\',body)]'
assert old in s;s=s.replace(old,new)
# Two original R65 figure captions asserted an unverified circuit classification
# and placed developer precision wording on customer pages. Keep exact numeric
# facts, put unresolved precision in the evidence package rather than a QA card.
s=s.replace('Experiential discovery: sub-circuit unverified','Complete Channel 29 - 46')
s=s.replace("note(cv,0,42,'Each axis remains distinct. Advanced precision is not globally admitted.');note(cv,0,22,'No Tone-to-Cognition inference or medical instruction.');",'')
s=s.replace('Design Venus Line is unresolved against an independent reference.','The marked Venus position is displayed as a calculated position only.')
s=s.replace('No personal Line interpretation is generated from that position.','It is not used for an individual Line interpretation.')
s=s.replace('The43–23,29–46 and37–40','The 43–23, 29–46 and 37–40')
s=s.replace('while size(tail)<210','while size(tail)<(330 if fmt!=\'zh-Hans\' else 210)')
requested=sys.argv[1:] or ['zh-Hans','en','bilingual'];assert all(x in ['zh-Hans','en','bilingual'] for x in requested)
if len(requested)<3:
 s=s.replace('manifest=[];layout=[]',"manifest=[x for x in j(D/'PDF-MANIFEST.json')['files'] if x['format'] not in "+repr(requested)+"];layout=[x for x in j(D/'LAYOUT-MAP.json')['formats'] if x['format'] not in "+repr(requested)+"]")
 s=s.replace("for fmt in ['zh-Hans','en','bilingual']:",'for fmt in '+repr(requested)+':')
# Private-review labels remain on cover/margins; no internal workflow language
# is inserted into chapter manuscripts or used as replacement chapter prose.
assert 'Scope / Cognition claims excluded' not in s
D=pathlib.Path('tools/review/hd-r6/import-20261027/r68');(D/'RENDER-ADAPTER.json').write_text(json.dumps({'base':str(base),'baseSHA256':hashlib.sha256(original.encode()).hexdigest(),'configuredAdapterSHA256':hashlib.sha256(s.encode()).hexdigest(),'reuses':'Original ReportLab Graphic, Poster, Report, build_story and BodyGraph primitives','changes':['R68 paragraph/asset input paths','Seventeen PDF outline bookmarks and seventeen contents links','Opaque original R65 ivory reading panels retained','Continuation-end grouping retained','No unverified circuit classification asserted'],'newRendererEngine':False},indent=2)+'\n')
exec(compile(s,'R65-existing-export-adapter-with-R68-inputs','exec'),{'__name__':'__main__'})
