// One timeline owns motion and sound. Random visual noise never determines a reading.
export const RITUAL_DURATION_MS=120000;
export function startRitual(host,{kind='tarot',zh=false}={}){
 const panel=document.createElement('section');panel.className='cx-ritual';
 panel.style.cssText='width:100%;box-sizing:border-box;padding:24px;background:#171d22;color:#f5e6b8;border-radius:16px;margin:20px 0';
 const canvas=document.createElement('canvas');canvas.width=1000;canvas.height=500;canvas.style.cssText='display:block;width:100%;height:auto';canvas.setAttribute('aria-hidden','true');
 const label=document.createElement('p');label.setAttribute('role','status');
 const progress=document.createElement('progress');progress.max=RITUAL_DURATION_MS;progress.style.width='100%';progress.setAttribute('aria-label',zh?'仪式进度':'Sequence progress');
 const cancel=document.createElement('button');cancel.type='button';cancel.textContent=zh?'取消本次过程':'Cancel this sequence';
 panel.append(label,canvas,progress,cancel);host.before(panel);
 const ctx=canvas.getContext('2d'),reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
 let audio,frame,ended=false,lastCue=-1,lastLabel='',resolveDone;
 const done=new Promise(resolve=>resolveDone=resolve);
 try{const Audio=globalThis.AudioContext||globalThis.webkitAudioContext;if(Audio){audio=new Audio();audio.resume().catch(()=>{});}}catch{}
 function cue(coin){
  if(!audio||audio.state!=='running')return;
  const now=audio.currentTime,gain=audio.createGain();gain.connect(audio.destination);gain.gain.setValueAtTime(.0001,now);gain.gain.exponentialRampToValueAtTime(coin ? .065 : .045,now+.006);gain.gain.exponentialRampToValueAtTime(.0001,now+.16);
  if(coin){const o=audio.createOscillator();o.type='triangle';o.frequency.setValueAtTime(1200,now);o.frequency.exponentialRampToValueAtTime(430,now+.14);o.connect(gain);o.start(now);o.stop(now+.17);}
  else{const b=audio.createBuffer(1,Math.ceil(audio.sampleRate*.17),audio.sampleRate),a=b.getChannelData(0);for(let i=0;i<a.length;i++)a[i]=Math.random()*2-1;const s=audio.createBufferSource(),f=audio.createBiquadFilter();s.buffer=b;f.type='bandpass';f.frequency.value=1800;s.connect(f).connect(gain);s.start(now);s.stop(now+.17);}
 }
 function stop(completed=false){if(ended)return;ended=true;cancelAnimationFrame(frame);if(audio&&audio.state!=='closed')audio.close().catch(()=>{});document.removeEventListener('visibilitychange',hidden);window.removeEventListener('pagehide',pagehide);panel.remove();resolveDone(completed);}
 function hidden(){if(document.hidden)stop(false);}
 // Explicit handlers avoid background audio and stale submissions after leaving a page.
 const pagehide=()=>stop(false);
 window.addEventListener('pagehide',pagehide,{once:true});document.addEventListener('visibilitychange',hidden);
 cancel.onclick=()=>stop(false);
 const start=performance.now();
 function tick(now){
  if(ended)return;const elapsed=Math.min(now-start,RITUAL_DURATION_MS),p=elapsed/RITUAL_DURATION_MS;progress.value=elapsed;
  ctx.clearRect(0,0,1000,500);ctx.fillStyle='#25302f';ctx.beginPath();ctx.ellipse(500,285,460,195,0,0,Math.PI*2);ctx.fill();
  const cycle=kind==='tarot'?8000:20000,phase=(elapsed%cycle)/cycle,round=Math.min(kind==='tarot'?14:5,Math.floor(elapsed/cycle));
  const phaseName=kind==='tarot'?(phase<.25?(zh?'分牌':'Cut'):phase<.65?(zh?'交错洗牌':'Interleave'):(zh?'收拢牌堆':'Gather')):(phase<.25?(zh?'聚拢铜钱':'Gather coins'):phase<.7?(zh?'抛掷铜钱':'Toss coins'):(zh?'落定':'Settle'));
  const text=(kind==='tarot'?(zh?'洗牌':'Shuffling'):(zh?'起卦 · 第 '+(round+1)+' 轮':'Casting · round '+(round+1)))+' · '+phaseName+' · '+Math.ceil((RITUAL_DURATION_MS-elapsed)/1000)+'s';
  if(text!==lastLabel){label.textContent=text;lastLabel=text;}
  if(kind==='tarot'){
   const split=phase<.25?phase/.25:phase<.65?1-(phase-.25)/.4:0;
   for(let i=0;i<32;i++){const side=i%2?1:-1,layer=Math.floor(i/2),wave=phase>.25&&phase<.65?Math.sin((phase-.25)/.4*Math.PI):0;
    const x=500+side*split*(reduced?70:235)+layer*1.5,y=270-layer*3-wave*(i%4)*9;
    ctx.save();ctx.translate(x,y);ctx.rotate(reduced?0:side*split*.24);ctx.fillStyle='#102332';ctx.strokeStyle='#c8a55c';ctx.lineWidth=2;ctx.fillRect(-49,-77,98,154);ctx.strokeRect(-46,-74,92,148);ctx.beginPath();ctx.ellipse(0,0,24,36,0,0,Math.PI*2);ctx.stroke();ctx.restore();}
   if(phase>.25&&phase<.65){const cueId=round*100+Math.floor(phase*40);if(cueId!==lastCue){cue(false);lastCue=cueId;}}
  }else{
   for(let i=0;i<3;i++){const flight=phase>.25&&phase<.7?Math.sin((phase-.25)/.45*Math.PI):0,x=380+i*120+(i-1)*flight*35,y=320-flight*(reduced?30:195),squash=flight?Math.max(.16,Math.abs(Math.cos(phase*45+i))):1;
    ctx.save();ctx.translate(x,y);ctx.scale(1,reduced?1:squash);ctx.fillStyle='#b68a40';ctx.strokeStyle='#f9dfa0';ctx.lineWidth=4;ctx.beginPath();ctx.arc(0,0,45,0,Math.PI*2);ctx.fill();ctx.stroke();ctx.fillStyle='#25302f';ctx.fillRect(-11,-11,22,22);ctx.restore();}
   if(phase>=.7&&lastCue!==round){cue(true);lastCue=round;}
   ctx.fillStyle='#f5e6b8';ctx.font='20px system-ui';ctx.textAlign='center';ctx.fillText(zh?'由下往上，依次形成六爻':'Six rounds, from the bottom line upward',500,455);
  }
  if(elapsed>=RITUAL_DURATION_MS){window.removeEventListener('pagehide',pagehide);stop(true);}else frame=requestAnimationFrame(tick);
 }
 frame=requestAnimationFrame(tick);
 return {done,stop:()=>{window.removeEventListener('pagehide',pagehide);stop(false);}};
}
