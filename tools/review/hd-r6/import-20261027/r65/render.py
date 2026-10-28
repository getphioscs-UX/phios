import json,pathlib,hashlib,re,io,copy,datetime
import sys
sys.path.insert(0,str(pathlib.Path('scripts/lib').resolve()))
from disk_space_guard import require_disk_space,reserve_render_slot
require_disk_space('HD R65 report batch',2_000_000_000)
reserve_render_slot('HD R65 report batch')
from xml.sax.saxutils import escape
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfgen import canvas
from reportlab.platypus import BaseDocTemplate,PageTemplate,Frame,Paragraph,Spacer,PageBreak,Table,TableStyle,Flowable,KeepTogether
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.colors import HexColor,Color,white
from reportlab.lib.utils import ImageReader
from PIL import Image
from pypdf import PdfReader
D=pathlib.Path('tools/review/hd-r6/import-20261027/r65');O=pathlib.Path('output/pdf/hd-r65-owner-review');O.mkdir(parents=True,exist_ok=True);T=pathlib.Path('.tmp/hd-r65-private');j=lambda p:json.loads(pathlib.Path(p).read_text(encoding='utf-8'));save=lambda n,x:(D/n).write_text(json.dumps(x,ensure_ascii=False,indent=2)+'\n',encoding='utf-8');sha=lambda p:hashlib.sha256(pathlib.Path(p).read_bytes()).hexdigest()
pack=j(D/'SECTION-PACKETS.json')['packets'];selection=j(D/'FULL-REPORT-SELECTION.json');preview=j(D/'CURRENT-PLAN.json')['preview'];c=preview['chart'];geom=j(D/'BODYGRAPH-GEOMETRY.json');state=j(D/'BODYGRAPH-STATE.json');assets=j(D/'R2-ASSET-MANIFEST.json')['rows'];lookup={str(a['section']):a for a in assets};W,H=595.2756,841.8898;navy=HexColor('#173847');teal=HexColor('#205c62');gold=HexColor('#ac8a4a');ivory=HexColor('#fffdf8');red=HexColor('#b94339')
accept=j(D/'SEC11-OWNER-VISUAL-ACCEPTANCE.json');assert sha(lookup['11']['file'])==accept['sha256'] and accept['personalTone4CognitionInferenceAllowed'] is False
pdfmetrics.registerFont(TTFont('Noto','assets/fonts/private-report/NotoSansSC-Regular.ttf'))
bodyImage=ImageReader(Image.open(lookup['BODY']['file']).convert('RGB'));posterImages={a['section']:ImageReader(Image.open(a['file']).convert('RGB')) for a in assets if a['section']!='BODY'}
clean=lambda t:re.sub(r'\*\*(.*?)\*\*',r'\1',t.replace('\r',''),flags=re.S)
class Graphic(Flowable):
 def __init__(self,kind,section=None):Flowable.__init__(self);self.kind=kind;self.section=section;self.width=487;self.height=630 if kind=='bodygraph' else 520
 def draw(self):
  cv=self.canv
  if self.kind=='bodygraph':draw_graph(cv,22,0,0.70);return
  if self.kind=='activation':
   for col,side in enumerate(['PERSONALITY','DESIGN']):
    x=col*248;cv.setFillColor(navy if col==0 else red);cv.setFont('Helvetica-Bold',15);cv.drawString(x,492,'Personality' if col==0 else 'Design')
    for i,a in enumerate(x for x in c['activations'] if x['layer']==side):
     y=455-i*27;cv.setFillColor(HexColor('#eee8db') if i%2==0 else ivory);cv.rect(x,y-8,230,25,fill=1,stroke=0);cv.setFillColor(navy if col==0 else red);cv.setFont('Helvetica',11);cv.drawString(x+10,y,a['bodyCode'].replace('_',' ').title());cv.setFont('Helvetica-Bold',13);cv.drawRightString(x+216,y,f"{a['gate']}.{a['line']}"+(' *' if side=='DESIGN' and a['bodyCode']=='VENUS' else ''))
   note(cv,0,48,'* Design Venus Line is unresolved against an independent reference.');note(cv,0,28,'No personal Line interpretation is generated from that position.');return
  if self.kind=='centers':
   for i,v in enumerate(geom['centers']):
    x=i%3*165;y=390-i//3*130;box(cv,x,y,155,115,v['name'],'Defined' if v['id'] in state['defined'] else 'Fully open' if v['id'] in state['fullyOpen'] else 'Undefined / activated',str([a['gate'] for a in c['activations'] if geom['gates'][str(a['gate'])]['center']==v['id']])[:45])
  elif self.kind=='definition':
   for i,ch in enumerate(c['channels']):box(cv,35,365-i*140,415,100,f"Cluster {i+1}",ch['centerA'].replace('_',' ')+' / '+ch['centerB'].replace('_',' '),'Complete Channel '+ ' - '.join(map(str,ch['gates'])))
   note(cv,35,25,'Three disconnected defined components. No inferred bridging person.');
  elif self.kind=='channels':
   circuit={frozenset([43,23]):'Individual / Knowing',frozenset([29,46]):'Experiential discovery: sub-circuit unverified',frozenset([37,40]):'Tribal / Community'}
   for i,ch in enumerate(c['channels']):box(cv,15,360-i*140,455,110,' - '.join(map(str,ch['gates'])),circuit[frozenset(ch['gates'])],ch['centerA'].replace('_',' ')+' / '+ch['centerB'].replace('_',' '))
  elif self.kind=='profile':
   cv.setFillColor(teal);cv.setFont('Helvetica',92);cv.drawCentredString(243,310,c['profile']['profileCode']);box(cv,0,120,230,130,'Personality Line 5','Practical expectations','Clarify request and responsibility');box(cv,252,120,230,130,'Design Line 1','Reliable foundations','Research the conditions');note(cv,15,48,'Combine with Emotional Authority before a major commitment.');
  elif self.kind=='cross':
   acts=[next(a for a in c['activations'] if a['layer']==s and a['bodyCode']==b) for s,b in [('PERSONALITY','SUN'),('PERSONALITY','EARTH'),('DESIGN','SUN'),('DESIGN','EARTH')]]
   for i,a in enumerate(acts):box(cv,i%2*248,300-i//2*180,230,150,a['layer'].title()+' '+a['bodyCode'].title(),f"Gate {a['gate']} / Line {a['line']}",'Calculated position')
   note(cv,0,42,'Ordered identity: '+c['incarnationCross']['configurationCode']);note(cv,0,22,'No unverified commercial Cross name or book-specific narrative.');
  elif self.kind=='environment':
   for i,(key,label) in enumerate([('designLower','Environment'),('personalityLower','Perspective'),('personalityUpper','Motivation')]):
    a=c['variables']['fields'][key];box(cv,15,360-i*140,455,110,label,f"Color {a['color']} / Tone {a['tone']}",a['orientation'])
   note(cv,15,26,'Three distinct axes. Determination belongs to the preceding chapter.');
  elif self.kind=='variables':
   keys=['designUpper','designLower','personalityUpper','personalityLower'];labels=['Determination','Environment','Motivation','Perspective']
   for i,(key,label) in enumerate(zip(keys,labels)):
    a=c['variables']['fields'][key];x=i%2*248;y=300-i//2*180;box(cv,x,y,230,150,label,f"Color {a['color']} / Tone {a['tone']}",a['orientation']);cv.setStrokeColor(gold);cv.setLineWidth(3);right=a['orientation']=='RIGHT';start=x+65;end=x+165;cv.line(start,y+25,end,y+25);p=end if right else start;cv.line(p,y+25,p+(-10 if right else 10),y+33);cv.line(p,y+25,p+(-10 if right else 10),y+17)
   note(cv,0,42,'Each axis remains distinct. Advanced precision is not globally admitted.');note(cv,0,22,'No Tone-to-Cognition inference or medical instruction.');
  elif self.kind=='comparison':
   for i,(a,b,t) in enumerate([('Known conditions','What is already established?','Your current situation and available resources'),('Important unknowns','What would change the choice?','Workload, support, timing and willingness'),('Possible directions','What can be compared?','A bounded trial / a smaller role / defer'),('Review','What actually happened?','Leave unobserved outcomes blank')]):box(cv,10,400-i*125,465,100,a,b,t)
def localized(cv,t):
 if getattr(getattr(cv,'_doctemplate',None),'fmt',None)!='zh-Hans':return t
 terms={'Head':'头顶','Ajna':'逻辑','Throat':'喉咙','Identity':'G中心','Ego':'意志','Spleen':'脾中心','Emotional':'情绪','Sacral':'荐骨','Root':'根部','Defined':'有定义','Fully open':'完全开放','Undefined / activated':'未定义，有激活','Individual / Knowing':'个体／知晓','Tribal / Community':'部落／合作','Experiential discovery: sub-circuit unverified':'经验发现：子回路待核验','Personality Line 5':'意识第五爻','Design Line 1':'设计第一爻','Practical expectations':'实用贡献的期待','Reliable foundations':'可靠的基础','Clarify request and responsibility':'明确请求与责任','Research the conditions':'了解实际条件','Personality Sun':'意识太阳','Personality Earth':'意识地球','Design Sun':'设计太阳','Design Earth':'设计地球','Calculated position':'计算所得位置','Determination':'摄取','Environment':'环境','Perspective':'视角','Motivation':'动机','RIGHT':'右向','LEFT':'左向','Known conditions':'已知条件','What is already established?':'目前有哪些已知资料？','Your current situation and available resources':'你现在的处境与可用资源','Important unknowns':'重要未知','What would change the choice?':'哪些资料会影响选择？','Workload, support, timing and willingness':'工作量、支持、时机和意愿','Possible directions':'可比较的方向','What can be compared?':'有哪些可以比较的安排？','A bounded trial / a smaller role / defer':'小规模试行／缩小参与／暂缓','Review':'复核','What actually happened?':'之后实际发生了什么？','Leave unobserved outcomes blank':'没有观察到的结果保持空白','Three distinct axes. Determination belongs to the preceding chapter.':'三个不同的轴。摄取属于上一章的主题。','Three disconnected defined components. No inferred bridging person.':'三个独立的定义群组，不推断某个人替你桥接。','Combine with Emotional Authority before a major commitment.':'重要承诺须结合情绪权威的过程。','No unverified commercial Cross name or book-specific narrative.':'不指定未核实的商业名称或书籍专属叙事。','Each axis remains distinct. Advanced precision is not globally admitted.':'各轴保持区别；高级位置的精度仍有独立边界。','No Tone-to-Cognition inference or medical instruction.':'不从Tone推导感官解释或医疗建议。'}
 if t in terms:return terms[t]
 t=re.sub(r'^Cluster (\d+)',r'群组 \1',t);t=re.sub(r'^Complete Channel ',r'完整通道 ',t);t=re.sub(r'^Color (\d+) / Tone (\d+)',r'色调 \1／音调 \2',t);t=re.sub(r'^Gate (\d+) / Line (\d+)',r'闸门 \1／爻线 \2',t);t=t.replace('Ordered identity:','顺序身份：')
 for a,b in [('SOLAR_PLEXUS','情绪'),('SACRAL','荐骨'),('THROAT','喉咙'),('AJNA','逻辑'),('EGO','意志')]:t=t.replace(a,b)
 return t
def note(cv,x,y,t):cv.setFillColor(navy);cv.setFont('Noto',9);cv.drawString(x,y,localized(cv,t))
def box(cv,x,y,w,h,title,sub,detail):
 assert x>=0 and y>=0 and x+w<=487 and y+h<=520,'Diagram frame escapes its declared flowable'
 cv.setFillColor(HexColor('#f0ede4'));cv.setStrokeColor(gold);cv.roundRect(x,y,w,h,9,fill=1,stroke=1);cv.setFillColor(teal);cv.setFont('Noto',14);cv.drawString(x+13,y+h-28,localized(cv,title));cv.setFillColor(navy);cv.setFont('Noto',10 if len(sub)>33 else 11);cv.drawString(x+13,y+h-54,localized(cv,sub));cv.setFont('Noto',9);cv.drawString(x+13,y+h-76,localized(cv,detail))
def draw_graph(cv,x,y,scale):
 cv.saveState();cv.translate(x,y);cv.scale(scale,scale);flip=lambda y:900-y
 def line(route,color,width,offset=0):
  cv.setStrokeColor(color);cv.setLineWidth(width)
  for a,b in zip(route,route[1:]):cv.line(a[0]+offset,flip(a[1]),b[0]+offset,flip(b[1]))
 def split(route):
  import math
  lengths=[math.dist(a,b) for a,b in zip(route,route[1:])];half=sum(lengths)/2;acc=0
  for i,n in enumerate(lengths):
   if acc+n>=half:
    t=(half-acc)/n;a,b=route[i:i+2];mid=[a[0]+t*(b[0]-a[0]),a[1]+t*(b[1]-a[1])];return [route[:i+1]+[mid],list(reversed(route[i+1:]))+[mid]]
   acc+=n
 for ch in geom['channels']:
  route=ch['route'];line(route,HexColor('#d6cfc0'),9)
  for gate,part in zip(ch['gates'],split(route)):
   v=state['gates'][str(gate)]
   if v['personality']:line(part,HexColor('#20272c'),4 if v['design'] else 7,-2 if v['design'] else 0)
   if v['design']:line(part,red,4 if v['personality'] else 7,2 if v['personality'] else 0)
 for center in geom['centers']:
  path=cv.beginPath();path.moveTo(center['points'][0][0],flip(center['points'][0][1]));[path.lineTo(xx,flip(yy)) for xx,yy in center['points'][1:]];path.close();cv.setFillColor(HexColor(center['fill']) if center['id'] in state['defined'] else ivory);cv.setStrokeColor(gold if center['id'] in state['fullyOpen'] else teal);cv.setLineWidth(2 if center['id'] in state['fullyOpen'] else 1.2);cv.drawPath(path,fill=1,stroke=1);cv.setFillColor(navy);cv.setFont('Helvetica-Bold',10);cv.drawCentredString(center['label'][0],flip(center['label'][1]),center['name'])
 for gate,p in geom['gates'].items():
  v=state['gates'][gate];cv.setFillColor(HexColor('#20272c') if v['personality'] else red if v['design'] else ivory);cv.setStrokeColor(red if v['personality'] and v['design'] else gold);cv.setLineWidth(3 if v['personality'] and v['design'] else .6);cv.circle(p['x'],flip(p['y']),9,fill=1,stroke=1);cv.setFillColor(white if v['active'] else navy);cv.setFont('Helvetica',12.5);cv.drawCentredString(p['x'],flip(p['y'])-4,gate)
 cv.restoreState()
class Poster(Flowable):
 def __init__(self,num):Flowable.__init__(self);self.number=num;self.width=487;self.height=716;self.role='opener'
 def draw(self):
  if self.number in posterImages:self.canv.drawImage(posterImages[self.number],4,0,478,716,preserveAspectRatio=True,anchor='c',mask='auto')
  else:
   self.canv.setFillColor(teal);self.canv.setFont('Noto',27);self.canv.drawString(20,515,'11');self.canv.drawString(20,465,'环境与感知');self.canv.setFont('Helvetica',23);self.canv.drawString(20,420,'Environment & Perception');self.canv.setStrokeColor(gold);self.canv.line(20,390,450,390);note(self.canv,20,350,'Revised approved fixed artwork is not yet available.');note(self.canv,20,330,'The stale image is excluded. Continue to the calculated fields and reading.')
class Report(BaseDocTemplate):
 def __init__(self,file,fmt,known=None):self.fmt=fmt;self.chapters={};self.roles={};self.known=known or {};self.total=0;super().__init__(str(file),pagesize=(W,H),leftMargin=54,rightMargin=54,topMargin=63,bottomMargin=58,title='PHI OS Human Design R6.5 - Private premium design candidate',author='PHI OS');self.addPageTemplates(PageTemplate(id='body',frames=[Frame(54,58,W-108,H-121,leftPadding=0,rightPadding=0,topPadding=0,bottomPadding=0)],onPage=self.background))
 def background(self,cv,doc):
  n=doc.page;cv.drawImage(bodyImage,0,0,W,H,mask='auto');cv.setFillColor(ivory)
  if n==1:cv.roundRect(36,330,W-72,H-373,9,fill=1,stroke=0)
  else:cv.roundRect(36,43,W-72,H-86,9,fill=1,stroke=0)
  cv.setFillColor(teal);cv.setFont('Helvetica',8);cv.drawString(54,H-35,'PHI OS / HUMAN DESIGN');cv.setFillColor(HexColor('#865547'));cv.setFont('Helvetica',6);cv.drawRightString(W-42,H-35,'OWNER REVIEW / NOT FOR COMMERCIAL DISTRIBUTION');cv.setStrokeColor(gold);cv.line(54,44,W-54,44);cv.setFont('Helvetica',8);cv.setFillColor(navy);cv.drawString(54,29,'Private '+self.fmt+' edition');cv.drawRightString(W-54,29,str(n)+(f' / {self.known["pages"]}' if self.known.get('pages') else ''))
 def afterFlowable(self,f):
  self.total=self.page
  if isinstance(f,Poster):self.chapters[f.number]=self.page;self.roles[self.page]='SECTION_OPENER_'+str(f.number)
  if isinstance(f,Graphic):self.roles[self.page]='DIAGRAM_'+f.kind
def build_story(fmt,known):
 z=fmt=='zh-Hans';langs=['zh-Hans','en'] if fmt=='bilingual' else [fmt];body=ParagraphStyle('body',fontName='Noto',fontSize=11 if z else 11.5,leading=17.7 if z else 18,textColor=navy,spaceAfter=11,allowWidows=0,allowOrphans=0,wordWrap='CJK');h1=ParagraphStyle('h1',parent=body,fontSize=23,leading=31,textColor=teal,spaceAfter=20,keepWithNext=True);h2=ParagraphStyle('h2',parent=body,fontSize=15,leading=22,textColor=teal,spaceBefore=10,spaceAfter=11,keepWithNext=True);small=ParagraphStyle('small',parent=body,fontSize=9,leading=14);P=lambda t,style=body:Paragraph(escape(clean(t)).replace('\n','<br/>'),style);s=[]
 s +=[Spacer(1,100),P('人类图' if z else 'Human Design',h1),P('认识你的结构与生活中的选择' if z else 'Your Structure, Participation and Choices',h1),Spacer(1,30),P('完整十七章 · 私人设计审阅版' if z else 'Seventeen chapters / Private design review'),P('生产者 · 情绪权威 · 三分定义 · 5/1' if z else 'Generator / Emotional Authority / Triple Split / 5/1'),Spacer(1,80),P('本稿使用一个经本地确认的合成示例，不包含真实客户经历。正文为私人编辑候选；尚未获准商业分发。' if z else 'One confirmed synthetic example. No real customer history is supplied. This is a private editorial and design candidate; commercial distribution remains closed.',small),PageBreak()]
 s +=[P('阅读身份与重点' if z else 'Reading Identity and Priorities',h1),P('报告编号：HD-R65-OWNER-01' if z else 'Report reference: HD-R65-OWNER-01'),P('语言：'+fmt if z else 'Language: '+fmt),P('这一阅读把理解、参与和承诺放在一起。43–23、29–46与37–40形成三个独立连接群组。你可以先读类型、权威和定义，再进入各项主题。' if z else 'This reading brings understanding, participation and commitment into one view. The43–23,29–46 and37–40 form three separate connected groups. Begin with Type, Authority and Definition, then explore the other themes.'),P('解释应与真实处境和可核实资料比较。已接受章节保留；新稿等待Owner审核。高级位置仍有独立精度限制，不从数值推导医疗、职业或财富保证。' if z else 'Compare interpretations with real circumstances and checkable information. Accepted chapters are retained; new writing awaits Owner review. Advanced positions retain independent precision limits. The reading supplies no medical, career or wealth guarantee.'),P('下一页是目录；随后是完整计算图与星体表。' if z else 'The contents are followed by the calculated BodyGraph and activation table.'),PageBreak()]
 s +=[P('目录 / Contents',h1)]
 for n,sec in enumerate(selection['sections'],1):s +=[P(f"{n:02}  {sec['title']['zh-Hans' if z else 'en']}   {known.get('chapters',{}).get(n,'')}")]
 s +=[PageBreak(),P('计算所得人类图' if z else 'Your Calculated BodyGraph',h1),Graphic('bodygraph'),P('黑色：意识 · 红色：设计 · 红边黑点：双重激活。空白中心与完全开放中心按实际激活区别。' if z else 'Black: Personality. Red: Design. Black with red outline: both. Center states follow actual activations and completed Channels.',small),PageBreak(),P('星体激活 / Planetary Activations',h1),Graphic('activation'),PageBreak()]
 figures={4:'definition',5:'centers',6:'channels',8:'profile',9:'cross',10:'variables',11:'environment',16:'comparison'}
 for sec,packet in zip(selection['sections'],pack):
  n=sec['number'];s +=[Poster(n),PageBreak()]
  if n in figures:s +=[P(sec['title']['zh-Hans' if z else 'en'],h1),Graphic(figures[n]),P('以上图示使用本次实际计算字段；固定章节插图不代表客户命盘。' if z else 'These figures use the actual calculated fields. Fixed chapter artwork is editorial imagery, not the customer chart.',small),PageBreak()]
  for lang in langs:
   sb=copy.copy(body);sb.fontSize=11 if lang=='zh-Hans' else 11.5;sb.leading=17.7 if lang=='zh-Hans' else 18;title=sec['title'][lang];s +=[P(f'{n:02} · '+title,h1)]
   last=None;groups=[]
   for row in packet['paragraphs']:
    if row['language']!=lang:continue
    title=row['title'].removeprefix('R6.5 · ')
    if title!=last:groups.append([P(title,h2)]);last=title
    groups[-1].append(P(row['text'],sb))
   # Keep a substantial ending together rather than leaving a tiny continuation
   # page. Preserve every source paragraph and the stated body font sizes.
   size=lambda group:sum(f.wrap(W-108,10000)[1]+f.getSpaceBefore()+f.getSpaceAfter() for f in group)
   tail=list(groups[-1]);prefix=groups[:-1]
   while size(tail)<210 and len(prefix)>1 and size(prefix[-1]+tail)<650:tail=prefix.pop()+tail
   for group in prefix:s.extend(group)
   s.append(KeepTogether(tail) if size(tail)<650 else tail[0])
   if size(tail)>=650:s.extend(tail[1:])
   if lang!=langs[-1]:s.append(PageBreak())
  if n!=17:s.append(PageBreak())
 return s
manifest=[];layout=[]
for fmt in ['zh-Hans','en','bilingual']:
 temp=T/('layout-'+fmt+'.pdf');first=Report(temp,fmt);first.build(build_story(fmt,{}));known={'pages':first.total,'chapters':first.chapters};file=O/('HD-R65-PREMIUM-OWNER-'+fmt+'.pdf');final=Report(file,fmt,known);final.build(build_story(fmt,known));assert final.total==known['pages'];assert len(final.chapters)==17
 manifest.append({'format':fmt,'path':str(file).replace('\\','/'),'pages':final.total,'bytes':file.stat().st_size,'sha256':sha(file),'paragraphs':sum(len([r for r in x['paragraphs'] if fmt=='bilingual' or r['language']==fmt]) for x in pack),'embeddedPosters':17,'BODYBackground':True,'commercial':False,'amountMinor':13900 if fmt=='bilingual' else 12900});layout.append({'format':fmt,'chapters':final.chapters,'roles':final.roles,'pages':final.total});save('PDF-MANIFEST.json',{'files':manifest,'partialVisual':'Seventeen actual fixed openers embedded; SEC11 exact bytes explicitly confirmed by Owner','renderer':'Local premium export adapter over existing confirmed report plan, paragraph selection and entitlement owners. No production renderer route activated.','providerCalls':0});print(fmt,final.total,flush=True)
file=O/'HD-R65-BODYGRAPH-PROOF.pdf';cv=canvas.Canvas(str(file),pagesize=(W,H));cv.setFillColor(ivory);cv.rect(0,0,W,H,fill=1,stroke=0);cv.setFillColor(teal);cv.setFont('Helvetica-Bold',19);cv.drawString(55,790,'PHI OS / Calculated BodyGraph');draw_graph(cv,80,90,.72);note(cv,55,45,'OWNER REVIEW ONLY / One geometry map,64 Gates,36 Channels');cv.save();save('BODYGRAPH-PDF.json',{'path':str(file).replace('\\','/'),'sha256':sha(file),'pages':1,'geometry':'BODYGRAPH-GEOMETRY.json','primaryChannelCount':3,'acceptance':'OWNER_VISUAL_REVIEW_REQUIRED'});save('LAYOUT-MAP.json',{'formats':layout});save('DESIGN-CONTRACT.json',{'page':'A4 portrait','safeMarginsPt':54,'ChineseSizePt':11,'EnglishSizePt':11.5,'BODY':'Actual R2 BODY image under opaque ivory reading panel; no long prose over complex image','poster':'Seventeen exact fixed bilingual images; SEC11 Owner-confirmed educational artwork','languageSequencing':'Chapter-by-chapter ZH then EN','figureGeometry':'Same BODYGRAPH-GEOMETRY.json for generated HTML SVG and native PDF primitives','commercial':False})
