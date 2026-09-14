'use client';

import { useRef, useState } from 'react';
import { IntroVideo } from '@/components/IntroVideo';
import { PreparationIntro } from '@/components/PreparationIntro';
import { Assessment } from '@/components/Assessment';

type Stage = 'video' | 'intro' | 'assessment';

export default function Page() {
  const [stage, setStage] = useState<Stage>('video');
  const presentationRef = useRef<HTMLAudioElement | null>(null);

  const enter = () => {
    const audio = presentationRef.current;
    if (!audio) return;
    audio.src = '/audio/presentation.mp3';
    audio.load();
    void audio.play().catch(() => undefined);
    setStage('intro');
  };

  return <div className="app-shell"><audio ref={presentationRef} className="presentation-audio" preload="auto" playsInline />{stage === 'video' && <IntroVideo onFinish={enter}/>} {stage === 'intro' && <PreparationIntro audio={presentationRef.current} onStart={() => setStage('assessment')}/>} {stage === 'assessment' && <Assessment/>}</div>;
}
