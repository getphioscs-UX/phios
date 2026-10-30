"""Content-addressed raster reuse: include every page resource, not only XRefs."""
import hashlib,json
from pypdf.generic import IndirectObject,StreamObject,DictionaryObject,ArrayObject,NullObject,BooleanObject
def page_appearance_fingerprints(reader):
 memo={};active=set()
 def digest(value):
  if isinstance(value,IndirectObject):
   key=(value.idnum,value.generation)
   if key in memo:return memo[key]
   if key in active:raise ValueError('Cyclic page resources cannot be cached')
   active.add(key);answer=digest(value.get_object());active.remove(key);memo[key]=answer;return answer
  if isinstance(value,StreamObject):
   item=['stream',hashlib.sha256(value.get_data()).hexdigest(),[(str(k),digest(v))for k,v in sorted(value.items(),key=lambda x:str(x[0]))if str(k)not in['/Length']]]
  elif isinstance(value,DictionaryObject):item=['dict',[(str(k),digest(v))for k,v in sorted(value.items(),key=lambda x:str(x[0]))]]
  elif isinstance(value,(ArrayObject,list,tuple)):item=['array',[digest(x)for x in value]]
  elif isinstance(value,bytes):item=['bytes',value.hex()]
  elif isinstance(value,NullObject):item=['null']
  elif isinstance(value,BooleanObject):item=['bool',value.value]
  else:item=[type(value).__name__,str(value)]
  return hashlib.sha256(json.dumps(item,ensure_ascii=False,separators=(',',':')).encode()).hexdigest()
 # Parent is the page tree, not page appearance. All inherited page properties
 # are resolved explicitly, including boxes, rotation, resources and contents.
 out=[]
 for page in reader.pages:
  data={str(k):v for k,v in page.items()if str(k)not in['/Parent']}
  data['/ResolvedMediaBox']=list(page.mediabox);data['/ResolvedCropBox']=list(page.cropbox);data['/ResolvedRotation']=page.rotation
  item=[(k,digest(v))for k,v in sorted(data.items())]
  out.append(hashlib.sha256(json.dumps(item,separators=(',',':')).encode()).hexdigest())
 return out
