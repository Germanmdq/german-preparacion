'use client';
import { useEffect, useRef } from 'react';

export function VoiceAura({src='/audio/presentation.mp3',audio:externalAudio,onEnded}:{src?:string;audio?:HTMLAudioElement|null;onEnded?:()=>void}){
  const audioRef=useRef<HTMLAudioElement>(null);
  const canvasRef=useRef<HTMLCanvasElement>(null);
  useEffect(()=>{
    const audio=externalAudio??audioRef.current, canvas=canvasRef.current;
    if(!audio||!canvas)return;
    let ac:AudioContext|null=null, analyser:AnalyserNode|null=null, source:MediaElementAudioSourceNode|null=null, raf=0;
    let data:Uint8Array<ArrayBuffer>|null=null;
    const draw=()=>{
      const c=canvas.getContext('2d'); if(!c)return;
      const dpr=window.devicePixelRatio||1,w=canvas.clientWidth,h=canvas.clientHeight;
      if(canvas.width!==Math.round(w*dpr)||canvas.height!==Math.round(h*dpr)){canvas.width=Math.round(w*dpr);canvas.height=Math.round(h*dpr)}
      c.setTransform(dpr,0,0,dpr,0,0);c.clearRect(0,0,w,h);
      if(!analyser||!data){raf=requestAnimationFrame(draw);return}
      analyser.getByteFrequencyData(data);
      const bars=42,gap=3,bw=(w-gap*(bars-1))/bars;
      for(let i=0;i<bars;i++){
        const idx=Math.floor((i/(bars-1))*Math.min(data.length-1,80));
        const level=data[idx]/255;
        const bh=Math.max(4,level*h*.9),x=i*(bw+gap),y=(h-bh)/2;
        const g=c.createLinearGradient(0,y,0,y+bh);g.addColorStop(0,'#ef6268');g.addColorStop(.5,'#d92d35');g.addColorStop(1,'#b91f28');
        c.fillStyle=g;c.beginPath();c.roundRect(x,y,bw,bh,bw/2);c.fill();
      }
      raf=requestAnimationFrame(draw);
    };
    const setup=async()=>{
      if(!ac){ac=new AudioContext();analyser=ac.createAnalyser();analyser.fftSize=256;analyser.smoothingTimeConstant=.7;source=ac.createMediaElementSource(audio);source.connect(analyser);analyser.connect(ac.destination);data=new Uint8Array(analyser.frequencyBinCount);draw()}
      if(ac.state==='suspended')await ac.resume();
    };
    const play=()=>{void setup()}; const ended=()=>onEnded?.();
    audio.addEventListener('play',play);audio.addEventListener('playing',play);audio.addEventListener('ended',ended);void setup();
    return()=>{cancelAnimationFrame(raf);audio.removeEventListener('play',play);audio.removeEventListener('playing',play);audio.removeEventListener('ended',ended);source?.disconnect();analyser?.disconnect();void ac?.close()};
  },[externalAudio,onEnded]);
  return <div className="voice-aura-wrap" aria-label="Presentación en audio"><canvas ref={canvasRef} className="voice-live-wave" aria-hidden="true"/>{!externalAudio&&<audio ref={audioRef} src={src} autoPlay preload="auto" playsInline/>}</div>;
}
