'use client';

import { ArrowRight } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { questions } from '@/data/questions';
import { buildResult } from '@/lib/assessment/result';
import {
  firstUnansweredQuestionIndex,
  isCompletedAssessmentSession,
  normalizeAssessmentSession,
  touchAssessmentSession,
} from '@/lib/assessment/session-recovery';
import { assessmentStorage, createSession, type AssessmentSession } from '@/lib/storage/assessment-storage';
import { Progress } from './Progress';
import { QuestionCard } from './QuestionCard';
import { AssessmentResult } from './AssessmentResult';

export function Assessment() {
  const [session, setSession] = useState<AssessmentSession | null>(null);
  const [index, setIndex] = useState(0);
  const [analyzing, setAnalyzing] = useState(false);
  const sessionRef = useRef<AssessmentSession | null>(null);
  const lock = useRef(false);
  const resultTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    let recovered = normalizeAssessmentSession(assessmentStorage.load()) ?? createSession();
    if (firstUnansweredQuestionIndex(recovered, questions) === -1 && !isCompletedAssessmentSession(recovered, questions)) {
      const result = buildResult(questions, recovered.answers);
      recovered = touchAssessmentSession({
        ...recovered,
        completedAt: recovered.completedAt ?? new Date().toISOString(),
        scores: result.scores,
        primaryPattern: result.primaryPattern,
        secondaryPattern: result.secondaryPattern,
      });
    }

    sessionRef.current = recovered;
    assessmentStorage.save(recovered);
    setSession(recovered);
    const unansweredIndex = firstUnansweredQuestionIndex(recovered, questions);
    setIndex(unansweredIndex === -1 ? 0 : unansweredIndex);

    return () => {
      if (resultTimeout.current) clearTimeout(resultTimeout.current);
    };
  }, []);

  const updateSession = useCallback((update: (current: AssessmentSession) => AssessmentSession) => {
    if (!sessionRef.current) return null;
    const next = touchAssessmentSession(update(sessionRef.current));
    sessionRef.current = next;
    assessmentStorage.save(next);
    setSession(next);
    return next;
  }, []);

  if (!session) return null;
  if (analyzing) return <main className="screen analysis-screen"><section className="content-card"><div className="analysis-pulse"/><p className="eyebrow">LISTO</p><h1>Estoy cruzando tus respuestas.</h1><p className="lead">Busco dónde aparece el patrón más fuerte.</p></section></main>;
  if (isCompletedAssessmentSession(session, questions)) return <AssessmentResult result={buildResult(questions, session.answers)}/>;

  const question = questions[index];
  const selected = session.answers[question.id];
  const select = (id: string) => updateSession((current) => ({
    ...current,
    answers: { ...current.answers, [question.id]: id },
  }));
  const recordPlay = (optionId: string) => updateSession((current) => ({
    ...current,
    audioPlayEvents: [...current.audioPlayEvents, {
      questionId: question.id,
      optionId,
      playedAt: new Date().toISOString(),
      order: current.audioPlayEvents.length + 1,
    }],
  }));
  const next = () => {
    const current = sessionRef.current;
    if (!current || !current.answers[question.id] || lock.current) return;
    lock.current = true;
    const unansweredIndex = firstUnansweredQuestionIndex(current, questions);
    if (unansweredIndex !== -1) {
      setIndex(unansweredIndex);
      requestAnimationFrame(() => { lock.current = false; });
      return;
    }

    const result = buildResult(questions, current.answers);
    setAnalyzing(true);
    updateSession((value) => ({
      ...value,
      completedAt: new Date().toISOString(),
      scores: result.scores,
      primaryPattern: result.primaryPattern,
      secondaryPattern: result.secondaryPattern,
    }));
    resultTimeout.current = setTimeout(() => {
      setAnalyzing(false);
      lock.current = false;
    }, 1200);
  };

  return <main className="screen assessment-screen"><section className="assessment-inner"><Progress current={index + 1} total={questions.length}/><div key={question.id} className="question-transition"><QuestionCard question={question} value={selected} onChange={select} onAudioPlay={recordPlay}/></div><div className="assessment-actions"><button className="btn-primary" onClick={next} disabled={!selected}>Continuar <ArrowRight size={19}/></button></div></section></main>;
}
