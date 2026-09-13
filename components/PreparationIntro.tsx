'use client';

import { ArrowRight } from 'lucide-react';
import { useCallback, useState } from 'react';
import { VoiceAura } from './VoiceAura';

export function PreparationIntro({onStart,audio}:{onStart:()=>void;audio?:HTMLAudioElement|null}) {
  const [finished, setFinished] = useState(false);
  const onAudioEnded = useCallback(() => setFinished(true), []);
  return <main className="screen intro-screen audio-intro-screen">
    <section className="audio-intro-card">
      <VoiceAura audio={audio} onEnded={onAudioEnded}/>
      {finished && <button className="btn-primary audio-intro-enter" onClick={onStart}>Empezar <ArrowRight size={20}/></button>}
    </section>
  </main>;
}
