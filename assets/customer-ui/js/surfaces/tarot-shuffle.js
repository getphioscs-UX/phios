// Procedural paper riffle: created only by the user's draw gesture, never autoplay.
export function shuffleSound(){
 const Audio=globalThis.AudioContext||globalThis.webkitAudioContext;
 if(!Audio)return ()=>{};
 let context;
 try {
  context=new Audio();
  context.resume().catch(()=>{});
  for(let i=0;i<18;i++){
   const buffer=context.createBuffer(1,Math.ceil(context.sampleRate*.045),context.sampleRate);
   const samples=buffer.getChannelData(0);
   for(let n=0;n<samples.length;n++)samples[n]=(Math.random()*2-1)*(1-n/samples.length);
   const source=context.createBufferSource(),filter=context.createBiquadFilter(),gain=context.createGain();
   source.buffer=buffer;filter.type='bandpass';filter.frequency.value=1600+i%3*450;gain.gain.value=.07;
   source.connect(filter).connect(gain).connect(context.destination);
   source.start(context.currentTime+.05+i*.075);
  }
 }catch {context?.close().catch(()=>{});}
 return ()=>{if(context&&context.state!=='closed')context.close().catch(()=>{});};
}
