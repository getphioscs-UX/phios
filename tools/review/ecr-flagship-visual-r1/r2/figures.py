from pathlib import Path
import json,hashlib,math
from PIL import Image,ImageDraw
D=Path('tools/review/ecr-flagship-visual-r1/r2'); A=Path('assets/customer-ui/media/ecr-flagship-r2'); A.mkdir(parents=True,exist_ok=True)
reads=json.loads((D/'PUBLIC-READS.json').read_text())
contact=Image.new('RGB',(1200,840),'#f8f6f0');draw=ImageDraw.Draw(contact)
for i,r in enumerate(reads['rows']):
 im=Image.open(r['file']);im.load();r['width'],r['height']=im.size;r['decode']='PASS';r['format']=im.format
 rgba=im.convert('RGBA');r['alphaExtrema']=rgba.getchannel('A').getextrema()
 rgb=im.convert('RGB');w,h=rgb.size
 def edge(box):
  pixels=list(rgb.crop(box).getdata());return {'nearWhiteFraction':round(sum(min(p)>245 for p in pixels)/len(pixels),4),'meanRGB':[round(sum(p[j] for p in pixels)/len(pixels),1) for j in range(3)]}
 r['edges']={'top':edge((0,0,w,2)),'bottom':edge((0,h-2,w,h)),'left':edge((0,0,2,h)),'right':edge((w-2,0,w,h))}
 r['visualReview']='PENDING_CONTACT_INSPECTION'
 thumb=rgb.copy();thumb.thumbnail((570,365));x=(i%2)*600+(600-thumb.width)//2;y=(i//2)*420+30;contact.paste(thumb,(x,y));draw.text(((i%2)*600+12,(i//2)*420+5),r['name'],fill='#163f46')
contact.save(D/'FOUR-WEBP-CONTACT.jpg',quality=90)
(D/'PUBLIC-READS.json').write_text(json.dumps(reads,indent=2))
def wrap(inner,h):return f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 {h}" fill="none"><defs><linearGradient id="glass" x2="1" y2="1"><stop stop-color="#fff" stop-opacity=".95"/><stop offset="1" stop-color="#d8e4df" stop-opacity=".5"/></linearGradient></defs><g stroke="#163f46" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">{inner}</g></svg>'
def nodes(cx,cy,r,n=8):
 points=[(cx+r*math.cos(i*2*math.pi/n),cy+r*math.sin(i*2*math.pi/n)) for i in range(n)]
 return ''.join(f'<path d="M{cx} {cy}L{x:.2f} {y:.2f}" opacity=".25"/><circle cx="{x:.2f}" cy="{y:.2f}" r="5" fill="#b99a64" stroke="none"/>' for x,y in points)
origin='<path d="M343 230H445M755 230H854" stroke="#b99a64"/><path d="M432 224l13 6-13 6M841 224l13 6-13 6" stroke="#b99a64"/>'
origin+='<path d="M90 146Q170 126 235 162Q300 126 365 146V305Q300 283 235 319Q170 283 90 305Z" fill="url(#glass)"/><path d="M235 162V319M110 184Q168 168 212 187M110 216Q168 200 212 219M110 248Q168 232 212 251M258 187Q306 168 344 184M258 219Q306 200 344 216M258 251Q306 232 344 248" opacity=".4"/>'
origin+='<circle cx="600" cy="230" r="145" fill="url(#glass)"/><circle cx="600" cy="230" r="112" stroke="#b99a64"/><circle cx="600" cy="230" r="76"/><circle cx="600" cy="230" r="36" fill="#163f46"/>'+nodes(600,230,112,12)+nodes(600,230,76,8)
origin+='<rect x="864" y="135" width="240" height="180" rx="15" fill="url(#glass)"/><path d="M864 171H1104M898 285V238H944V285M967 285V209H1013V285M1035 285V252H1071V285"/><circle cx="1027" cy="219" r="46" stroke="#b99a64"/><path d="M1060 253L1101 296" stroke="#b99a64"/>'
reading='<path d="M80 270H1120" stroke="#b99a64" stroke-width="1.5"/>'
for x in [120,360,600,840,1080]:reading+=f'<circle cx="{x}" cy="270" r="100" fill="url(#glass)" stroke="#b99a64" stroke-width="1"/>'
reading+='<path d="M57 307H184M71 232V307M108 210V307M148 250V307M177 227V307" opacity=".5"/><circle cx="71" cy="232" r="7" fill="#163f46"/><circle cx="108" cy="210" r="7" fill="#b99a64"/><circle cx="148" cy="250" r="7" fill="#163f46"/>'+nodes(360,270,62,6)
reading+='<circle cx="600" cy="260" r="52" fill="url(#glass)"/><path d="M637 299L672 334M563 267L585 243L614 281L639 247"/><circle cx="585" cy="243" r="4" fill="#b99a64"/><rect x="774" y="229" width="53" height="83" rx="6"/><rect x="853" y="229" width="53" height="83" rx="6"/><path d="M795 252H812M795 273H812M868 252H890M868 273H880M833 270H847" stroke="#b99a64"/><path d="M1020 318L1061 278L1093 257M1061 278L1094 310M1093 257L1128 226M1093 257L1128 266M1094 310L1128 317"/><circle cx="1020" cy="318" r="6" fill="#163f46"/><circle cx="1128" cy="226" r="7" stroke="#b99a64"/><circle cx="1128" cy="266" r="7" stroke="#b99a64"/><circle cx="1128" cy="317" r="7" stroke="#b99a64"/>'
reality='<rect x="60" y="150" width="370" height="355" rx="25" fill="url(#glass)"/><rect x="770" y="150" width="370" height="355" rx="25" fill="url(#glass)"/>'+nodes(245,325,118,9)
reality+='<circle cx="245" cy="325" r="72"/><path d="M430 265L526 298M430 391L526 354M770 265L674 298M770 391L674 354" stroke="#b99a64" stroke-dasharray="6 9"/><circle cx="600" cy="325" r="86" fill="url(#glass)" stroke="#b99a64"/><path d="M575 275V375M625 275V375M553 301H647M553 349H647" opacity=".4"/><path d="M660 386L702 433" stroke="#b99a64"/>'
reality+='<path d="M810 437H1101M842 437V340H1024V437M858 340V288H939V340M867 301H930M867 316H914"/><circle cx="1063" cy="283" r="24"/><path d="M1030 421V349Q1063 310 1096 349V421M1044 361L1010 384M1085 362L1104 386"/><path d="M818 237H914M818 254H880" stroke="#b99a64"/>'
items=[('P03-METHOD-ORIGINS',origin,460),('P04-READING-LAYERS',reading,540),('P07-REALITY-COMPARISON',reality,675)]
for name,content,h in items:(A/f'VIS-PREENTRY-ECR-{name}.svg').write_text(wrap(content,h))
print(json.dumps([{'name':r['name'],'size':[r['width'],r['height']],'decode':r['decode'],'edges':r['edges']}for r in reads['rows']]))
