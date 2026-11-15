let available=false,checked=false;
function render(){
 for(const n of document.querySelectorAll('a[href="/perspectives/iching/"] [data-pis-copy]')){
  const en=available?'I Ching · readings available':checked?'I Ching · guide available; readings unavailable':'I Ching · check reading availability';
  const zh=available?'易经 · 读取可用':checked?'易经 · 可读说明；读取暂不可用':'易经 · 查看读取状态';
  n.dataset.cxEn=en;n.dataset.cxZh=zh;n.textContent=document.documentElement.lang.startsWith('zh')?zh:en;
 }
 const note=document.querySelector('[data-symbolic-directory-status]');if(note){note.dataset.cxEn=available?'I Ching readings are available. Your question and cast are not saved automatically. Saving follows its separate availability and consent requirements.':'Read the I Ching method guide and check current reading availability on its page.';note.dataset.cxZh=available?'易经读取可用，不会自动保存问题与卦局。保存操作须另行满足可用状态与同意条件。':'可阅读易经方法说明，并在对应页面查看当前读取状态。';note.textContent=document.documentElement.lang.startsWith('zh')?note.dataset.cxZh:note.dataset.cxEn;}
}
render();new MutationObserver(render).observe(document.documentElement,{attributes:true,attributeFilter:['lang']});
fetch('/api/iching-full-production-status',{cache:'no-store',signal:AbortSignal.timeout(8000)}).then(r=>r.ok?r.json():null).then(v=>{available=v?.service?.execution?.allowed===true;checked=true;render();}).catch(()=>{checked=true;render();});
