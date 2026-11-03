// This local-only research entry never appears on a remote customer host.
if(['127.0.0.1','localhost'].includes(location.hostname)){
 const section=document.createElement('section');section.className='cx-container';
 const h=document.createElement('h2');h.textContent='Tax readiness · 税务准备';
 const p=document.createElement('p');p.textContent='Synthetic local review only / 仅限本地合成审阅';
 const a=document.createElement('a');a.className='cx-button';a.href='/professional/financial/tax-review-r1.html';a.textContent='Open Tax R1 review / 打开税务审阅';
 section.append(h,p,a);document.querySelector('main')?.append(section);
}
