'use client';
import { Headphones, Pause, Play } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

export function AudioButton({ audioSrc }: { audioSrc?: string }) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const available = Boolean(audioSrc);
  useEffect(() => () => audioRef.current?.pause(), []);
  const toggle = async () => { const audio = audioRef.current; if (!audio || !available) return; if (audio.paused) await audio.play(); else audio.pause(); };
  return <>
    <button type="button" className="audio-button" onClick={toggle} disabled={!available} aria-label={available ? (playing ? 'Pausar audio de Germán' : 'Escuchar a Germán') : 'Escuchar a Germán, audio próximamente'} title={available ? undefined : 'Audio próximamente'}>
      <Headphones size={19} aria-hidden="true" /><span>Escuchar a Germán</span>{available && (playing ? <Pause size={17} aria-hidden="true" /> : <Play size={17} aria-hidden="true" />)}
    </button>
    {available && <audio ref={audioRef} src={audioSrc} preload="none" onPlay={() => setPlaying(true)} onPause={() => setPlaying(false)} onEnded={() => setPlaying(false)} />}
  </>;
}
