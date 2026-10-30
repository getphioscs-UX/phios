from pathlib import Path
from PIL import Image,ImageDraw,ImageFont
import sys
sys.path.insert(0,str(Path('scripts/lib').resolve()))
from disk_space_guard import require_disk_space
require_disk_space('R611B small synthetic TOC test artwork only',10_000_000)
p=Path('.tmp/hd-r611b');p.mkdir(parents=True,exist_ok=True)
im=Image.new('RGB',(595,842),'white');d=ImageDraw.Draw(im);font=ImageFont.truetype('C:/Windows/Fonts/msyh.ttc',16)
d.text((35,30),'LOCAL MECHANICS FIXTURE / NOT R2 ARTWORK',font=font,fill='#203e49')
d.text((35,65),'No actual method contents or visual approval is claimed.',font=font,fill='#203e49')
for i in range(3):
 y=842-(.72-i*.16)*842;d.text((45,y-15),f'{i+1:02}  测试部分 / Diagnostic section {i+1}',font=font,fill='#203e49')
im.save(p/'synthetic-contents.png')
print('Synthetic blank-number-region PNG created; no R2 image substituted')
