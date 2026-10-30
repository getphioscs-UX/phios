"""Shared placement policy for existing PDF composition owners; no content engine."""
from PIL import Image,ImageFilter
import math
MODES={'FULL_BLEED_SAFE_COVER','FULL_BLEED_SAFE_EXTEND','CONTAIN','EXPLICIT_BACKGROUND_LAYOUT'}
def plan_background(source_size,page_size,mode,*,main_box=None,safe_crop=None,contain_approved=False,explicit_box=None):
 if mode not in MODES:raise ValueError('BACKGROUND_MODE_REQUIRED')
 sw,sh=map(float,source_size);W,H=map(float,page_size)
 if min(sw,sh,W,H)<=0 or not all(math.isfinite(x) for x in [sw,sh,W,H]):raise ValueError('BACKGROUND_GEOMETRY_INVALID')
 if mode=='CONTAIN' and not contain_approved:raise ValueError('INTENTIONAL_CONTAIN_APPROVAL_REQUIRED')
 if mode=='EXPLICIT_BACKGROUND_LAYOUT':
  if explicit_box is None:raise ValueError('EXPLICIT_BACKGROUND_GEOMETRY_REQUIRED')
  box=list(map(float,explicit_box))
 elif mode=='FULL_BLEED_SAFE_COVER':
  if safe_crop is None:raise ValueError('APPROVED_SAFE_CROP_REQUIRED')
  scale=max(W/sw,H/sh);w,h=sw*scale,sh*scale;box=[(W-w)/2,(H-h)/2,(W+w)/2,(H+h)/2]
  visible=[-box[0]/w,-box[1]/h,(W-box[0])/w,(H-box[1])/h]
  if any(not math.isfinite(float(x)) for x in safe_crop) or len(safe_crop)!=4:raise ValueError('SAFE_CROP_INVALID')
  # Meaningful content rectangle must be entirely visible after cover.
  if not(visible[0]<=safe_crop[0]<safe_crop[2]<=visible[2] and visible[1]<=safe_crop[1]<safe_crop[3]<=visible[3]):raise ValueError('MEANINGFUL_CONTENT_WOULD_BE_CROPPED')
 else:
  scale=min(W/sw,H/sh);w,h=sw*scale,sh*scale;box=list(map(float,main_box)) if main_box is not None else [(W-w)/2,(H-h)/2,(W+w)/2,(H+h)/2]
 if len(box)!=4 or not all(math.isfinite(x) for x in box) or box[2]<=box[0] or box[3]<=box[1]:raise ValueError('BACKGROUND_BOX_INVALID')
 strips=[]
 if mode=='FULL_BLEED_SAFE_EXTEND':
  x0,y0,x1,y1=box
  if x0<-.6 or y0<-.6 or x1>W+.6 or y1>H+.6:raise ValueError('EXTEND_MUST_PRESERVE_CONTAINED_SOURCE')
  if H-y1>.01:strips.append({'side':'top','box':[0,y1,W,H]})
  if y0>.01:strips.append({'side':'bottom','box':[0,0,W,y0]})
  if x0>.01:strips.append({'side':'left','box':[0,max(0,y0),x0,min(H,y1)]})
  if W-x1>.01:strips.append({'side':'right','box':[x1,max(0,y0),W,min(H,y1)]})
 return {'mode':mode,'mainBox':box,'sourceSize':[sw,sh],'pageSize':[W,H],'strips':strips,'mainArtworkCropped':False if mode!='FULL_BLEED_SAFE_COVER' else True,'newMainArtworkStretch':False,'changesTextGeometry':False}

def make_edge_extension(image,side,size):
 """Extend only boundary colour, never reflect titles/logos/whole illustrations.
 Boundary-adjacent pixels follow the exact existing JPEG edge; farther pixels
 transition to a horizontally/vertically smoothed edge profile. No solid fill.
 """
 im=image.convert('RGB');W,H=map(int,size)
 if W<1 or H<1 or side not in {'top','bottom','left','right'}:raise ValueError('EDGE_EXTENSION_INVALID')
 horizontal=side in {'top','bottom'}
 if horizontal:
  edge=im.crop((0,0,im.width,1) if side=='top' else (0,im.height-1,im.width,im.height)).resize((W,1));blur=edge.resize((W,5)).filter(ImageFilter.GaussianBlur(max(2,W/4))).resize((W,1));a=list(edge.getdata());b=list(blur.getdata());out=Image.new('RGB',(W,H));pixels=[]
  for y in range(H):
   t=(1-y/max(1,H-1)) if side=='top' else y/max(1,H-1);t=math.sin(min(1,t/.45)*math.pi/2)**2
   pixels.extend(tuple(round(v*(1-t)+z*t) for v,z in zip(p,q)) for p,q in zip(a,b))
 else:
  edge=im.crop((0,0,1,im.height) if side=='left' else (im.width-1,0,im.width,im.height)).resize((1,H));blur=edge.resize((5,H)).filter(ImageFilter.GaussianBlur(max(2,H/4))).resize((1,H));a=list(edge.getdata());b=list(blur.getdata());out=Image.new('RGB',(W,H));pixels=[]
  for y in range(H):
   for x in range(W):
    t=(1-x/max(1,W-1)) if side=='left' else x/max(1,W-1);t=math.sin(min(1,t/.45)*math.pi/2)**2;pixels.append(tuple(round(v*(1-t)+z*t) for v,z in zip(a[y],b[y])))
 out.putdata(pixels);return out


def extend_pdf_page_background(writer,page_index,source_image,placement,quality=87):
 """Existing pypdf composition adapter; original art/text streams stay exact.
 Isolate the original root CTM before adding absolute PDF-point gap layers.
 """
 import io,hashlib
 from pypdf.generic import NameObject,NumberObject,DictionaryObject,ArrayObject,DecodedStreamObject,StreamObject
 if placement['mode']!='FULL_BLEED_SAFE_EXTEND' or quality!=87:raise ValueError('REVIEWED_EDGE_EXTENSION_Q87_REQUIRED')
 page=writer.pages[page_index];res=DictionaryObject(dict(page['/Resources']));xobj=DictionaryObject(dict(res.get('/XObject',{})));res[NameObject('/XObject')]=xobj;page[NameObject('/Resources')]=res;commands=[];proof=[]
 for i,item in enumerate(placement['strips']):
  x0,y0,x1,y1=item['box'];size=(max(1,math.ceil((x1-x0)*2)),max(1,math.ceil((y1-y0)*2)));strip=make_edge_extension(source_image,item['side'],size);buf=io.BytesIO();strip.save(buf,format='JPEG',quality=quality,subsampling=0,optimize=True);data=buf.getvalue();obj=StreamObject();obj._data=data;obj.update({NameObject('/Type'):NameObject('/XObject'),NameObject('/Subtype'):NameObject('/Image'),NameObject('/Width'):NumberObject(size[0]),NameObject('/Height'):NumberObject(size[1]),NameObject('/BitsPerComponent'):NumberObject(8),NameObject('/ColorSpace'):NameObject('/DeviceRGB'),NameObject('/Filter'):NameObject('/DCTDecode')});name=NameObject('/PHIOSBleed'+str(i));xobj[name]=writer._add_object(obj);commands.append(f'q\n{x1-x0:.12f} 0 0 {y1-y0:.12f} {x0:.12f} {y0:.12f} cm\n{name} Do\nQ\n');proof.append({'side':item['side'],'box':item['box'],'derivedPixels':list(size),'jpegQuality':quality,'sampling':'4:4:4','sourceMainUnchanged':True,'derivedEdgeOnly':True,'encodedSHA256':hashlib.sha256(data).hexdigest()})
 stream=DecodedStreamObject();stream.set_data(''.join(commands).encode('ascii'));prior=page.raw_get('/Contents');original=list(prior.get_object()) if isinstance(prior.get_object(),ArrayObject) else [prior];prefix=DecodedStreamObject();prefix.set_data(b'q\n');suffix=DecodedStreamObject();suffix.set_data(b'Q\n');page[NameObject('/Contents')]=ArrayObject([writer._add_object(prefix),*original,writer._add_object(suffix),writer._add_object(stream)])
 return proof
