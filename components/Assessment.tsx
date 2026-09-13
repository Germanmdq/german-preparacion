'use client';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { questions } from '@/data/questions';
import { buildResult } from '@/lib/assessment/result';
import { assessmentStorage, createSession, type AssessmentSession } from '@/lib/storage/assessment-storage';
import { Progress } from './Progress';
import { QuestionCard } from './QuestionCard';
import { AssessmentResult } from './AssessmentResult';

export function Assessment(){
 const [session,setSession]=useState<AssessmentSession|null>(null);const [index,setIndex]=useState(0);const [analyzing,setAnalyzing]=useState(false);const lock=useRef(false);
 useEffect(()=>{const loaded=assessmentStorage.load();setSession(loaded?{...loaded,audioPlayEvents:loaded.audioPlayEvents??[]}:createSession())},[]);
 useEffect(()=>{if(session)assessmentStorage.save(session)},[session]);
 if(!session)return null;
 if(session.completedAt&&session.scores)return <AssessmentResult result={buildResult(questions,session.answers)} onRestart={()=>{const fresh=createSession();assessmentStorage.save(fresh);setSession(fresh);setIndex(0)}}/>;
 if(analyzing)return <main className="screen analysis-screen"><section className="content-card"><div className="analysis-pulse"/><p className="eyebrow">LISTO</p><h1>Estoy cruzando tus respuestas.</h1><p className="lead">Busco dónde aparece el patrón más fuerte.</p></section></main>;
 const question=questions[index];const selected=session.answers[question.id];
 const select=(id:string)=>setSession(current=>current?{...current,answers:{...current.answers,[question.id]:id}}:current);
 const recordPlay=(optionId:string)=>setSession(current=>current?{...current,audioPlayEvents:[...current.audioPlayEvents,{questionId:question.id,optionId,playedAt:new Date().toISOString(),order:current.audioPlayEvents.length+1}]}:current);
 const next=()=>{if(!selected||lock.current)return;lock.current=true;if(index<questions.length-1){setIndex(value=>value+1);requestAnimationFrame(()=>{lock.current=false})}else{const result=buildResult(questions,session.answers);setAnalyzing(true);setTimeout(()=>{const done={...session,completedAt:new Date().toISOString(),scores:result.scores,primaryPattern:result.primaryPattern,secondaryPattern:result.secondaryPattern};assessmentStorage.save(done);setSession(done);setAnalyzing(false);lock.current=false},1200)}};
 return <main className="screen assessment-screen"><section className="assessment-inner"><Progress current={index+1} total={questions.length}/><div key={question.id} className="question-transition"><QuestionCard question={question} value={selected} onChange={select} onAudioPlay={recordPlay}/></div><div className="assessment-actions"><button className="btn-back" onClick={()=>setIndex(value=>Math.max(0,value-1))} disabled={index===0}><ArrowLeft size={19}/> Volver</button><button className="btn-primary" onClick={next} disabled={!selected}>Continuar <ArrowRight size={19}/></button></div></section></main>
}
