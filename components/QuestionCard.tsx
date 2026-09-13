'use client';
import { Pause, Play } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import type { Question, QuestionOption } from '@/data/questions';

const formatTime=(seconds:number)=>!Number.isFinite(seconds)||seconds<=0?'--:--':`${Math.floor(seconds/60)}:${String(Math.floor(seconds%60)).padStart(2,'0')}`;

function AudioOption({option,selected,playing,onSelect,onPlay}:{option:QuestionOption;selected:boolean;playing:boolean;onSelect:()=>void;onPlay:()=>void}){
 const audio=useRef<HTMLAudioElement>(null);const [current,setCurrent]=useState(0);const [duration,setDuration]=useState(option.duration??0);
 useEffect(()=>{const element=audio.current;if(!element)return;if(playing&&option.audioSrc)element.play().catch(()=>undefined);else element.pause()},[playing,option.audioSrc]);
 return <div className={`audio-choice${selected?' selected':''}${playing?' playing':''}`}>
   <div className="audio-choice-player">
    <button type="button" className="audio-play" aria-label={playing?'Pausar respuesta':'Reproducir respuesta'} onClick={onPlay} disabled={!option.audioSrc}>{playing?<Pause size={21}/>:<Play size={21} fill="currentColor"/>}</button>
    <div className="audio-timeline" aria-hidden="true"><div className="audio-wave">{Array.from({length:30},(_,i)=><i key={i} style={{height:`${9+((i*11)%23)}px`}}/>)}</div><span className="audio-progress-line" style={{left:`${(duration?current/duration:0)*100}%`}}/></div>
    <time>{formatTime(duration)}</time>
   </div>
   <button type="button" className="answer-confirm" aria-pressed={selected} onClick={onSelect}>{selected?'Respuesta elegida':'Esta es mi respuesta'}</button>
   {option.audioSrc&&<audio ref={audio} src={option.audioSrc} preload="metadata" onLoadedMetadata={e=>setDuration(e.currentTarget.duration)} onTimeUpdate={e=>setCurrent(e.currentTarget.currentTime)} onEnded={onPlay}/>} 
 </div>
}

export function QuestionCard({question,value,onChange,onAudioPlay}:{question:Question;value?:string;onChange:(id:string)=>void;onAudioPlay:(id:string)=>void}){
 const [playingId,setPlayingId]=useState<string|null>(null);useEffect(()=>setPlayingId(null),[question.id]);
 const toggle=(option:QuestionOption)=>{if(!option.audioSrc)return;const next=playingId===option.id?null:option.id;setPlayingId(next);if(next)onAudioPlay(option.id)};
 return <fieldset className="question-card"><legend>{question.text}</legend><div className="audio-options">{question.options.map(option=><AudioOption key={option.id} option={option} selected={value===option.id} playing={playingId===option.id} onSelect={()=>onChange(option.id)} onPlay={()=>toggle(option)}/>)}</div></fieldset>
}
