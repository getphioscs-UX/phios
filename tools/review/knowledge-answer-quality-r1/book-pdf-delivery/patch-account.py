from pathlib import Path
p=Path('assets/customer-ui/js/surfaces/commerce-account.js');s=p.read_bytes().decode()
old="${t('Download','下载')}</button>"
new="${t('Download full PDF','下载完整 PDF')}</button>"
assert s.count(old)==1;s=s.replace(old,new)
old="root.querySelector('[data-product-note]').textContent=p.productId.includes('BUNDLE')?"
new="root.querySelector('[data-product-note]').textContent=p.deliveryFormat==='FULL_PDF_DOWNLOAD'?t('RM89 for this book and language only. Full purchaser-watermarked PDF in My Books; verified re-downloads are allowed. The other language is sold separately. Whole-book web reading is a later extra.','RM89 仅购买本册所选语言。个人书库提供完整购买者水印 PDF，并允许验证权益后重新下载。另一语言单独购买；网站整本阅读为后续增值功能。'):p.productId.includes('BUNDLE')?"
assert s.count(old)==1;s=s.replace(old,new)
old="<h3>${category==='BOOK'?t('My Books','我的书籍')"
if old in s:s=s.replace(old,"<h3>${category==='BOOK'?t('My Books · PDF library','个人书库 · PDF 下载')")
old="${['BOOK','REPORT','MEMBERSHIP','HUMAN_SERVICE'].map"
# Keep existing account structure; no new library or storage owner.
p.write_bytes(s.encode())
p=Path('assets/customer-ui/js/surfaces/commerce-product-visuals.js');s=p.read_bytes().decode();old="entries.find(e=>e.productId===id)";assert s.count(old)==1;s=s.replace(old,"entries.find(e=>e.productId===id)||entries.find(e=>e.productId===String(id).replace(/-(ZH|EN)$/,''))");p.write_bytes(s.encode())
