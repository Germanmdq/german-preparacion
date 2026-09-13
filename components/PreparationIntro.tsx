'use client';

import { ArrowRight, Volume2 } from 'lucide-react';
import { useEffect, useState } from 'react';

export function PreparationIntro({onStart,audio}:{onStart:()=>void;audio?:HTMLAudioElement|null}) {
  const [finished, setFinished] = useState(false);
  const [progress, setProgress] = useState(0);
  useEffect(() => {
    if (!audio) return;
    const updateProgress = () => {
      const duration = audio.duration;
      setProgress(Number.isFinite(duration) && duration > 0 ? Math.min(1, audio.currentTime / duration) : 0);
    };
    const complete = () => { setProgress(1); setFinished(true); };
    audio.addEventListener('timeupdate', updateProgress);
    audio.addEventListener('loadedmetadata', updateProgress);
    audio.addEventListener('durationchange', updateProgress);
    audio.addEventListener('ended', complete);
    updateProgress();
    return () => {
      audio.removeEventListener('timeupdate', updateProgress);
      audio.removeEventListener('loadedmetadata', updateProgress);
      audio.removeEventListener('durationchange', updateProgress);
      audio.removeEventListener('ended', complete);
    };
  }, [audio]);
  return <main className="screen intro-screen audio-intro-screen">
    <section className="audio-intro-card">
      <div className="audio-intro-panel">
        <div className="audio-static-wave" aria-label="Presentación en audio" role="img">{[28, 48, 72, 40, 88, 58, 34, 64, 94, 52, 76, 42, 66, 90, 54, 35, 70, 48, 82, 60, 38, 74, 52, 92, 44, 68, 36, 58, 80, 46, 64, 32].map((height, index) => <span key={index} style={{height: `${height}%`}} />)}</div>
        {!finished && <div className="audio-guidance" aria-live="polite"><p>Presentación en audio</p><span><Volume2 size={13} aria-hidden="true"/> Subí el volumen para escucharme mejor</span></div>}
        <div className="audio-progress" role="progressbar" aria-label="Progreso del mensaje de audio" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(progress * 100)}><i style={{width:`${progress * 100}%`}} /></div>
      </div>
      {finished && <button className="btn-primary audio-intro-enter" onClick={onStart}>Ingresar <ArrowRight size={20}/></button>}
    </section>
  </main>;
}
