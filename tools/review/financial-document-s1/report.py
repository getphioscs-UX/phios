import json,pathlib
from reportlab.platypus import SimpleDocTemplate,Paragraph,Spacer,Table,TableStyle,PageBreak
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.lib import colors
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.cidfonts import UnicodeCIDFont
p=pathlib.Path('content/production-closure/live-customer-commercial-convergence/financial-document-intelligence-staging-s1');r=json.loads((p/'deliverables.json').read_text(encoding='utf8'));pdfmetrics.registerFont(UnicodeCIDFont('STSong-Light'));styles=getSampleStyleSheet()
for k in styles.byName:styles[k].fontName='STSong-Light'
styles['Normal'].leading=17;styles['Normal'].fontSize=11
story=[]
def para(t,kind='Normal'):story.extend([Paragraph(t,styles[kind]),Spacer(1,12)])
para('财务专业审阅草稿 / Financial Review Draft','Title');para('Saffron Workshop Example · 完全虚构 / Entirely fictional');para('SYNTHETIC ONLY · NOT AUDITED · NOT CUSTOMER PUBLICATION');para('同一已审核结构化数据 / Same reviewed structured source: '+r['packageSha256']);
data=[['MYR / 马币','2025-Q1','2025-Q2']]
for id,l in r['labels'].items():data.append([Paragraph(' / '.join(l),styles['Normal'])]+[f"{c['values'][id]/100:,.2f}" if c['values'][id] is not None else 'Unknown' for c in r['reportColumns']])
t=Table(data,colWidths=[270,100,100]);t.setStyle(TableStyle([('FONTNAME',(0,0),(-1,-1),'STSong-Light'),('BACKGROUND',(0,0),(-1,0),colors.HexColor('#142b46')),('TEXTCOLOR',(0,0),(-1,0),colors.white),('GRID',(0,0),(-1,-1),.3,colors.lightgrey),('TOPPADDING',(0,0),(-1,-1),9),('BOTTOMPADDING',(0,0),(-1,-1),9)]));story.append(t);story.append(Spacer(1,18));para('经营者可提取资金：未知 / Owner accessible cash: Unknown.');para('企业利润、经营现金和经营者实收款分别记录；不能由正利润推断可提取资金。 / Positive profit does not establish withdrawable cash.');story.append(PageBreak());para('来源、发现及进一步证据 / Sources, findings and further evidence','Heading1');para('两期损益、资产负债与现金数学核对通过。独立合成账户 C 审核仅为本地来源审阅，不是专业签发。 / Mathematical reconciliation passed. Independent synthetic Account C review is local source review, not professional release.');para('第二期利润为正，但经营现金流较低；应收款和库存增加可能有关，仍需发票、回款及限制条件证据。 / Period two has positive profit but lower operating cash flow; receivables and inventory may explain part of the difference, subject to source review.');para('需要：债务条款、限制资金、提款政策及独立授权的家庭资料。 / Needed: debt terms, restricted cash, withdrawal policy and separately authorized household evidence.');para('行动草稿 / Action draft','Heading2')
for a in r['actions']:para(a['action']+' — '+a['role']+' — 拟议未批准 / Proposed, not approved. Review date '+a['expectedReviewDate']+' is a fictional scenario date.')
para('不提供自动保险、投资、税务或融资建议。 / No automatic insurance, investment, tax or financing advice.');para('Source versions / 来源版本：'+'; '.join(c['period']+': '+c['sourceVersion'] for c in r['reportColumns']));SimpleDocTemplate(str(p/'professional-draft.pdf'),pagesize=(595,842),rightMargin=42,leftMargin=42,topMargin=42,bottomMargin=42).build(story)
import pypdfium2 as pdfium
for filename in ['professional-draft.pdf','documents/synthetic-statements.pdf']:
 doc=pdfium.PdfDocument(str(p/filename));page=doc[0];page.render(scale=1).to_pil().save('.tmp/financial-document-s1/'+('draft' if filename.startswith('professional') else 'source')+'-preview.png');print(filename,len(doc),'pages')
