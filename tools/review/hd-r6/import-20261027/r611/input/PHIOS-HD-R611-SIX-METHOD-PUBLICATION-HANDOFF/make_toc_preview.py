#!/usr/bin/env python3
"""PHI OS HD R6.11: owner-only demo of a fixed TOC with post-pagination numerals.

NOT a production renderer. In production, preserve the exact R2 asset/renderer owners,
compose full document first, then stamp one-based final physical page indices and links.
No image bytes from the user-specified front matter are bundled here.
"""
from __future__ import annotations
import json, argparse, io
from pathlib import Path
from reportlab.pdfgen import canvas
from reportlab.lib.colors import HexColor, Color
from reportlab.lib.pagesizes import A4
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.cidfonts import UnicodeCIDFont
from reportlab.lib.utils import ImageReader

ROOT=Path(__file__).resolve().parent
CONFIG=json.loads((ROOT/'HD-TOC-CONTRACT.json').read_text('utf-8'))
pdfmetrics.registerFont(UnicodeCIDFont('STSong-Light'))
W,H=A4
TEAL=HexColor('#18565E'); PALE=HexColor('#FAF9F5'); GOLD=HexColor('#C6AA72'); MUTED=HexColor('#5D7478')

def row_y(i:int): return 675-i*31.0

def display(c,locale,background=None,page_map=None, sample=False):
    if background and Path(background).exists():
        c.drawImage(ImageReader(str(background)),0,0,width=W,height=H)
    else:
        c.setFillColor(PALE);c.rect(0,0,W,H,fill=1,stroke=0)
    c.saveState()
    c.setFillColor(Color(0.995,0.992,0.981, alpha=0.985))
    c.setStrokeColor(GOLD)
    c.setLineWidth(.6)
    c.roundRect(37,42,W-74,H-85,12,fill=1,stroke=1)
    c.restoreState()
    c.setFillColor(GOLD);c.setFont('Helvetica',8.5)
    c.drawString(65,762,'PHI OS   /   HUMAN DESIGN')
    c.setStrokeColor(GOLD);c.setLineWidth(.7);c.line(66,747,W-67,747)
    c.setFillColor(TEAL)
    if locale=='en':
        c.setFont('Times-Roman',25);c.drawString(65,711,'Contents')
    else:
        c.setFont('STSong-Light',24);c.drawString(65,711,'目录')
        c.setFont('Times-Roman',18);c.drawString(125,714,'/ Contents')
    c.setFillColor(MUTED);c.setFont('Helvetica',8.2)
    c.drawRightString(W-72,716,'17 SECTIONS')
    c.setStrokeColor(GOLD);c.setLineWidth(.5);c.line(65,697,W-65,697)
    for i,entry in enumerate(CONFIG['section_titles']):
        y=row_y(i)
        c.setFillColor(GOLD);c.setFont('Helvetica-Bold',9.6);c.drawString(67,y,f'{i+1:02d}')
        c.setFillColor(TEAL)
        x=102
        if locale=='zh-Hans':
            c.setFont('STSong-Light',11.7);c.drawString(x,y,entry['zh-Hans'])
            label_width=pdfmetrics.stringWidth(entry['zh-Hans'],'STSong-Light',11.7)
        elif locale=='en':
            fsize=10.7 if len(entry['en'])<30 else 10.0
            c.setFont('Helvetica',fsize);c.drawString(x,y,entry['en'])
            label_width=pdfmetrics.stringWidth(entry['en'],'Helvetica',fsize)
        else:
            c.setFont('STSong-Light',11.2);c.drawString(x,y+4.5,entry['zh-Hans'])
            c.setFont('Helvetica',8.3);c.setFillColor(MUTED);c.drawString(x,y-8.5,entry['en'])
            label_width=max(pdfmetrics.stringWidth(entry['zh-Hans'],'STSong-Light',11.2),pdfmetrics.stringWidth(entry['en'],'Helvetica',8.3))
        c.setStrokeColor(GOLD);c.setLineWidth(.35)
        leader_x=min(465,x+label_width+18)
        if leader_x < 490:
            c.setDash(1,4);c.line(leader_x,y-2.3,489,y-2.3);c.setDash()
        if page_map is not None:
            n=page_map.get(entry['id'])
            if isinstance(n,int):
                c.setFillColor(TEAL);c.setFont('Helvetica-Bold',10.8)
                c.drawRightString(W-70,y,f'{n:02d}')
        c.setStrokeColor(HexColor('#EEE5D7'));c.setLineWidth(.27)
        c.line(66,y-14,W-66,y-14)
    if sample:
        c.setFillColor(HexColor('#A36955'));c.setFont('Helvetica',7.2)
        c.drawCentredString(W/2,75,'ILLUSTRATION ONLY  •  FINAL PAGE NUMBERS MUST COME FROM THE RENDERED PDF')
    c.setFillColor(MUTED);c.setFont('Helvetica',8)
    c.drawCentredString(W/2,61, 'PHI OS  •  HUMAN DESIGN')
    c.showPage()

def validate_map(page_map):
    expected=[x['id'] for x in CONFIG['section_titles']]
    if set(page_map)!=set(expected): raise ValueError('Final page map must contain exactly SEC01–SEC17')
    nums=[page_map[x] for x in expected]
    if not all(isinstance(n,int) and n>0 for n in nums):raise ValueError('Invalid section pages')
    if not all(a<b for a,b in zip(nums,nums[1:])):raise ValueError('Section starts must strictly increase')

if __name__=='__main__':
    a=argparse.ArgumentParser(); a.add_argument('--background',default=None)
    a.add_argument('--out',default=str(ROOT/'HD-R611-TOC-SEMIFIXED-PREVIEW.pdf'))
    a.add_argument('--page-map-json',default=None)
    a.add_argument('--single-locale',choices=['zh-Hans','en','bilingual'])
    args=a.parse_args()
    page_map=None
    if args.page_map_json:
        page_map=json.loads(Path(args.page_map_json).read_text('utf-8'))
        validate_map(page_map)
    c=canvas.Canvas(args.out,pagesize=A4,pageCompression=1)
    c.setAuthor('PHI OS · private design review')
    c.setTitle('HD R6.11 | Semi-fixed Table of Contents | owner preview')
    for loc in ([args.single_locale] if args.single_locale else ['zh-Hans','en','bilingual']):
        display(c,loc,args.background,page_map,sample=bool(page_map))
    c.save();print('Created',args.out)
