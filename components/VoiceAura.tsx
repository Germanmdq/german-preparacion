'use client';
import { useEffect, useRef } from 'react';

// Visualizador deliberadamente desacoplado del audio. No usamos Web Audio API:
// en iOS un MediaElement conectado a AudioContext puede suspenderse al bloquear
// la pantalla. El HTMLAudioElement queda nativo para permitir reproducción en background.
export function VoiceAura({src='/audio/presentation.mp3',audio:externalAudio,onEnded}:{src?:string;audio?:HTMLAudioElement|null;onEnded?:()=>void}){
  const audioRef=useRef<HTMLAudioElement>(null);
  const canvasRef=useRef<HTMLCanvasElement>(null);
  useEffect(()=>{
    const audio=externalAudio??audioRef.current, canvas=canvasRef.current;
    if(!audio||!canvas)return;
    let raf=0;
    const draw=()=>{
      const c=canvas.getContext('2d'); if(!c)return;
      const dpr=window.devicePixelRatio||1,w=canvas.clientWidth,h=canvas.clientHeight;
      if(canvas.width!==Math.round(w*dpr)||canvas.height!==Math.round(h*dpr)){canvas.width=Math.round(w*dpr);canvas.height=Math.round(h*dpr)}
      c.setTransform(dpr,0,0,dpr,0,0);c.clearRect(0,0,w,h);
      const bars=42,gap=3,bw=(w-gap*(bars-1))/bars;
      const playing=!audio.paused&&!audio.ended;
      const t=audio.currentTime||0;
      for(let i=0;i<bars;i++){
        const wave=playing ? (.18+.48*Math.abs(Math.sin(t*5.2+i*.61))+.16*Math.abs(Math.sin(t*2.1+i*1.17))) : .08;
        const bh=Math.max(4,Math.min(.9,wave)*h),x=i*(bw+gap),y=(h-bh)/2;
        const g=c.createLinearGradient(0,y,0,y+bh);g.addColorStop(0,'#ef6268');g.addColorStop(.5,'#d92d35');g.addColorStop(1,'#b91f28');
        c.fillStyle=g;c.beginPath();c.roundRect(x,y,bw,bh,bw/2);c.fill();
      }
      raf=requestAnimationFrame(draw);
    };
    const ended=()=>onEnded?.();
    audio.addEventListener('ended',ended);draw();
    return()=>{cancelAnimationFrame(raf);audio.removeEventListener('ended',ended)};
  },[externalAudio,onEnded]);
  return <div className="voice-aura-wrap" aria-label="Presentación en audio"><canvas ref={canvasRef} className="voice-live-wave" aria-hidden="true"/>{!externalAudio&&<audio ref={audioRef} src={src} autoPlay preload="auto" playsInline/>}</div>;
}
