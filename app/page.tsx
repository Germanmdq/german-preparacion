'use client';
import { useEffect, useRef, useState } from 'react';
import { onAuthStateChanged, getRedirectResult, User } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { IntroVideo } from '@/components/IntroVideo';
import { PreparationIntro } from '@/components/PreparationIntro';
import { AuthScreen } from '@/components/AuthScreen';
import { Assessment } from '@/components/Assessment';

type Stage = 'video' | 'intro' | 'auth' | 'assessment';
export default function Page() {
  const [stage, setStage] = useState<Stage>('video');
  const [user, setUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const presentationRef = useRef<HTMLAudioElement | null>(null);
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, current => { setUser(current); setAuthReady(true); });
    void getRedirectResult(auth).catch(() => undefined);
    return unsubscribe;
  }, []);
  const enter = () => { const audio = new Audio('/audio/presentation.mp3'); audio.preload='auto'; presentationRef.current=audio; void audio.play().catch(()=>{}); setStage('intro'); };
  const afterPresentation = () => setStage(user ? 'assessment' : 'auth');
  if (!authReady) return <div className="app-shell" />;
  return <div className="app-shell">{stage==='video'&&<IntroVideo onFinish={enter}/>} {stage==='intro'&&<PreparationIntro audio={presentationRef.current} onStart={afterPresentation}/>} {stage==='auth'&&<AuthScreen onAuthenticated={()=>setStage('assessment')}/>} {stage==='assessment'&&<Assessment/>}</div>;
}
