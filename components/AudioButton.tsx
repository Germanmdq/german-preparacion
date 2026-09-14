'use client';
import { Pause, Play } from 'lucide-react';
import { useEffect, useState } from 'react';
import { VoiceAura } from './VoiceAura';

export function AudioButton({ audioSrc }: { audioSrc?: string }) {
  const [audio, setAudio] = useState<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const available = Boolean(audioSrc);
  useEffect(() => () => audio?.pause(), [audio]);
  const updateProgress = () => setProgress(audio && Number.isFinite(audio.duration) && audio.duration > 0 ? Math.min(1, audio.currentTime / audio.duration) : 0);
  const toggle = async () => { if (!audio || !available) return; if (audio.paused) await audio.play(); else audio.pause(); };
  return <div className="result-audio-player">
    <VoiceAura audio={audio} standalone={false}/>
    <audio ref={setAudio} src={audioSrc} preload="metadata" playsInline onPlay={() => setPlaying(true)} onPause={() => setPlaying(false)} onEnded={() => {setPlaying(false);setProgress(1)}} onTimeUpdate={updateProgress} onLoadedMetadata={updateProgress}/>
    <button type="button" className="result-audio-toggle" onClick={toggle} disabled={!available} aria-label={playing ? 'Pausar resultado en audio' : 'Reproducir resultado en audio'}>{playing ? <Pause size={26} fill="currentColor"/> : <Play size={28} fill="currentColor"/>}</button>
    <div className="result-audio-progress" role="progressbar" aria-label="Progreso del resultado en audio" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(progress*100)}><i style={{transform:`scaleX(${progress})`}}/></div>
  </div>;
}
