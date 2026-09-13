'use client';
import {useState} from 'react';import {IntroVideo} from '@/components/IntroVideo';import {PreparationIntro} from '@/components/PreparationIntro';import {Assessment} from '@/components/Assessment';
type Stage='video'|'intro'|'assessment';export default function Page(){const [stage,setStage]=useState<Stage>('video');return <div className="app-shell">{stage==='video'&&<IntroVideo onFinish={()=>setStage('intro')}/>} {stage==='intro'&&<PreparationIntro onStart={()=>setStage('assessment')}/>} {stage==='assessment'&&<Assessment/>}</div>}
