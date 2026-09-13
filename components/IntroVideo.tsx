'use client';
import { ArrowRight } from 'lucide-react';
import { useEffect,useRef,useState } from 'react';

export function IntroVideo({onFinish}:{onFinish:()=>void}){
  const videoRef=useRef<HTMLVideoElement>(null);
  const [started,setStarted]=useState(false);
  const [ended,setEnded]=useState(false);

  useEffect(()=>{
    const video=videoRef.current;
    if(!video)return;
    video.load();
  },[]);

  const start=()=>{
    const video=videoRef.current;
    if(!video)return;
    video.muted=false;
    video.volume=1;
    void video.play().then(()=>setStarted(true)).catch(()=>{});
  };

  return <div className="video-intro">
    <video ref={videoRef} className="video-intro-video" src="/videos/video-german-white.mp4?v=4" preload="auto" playsInline onEnded={()=>setEnded(true)} aria-label="Presentación de Germán Asistente" />
    {!started&&<button className="video-intro-enter" onClick={start}>Empezar <ArrowRight size={19}/></button>}
    {ended&&<button className="video-intro-enter" onClick={onFinish}>Ingresar <ArrowRight size={19}/></button>}
  </div>;
}
