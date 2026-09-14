'use client';

import { ArrowRight } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import type { User } from 'firebase/auth';
import { questions } from '@/data/questions';
import { buildResult } from '@/lib/assessment/result';
import {
  firstUnansweredQuestionIndex,
  hydrateRestorableSession,
  isCompletedAssessmentSession,
  touchAssessmentSession,
} from '@/lib/assessment/session-recovery';
import {
  loadRemoteAssessmentSessions,
  saveRemoteAssessmentSession,
} from '@/lib/assessment/assessment-repository';
import { assessmentStorage, createSession, type AssessmentSession } from '@/lib/storage/assessment-storage';
import { Progress } from './Progress';
import { QuestionCard } from './QuestionCard';
import { AssessmentResult } from './AssessmentResult';

export function Assessment({ user, onLogout }: { user: User; onLogout: () => Promise<void> }) {
  const [session, setSession] = useState<AssessmentSession | null>(null);
  const [index, setIndex] = useState(0);
  const [analyzing, setAnalyzing] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const [hydrationError, setHydrationError] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const sessionRef = useRef<AssessmentSession | null>(null);
  const lock = useRef(false);
  const resultTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const persistRemote = useCallback((next: AssessmentSession) => {
    void saveRemoteAssessmentSession(user.uid, user.email ?? '', next).catch((error) => {
      console.error('No se pudo guardar el progreso en Firestore.', error);
    });
  }, [user.email, user.uid]);

  const persist = useCallback((next: AssessmentSession) => {
    assessmentStorage.save(user.uid, next);
    persistRemote(next);
  }, [persistRemote, user.uid]);

  const installSession = useCallback((next: AssessmentSession, persistNow = true) => {
    sessionRef.current = next;
    assessmentStorage.save(user.uid, next);
    setSession(next);
    const unansweredIndex = firstUnansweredQuestionIndex(next, questions);
    setIndex(unansweredIndex === -1 ? 0 : unansweredIndex);
    if (persistNow) persist(next);
  }, [persist, user.uid]);

  useEffect(() => {
    let cancelled = false;
    setHydrated(false);
    setHydrationError(false);
    setSession(null);
    sessionRef.current = null;
    setIndex(0);

    const hydrate = async () => {
      const local = assessmentStorage.load(user.uid);
      try {
        let recovered = await hydrateRestorableSession(
          local,
          () => loadRemoteAssessmentSessions(user.uid),
          questions,
          () => createSession(),
        );
        if (cancelled) return;
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

        installSession(recovered, false);
        setHydrated(true);
        persistRemote(recovered);
      } catch (error) {
        if (cancelled) return;
        console.error('No se pudo recuperar la evaluación desde Firestore.', error);
        setHydrationError(true);
      }
    };

    void hydrate();
    return () => {
      cancelled = true;
      if (resultTimeout.current) clearTimeout(resultTimeout.current);
    };
  }, [installSession, persistRemote, retryCount, user.uid]);

  const updateSession = useCallback((update: (current: AssessmentSession) => AssessmentSession) => {
    if (!hydrated || !sessionRef.current) return null;
    const next = touchAssessmentSession(update(sessionRef.current));
    sessionRef.current = next;
    setSession(next);
    persist(next);
    return next;
  }, [hydrated, persist]);

  const restart = () => {
    const current = sessionRef.current;
    if (!current) return;
    const fresh = createSession(new Date(), current.sessionId);
    setAnalyzing(false);
    installSession(fresh);
  };

  if (!hydrated) {
    return <main className="screen analysis-screen"><section className="content-card"><p className="eyebrow">UN MOMENTO</p><h1>{hydrationError ? 'No pudimos recuperar tu evaluación.' : 'Recuperando tu evaluación.'}</h1>{hydrationError && <button className="btn-primary" type="button" onClick={() => setRetryCount((value) => value + 1)}>Reintentar</button>}</section></main>;
  }
  if (!session) return null;
  if (analyzing) return <main className="screen analysis-screen"><section className="content-card"><div className="analysis-pulse"/><p className="eyebrow">LISTO</p><h1>Estoy cruzando tus respuestas.</h1><p className="lead">Busco dónde aparece el patrón más fuerte.</p></section></main>;
  if (isCompletedAssessmentSession(session, questions)) return <AssessmentResult result={buildResult(questions, session.answers)} onRestart={restart} onLogout={onLogout}/>;

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

  return <main className="screen assessment-screen"><section className="assessment-inner"><button className="session-logout" onClick={() => void onLogout()}>Cerrar sesión</button><Progress current={index + 1} total={questions.length}/><div key={question.id} className="question-transition"><QuestionCard question={question} value={selected} onChange={select} onAudioPlay={recordPlay}/></div><div className="assessment-actions"><button className="btn-primary" onClick={next} disabled={!selected}>Continuar <ArrowRight size={19}/></button></div></section></main>;
}
