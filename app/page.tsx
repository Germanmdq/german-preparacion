'use client';
import { useEffect, useRef, useState } from 'react';
import { onAuthStateChanged, getRedirectResult, signOut, User } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { assessmentStorage } from '@/lib/storage/assessment-storage';
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
  const enter = () => {
    const audio = presentationRef.current;
    if (!audio) return;
    audio.src = '/audio/presentation.mp3';
    audio.load();
    void audio.play().catch(() => undefined);
    setStage('intro');
  };
  const afterPresentation = () => setStage(user ? 'assessment' : 'auth');
  const logout = async () => {
    const uid = user?.uid;
    await signOut(auth);
    if (uid) assessmentStorage.clear(uid);
    setStage('auth');
  };
  if (!authReady) return <div className="app-shell" />;
  return <div className="app-shell"><audio ref={presentationRef} className="presentation-audio" preload="auto" playsInline />{stage==='video'&&<IntroVideo onFinish={enter}/>} {stage==='intro'&&<PreparationIntro audio={presentationRef.current} onStart={afterPresentation}/>} {stage==='auth'&&<AuthScreen onAuthenticated={()=>setStage('assessment')}/>} {stage==='assessment'&&user&&<Assessment key={user.uid} user={user} onLogout={logout}/>}</div>;
}
